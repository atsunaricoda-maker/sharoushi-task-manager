/**
 * Admin Dashboard Routes
 * 管理者向けの分析・レポート機能
 */

import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
  KV: KVNamespace
}

const adminRouter = new Hono<{ Bindings: Bindings }>()

/**
 * スタッフ別業務実績サマリー
 */
adminRouter.get('/staff-performance', async (c) => {
  try {
    const period = c.req.query('period') || 'month' // month, week, year, custom
    const startDate = c.req.query('start_date')
    const endDate = c.req.query('end_date')
    
    let dateFilter = ''
    const now = new Date()
    
    switch (period) {
      case 'week':
        dateFilter = `AND t.completed_at >= datetime('now', '-7 days')`
        break
      case 'month':
        dateFilter = `AND t.completed_at >= datetime('now', 'start of month')`
        break
      case 'year':
        dateFilter = `AND t.completed_at >= datetime('now', 'start of year')`
        break
      case 'custom':
        if (startDate && endDate) {
          dateFilter = `AND t.completed_at BETWEEN '${startDate}' AND '${endDate}'`
        }
        break
    }
    
    // スタッフ別のタスク完了統計
    const staffStats = await c.env.DB.prepare(`
      SELECT 
        u.id as user_id,
        u.name as user_name,
        u.email,
        u.role,
        COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) as in_progress_tasks,
        COUNT(CASE WHEN t.status = 'pending' THEN 1 END) as pending_tasks,
        COUNT(t.id) as total_tasks,
        COALESCE(SUM(CASE WHEN t.status = 'completed' THEN t.actual_hours END), 0) as total_hours,
        COALESCE(AVG(CASE WHEN t.status = 'completed' THEN t.actual_hours END), 0) as avg_hours_per_task,
        COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.client_id END) as clients_served,
        COALESCE(AVG(CASE 
          WHEN t.status = 'completed' AND t.completed_at IS NOT NULL AND t.created_at IS NOT NULL
          THEN JULIANDAY(t.completed_at) - JULIANDAY(t.created_at)
        END), 0) as avg_completion_days
      FROM users u
      LEFT JOIN tasks t ON u.id = t.assignee_id ${dateFilter}
      GROUP BY u.id, u.name, u.email, u.role
      ORDER BY completed_tasks DESC
    `).all()
    
    // タスクタイプ別の統計
    const taskTypeStats = await c.env.DB.prepare(`
      SELECT 
        u.name as user_name,
        t.task_type,
        COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_count,
        COALESCE(SUM(CASE WHEN t.status = 'completed' THEN t.actual_hours END), 0) as total_hours
      FROM users u
      JOIN tasks t ON u.id = t.assignee_id
      WHERE t.status = 'completed' ${dateFilter}
      GROUP BY u.id, u.name, t.task_type
      ORDER BY u.name, completed_count DESC
    `).all()
    
    // 顧客別の対応状況
    const clientStats = await c.env.DB.prepare(`
      SELECT 
        u.name as user_name,
        c.company_name as client_name,
        COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
        COALESCE(SUM(CASE WHEN t.status = 'completed' THEN t.actual_hours END), 0) as total_hours
      FROM users u
      JOIN tasks t ON u.id = t.assignee_id
      JOIN clients c ON t.client_id = c.id
      WHERE t.status = 'completed' ${dateFilter}
      GROUP BY u.id, u.name, c.id, c.company_name
      ORDER BY u.name, completed_tasks DESC
    `).all()
    
    return c.json({
      period,
      staff_performance: staffStats.results,
      task_type_breakdown: taskTypeStats.results,
      client_breakdown: clientStats.results
    })
  } catch (error: any) {
    console.error('Failed to get staff performance:', error)
    return c.json({ 
      error: 'Failed to get staff performance', 
      message: error.message 
    }, 500)
  }
})

/**
 * 時系列での業務推移
 */
adminRouter.get('/performance-trends', async (c) => {
  try {
    const userId = c.req.query('user_id')
    const period = c.req.query('period') || '30' // days
    
    let userFilter = ''
    if (userId) {
      userFilter = `AND t.assignee_id = ${userId}`
    }
    
    // 日別の完了タスク数
    const dailyTrends = await c.env.DB.prepare(`
      SELECT 
        DATE(t.completed_at) as date,
        u.name as user_name,
        COUNT(*) as completed_tasks,
        SUM(t.actual_hours) as total_hours
      FROM tasks t
      JOIN users u ON t.assignee_id = u.id
      WHERE t.status = 'completed' 
        AND t.completed_at >= datetime('now', '-${period} days')
        ${userFilter}
      GROUP BY DATE(t.completed_at), u.id, u.name
      ORDER BY date DESC, u.name
    `).all()
    
    // 週別の統計
    const weeklyTrends = await c.env.DB.prepare(`
      SELECT 
        strftime('%Y-%W', t.completed_at) as week,
        u.name as user_name,
        COUNT(*) as completed_tasks,
        SUM(t.actual_hours) as total_hours,
        AVG(JULIANDAY(t.completed_at) - JULIANDAY(t.created_at)) as avg_completion_days
      FROM tasks t
      JOIN users u ON t.assignee_id = u.id
      WHERE t.status = 'completed' 
        AND t.completed_at >= datetime('now', '-${period} days')
        ${userFilter}
      GROUP BY strftime('%Y-%W', t.completed_at), u.id, u.name
      ORDER BY week DESC, u.name
    `).all()
    
    return c.json({
      daily: dailyTrends.results,
      weekly: weeklyTrends.results
    })
  } catch (error: any) {
    console.error('Failed to get performance trends:', error)
    return c.json({ 
      error: 'Failed to get performance trends', 
      message: error.message 
    }, 500)
  }
})

/**
 * 業務効率指標
 */
adminRouter.get('/efficiency-metrics', async (c) => {
  try {
    // 予定時間 vs 実績時間の比較
    const efficiencyMetrics = await c.env.DB.prepare(`
      SELECT 
        u.name as user_name,
        COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
        COALESCE(SUM(t.estimated_hours), 0) as total_estimated_hours,
        COALESCE(SUM(t.actual_hours), 0) as total_actual_hours,
        CASE 
          WHEN SUM(t.actual_hours) > 0 
          THEN ROUND((SUM(t.estimated_hours) / SUM(t.actual_hours)) * 100, 1)
          ELSE 0 
        END as efficiency_rate,
        COUNT(CASE WHEN t.due_date < t.completed_at THEN 1 END) as overdue_tasks,
        COUNT(CASE WHEN t.priority = 'urgent' AND t.status = 'completed' THEN 1 END) as urgent_completed,
        ROUND(AVG(t.progress), 1) as avg_progress
      FROM users u
      LEFT JOIN tasks t ON u.id = t.assignee_id
      WHERE t.completed_at >= datetime('now', '-30 days')
      GROUP BY u.id, u.name
      ORDER BY efficiency_rate DESC
    `).all()
    
    // タスクの遅延状況
    const delayMetrics = await c.env.DB.prepare(`
      SELECT 
        u.name as user_name,
        COUNT(CASE WHEN t.due_date < CURRENT_DATE AND t.status != 'completed' THEN 1 END) as overdue_active,
        COUNT(CASE WHEN t.due_date = CURRENT_DATE AND t.status != 'completed' THEN 1 END) as due_today,
        COUNT(CASE WHEN t.due_date BETWEEN CURRENT_DATE AND date('now', '+7 days') AND t.status != 'completed' THEN 1 END) as due_this_week
      FROM users u
      LEFT JOIN tasks t ON u.id = t.assignee_id
      GROUP BY u.id, u.name
    `).all()
    
    return c.json({
      efficiency: efficiencyMetrics.results,
      delays: delayMetrics.results
    })
  } catch (error: any) {
    console.error('Failed to get efficiency metrics:', error)
    return c.json({ 
      error: 'Failed to get efficiency metrics', 
      message: error.message 
    }, 500)
  }
})

/**
 * プロジェクト別の実績
 */
adminRouter.get('/project-performance', async (c) => {
  try {
    const projectStats = await c.env.DB.prepare(`
      SELECT 
        p.id as project_id,
        p.name as project_name,
        p.status as project_status,
        u.name as manager_name,
        c.company_name as client_name,
        COUNT(pt.id) as total_tasks,
        COUNT(CASE WHEN pt.status = 'completed' THEN 1 END) as completed_tasks,
        COALESCE(SUM(pt.actual_hours), 0) as total_hours,
        p.progress as overall_progress,
        p.start_date,
        p.end_date,
        CASE 
          WHEN p.end_date < CURRENT_DATE AND p.status != 'completed' THEN 'overdue'
          WHEN p.end_date = CURRENT_DATE THEN 'due_today'
          WHEN p.end_date <= date('now', '+7 days') THEN 'due_soon'
          ELSE 'on_track'
        END as deadline_status
      FROM projects p
      LEFT JOIN users u ON p.manager_id = u.id
      LEFT JOIN clients c ON p.client_id = c.id
      LEFT JOIN tasks pt ON p.id = pt.project_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `).all()
    
    return c.json({
      projects: projectStats.results
    })
  } catch (error: any) {
    console.error('Failed to get project performance:', error)
    return c.json({ 
      error: 'Failed to get project performance', 
      message: error.message 
    }, 500)
  }
})

/**
 * 業務負荷分析
 */
adminRouter.get('/workload-analysis', async (c) => {
  try {
    // 現在の業務負荷
    const currentWorkload = await c.env.DB.prepare(`
      SELECT 
        u.id as user_id,
        u.name as user_name,
        COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) as active_tasks,
        COUNT(CASE WHEN t.status = 'pending' AND t.due_date <= date('now', '+7 days') THEN 1 END) as upcoming_tasks,
        COALESCE(SUM(CASE WHEN t.status != 'completed' THEN t.estimated_hours END), 0) as remaining_hours,
        COUNT(CASE WHEN t.priority = 'urgent' AND t.status != 'completed' THEN 1 END) as urgent_tasks
      FROM users u
      LEFT JOIN tasks t ON u.id = t.assignee_id
      GROUP BY u.id, u.name
      ORDER BY remaining_hours DESC
    `).all()
    
    // 顧客別の業務負荷
    const clientWorkload = await c.env.DB.prepare(`
      SELECT 
        c.company_name as client_name,
        COUNT(CASE WHEN t.status != 'completed' THEN 1 END) as pending_tasks,
        COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) as active_tasks,
        COALESCE(SUM(CASE WHEN t.status != 'completed' THEN t.estimated_hours END), 0) as estimated_hours
      FROM clients c
      LEFT JOIN tasks t ON c.id = t.client_id
      GROUP BY c.id, c.company_name
      HAVING pending_tasks > 0
      ORDER BY estimated_hours DESC
    `).all()
    
    return c.json({
      staff_workload: currentWorkload.results,
      client_workload: clientWorkload.results
    })
  } catch (error: any) {
    console.error('Failed to get workload analysis:', error)
    return c.json({ 
      error: 'Failed to get workload analysis', 
      message: error.message 
    }, 500)
  }
})

/**
 * ランキング（ゲーミフィケーション）
 */
adminRouter.get('/rankings', async (c) => {
  try {
    const period = c.req.query('period') || 'month'
    
    let dateFilter = ''
    switch (period) {
      case 'week':
        dateFilter = `AND t.completed_at >= datetime('now', '-7 days')`
        break
      case 'month':
        dateFilter = `AND t.completed_at >= datetime('now', 'start of month')`
        break
      case 'year':
        dateFilter = `AND t.completed_at >= datetime('now', 'start of year')`
        break
    }
    
    // タスク完了数ランキング
    const completionRanking = await c.env.DB.prepare(`
      SELECT 
        u.name as user_name,
        COUNT(*) as completed_tasks,
        RANK() OVER (ORDER BY COUNT(*) DESC) as rank
      FROM users u
      JOIN tasks t ON u.id = t.assignee_id
      WHERE t.status = 'completed' ${dateFilter}
      GROUP BY u.id, u.name
      ORDER BY completed_tasks DESC
      LIMIT 10
    `).all()
    
    // 効率性ランキング
    const efficiencyRanking = await c.env.DB.prepare(`
      SELECT 
        u.name as user_name,
        COUNT(*) as completed_tasks,
        AVG(JULIANDAY(t.completed_at) - JULIANDAY(t.created_at)) as avg_completion_days,
        RANK() OVER (ORDER BY AVG(JULIANDAY(t.completed_at) - JULIANDAY(t.created_at)) ASC) as rank
      FROM users u
      JOIN tasks t ON u.id = t.assignee_id
      WHERE t.status = 'completed' ${dateFilter}
      GROUP BY u.id, u.name
      HAVING completed_tasks >= 5
      ORDER BY avg_completion_days ASC
      LIMIT 10
    `).all()
    
    // 顧客対応数ランキング
    const clientRanking = await c.env.DB.prepare(`
      SELECT 
        u.name as user_name,
        COUNT(DISTINCT t.client_id) as clients_served,
        RANK() OVER (ORDER BY COUNT(DISTINCT t.client_id) DESC) as rank
      FROM users u
      JOIN tasks t ON u.id = t.assignee_id
      WHERE t.status = 'completed' ${dateFilter}
      GROUP BY u.id, u.name
      ORDER BY clients_served DESC
      LIMIT 10
    `).all()
    
    return c.json({
      period,
      completion_ranking: completionRanking.results,
      efficiency_ranking: efficiencyRanking.results,
      client_service_ranking: clientRanking.results
    })
  } catch (error: any) {
    console.error('Failed to get rankings:', error)
    return c.json({ 
      error: 'Failed to get rankings', 
      message: error.message 
    }, 500)
  }
})

export { adminRouter }