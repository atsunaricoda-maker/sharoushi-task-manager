import { Hono } from 'hono'
import type { Bindings } from '../types'
import { getCookie } from 'hono/cookie'
import { verify } from 'hono/jwt'

const scheduleRouter = new Hono<{ Bindings: Bindings }>()

// Simple auth check for schedule routes
async function checkScheduleAuth(c: any) {
  try {
    const token = getCookie(c, 'auth_token')
    if (!token) {
      return c.json({ error: 'Unauthorized', message: 'No auth token found' }, 401)
    }

    const jwtSecret = c.env.JWT_SECRET || 'dev-secret-key-please-change-in-production'
    const payload = await verify(token, jwtSecret)
    
    if (!payload || !payload.userId) {
      return c.json({ error: 'Unauthorized', message: 'Invalid token' }, 401)
    }

    // Set user info for use in route handlers
    c.set('userId', payload.userId)
    c.set('user', payload)
    return null // No error
  } catch (error) {
    console.error('Auth error:', error)
    return c.json({ error: 'Unauthorized', message: 'Invalid token' }, 401)
  }
}

// Get schedule entries for a date range
scheduleRouter.get('/', async (c) => {
  // Check authentication
  const authError = await checkScheduleAuth(c)
  if (authError) return authError
  
  try {
    const startDate = c.req.query('start_date') || new Date().toISOString().split('T')[0]
    const endDate = c.req.query('end_date') || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const userId = c.req.query('user_id')
    
    console.log(`Loading schedule entries from ${startDate} to ${endDate}`)
    
    // Check if schedule_entries table exists by trying a simple query first
    let result
    try {
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
      
      result = await c.env.DB.prepare(query).bind(...params).all()
      console.log(`Successfully loaded ${result.results?.length || 0} schedule entries`)
    } catch (dbError) {
      console.warn('Schedule_entries table might not exist or query failed:', dbError)
      // Return empty array if table doesn't exist
      return c.json([])
    }
    
    return c.json(result.results || [])
  } catch (error) {
    console.error('Unexpected error fetching schedule entries:', error)
    return c.json({ error: 'Failed to fetch schedule', debug: error.message }, 500)
  }
})

// Get single schedule entry
scheduleRouter.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    
    let entry
    try {
      entry = await c.env.DB.prepare(`
        SELECT se.*, c.name as client_name, c.company_name
        FROM schedule_entries se
        LEFT JOIN clients c ON se.client_id = c.id
        WHERE se.id = ?
      `).bind(id).first()
    } catch (dbError) {
      console.warn('Schedule_entries table might not exist:', dbError)
      return c.json({ error: 'Schedule entry not found' }, 404)
    }
    
    if (!entry) {
      return c.json({ error: 'Schedule entry not found' }, 404)
    }
    
    return c.json(entry)
  } catch (error) {
    console.error('Error fetching schedule entry:', error)
    return c.json({ error: 'Failed to fetch schedule entry', debug: error.message }, 500)
  }
})

// Create schedule entry
scheduleRouter.post('/', async (c) => {
  // Check authentication
  const authError = await checkScheduleAuth(c)
  if (authError) return authError
  
  try {
    const body = await c.req.json()
    const { 
      client_id, title, description, entry_type,
      start_time, end_time, location, is_recurring, recurrence_pattern
    } = body
    
    // Get user_id from auth context
    const userId = c.get('userId')
    
    console.log('Creating schedule entry:', { title, entry_type, start_time, userId })
    
    // Validate required fields
    if (!title || !start_time) {
      return c.json({ error: 'タイトルと開始時刻は必須です' }, 400)
    }
    
    // Try to create schedule entry, but handle table not existing
    try {
      const result = await c.env.DB.prepare(`
        INSERT INTO schedule_entries 
        (user_id, client_id, title, description, entry_type, start_time, end_time, location, is_recurring, recurrence_pattern, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        userId, 
        client_id || null, 
        title, 
        description || null, 
        entry_type || 'other',
        start_time, 
        end_time || null, 
        location || null, 
        is_recurring ? 1 : 0,
        recurrence_pattern ? JSON.stringify(recurrence_pattern) : null
      ).run()
      
      console.log('Successfully created schedule entry:', result.meta.last_row_id)
      
      return c.json({ 
        id: result.meta.last_row_id,
        success: true,
        message: 'スケジュールを登録しました'
      })
    } catch (dbError) {
      console.error('Database error creating schedule entry:', dbError)
      return c.json({ 
        error: 'スケジュールテーブルが存在しないか、データベースエラーが発生しました',
        debug: dbError.message 
      }, 500)
    }
    
  } catch (error) {
    console.error('Unexpected error creating schedule entry:', error)
    return c.json({ 
      error: 'スケジュール作成中に予期しないエラーが発生しました', 
      debug: error.message 
    }, 500)
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
    
    let result
    try {
      result = await c.env.DB.prepare(`
        SELECT se.*, c.name as client_name, c.company_name
        FROM schedule_entries se
        LEFT JOIN clients c ON se.client_id = c.id
        WHERE se.start_time >= ? AND se.start_time <= ?
        ORDER by se.start_time ASC
        LIMIT 10
      `).bind(now, weekLater).all()
    } catch (dbError) {
      console.warn('Schedule_entries table might not exist:', dbError)
      return c.json([])
    }
    
    return c.json(result.results || [])
  } catch (error) {
    console.error('Error fetching upcoming entries:', error)
    return c.json({ error: 'Failed to fetch upcoming entries', debug: error.message }, 500)
  }
})

export default scheduleRouter