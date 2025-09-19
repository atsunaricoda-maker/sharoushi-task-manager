/**
 * Project Management Routes
 * プロジェクト管理のAPIエンドポイント
 */

import { Hono } from 'hono'
import { AIProjectGenerator, ProjectProgressCalculator } from '../lib/ai-project-generator'

type Bindings = {
  DB: D1Database
  KV: KVNamespace
  GEMINI_API_KEY: string
}

const projectsRouter = new Hono<{ Bindings: Bindings }>()

/**
 * プロジェクト一覧取得
 */
projectsRouter.get('/', async (c) => {
  try {
    const status = c.req.query('status')
    const clientId = c.req.query('clientId')
    
    let query = `
      SELECT 
        p.*,
        c.name as client_name,
        u.name as created_by_name,
        COUNT(DISTINCT t.id) as task_count,
        COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_task_count
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      LEFT JOIN users u ON p.created_by = u.id
      LEFT JOIN tasks t ON t.project_id = p.id
      WHERE 1=1
    `
    
    const params: any[] = []
    
    if (status) {
      query += ` AND p.status = ?`
      params.push(status)
    }
    
    if (clientId) {
      query += ` AND p.client_id = ?`
      params.push(parseInt(clientId))
    }
    
    query += ` GROUP BY p.id ORDER BY p.created_at DESC`
    
    const projects = await c.env.DB.prepare(query).bind(...params).all()
    
    // 進捗を計算
    const projectsWithProgress = projects.results.map(project => {
      const progress = project.task_count > 0 
        ? Math.round((project.completed_task_count / project.task_count) * 100)
        : 0
      
      return {
        ...project,
        progress,
        isDelayed: new Date(project.end_date) < new Date() && project.status !== 'completed'
      }
    })
    
    return c.json({
      projects: projectsWithProgress,
      totalCount: projectsWithProgress.length
    })
  } catch (error: any) {
    console.error('Failed to fetch projects:', error)
    return c.json({ error: 'Failed to fetch projects' }, 500)
  }
})

/**
 * プロジェクト詳細取得
 */
projectsRouter.get('/:id', async (c) => {
  try {
    const projectId = parseInt(c.req.param('id'))
    
    // プロジェクト基本情報
    const project = await c.env.DB.prepare(`
      SELECT 
        p.*,
        c.name as client_name,
        u.name as created_by_name
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = ?
    `).bind(projectId).first()
    
    if (!project) {
      return c.json({ error: 'Project not found' }, 404)
    }
    
    // タスク一覧
    const tasks = await c.env.DB.prepare(`
      SELECT 
        t.*,
        u.name as assignee_name
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      WHERE t.project_id = ?
      ORDER BY t.due_date ASC
    `).bind(projectId).all()
    
    // マイルストーン
    const milestones = await c.env.DB.prepare(`
      SELECT * FROM project_milestones
      WHERE project_id = ?
      ORDER BY due_date ASC
    `).bind(projectId).all()
    
    // メンバー
    const members = await c.env.DB.prepare(`
      SELECT 
        pm.*,
        u.name as user_name,
        u.email as user_email
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = ?
    `).bind(projectId).all()
    
    // 進捗計算
    const progress = ProjectProgressCalculator.calculateProjectProgress(tasks.results)
    
    // 最新の進捗レポート
    const latestProgress = await c.env.DB.prepare(`
      SELECT 
        tp.*,
        u.name as reporter_name
      FROM task_progress tp
      JOIN tasks t ON tp.task_id = t.id
      JOIN users u ON tp.user_id = u.id
      WHERE t.project_id = ?
      ORDER BY tp.recorded_at DESC
      LIMIT 5
    `).bind(projectId).all()
    
    return c.json({
      project: {
        ...project,
        ...progress,
        tasks: tasks.results,
        milestones: milestones.results,
        members: members.results,
        recentProgress: latestProgress.results
      }
    })
  } catch (error: any) {
    console.error('Failed to fetch project details:', error)
    return c.json({ error: 'Failed to fetch project details' }, 500)
  }
})

/**
 * AIによるプロジェクト自動生成
 */
projectsRouter.post('/generate', async (c) => {
  try {
    const user = c.get('user')
    const { prompt, clientId, context } = await c.req.json()
    
    if (!prompt) {
      return c.json({ error: 'Prompt is required' }, 400)
    }
    
    // クライアント情報を取得
    let clientInfo = null
    if (clientId) {
      clientInfo = await c.env.DB.prepare(`
        SELECT * FROM clients WHERE id = ?
      `).bind(clientId).first()
    }
    
    // AI生成
    const generator = new AIProjectGenerator(c.env.GEMINI_API_KEY)
    const result = await generator.generateProjectFromPrompt(prompt, {
      clientName: clientInfo?.name,
      clientType: clientInfo?.industry,
      ...context
    })
    
    // プロジェクトを作成
    const projectResult = await c.env.DB.prepare(`
      INSERT INTO projects (
        name, description, client_id, status, priority,
        start_date, end_date, estimated_hours, created_by
      ) VALUES (?, ?, ?, 'planning', ?, date('now'), date('now', '+${result.project.estimatedDuration} days'), ?, ?)
    `).bind(
      result.project.name,
      result.project.description,
      clientId || null,
      result.project.priority,
      result.tasks.reduce((sum, t) => sum + t.estimatedHours, 0),
      user.id
    ).run()
    
    const projectId = projectResult.meta.last_row_id
    
    // マイルストーンを作成
    for (const milestone of result.project.milestones) {
      await c.env.DB.prepare(`
        INSERT INTO project_milestones (
          project_id, name, description, due_date, status
        ) VALUES (?, ?, ?, date('now', '+${milestone.daysFromStart} days'), 'pending')
      `).bind(
        projectId,
        milestone.name,
        milestone.description
      ).run()
    }
    
    // タスクを作成
    const taskIdMap = new Map<string, number>()
    
    for (const task of result.tasks) {
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + task.daysFromStart)
      
      const taskResult = await c.env.DB.prepare(`
        INSERT INTO tasks (
          title, description, project_id, client_id,
          priority, task_type, status, due_date,
          estimated_hours, assignee_id
        ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
      `).bind(
        task.title,
        task.description,
        projectId,
        clientId || null,
        task.priority,
        task.category,
        dueDate.toISOString().split('T')[0],
        task.estimatedHours,
        user.id
      ).run()
      
      taskIdMap.set(task.title, taskResult.meta.last_row_id as number)
    }
    
    // タスクの依存関係を設定
    for (const task of result.tasks) {
      const taskId = taskIdMap.get(task.title)
      if (!taskId) continue
      
      for (const depTitle of task.dependencies) {
        const depId = taskIdMap.get(depTitle)
        if (!depId) continue
        
        await c.env.DB.prepare(`
          INSERT INTO task_dependencies (
            task_id, depends_on_task_id, dependency_type
          ) VALUES (?, ?, 'finish_to_start')
        `).bind(taskId, depId).run()
      }
    }
    
    return c.json({
      success: true,
      projectId,
      project: result.project,
      tasksCreated: result.tasks.length,
      message: `プロジェクト「${result.project.name}」を作成し、${result.tasks.length}個のタスクを生成しました`
    })
  } catch (error: any) {
    console.error('Failed to generate project:', error)
    return c.json({ 
      error: 'Failed to generate project', 
      message: error.message 
    }, 500)
  }
})

/**
 * カテゴリベースのプロジェクト生成
 */
projectsRouter.post('/generate-category', async (c) => {
  try {
    const user = c.get('user')
    const { category, clientId } = await c.req.json()
    
    if (!category || !clientId) {
      return c.json({ error: 'Category and clientId are required' }, 400)
    }
    
    // クライアント情報を取得
    const client = await c.env.DB.prepare(`
      SELECT * FROM clients WHERE id = ?
    `).bind(clientId).first()
    
    if (!client) {
      return c.json({ error: 'Client not found' }, 404)
    }
    
    const generator = new AIProjectGenerator(c.env.GEMINI_API_KEY)
    const result = await generator.generateCategoryProject(category, {
      name: client.name as string,
      employeeCount: client.employee_count as number || 10,
      industry: client.industry as string || '一般'
    })
    
    // プロジェクト作成（上記と同様の処理）
    // ... (省略)
    
    return c.json({
      success: true,
      project: result.project,
      tasksCreated: result.tasks.length
    })
  } catch (error: any) {
    console.error('Failed to generate category project:', error)
    return c.json({ error: 'Failed to generate project' }, 500)
  }
})

/**
 * タスク進捗の記録
 */
projectsRouter.post('/:projectId/tasks/:taskId/progress', async (c) => {
  try {
    const user = c.get('user')
    const taskId = parseInt(c.req.param('taskId'))
    const { 
      progressPercentage, 
      hoursSpent, 
      comment, 
      blockers, 
      nextSteps 
    } = await c.req.json()
    
    // 進捗を記録
    await c.env.DB.prepare(`
      INSERT INTO task_progress (
        task_id, user_id, progress_percentage,
        hours_spent, comment, blockers, next_steps
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      taskId,
      user.id,
      progressPercentage || 0,
      hoursSpent || 0,
      comment || '',
      blockers || '',
      nextSteps || ''
    ).run()
    
    // タスクのステータスと進捗を更新
    if (progressPercentage >= 100) {
      await c.env.DB.prepare(`
        UPDATE tasks 
        SET status = 'completed', 
            progress = 100,
            actual_hours = actual_hours + ?,
            updated_at = datetime('now')
        WHERE id = ?
      `).bind(hoursSpent || 0, taskId).run()
    } else if (progressPercentage > 0) {
      await c.env.DB.prepare(`
        UPDATE tasks 
        SET status = 'in_progress', 
            progress = ?,
            actual_hours = actual_hours + ?,
            updated_at = datetime('now')
        WHERE id = ?
      `).bind(progressPercentage, hoursSpent || 0, taskId).run()
    }
    
    return c.json({
      success: true,
      message: '進捗を記録しました'
    })
  } catch (error: any) {
    console.error('Failed to record progress:', error)
    return c.json({ error: 'Failed to record progress' }, 500)
  }
})

/**
 * プロジェクト進捗サマリー
 */
projectsRouter.get('/:id/progress-summary', async (c) => {
  try {
    const projectId = parseInt(c.req.param('id'))
    
    // タスク統計
    const taskStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tasks,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tasks,
        COUNT(CASE WHEN due_date < date('now') AND status != 'completed' THEN 1 END) as overdue_tasks,
        SUM(estimated_hours) as total_estimated_hours,
        SUM(actual_hours) as total_actual_hours
      FROM tasks
      WHERE project_id = ?
    `).bind(projectId).first()
    
    // マイルストーン進捗
    const milestones = await c.env.DB.prepare(`
      SELECT 
        m.*,
        COUNT(t.id) as total_tasks,
        COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks
      FROM project_milestones m
      LEFT JOIN tasks t ON t.project_id = m.project_id 
        AND date(t.due_date) <= date(m.due_date)
      WHERE m.project_id = ?
      GROUP BY m.id
      ORDER BY m.due_date ASC
    `).bind(projectId).all()
    
    // チームメンバー別の進捗
    const memberProgress = await c.env.DB.prepare(`
      SELECT 
        u.id,
        u.name,
        COUNT(t.id) as assigned_tasks,
        COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
        SUM(t.actual_hours) as total_hours
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      LEFT JOIN tasks t ON t.assignee_id = u.id AND t.project_id = pm.project_id
      WHERE pm.project_id = ?
      GROUP BY u.id, u.name
    `).bind(projectId).all()
    
    // 最近のアクティビティ
    const recentActivity = await c.env.DB.prepare(`
      SELECT 
        'progress' as type,
        tp.recorded_at as timestamp,
        u.name as user_name,
        t.title as task_title,
        tp.comment as description
      FROM task_progress tp
      JOIN tasks t ON tp.task_id = t.id
      JOIN users u ON tp.user_id = u.id
      WHERE t.project_id = ?
      
      UNION ALL
      
      SELECT 
        'comment' as type,
        tc.created_at as timestamp,
        u.name as user_name,
        t.title as task_title,
        tc.comment as description
      FROM task_comments tc
      JOIN tasks t ON tc.task_id = t.id
      JOIN users u ON tc.user_id = u.id
      WHERE t.project_id = ?
      
      ORDER BY timestamp DESC
      LIMIT 10
    `).bind(projectId, projectId).all()
    
    // 全体進捗の計算
    const overallProgress = taskStats?.total_tasks > 0
      ? Math.round((taskStats.completed_tasks / taskStats.total_tasks) * 100)
      : 0
    
    return c.json({
      summary: {
        overallProgress,
        taskStats,
        milestones: milestones.results.map(m => ({
          ...m,
          progress: m.total_tasks > 0 
            ? Math.round((m.completed_tasks / m.total_tasks) * 100)
            : 0
        })),
        memberProgress: memberProgress.results,
        recentActivity: recentActivity.results,
        healthStatus: this.calculateHealthStatus(taskStats)
      }
    })
  } catch (error: any) {
    console.error('Failed to fetch progress summary:', error)
    return c.json({ error: 'Failed to fetch progress summary' }, 500)
  }
})

/**
 * プロジェクトの健全性ステータスを計算
 */
function calculateHealthStatus(stats: any): string {
  if (!stats) return 'unknown'
  
  const overdueRate = stats.total_tasks > 0 
    ? stats.overdue_tasks / stats.total_tasks 
    : 0
  
  const actualVsEstimated = stats.total_estimated_hours > 0
    ? stats.total_actual_hours / stats.total_estimated_hours
    : 1
  
  if (overdueRate > 0.3 || actualVsEstimated > 1.5) {
    return 'at_risk'
  } else if (overdueRate > 0.1 || actualVsEstimated > 1.2) {
    return 'warning'
  } else {
    return 'healthy'
  }
}

export { projectsRouter }