import { Hono } from 'hono'
import type { Bindings } from '../types'

const scheduleRouter = new Hono<{ Bindings: Bindings }>()

// Get schedule entries for a date range
scheduleRouter.get('/', async (c) => {
  try {
    const startDate = c.req.query('start_date') || new Date().toISOString().split('T')[0]
    const endDate = c.req.query('end_date') || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const userId = c.req.query('user_id')
    
    let query = `
      SELECT se.*, c.name as client_name, c.company_name
      FROM schedule_entries se
      LEFT JOIN clients c ON se.client_id = c.id
      WHERE se.start_time >= ? AND se.start_time <= ?
    `
    const params = [startDate, endDate + 'T23:59:59']
    
    if (userId) {
      query += ' AND se.user_id = ?'
      params.push(userId)
    }
    
    query += ' ORDER BY se.start_time ASC'
    
    const result = await c.env.DB.prepare(query).bind(...params).all()
    
    return c.json(result.results || [])
  } catch (error) {
    console.error('Error fetching schedule entries:', error)
    return c.json({ error: 'Failed to fetch schedule' }, 500)
  }
})

// Get single schedule entry
scheduleRouter.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    
    const entry = await c.env.DB.prepare(`
      SELECT se.*, c.name as client_name, c.company_name
      FROM schedule_entries se
      LEFT JOIN clients c ON se.client_id = c.id
      WHERE se.id = ?
    `).bind(id).first()
    
    if (!entry) {
      return c.json({ error: 'Schedule entry not found' }, 404)
    }
    
    return c.json(entry)
  } catch (error) {
    console.error('Error fetching schedule entry:', error)
    return c.json({ error: 'Failed to fetch schedule entry' }, 500)
  }
})

// Create schedule entry
scheduleRouter.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const { 
      user_id, client_id, title, description, entry_type,
      start_time, end_time, location, is_recurring, recurrence_pattern
    } = body
    
    const result = await c.env.DB.prepare(`
      INSERT INTO schedule_entries 
      (user_id, client_id, title, description, entry_type, start_time, end_time, location, is_recurring, recurrence_pattern)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      user_id, client_id, title, description, entry_type,
      start_time, end_time, location, is_recurring ? 1 : 0,
      recurrence_pattern ? JSON.stringify(recurrence_pattern) : null
    ).run()
    
    return c.json({ 
      id: result.meta.last_row_id,
      success: true,
      message: 'スケジュールを登録しました'
    })
  } catch (error) {
    console.error('Error creating schedule entry:', error)
    return c.json({ error: 'Failed to create schedule entry' }, 500)
  }
})

// Update schedule entry
scheduleRouter.put('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const { 
      user_id, client_id, title, description, entry_type,
      start_time, end_time, location, is_recurring, recurrence_pattern
    } = body
    
    await c.env.DB.prepare(`
      UPDATE schedule_entries SET
        user_id = ?, client_id = ?, title = ?, description = ?,
        entry_type = ?, start_time = ?, end_time = ?, location = ?,
        is_recurring = ?, recurrence_pattern = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      user_id, client_id, title, description, entry_type,
      start_time, end_time, location, is_recurring ? 1 : 0,
      recurrence_pattern ? JSON.stringify(recurrence_pattern) : null, id
    ).run()
    
    return c.json({ 
      success: true,
      message: 'スケジュールを更新しました'
    })
  } catch (error) {
    console.error('Error updating schedule entry:', error)
    return c.json({ error: 'Failed to update schedule entry' }, 500)
  }
})

// Delete schedule entry
scheduleRouter.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    
    await c.env.DB.prepare(`
      DELETE FROM schedule_entries WHERE id = ?
    `).bind(id).run()
    
    return c.json({ 
      success: true,
      message: 'スケジュールを削除しました'
    })
  } catch (error) {
    console.error('Error deleting schedule entry:', error)
    return c.json({ error: 'Failed to delete schedule entry' }, 500)
  }
})

// Get upcoming deadlines and appointments
scheduleRouter.get('/upcoming/summary', async (c) => {
  try {
    const now = new Date().toISOString()
    const weekLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    
    const result = await c.env.DB.prepare(`
      SELECT se.*, c.name as client_name, c.company_name
      FROM schedule_entries se
      LEFT JOIN clients c ON se.client_id = c.id
      WHERE se.start_time >= ? AND se.start_time <= ?
      ORDER BY se.start_time ASC
      LIMIT 10
    `).bind(now, weekLater).all()
    
    return c.json(result.results || [])
  } catch (error) {
    console.error('Error fetching upcoming entries:', error)
    return c.json({ error: 'Failed to fetch upcoming entries' }, 500)
  }
})

export default scheduleRouter