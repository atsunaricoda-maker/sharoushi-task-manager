import { Hono } from 'hono'
import type { Bindings } from '../types'

export const reportsRouter = new Hono<{ Bindings: Bindings }>()

// Get dashboard statistics
reportsRouter.get('/dashboard', async (c) => {
  try {
    // Get client statistics
    const clientStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_clients,
        SUM(employee_count) as total_employees,
        SUM(monthly_fee) as total_monthly_revenue
      FROM clients WHERE is_active = 1
    `).first()
    
    // Get task statistics
    const taskStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tasks,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_tasks
      FROM tasks
    `).first()
    
    // Get project statistics
    const projectStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_projects,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_projects,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_projects
      FROM projects
    `).first()
    
    // Get subsidy statistics
    const subsidyStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_applications,
        SUM(amount_requested) as total_requested,
        SUM(amount_approved) as total_approved
      FROM subsidy_applications
    `).first()
    
    return c.json({
      clients: clientStats || {},
      tasks: taskStats || {},
      projects: projectStats || {},
      subsidies: subsidyStats || {}
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return c.json({ error: 'Failed to fetch dashboard statistics' }, 500)
  }
})

// Get revenue report
reportsRouter.get('/revenue', async (c) => {
  try {
    const period = c.req.query('period') || 'monthly'
    
    let query = ''
    if (period === 'monthly') {
      query = `
        SELECT 
          strftime('%Y-%m', created_at) as period,
          COUNT(*) as new_clients,
          SUM(monthly_fee) as revenue
        FROM clients
        GROUP BY period
        ORDER BY period DESC
        LIMIT 12
      `
    } else if (period === 'yearly') {
      query = `
        SELECT 
          strftime('%Y', created_at) as period,
          COUNT(*) as new_clients,
          SUM(monthly_fee * 12) as revenue
        FROM clients
        GROUP BY period
        ORDER BY period DESC
        LIMIT 5
      `
    }
    
    const result = await c.env.DB.prepare(query).all()
    
    return c.json(result.results || [])
  } catch (error) {
    console.error('Error fetching revenue report:', error)
    return c.json({ error: 'Failed to fetch revenue report' }, 500)
  }
})

// Get task completion report
reportsRouter.get('/task-completion', async (c) => {
  try {
    const startDate = c.req.query('start_date') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const endDate = c.req.query('end_date') || new Date().toISOString().split('T')[0]
    
    const result = await c.env.DB.prepare(`
      SELECT 
        DATE(COALESCE(completed_at, updated_at)) as date,
        COUNT(*) as completed_tasks
      FROM tasks
      WHERE status = 'completed'
        AND DATE(COALESCE(completed_at, updated_at)) BETWEEN ? AND ?
      GROUP BY DATE(COALESCE(completed_at, updated_at))
      ORDER BY date DESC
    `).bind(startDate, endDate).all()
    
    return c.json(result.results || [])
  } catch (error) {
    console.error('Error fetching task completion report:', error)
    return c.json({ error: 'Failed to fetch task completion report' }, 500)
  }
})

// Get client activity report
reportsRouter.get('/client-activity', async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT 
        c.id, c.name, c.company_name,
        COUNT(DISTINCT t.id) as total_tasks,
        COUNT(DISTINCT p.id) as total_projects,
        COUNT(DISTINCT sa.id) as total_subsidies,
        c.monthly_fee
      FROM clients c
      LEFT JOIN tasks t ON c.id = t.client_id
      LEFT JOIN projects p ON c.id = p.client_id
      LEFT JOIN subsidy_applications sa ON c.id = sa.client_id
      WHERE c.is_active = 1
      GROUP BY c.id
      ORDER BY (COUNT(DISTINCT t.id) + COUNT(DISTINCT p.id) + COUNT(DISTINCT sa.id)) DESC
      LIMIT 50
    `).all()
    
    return c.json(result.results || [])
  } catch (error) {
    console.error('Error fetching client activity report:', error)
    return c.json({ error: 'Failed to fetch client activity report' }, 500)
  }
})

// Get monthly report
reportsRouter.get('/monthly', async (c) => {
  try {
    const year = c.req.query('year') || new Date().getFullYear()
    const month = c.req.query('month') || (new Date().getMonth() + 1)
    
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = new Date(Number(year), Number(month), 0).toISOString().split('T')[0]
    
    // Get summary statistics
    const summary = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tasks,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_tasks,
        SUM(CASE WHEN status != 'completed' AND due_date < datetime('now') THEN 1 ELSE 0 END) as overdue_tasks,
        COALESCE(SUM(estimated_hours), 0) as total_estimated_hours,
        COALESCE(SUM(actual_hours), 0) as total_actual_hours
      FROM tasks
      WHERE DATE(created_at) BETWEEN ? AND ?
    `).bind(startDate, endDate).first()
    
    // Get daily trend
    const dailyTrend = await c.env.DB.prepare(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        ROUND(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0), 1) as completion_rate
      FROM tasks
      WHERE DATE(created_at) BETWEEN ? AND ?
      GROUP BY DATE(created_at)
      ORDER BY date
    `).bind(startDate, endDate).all()
    
    // Get client breakdown
    const clientBreakdown = await c.env.DB.prepare(`
      SELECT 
        c.id, c.name, c.company_name,
        COUNT(t.id) as task_count,
        SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_count,
        c.monthly_fee
      FROM clients c
      LEFT JOIN tasks t ON c.id = t.client_id 
        AND DATE(t.created_at) BETWEEN ? AND ?
      WHERE c.is_active = 1
      GROUP BY c.id
      ORDER BY task_count DESC
    `).bind(startDate, endDate).all()
    
    // Get staff breakdown
    const staffBreakdown = await c.env.DB.prepare(`
      SELECT 
        u.id, u.name,
        COUNT(t.id) as task_count,
        SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_count,
        AVG(CASE WHEN t.status = 'completed' AND t.estimated_hours > 0 
          THEN CAST(t.actual_hours AS FLOAT) / CAST(t.estimated_hours AS FLOAT) * 100 ELSE NULL END) as efficiency
      FROM users u
      LEFT JOIN tasks t ON u.id = t.assignee_id 
        AND DATE(t.created_at) BETWEEN ? AND ?
      GROUP BY u.id
      ORDER BY task_count DESC
    `).bind(startDate, endDate).all()
    
    return c.json({
      period: { year, month },
      summary: summary || {},
      dailyTrend: dailyTrend.results || [],
      clientBreakdown: clientBreakdown.results || [],
      staffBreakdown: staffBreakdown.results || []
    })
  } catch (error) {
    console.error('Error generating monthly report:', error)
    return c.json({ error: 'Failed to generate monthly report' }, 500)
  }
})

// Get client-specific report
reportsRouter.get('/client/:id', async (c) => {
  try {
    const clientId = c.req.param('id')
    const months = c.req.query('months') || '3'
    
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - Number(months))
    
    // Get client info
    const client = await c.env.DB.prepare(`
      SELECT * FROM clients WHERE id = ?
    `).bind(clientId).first()
    
    if (!client) {
      return c.json({ error: 'Client not found' }, 404)
    }
    
    // Get task statistics
    const taskStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tasks,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_tasks,
        AVG(CASE WHEN status = 'completed' AND due_date IS NOT NULL 
          THEN julianday(completed_at) - julianday(due_date) ELSE NULL END) as avg_completion_days
      FROM tasks
      WHERE client_id = ? AND created_at >= ?
    `).bind(clientId, startDate.toISOString()).first()
    
    // Get monthly trend
    const monthlyTrend = await c.env.DB.prepare(`
      SELECT 
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as task_count,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count
      FROM tasks
      WHERE client_id = ? AND created_at >= ?
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month
    `).bind(clientId, startDate.toISOString()).all()
    
    // Get project summary
    const projects = await c.env.DB.prepare(`
      SELECT 
        id, name, status, budget,
        start_date, end_date
      FROM projects
      WHERE client_id = ?
      ORDER BY created_at DESC
    `).bind(clientId).all()
    
    // Get subsidy applications
    const subsidies = await c.env.DB.prepare(`
      SELECT 
        id, subsidy_name, status,
        amount_requested, amount_approved,
        application_date, approval_date
      FROM subsidy_applications
      WHERE client_id = ?
      ORDER BY created_at DESC
    `).bind(clientId).all()
    
    return c.json({
      client,
      taskStats: taskStats || {},
      monthlyTrend: monthlyTrend.results || [],
      projects: projects.results || [],
      subsidies: subsidies.results || [],
      period: { months }
    })
  } catch (error) {
    console.error('Error generating client report:', error)
    return c.json({ error: 'Failed to generate client report' }, 500)
  }
})

// Generate PDF report (placeholder - actual PDF generation would require additional libraries)
reportsRouter.post('/export/pdf', async (c) => {
  try {
    const { type, data } = await c.req.json()
    
    // In a real implementation, we would use a PDF library like jsPDF or Puppeteer
    // For now, return a success message
    return c.json({
      success: true,
      message: 'PDF生成機能は実装予定です',
      type,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return c.json({ error: 'Failed to generate PDF' }, 500)
  }
})

// Generate CSV report
reportsRouter.post('/export/csv', async (c) => {
  try {
    const { type, period } = await c.req.json()
    
    let csvData = []
    let headers = []
    
    if (type === 'tasks') {
      headers = ['ID', 'タイトル', '顧客名', '担当者', 'ステータス', '優先度', '期限', '作成日']
      
      const tasks = await c.env.DB.prepare(`
        SELECT 
          t.id, t.title, c.name as client_name, u.name as assignee_name,
          t.status, t.priority, t.due_date, t.created_at
        FROM tasks t
        LEFT JOIN clients c ON t.client_id = c.id
        LEFT JOIN users u ON t.assignee_id = u.id
        ORDER BY t.created_at DESC
      `).all()
      
      csvData = tasks.results?.map(t => [
        t.id,
        t.title,
        t.client_name || '',
        t.assignee_name || '',
        t.status,
        t.priority,
        t.due_date || '',
        t.created_at
      ]) || []
    } else if (type === 'clients') {
      headers = ['ID', '名前', '会社名', 'メール', '電話', '契約プラン', '従業員数', '月額料金']
      
      const clients = await c.env.DB.prepare(`
        SELECT * FROM clients WHERE is_active = 1
      `).all()
      
      csvData = clients.results?.map(c => [
        c.id,
        c.name,
        c.company_name || '',
        c.email || '',
        c.phone || '',
        c.contract_plan || '',
        c.employee_count || '',
        c.monthly_fee || ''
      ]) || []
    }
    
    // Convert to CSV format
    const csv = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n')
    
    // Return CSV with appropriate headers
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="report_${type}_${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error) {
    console.error('Error generating CSV:', error)
    return c.json({ error: 'Failed to generate CSV' }, 500)
  }
})

export default reportsRouter