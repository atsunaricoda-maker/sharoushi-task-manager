import { Hono } from 'hono'
import type { Bindings } from '../types'

export const notificationRouter = new Hono<{ Bindings: Bindings }>()

// Get user notification settings
notificationRouter.get('/settings', async (c) => {
  try {
    const userId = c.req.query('user_id')
    
    if (!userId) {
      return c.json({ error: 'User ID is required' }, 400)
    }
    
    const settings = await c.env.DB.prepare(`
      SELECT * FROM notification_settings
      WHERE user_id = ?
    `).bind(userId).first()
    
    // Return default settings if none exist
    if (!settings) {
      return c.json({
        user_id: userId,
        email_enabled: true,
        push_enabled: false,
        sms_enabled: false,
        task_reminders: true,
        deadline_alerts: true,
        subsidy_updates: true,
        client_updates: true,
        reminder_time: '09:00'
      })
    }
    
    return c.json(settings)
  } catch (error) {
    console.error('Error fetching notification settings:', error)
    return c.json({ error: 'Failed to fetch notification settings' }, 500)
  }
})

// Update notification settings
notificationRouter.post('/settings', async (c) => {
  try {
    const body = await c.req.json()
    const {
      user_id,
      email_enabled = true,
      push_enabled = false,
      sms_enabled = false,
      task_reminders = true,
      deadline_alerts = true,
      subsidy_updates = true,
      client_updates = true,
      reminder_time = '09:00'
    } = body
    
    if (!user_id) {
      return c.json({ error: 'User ID is required' }, 400)
    }
    
    // Check if settings exist
    const existing = await c.env.DB.prepare(`
      SELECT id FROM notification_settings WHERE user_id = ?
    `).bind(user_id).first()
    
    if (existing) {
      // Update existing settings
      await c.env.DB.prepare(`
        UPDATE notification_settings SET
          email_enabled = ?, push_enabled = ?, sms_enabled = ?,
          task_reminders = ?, deadline_alerts = ?, subsidy_updates = ?,
          client_updates = ?, reminder_time = ?, updated_at = datetime('now')
        WHERE user_id = ?
      `).bind(
        email_enabled ? 1 : 0, push_enabled ? 1 : 0, sms_enabled ? 1 : 0,
        task_reminders ? 1 : 0, deadline_alerts ? 1 : 0, subsidy_updates ? 1 : 0,
        client_updates ? 1 : 0, reminder_time, user_id
      ).run()
    } else {
      // Create new settings
      await c.env.DB.prepare(`
        INSERT INTO notification_settings 
        (user_id, email_enabled, push_enabled, sms_enabled, task_reminders, 
         deadline_alerts, subsidy_updates, client_updates, reminder_time)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        user_id,
        email_enabled ? 1 : 0, push_enabled ? 1 : 0, sms_enabled ? 1 : 0,
        task_reminders ? 1 : 0, deadline_alerts ? 1 : 0, subsidy_updates ? 1 : 0,
        client_updates ? 1 : 0, reminder_time
      ).run()
    }
    
    return c.json({ 
      success: true,
      message: '通知設定を更新しました'
    })
  } catch (error) {
    console.error('Error updating notification settings:', error)
    return c.json({ error: 'Failed to update notification settings' }, 500)
  }
})

// Get pending notifications
notificationRouter.get('/pending', async (c) => {
  try {
    const userId = c.req.query('user_id')
    const now = new Date()
    
    // Get tasks due soon
    const tasksDue = await c.env.DB.prepare(`
      SELECT 
        'task' as type,
        t.id,
        t.title,
        t.due_date,
        c.name as client_name
      FROM tasks t
      LEFT JOIN clients c ON t.client_id = c.id
      WHERE t.status != 'completed'
        AND t.due_date <= datetime('now', '+3 days')
        ${userId ? 'AND t.assigned_to = ?' : ''}
      ORDER BY t.due_date ASC
      LIMIT 10
    `).bind(...(userId ? [userId] : [])).all()
    
    // Get subsidy deadlines
    const subsidyDeadlines = await c.env.DB.prepare(`
      SELECT 
        'subsidy' as type,
        sa.id,
        sa.subsidy_name as title,
        sa.deadline_date as due_date,
        c.name as client_name
      FROM subsidy_applications sa
      LEFT JOIN clients c ON sa.client_id = c.id
      WHERE sa.status IN ('preparing', 'submitted')
        AND sa.deadline_date <= datetime('now', '+7 days')
      ORDER BY sa.deadline_date ASC
      LIMIT 10
    `).all()
    
    return c.json({
      tasks: tasksDue.results || [],
      subsidies: subsidyDeadlines.results || []
    })
  } catch (error) {
    console.error('Error fetching pending notifications:', error)
    return c.json({ error: 'Failed to fetch pending notifications' }, 500)
  }
})

export default notificationRouter