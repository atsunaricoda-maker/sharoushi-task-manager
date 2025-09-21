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
        DATE(completed_at) as date,
        COUNT(*) as completed_tasks
      FROM tasks
      WHERE status = 'completed'
        AND completed_at BETWEEN ? AND ?
      GROUP BY DATE(completed_at)
      ORDER BY date DESC
    `).bind(startDate, endDate + 'T23:59:59').all()
    
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

export default reportsRouter