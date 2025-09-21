import { Hono } from 'hono'
import type { Bindings } from '../types'

export const adminRouter = new Hono<{ Bindings: Bindings }>()

// Get system statistics
adminRouter.get('/stats', async (c) => {
  try {
    // Get user statistics
    const userStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN created_at > datetime('now', '-30 days') THEN 1 ELSE 0 END) as new_users_month
      FROM users
    `).first()
    
    // Get database size info
    const tableInfo = await c.env.DB.prepare(`
      SELECT name FROM sqlite_master WHERE type = 'table'
    `).all()
    
    // Get activity summary
    const activityStats = await c.env.DB.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM tasks WHERE created_at > datetime('now', '-24 hours')) as tasks_today,
        (SELECT COUNT(*) FROM clients WHERE created_at > datetime('now', '-7 days')) as clients_week,
        (SELECT COUNT(*) FROM projects WHERE status = 'active') as active_projects,
        (SELECT COUNT(*) FROM subsidy_applications WHERE status = 'submitted') as pending_subsidies
    `).first()
    
    return c.json({
      users: userStats || {},
      tables: tableInfo.results?.map(t => t.name) || [],
      activity: activityStats || {}
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return c.json({ error: 'Failed to fetch admin statistics' }, 500)
  }
})

// Get all users
adminRouter.get('/users', async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT id, email, name, role, created_at, last_login
      FROM users
      ORDER BY created_at DESC
    `).all()
    
    return c.json(result.results || [])
  } catch (error) {
    console.error('Error fetching users:', error)
    return c.json({ error: 'Failed to fetch users' }, 500)
  }
})

// Update user role
adminRouter.put('/users/:id/role', async (c) => {
  try {
    const userId = c.req.param('id')
    const { role } = await c.req.json()
    
    if (!['admin', 'user', 'viewer'].includes(role)) {
      return c.json({ error: 'Invalid role' }, 400)
    }
    
    await c.env.DB.prepare(`
      UPDATE users SET role = ? WHERE id = ?
    `).bind(role, userId).run()
    
    return c.json({ 
      success: true,
      message: 'ユーザーの役割を更新しました'
    })
  } catch (error) {
    console.error('Error updating user role:', error)
    return c.json({ error: 'Failed to update user role' }, 500)
  }
})

// Get system logs (placeholder)
adminRouter.get('/logs', async (c) => {
  try {
    // In production, this would fetch from a logging service
    return c.json({
      logs: [],
      message: 'ログ機能は実装予定です'
    })
  } catch (error) {
    console.error('Error fetching logs:', error)
    return c.json({ error: 'Failed to fetch logs' }, 500)
  }
})

// Database maintenance
adminRouter.post('/maintenance/optimize', async (c) => {
  try {
    // Run VACUUM to optimize database
    await c.env.DB.prepare('VACUUM').run()
    
    // Analyze tables for query optimization
    await c.env.DB.prepare('ANALYZE').run()
    
    return c.json({ 
      success: true,
      message: 'データベースを最適化しました'
    })
  } catch (error) {
    console.error('Error optimizing database:', error)
    return c.json({ error: 'Failed to optimize database' }, 500)
  }
})

export default adminRouter