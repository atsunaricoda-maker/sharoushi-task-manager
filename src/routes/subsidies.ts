import { Hono } from 'hono'
import type { Bindings } from '../types'

const subsidiesRouter = new Hono<{ Bindings: Bindings }>()

// Get all subsidy applications
subsidiesRouter.get('/', async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT sa.*, c.name as client_name, c.company_name
      FROM subsidy_applications sa
      LEFT JOIN clients c ON sa.client_id = c.id
      ORDER BY sa.created_at DESC
    `).all()
    
    return c.json(result.results || [])
  } catch (error) {
    console.error('Error fetching subsidy applications:', error)
    return c.json({ error: 'Failed to fetch subsidy applications' }, 500)
  }
})

// Get single subsidy application
subsidiesRouter.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    
    const application = await c.env.DB.prepare(`
      SELECT sa.*, c.name as client_name, c.company_name
      FROM subsidy_applications sa
      LEFT JOIN clients c ON sa.client_id = c.id
      WHERE sa.id = ?
    `).bind(id).first()
    
    if (!application) {
      return c.json({ error: 'Subsidy application not found' }, 404)
    }
    
    return c.json(application)
  } catch (error) {
    console.error('Error fetching subsidy application:', error)
    return c.json({ error: 'Failed to fetch subsidy application' }, 500)
  }
})

// Create new subsidy application
subsidiesRouter.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const { 
      client_id, subsidy_name, application_date, deadline_date,
      amount_requested, status = 'preparing', notes, documents
    } = body
    
    const result = await c.env.DB.prepare(`
      INSERT INTO subsidy_applications 
      (client_id, subsidy_name, application_date, deadline_date, amount_requested, status, notes, documents)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      client_id, subsidy_name, application_date, deadline_date,
      amount_requested, status, notes, JSON.stringify(documents || [])
    ).run()
    
    return c.json({ 
      id: result.meta.last_row_id,
      success: true,
      message: '助成金申請を登録しました'
    })
  } catch (error) {
    console.error('Error creating subsidy application:', error)
    return c.json({ error: 'Failed to create subsidy application' }, 500)
  }
})

// Update subsidy application
subsidiesRouter.put('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const { 
      client_id, subsidy_name, application_date, deadline_date,
      amount_requested, status, notes, documents, approval_date, amount_approved
    } = body
    
    await c.env.DB.prepare(`
      UPDATE subsidy_applications SET
        client_id = ?, subsidy_name = ?, application_date = ?,
        deadline_date = ?, amount_requested = ?, status = ?,
        notes = ?, documents = ?, approval_date = ?,
        amount_approved = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      client_id, subsidy_name, application_date, deadline_date,
      amount_requested, status, notes, JSON.stringify(documents || []),
      approval_date, amount_approved, id
    ).run()
    
    return c.json({ 
      success: true,
      message: '助成金申請を更新しました'
    })
  } catch (error) {
    console.error('Error updating subsidy application:', error)
    return c.json({ error: 'Failed to update subsidy application' }, 500)
  }
})

// Delete subsidy application
subsidiesRouter.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    
    await c.env.DB.prepare(`
      DELETE FROM subsidy_applications WHERE id = ?
    `).bind(id).run()
    
    return c.json({ 
      success: true,
      message: '助成金申請を削除しました'
    })
  } catch (error) {
    console.error('Error deleting subsidy application:', error)
    return c.json({ error: 'Failed to delete subsidy application' }, 500)
  }
})

// Get subsidy statistics
subsidiesRouter.get('/stats/summary', async (c) => {
  try {
    const stats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_applications,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
        SUM(amount_requested) as total_requested,
        SUM(amount_approved) as total_approved
      FROM subsidy_applications
    `).first()
    
    return c.json(stats || {})
  } catch (error) {
    console.error('Error fetching subsidy statistics:', error)
    return c.json({ error: 'Failed to fetch statistics' }, 500)
  }
})

export default subsidiesRouter