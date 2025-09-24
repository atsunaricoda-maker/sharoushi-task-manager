import { Hono } from 'hono'
import type { Context } from 'hono'

type Bindings = {
  DB: D1Database
}

export const clientsRouter = new Hono<{ Bindings: Bindings }>()

// Get all tasks for a specific client
clientsRouter.get('/:id/tasks', async (c) => {
  try {
    const clientId = c.req.param('id')
    
    // Get all tasks for this client (including completed ones)
    const tasks = await c.env.DB.prepare(`
      SELECT 
        t.*,
        u.name as assignee_name
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      WHERE t.client_id = ?
      ORDER BY 
        CASE t.status 
          WHEN 'in_progress' THEN 1
          WHEN 'pending' THEN 2
          WHEN 'completed' THEN 3
          ELSE 4
        END,
        t.due_date ASC
    `).bind(clientId).all()
    
    return c.json({
      success: true,
      tasks: tasks.results || []
    })
  } catch (error) {
    console.error('Failed to fetch client tasks:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to fetch client tasks',
      tasks: []
    }, 500)
  }
})

// Get client details with tasks and templates
clientsRouter.get('/:id', async (c) => {
  try {
    const clientId = c.req.param('id')
    
    // Get client details
    const client = await c.env.DB.prepare(`
      SELECT * FROM clients WHERE id = ?
    `).bind(clientId).first()
    
    if (!client) {
      return c.json({ error: 'Client not found' }, 404)
    }
    
    // Get active tasks for this client
    const tasks = await c.env.DB.prepare(`
      SELECT 
        t.*,
        u.name as assignee_name
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      WHERE t.client_id = ? AND t.status != 'completed'
      ORDER BY t.due_date ASC
    `).bind(clientId).all()
    
    // Get assigned templates (template tables not yet created, returning empty)
    const templates = { results: [] }
    
    // Get task history
    const taskHistory = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overdue_tasks,
        AVG(actual_hours) as avg_actual_hours
      FROM tasks
      WHERE client_id = ?
    `).bind(clientId).first()
    
    return c.json({
      client,
      activeTasks: tasks.results,
      templates: templates.results,
      statistics: taskHistory
    })
  } catch (error) {
    return c.json({ error: 'Failed to fetch client details' }, 500)
  }
})

// Update client information
clientsRouter.put('/:id', async (c) => {
  try {
    const clientId = c.req.param('id')
    const body = await c.req.json()
    const {
      name, company_name, email, phone, address,
      contract_plan, employee_count, monthly_fee, notes
    } = body
    
    await c.env.DB.prepare(`
      UPDATE clients SET
        name = ?, company_name = ?, email = ?, phone = ?,
        address = ?, contract_plan = ?, employee_count = ?, 
        monthly_fee = ?, notes = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      name, company_name, email, phone,
      address, contract_plan, employee_count,
      monthly_fee, notes, clientId
    ).run()
    
    return c.json({ success: true, message: '顧問先情報を更新しました' })
  } catch (error) {
    return c.json({ error: 'Failed to update client' }, 500)
  }
})

// Create new client
clientsRouter.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const {
      name, company_name, email, phone, address,
      contract_plan, employee_count, monthly_fee, notes
    } = body
    
    // Validate required field
    if (!name) {
      return c.json({ error: '顧問先名は必須です' }, 400)
    }
    
    const result = await c.env.DB.prepare(`
      INSERT INTO clients (
        name, company_name, email, phone, address,
        contract_plan, employee_count, monthly_fee, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      name, company_name || null, email || null, phone || null, address || null,
      contract_plan || null, employee_count || null, monthly_fee || null, notes || null
    ).run()
    
    return c.json({
      success: true,
      id: result.meta.last_row_id,
      message: '顧問先を登録しました'
    })
  } catch (error) {
    return c.json({ error: 'Failed to create client' }, 500)
  }
})

// Manage client templates
clientsRouter.post('/:id/templates', async (c) => {
  try {
    const clientId = c.req.param('id')
    const { template_id, custom_due_day, assigned_user_id } = await c.req.json()
    
    await c.env.DB.prepare(`
      INSERT OR REPLACE INTO client_task_templates (
        client_id, template_id, is_active, custom_due_day, assigned_user_id
      ) VALUES (?, ?, TRUE, ?, ?)
    `).bind(clientId, template_id, custom_due_day, assigned_user_id).run()
    
    return c.json({ 
      success: true,
      message: 'テンプレートを割り当てました'
    })
  } catch (error) {
    return c.json({ error: 'Failed to assign template' }, 500)
  }
})

// Get client contact history
clientsRouter.get('/:id/contacts', async (c) => {
  try {
    const clientId = c.req.param('id')
    
    // First check if client_contacts table exists
    let contacts
    try {
      contacts = await c.env.DB.prepare(`
        SELECT 
          id,
          contact_type,
          subject,
          notes,
          contact_date,
          created_at
        FROM client_contacts 
        WHERE client_id = ? 
        ORDER BY contact_date DESC, created_at DESC
        LIMIT 50
      `).bind(clientId).all()
    } catch (dbError) {
      console.error('Database error (table might not exist):', dbError)
      // If table doesn't exist, return empty contacts gracefully
      return c.json({
        success: true,
        contacts: [],
        message: 'Contact history feature not yet initialized'
      })
    }
    
    return c.json({
      success: true,
      contacts: contacts.results || []
    })
  } catch (error) {
    console.error('Error fetching client contacts:', error)
    return c.json({ 
      success: true, // Change to success: true for graceful degradation
      contacts: [],
      message: 'Contact history temporarily unavailable'
    })
  }
})

// Delete client template assignment
clientsRouter.delete('/:id/templates/:templateId', async (c) => {
  try {
    const clientId = c.req.param('id')
    const templateId = c.req.param('templateId')
    
    await c.env.DB.prepare(`
      UPDATE client_task_templates
      SET is_active = FALSE
      WHERE client_id = ? AND template_id = ?
    `).bind(clientId, templateId).run()
    
    return c.json({ 
      success: true,
      message: 'テンプレートの割り当てを解除しました'
    })
  } catch (error) {
    return c.json({ error: 'Failed to remove template' }, 500)
  }
})

// Delete client (with safety checks)
clientsRouter.delete('/:id', async (c) => {
  try {
    const clientId = c.req.param('id')
    console.log(`Starting deletion process for client ID: ${clientId}`)
    
    // Check if client exists
    let client
    try {
      client = await c.env.DB.prepare(`SELECT * FROM clients WHERE id = ?`).bind(clientId).first()
      console.log(`Client lookup result:`, client)
    } catch (error) {
      console.error('Error checking client existence:', error)
      return c.json({ error: 'クライアント存在確認でエラーが発生しました', debug: error.message }, 500)
    }
    
    if (!client) {
      return c.json({ error: '顧問先が見つかりません' }, 404)
    }
    
    // Check for active tasks (with error handling)
    let activeTasks
    try {
      activeTasks = await c.env.DB.prepare(`
        SELECT COUNT(*) as count FROM tasks 
        WHERE client_id = ? AND status != 'completed'
      `).bind(clientId).first()
      console.log(`Active tasks check:`, activeTasks)
    } catch (error) {
      console.warn('Tasks table might not exist or query failed:', error)
      activeTasks = { count: 0 } // Default to 0 if table doesn't exist
    }
    
    if (activeTasks && activeTasks.count > 0) {
      return c.json({ 
        error: 'アクティブなタスクがある顧問先は削除できません。先にタスクを完了または削除してください。',
        activeTaskCount: activeTasks.count
      }, 400)
    }
    
    // Check for future schedule entries (with error handling)
    let futureSchedules
    try {
      futureSchedules = await c.env.DB.prepare(`
        SELECT COUNT(*) as count FROM schedule_entries 
        WHERE client_id = ? AND start_time > datetime('now')
      `).bind(clientId).first()
      console.log(`Future schedules check:`, futureSchedules)
    } catch (error) {
      console.warn('Schedule_entries table might not exist or query failed:', error)
      futureSchedules = { count: 0 } // Default to 0 if table doesn't exist
    }
    
    if (futureSchedules && futureSchedules.count > 0) {
      return c.json({ 
        error: '将来のスケジュールがある顧問先は削除できません。先にスケジュールを削除してください。',
        futureScheduleCount: futureSchedules.count
      }, 400)
    }
    
    // Proceed with deletion - only delete from tables that exist
    console.log('Starting deletion of related records...')
    
    // Try to delete from client_task_templates (optional table)
    try {
      await c.env.DB.prepare(`DELETE FROM client_task_templates WHERE client_id = ?`).bind(clientId).run()
      console.log('Deleted from client_task_templates')
    } catch (error) {
      console.warn('Failed to delete from client_task_templates (table might not exist):', error)
    }
    
    // Try to delete from tasks (optional table)
    try {
      await c.env.DB.prepare(`DELETE FROM tasks WHERE client_id = ?`).bind(clientId).run()
      console.log('Deleted from tasks')
    } catch (error) {
      console.warn('Failed to delete from tasks (table might not exist):', error)
    }
    
    // Try to delete from schedule_entries (optional table)
    try {
      await c.env.DB.prepare(`DELETE FROM schedule_entries WHERE client_id = ?`).bind(clientId).run()
      console.log('Deleted from schedule_entries')
    } catch (error) {
      console.warn('Failed to delete from schedule_entries (table might not exist):', error)
    }
    
    // Delete the client (this table should exist)
    try {
      await c.env.DB.prepare(`DELETE FROM clients WHERE id = ?`).bind(clientId).run()
      console.log('Successfully deleted client')
    } catch (error) {
      console.error('Failed to delete client:', error)
      return c.json({ error: 'クライアントの削除に失敗しました', debug: error.message }, 500)
    }
    
    return c.json({ 
      success: true,
      message: '顧問先を削除しました'
    })
  } catch (error) {
    console.error('Unexpected error during client deletion:', error)
    return c.json({ 
      error: '顧問先の削除中に予期しないエラーが発生しました', 
      debug: error.message 
    }, 500)
  }
})