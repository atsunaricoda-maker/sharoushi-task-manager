import { Hono } from 'hono'
import type { CloudflareBindings } from '../types'
import { requireAuth } from '../middleware/auth'
import { AIProjectGenerator } from '../lib/ai-project-generator'
import { TaskScheduler } from '../lib/task-scheduler'
import type { SchedulingOptions, SchedulingResult } from '../lib/task-scheduler'

const app = new Hono<{ Bindings: CloudflareBindings }>()

// スケジュール生成エンドポイント
app.post('/generate', requireAuth, async (c) => {
  try {
    const user = c.get('user')
    const { 
      projectId, 
      startDate, 
      endDate,
      bufferPercentage = 20,
      allowParallelExecution = true,
      maxDailyHours = 8
    } = await c.req.json()

    // プロジェクトとタスクを取得
    const project = await c.env.DB.prepare(`
      SELECT * FROM projects WHERE id = ? AND organization_id = ?
    `).bind(projectId, user.organizationId).first()

    if (!project) {
      return c.json({ error: 'プロジェクトが見つかりません' }, 404)
    }

    const tasks = await c.env.DB.prepare(`
      SELECT * FROM tasks 
      WHERE project_id = ? 
      ORDER BY order_index
    `).bind(projectId).all()

    // スケジューラーでスケジュール生成
    const scheduler = new TaskScheduler()
    const options: SchedulingOptions = {
      projectStartDate: new Date(startDate),
      projectEndDate: new Date(endDate),
      bufferPercentage,
      allowParallelExecution,
      workingHoursPerDay: maxDailyHours
    }

    const result = scheduler.generateSchedule(tasks.results || [], options)

    // スケジュール結果をデータベースに保存
    for (const schedule of result.schedule) {
      await c.env.DB.prepare(`
        UPDATE tasks 
        SET 
          scheduled_start = ?,
          scheduled_end = ?,
          estimated_hours = ?,
          is_critical = ?,
          buffer_days = ?
        WHERE id = ?
      `).bind(
        schedule.scheduledStart.toISOString(),
        schedule.scheduledEnd.toISOString(),
        schedule.estimatedHours,
        schedule.isCritical ? 1 : 0,
        schedule.bufferDays,
        schedule.taskId
      ).run()
    }

    return c.json({
      success: true,
      result: {
        ...result,
        message: result.warnings.length > 0 
          ? 'スケジュールを生成しましたが、警告があります' 
          : 'スケジュールを正常に生成しました'
      }
    })
  } catch (error) {
    console.error('Schedule generation error:', error)
    return c.json({ 
      error: 'スケジュール生成中にエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// スケジュール最適化エンドポイント
app.post('/optimize', requireAuth, async (c) => {
  try {
    const user = c.get('user')
    const { 
      projectId, 
      additionalDays = 0,
      reduceScope = false
    } = await c.req.json()

    // プロジェクトとタスクを取得
    const project = await c.env.DB.prepare(`
      SELECT * FROM projects WHERE id = ? AND organization_id = ?
    `).bind(projectId, user.organizationId).first()

    if (!project) {
      return c.json({ error: 'プロジェクトが見つかりません' }, 404)
    }

    const tasks = await c.env.DB.prepare(`
      SELECT * FROM tasks 
      WHERE project_id = ? 
      ORDER BY order_index
    `).bind(projectId).all()

    // AIプロジェクトジェネレーターを使用して最適化
    const generator = new AIProjectGenerator(c.env.GEMINI_API_KEY)
    const scheduler = new TaskScheduler()

    // 現在のスケジュールを取得
    const currentSchedule = scheduler.generateSchedule(tasks.results || [], {
      projectStartDate: new Date(project.start_date),
      projectEndDate: new Date(project.end_date),
      bufferPercentage: 20,
      allowParallelExecution: true,
      workingHoursPerDay: 8
    })

    // スケジュールが厳しい場合、緩和を試みる
    if (currentSchedule.isTight || currentSchedule.warnings.length > 0) {
      const relaxedResult = await generator.relaxTightSchedule(
        tasks.results || [],
        currentSchedule,
        additionalDays
      )

      // 緩和されたスケジュールを保存
      for (const schedule of relaxedResult.schedule) {
        await c.env.DB.prepare(`
          UPDATE tasks 
          SET 
            scheduled_start = ?,
            scheduled_end = ?,
            estimated_hours = ?,
            is_critical = ?,
            buffer_days = ?,
            priority = ?
          WHERE id = ?
        `).bind(
          schedule.scheduledStart.toISOString(),
          schedule.scheduledEnd.toISOString(),
          schedule.estimatedHours,
          schedule.isCritical ? 1 : 0,
          schedule.bufferDays,
          schedule.priority || 'medium',
          schedule.taskId
        ).run()
      }

      return c.json({
        success: true,
        optimized: true,
        result: relaxedResult,
        suggestions: relaxedResult.suggestions,
        message: 'スケジュールを最適化しました'
      })
    }

    return c.json({
      success: true,
      optimized: false,
      result: currentSchedule,
      message: 'スケジュールは既に最適な状態です'
    })
  } catch (error) {
    console.error('Schedule optimization error:', error)
    return c.json({ 
      error: 'スケジュール最適化中にエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// スケジュール取得エンドポイント
app.get('/project/:projectId', requireAuth, async (c) => {
  try {
    const user = c.get('user')
    const projectId = c.req.param('projectId')

    // プロジェクトの権限確認
    const project = await c.env.DB.prepare(`
      SELECT * FROM projects WHERE id = ? AND organization_id = ?
    `).bind(projectId, user.organizationId).first()

    if (!project) {
      return c.json({ error: 'プロジェクトが見つかりません' }, 404)
    }

    // スケジュール情報を含むタスクを取得
    const tasks = await c.env.DB.prepare(`
      SELECT 
        t.*,
        u.name as assignee_name
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      WHERE t.project_id = ?
        AND t.scheduled_start IS NOT NULL
      ORDER BY t.scheduled_start
    `).bind(projectId).all()

    // クリティカルパスのタスクを特定
    const criticalTasks = tasks.results?.filter(t => t.is_critical) || []

    // 統計情報を計算
    const stats = {
      totalTasks: tasks.results?.length || 0,
      criticalPathTasks: criticalTasks.length,
      totalEstimatedHours: tasks.results?.reduce((sum, t) => sum + (t.estimated_hours || 0), 0) || 0,
      averageBufferDays: tasks.results?.reduce((sum, t) => sum + (t.buffer_days || 0), 0) / (tasks.results?.length || 1) || 0
    }

    return c.json({
      success: true,
      project: {
        id: project.id,
        name: project.name,
        startDate: project.start_date,
        endDate: project.end_date
      },
      tasks: tasks.results || [],
      criticalPath: criticalTasks.map(t => t.id),
      stats
    })
  } catch (error) {
    console.error('Schedule fetch error:', error)
    return c.json({ 
      error: 'スケジュール取得中にエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// ガントチャートデータ取得エンドポイント
app.get('/gantt/:projectId', requireAuth, async (c) => {
  try {
    const user = c.get('user')
    const projectId = c.req.param('projectId')

    // プロジェクトの権限確認
    const project = await c.env.DB.prepare(`
      SELECT * FROM projects WHERE id = ? AND organization_id = ?
    `).bind(projectId, user.organizationId).first()

    if (!project) {
      return c.json({ error: 'プロジェクトが見つかりません' }, 404)
    }

    // タスクと依存関係を取得
    const tasks = await c.env.DB.prepare(`
      SELECT 
        t.*,
        u.name as assignee_name,
        GROUP_CONCAT(td.depends_on_id) as dependencies
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      LEFT JOIN task_dependencies td ON t.id = td.task_id
      WHERE t.project_id = ?
        AND t.scheduled_start IS NOT NULL
      GROUP BY t.id
      ORDER BY t.scheduled_start
    `).bind(projectId).all()

    // ガントチャート用のデータ形式に変換
    const ganttData = tasks.results?.map(task => ({
      id: task.id,
      text: task.title,
      start_date: task.scheduled_start,
      end_date: task.scheduled_end,
      duration: task.estimated_hours ? task.estimated_hours / 8 : 1, // 日数に変換
      progress: task.status === 'completed' ? 1 : task.status === 'in_progress' ? 0.5 : 0,
      assignee: task.assignee_name,
      priority: task.priority,
      is_critical: task.is_critical,
      buffer_days: task.buffer_days,
      dependencies: task.dependencies ? task.dependencies.split(',') : [],
      color: task.is_critical ? '#ff4444' : task.priority === 'high' ? '#ff9944' : '#4488ff'
    })) || []

    return c.json({
      success: true,
      project: {
        id: project.id,
        name: project.name,
        startDate: project.start_date,
        endDate: project.end_date
      },
      data: ganttData
    })
  } catch (error) {
    console.error('Gantt data fetch error:', error)
    return c.json({ 
      error: 'ガントチャートデータ取得中にエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

export default app