import { Hono } from 'hono'
import type { Bindings } from '../types'
import { getCookie } from 'hono/cookie'
import { verifyToken } from '../lib/auth'

const scheduleRouter = new Hono<{ Bindings: Bindings }>()

// Simple auth check for schedule routes
async function checkScheduleAuth(c: any) {
  try {
    // Try both cookie names for compatibility
    const token = getCookie(c, 'auth-token') || getCookie(c, 'auth_token')
    if (!token) {
      return c.json({ error: 'Unauthorized', message: 'No auth token found' }, 401)
    }

    const jwtSecret = c.env.JWT_SECRET || 'dev-secret-key-please-change-in-production'
    const payload = await verifyToken(token, jwtSecret)
    
    console.log('JWT payload:', payload)
    
    // Reject development tokens in production
    if (payload?.email === 'tanaka@sharoushi.com' && payload?.name === '田中 太郎') {
      console.error('Development token detected in production, rejecting')
      return c.json({ 
        error: 'Unauthorized', 
        message: 'Development tokens are not allowed in production. Please login with Google OAuth.', 
        debug: 'Dev token rejected' 
      }, 401)
    }
    
    if (!payload || !payload.sub) {
      console.error('Invalid token payload:', payload)
      return c.json({ error: 'Unauthorized', message: 'Invalid token', debug: 'No sub field in JWT' }, 401)
    }

    // Set user info for use in route handlers (sub contains the user id)
    // Convert sub to integer if it's a string (common in OAuth tokens)
    const userId = typeof payload.sub === 'string' ? parseInt(payload.sub, 10) : payload.sub
    c.set('userId', userId)
    c.set('user', payload)
    console.log('Auth successful, userId set to:', userId, 'from payload.sub:', payload.sub)
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
    const user = c.get('user')
    
    console.log('Creating schedule entry:', { title, entry_type, start_time, userId, userContext: user })
    
    // Validate required fields
    if (!title || !start_time) {
      return c.json({ error: 'タイトルと開始時刻は必須です' }, 400)
    }
    
    // Validate userId is available
    if (!userId) {
      console.error('No userId found in auth context:', { user })
      return c.json({ 
        error: 'ユーザー情報が見つかりません', 
        debug: 'No userId in auth context'
      }, 400)
    }
    
    // Verify user exists in database and get actual user ID
    let actualUserId = userId
    const userEmail = user?.email || payload?.email
    
    if (!userEmail) {
      console.error('No email found in user context:', { user, payload })
      return c.json({ 
        error: 'ユーザーメールアドレスが見つかりません', 
        debug: 'No email in auth context'
      }, 400)
    }
    
    try {
      // Always verify user exists by email for production safety
      const dbUser = await c.env.DB.prepare(`
        SELECT id, email, name FROM users WHERE email = ?
      `).bind(userEmail).first()
      
      if (!dbUser) {
        console.error('User not found in database for email:', userEmail)
        return c.json({ 
          error: 'ユーザーがデータベースに存在しません。管理者にお問い合わせください。', 
          debug: `User not found for email: ${userEmail}`
        }, 400)
      }
      
      actualUserId = dbUser.id
      console.log('Verified user in database:', { id: dbUser.id, email: dbUser.email, name: dbUser.name })
      
    } catch (userLookupError) {
      console.error('Database user lookup error:', userLookupError)
      return c.json({ 
        error: 'ユーザー情報の取得に失敗しました', 
        debug: userLookupError.message
      }, 500)
    }
    
    // Try to create schedule entry, but handle table not existing
    try {
      console.log('Inserting schedule entry with params:', {
        user_id: actualUserId,
        client_id: client_id || null,
        title,
        description: description || null,
        entry_type: entry_type || 'other',
        start_time,
        end_time: end_time || null,
        location: location || null,
        is_recurring: is_recurring ? 1 : 0,
        recurrence_pattern: recurrence_pattern ? JSON.stringify(recurrence_pattern) : null
      })
      
      const result = await c.env.DB.prepare(`
        INSERT INTO schedule_entries 
        (user_id, client_id, title, description, entry_type, start_time, end_time, location, is_recurring, recurrence_pattern, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        actualUserId, 
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