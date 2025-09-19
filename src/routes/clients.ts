import { Hono } from 'hono'
import type { Context } from 'hono'

type Bindings = {
  DB: D1Database
}

export const clientsRouter = new Hono<{ Bindings: Bindings }>()

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
    
    // Get assigned templates
    const templates = await c.env.DB.prepare(`
      SELECT 
        ctt.*,
        tt.name as template_name,
        tt.description as template_description,
        tt.frequency,
        tt.estimated_hours,
        u.name as assigned_user_name
      FROM client_task_templates ctt
      LEFT JOIN task_templates tt ON ctt.template_id = tt.id
      LEFT JOIN users u ON ctt.assigned_user_id = u.id
      WHERE ctt.client_id = ? AND ctt.is_active = TRUE
    `).bind(clientId).all()
    
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
      name, name_kana, address, contact_email, contact_phone,
      employee_count, health_insurance_type, contract_plan,
      primary_contact_name, monthly_fee
    } = body
    
    await c.env.DB.prepare(`
      UPDATE clients SET
        name = ?, name_kana = ?, address = ?, contact_email = ?,
        contact_phone = ?, employee_count = ?, health_insurance_type = ?,
        contract_plan = ?, primary_contact_name = ?, monthly_fee = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      name, name_kana, address, contact_email, contact_phone,
      employee_count, health_insurance_type, contract_plan,
      primary_contact_name, monthly_fee, clientId
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
      name, name_kana, address, contact_email, contact_phone,
      employee_count, health_insurance_type, contract_plan,
      primary_contact_name, monthly_fee, contract_start_date
    } = body
    
    const result = await c.env.DB.prepare(`
      INSERT INTO clients (
        name, name_kana, address, contact_email, contact_phone,
        employee_count, health_insurance_type, contract_plan,
        primary_contact_name, monthly_fee, contract_start_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      name, name_kana, address, contact_email, contact_phone,
      employee_count, health_insurance_type, contract_plan,
      primary_contact_name, monthly_fee, contract_start_date
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