import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
}

export const reportsRouter = new Hono<{ Bindings: Bindings }>()

// Monthly report
reportsRouter.get('/monthly', async (c) => {
  try {
    const { year, month } = c.req.query()
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`
    
    // Task completion statistics
    const taskStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN status = 'overdue' OR (date(due_date) < date('now') AND status != 'completed') THEN 1 ELSE 0 END) as overdue_tasks,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tasks,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_tasks,
        ROUND(AVG(CASE WHEN status = 'completed' THEN progress ELSE NULL END), 1) as avg_completion_rate,
        SUM(estimated_hours) as total_estimated_hours,
        SUM(actual_hours) as total_actual_hours
      FROM tasks
      WHERE date(due_date) BETWEEN ? AND ?
    `).bind(startDate, endDate).first()
    
    // Tasks by client
    const tasksByClient = await c.env.DB.prepare(`
      SELECT 
        c.name as client_name,
        COUNT(t.id) as task_count,
        SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_count,
        ROUND(AVG(t.progress), 1) as avg_progress,
        SUM(t.estimated_hours) as estimated_hours,
        SUM(t.actual_hours) as actual_hours
      FROM clients c
      LEFT JOIN tasks t ON c.id = t.client_id
      WHERE date(t.due_date) BETWEEN ? AND ?
      GROUP BY c.id, c.name
      ORDER BY task_count DESC
    `).bind(startDate, endDate).all()
    
    // Tasks by assignee
    const tasksByAssignee = await c.env.DB.prepare(`
      SELECT 
        u.name as assignee_name,
        COUNT(t.id) as task_count,
        SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_count,
        SUM(CASE WHEN t.status = 'overdue' OR (date(t.due_date) < date('now') AND t.status != 'completed') THEN 1 ELSE 0 END) as overdue_count,
        ROUND(AVG(t.progress), 1) as avg_progress,
        SUM(t.estimated_hours) as estimated_hours,
        SUM(t.actual_hours) as actual_hours,
        ROUND(
          CASE 
            WHEN SUM(t.estimated_hours) > 0 
            THEN (SUM(t.actual_hours) / SUM(t.estimated_hours)) * 100 
            ELSE 0 
          END, 1
        ) as efficiency_rate
      FROM users u
      LEFT JOIN tasks t ON u.id = t.assignee_id
      WHERE date(t.due_date) BETWEEN ? AND ?
      GROUP BY u.id, u.name
      ORDER BY task_count DESC
    `).bind(startDate, endDate).all()
    
    // Task type distribution
    const taskTypeDistribution = await c.env.DB.prepare(`
      SELECT 
        task_type,
        COUNT(*) as count,
        ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM tasks WHERE date(due_date) BETWEEN ? AND ?)), 1) as percentage
      FROM tasks
      WHERE date(due_date) BETWEEN ? AND ?
      GROUP BY task_type
    `).bind(startDate, endDate, startDate, endDate).all()
    
    // Priority distribution
    const priorityDistribution = await c.env.DB.prepare(`
      SELECT 
        priority,
        COUNT(*) as count,
        ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM tasks WHERE date(due_date) BETWEEN ? AND ?)), 1) as percentage
      FROM tasks
      WHERE date(due_date) BETWEEN ? AND ?
      GROUP BY priority
      ORDER BY 
        CASE priority
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END
    `).bind(startDate, endDate, startDate, endDate).all()
    
    // Daily completion trend
    const dailyTrend = await c.env.DB.prepare(`
      SELECT 
        date(due_date) as date,
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
        ROUND(
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1
        ) as completion_rate
      FROM tasks
      WHERE date(due_date) BETWEEN ? AND ?
      GROUP BY date(due_date)
      ORDER BY date(due_date)
    `).bind(startDate, endDate).all()
    
    return c.json({
      period: { year, month },
      summary: taskStats,
      byClient: tasksByClient.results,
      byAssignee: tasksByAssignee.results,
      taskTypes: taskTypeDistribution.results,
      priorities: priorityDistribution.results,
      dailyTrend: dailyTrend.results
    })
  } catch (error) {
    return c.json({ error: 'Failed to generate monthly report' }, 500)
  }
})

// Client-specific report
reportsRouter.get('/client/:id', async (c) => {
  try {
    const clientId = c.req.param('id')
    const { start_date, end_date } = c.req.query()
    
    // Client information
    const client = await c.env.DB.prepare(`
      SELECT * FROM clients WHERE id = ?
    `).bind(clientId).first()
    
    if (!client) {
      return c.json({ error: 'Client not found' }, 404)
    }
    
    // Task statistics for the client
    const taskStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN status = 'overdue' OR (date(due_date) < date('now') AND status != 'completed') THEN 1 ELSE 0 END) as overdue_tasks,
        ROUND(AVG(progress), 1) as avg_progress,
        SUM(estimated_hours) as total_estimated_hours,
        SUM(actual_hours) as total_actual_hours
      FROM tasks
      WHERE client_id = ? 
        ${start_date ? 'AND date(due_date) >= ?' : ''}
        ${end_date ? 'AND date(due_date) <= ?' : ''}
    `).bind(clientId, ...(start_date ? [start_date] : []), ...(end_date ? [end_date] : [])).first()
    
    // Tasks by type
    const tasksByType = await c.env.DB.prepare(`
      SELECT 
        task_type,
        COUNT(*) as count,
        SUM(estimated_hours) as estimated_hours,
        SUM(actual_hours) as actual_hours
      FROM tasks
      WHERE client_id = ?
        ${start_date ? 'AND date(due_date) >= ?' : ''}
        ${end_date ? 'AND date(due_date) <= ?' : ''}
      GROUP BY task_type
    `).bind(clientId, ...(start_date ? [start_date] : []), ...(end_date ? [end_date] : [])).all()
    
    // Monthly trend
    const monthlyTrend = await c.env.DB.prepare(`
      SELECT 
        strftime('%Y-%m', due_date) as month,
        COUNT(*) as task_count,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count,
        SUM(estimated_hours) as estimated_hours,
        SUM(actual_hours) as actual_hours
      FROM tasks
      WHERE client_id = ?
      GROUP BY strftime('%Y-%m', due_date)
      ORDER BY month DESC
      LIMIT 12
    `).bind(clientId).all()
    
    // Calculate billing information
    const billingInfo = {
      monthly_fee: client.monthly_fee,
      total_hours: taskStats?.total_actual_hours || 0,
      hourly_rate: client.monthly_fee && taskStats?.total_actual_hours 
        ? Math.round((client.monthly_fee as number) / (taskStats.total_actual_hours as number))
        : null
    }
    
    return c.json({
      client,
      statistics: taskStats,
      tasksByType: tasksByType.results,
      monthlyTrend: monthlyTrend.results,
      billing: billingInfo
    })
  } catch (error) {
    return c.json({ error: 'Failed to generate client report' }, 500)
  }
})

// Export report as CSV
reportsRouter.get('/export/csv', async (c) => {
  try {
    const { type, year, month, client_id } = c.req.query()
    
    let csvData = ''
    let filename = ''
    
    if (type === 'monthly') {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`
      const endDate = `${year}-${String(month).padStart(2, '0')}-31`
      
      const tasks = await c.env.DB.prepare(`
        SELECT 
          t.id,
          t.title,
          c.name as client_name,
          u.name as assignee_name,
          t.task_type,
          t.status,
          t.priority,
          t.due_date,
          t.estimated_hours,
          t.actual_hours,
          t.progress
        FROM tasks t
        LEFT JOIN clients c ON t.client_id = c.id
        LEFT JOIN users u ON t.assignee_id = u.id
        WHERE date(t.due_date) BETWEEN ? AND ?
        ORDER BY t.due_date, c.name
      `).bind(startDate, endDate).all()
      
      // Create CSV header
      csvData = 'ID,タスク名,顧問先,担当者,タイプ,ステータス,優先度,期限,予定工数,実績工数,進捗率\n'
      
      // Add data rows
      for (const task of tasks.results) {
        csvData += `${task.id},"${task.title}","${task.client_name}","${task.assignee_name}",`
        csvData += `${task.task_type},${task.status},${task.priority},${task.due_date},`
        csvData += `${task.estimated_hours},${task.actual_hours || 0},${task.progress}%\n`
      }
      
      filename = `monthly_report_${year}_${month}.csv`
    }
    
    // Return CSV file
    return new Response(csvData, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error) {
    return c.json({ error: 'Failed to export report' }, 500)
  }
})