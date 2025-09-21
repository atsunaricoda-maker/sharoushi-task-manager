import { Hono } from 'hono'
import type { Bindings } from '../types'

export const calendarRouter = new Hono<{ Bindings: Bindings }>()

// Get calendar events for a specific date range
calendarRouter.get('/events', async (c) => {
  try {
    const user = c.get('user')
    const userId = parseInt(user.sub)
    const startDate = c.req.query('start') || new Date().toISOString().split('T')[0]
    const endDate = c.req.query('end') || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    const events = await c.env.DB.prepare(`
      SELECT * FROM calendar_events 
      WHERE user_id = ? AND status != 'cancelled'
      AND date(start_datetime) BETWEEN ? AND ?
      ORDER BY start_datetime ASC
    `).bind(userId, startDate, endDate).all()
    
    return c.json({ 
      success: true,
      events: events.results || []
    })
  } catch (error) {
    console.error('Failed to fetch calendar events:', error)
    return c.json({ error: 'Failed to fetch calendar events' }, 500)
  }
})

// Get specific event
calendarRouter.get('/events/:id', async (c) => {
  try {
    const eventId = c.req.param('id')
    const user = c.get('user')
    const userId = parseInt(user.sub)
    
    const event = await c.env.DB.prepare(`
      SELECT * FROM calendar_events 
      WHERE id = ? AND user_id = ?
    `).bind(eventId, userId).first()
    
    if (!event) {
      return c.json({ error: 'Event not found' }, 404)
    }
    
    return c.json({ success: true, event })
  } catch (error) {
    console.error('Failed to fetch calendar event:', error)
    return c.json({ error: 'Failed to fetch calendar event' }, 500)
  }
})

// Create new calendar event
calendarRouter.post('/events', async (c) => {
  try {
    const user = c.get('user')
    const userId = parseInt(user.sub)
    const body = await c.req.json()
    const {
      title, description, start_datetime, end_datetime,
      all_day, location, color_id
    } = body
    
    if (!title || !start_datetime || !end_datetime) {
      return c.json({ error: 'タイトル、開始時間、終了時間は必須です' }, 400)
    }
    
    const result = await c.env.DB.prepare(`
      INSERT INTO calendar_events (
        user_id, title, description, start_datetime, end_datetime,
        all_day, location, color_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      userId, title, description || null, start_datetime, end_datetime,
      all_day || 0, location || null, color_id || 'default'
    ).run()
    
    return c.json({ 
      success: true,
      id: result.meta.last_row_id,
      message: 'イベントを作成しました'
    })
  } catch (error) {
    console.error('Failed to create calendar event:', error)
    return c.json({ error: 'Failed to create calendar event' }, 500)
  }
})

// Update calendar event
calendarRouter.put('/events/:id', async (c) => {
  try {
    const eventId = c.req.param('id')
    const user = c.get('user')
    const userId = parseInt(user.sub)
    const body = await c.req.json()
    const {
      title, description, start_datetime, end_datetime,
      all_day, location, color_id, status
    } = body
    
    // Check if event exists and belongs to user
    const existingEvent = await c.env.DB.prepare(`
      SELECT id FROM calendar_events WHERE id = ? AND user_id = ?
    `).bind(eventId, userId).first()
    
    if (!existingEvent) {
      return c.json({ error: 'Event not found' }, 404)
    }
    
    await c.env.DB.prepare(`
      UPDATE calendar_events SET
        title = ?, description = ?, start_datetime = ?, end_datetime = ?,
        all_day = ?, location = ?, color_id = ?, status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).bind(
      title, description, start_datetime, end_datetime,
      all_day || 0, location, color_id || 'default', status || 'confirmed',
      eventId, userId
    ).run()
    
    return c.json({ 
      success: true,
      message: 'イベントを更新しました'
    })
  } catch (error) {
    console.error('Failed to update calendar event:', error)
    return c.json({ error: 'Failed to update calendar event' }, 500)
  }
})

// Delete calendar event
calendarRouter.delete('/events/:id', async (c) => {
  try {
    const eventId = c.req.param('id')
    const user = c.get('user')
    const userId = parseInt(user.sub)
    
    // Check if event exists and belongs to user
    const existingEvent = await c.env.DB.prepare(`
      SELECT id FROM calendar_events WHERE id = ? AND user_id = ?
    `).bind(eventId, userId).first()
    
    if (!existingEvent) {
      return c.json({ error: 'Event not found' }, 404)
    }
    
    // Soft delete by marking as cancelled
    await c.env.DB.prepare(`
      UPDATE calendar_events SET
        status = 'cancelled',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).bind(eventId, userId).run()
    
    return c.json({ 
      success: true,
      message: 'イベントを削除しました'
    })
  } catch (error) {
    console.error('Failed to delete calendar event:', error)
    return c.json({ error: 'Failed to delete calendar event' }, 500)
  }
})

// Quick add using natural language
calendarRouter.post('/quick-add', async (c) => {
  try {
    const user = c.get('user')
    const userId = parseInt(user.sub)
    const { text } = await c.req.json()
    
    if (!text) {
      return c.json({ error: 'テキストを入力してください' }, 400)
    }
    
    // Simple natural language parsing (basic implementation)
    // In production, you might use a more sophisticated NLP library
    const parsedEvent = parseNaturalLanguage(text)
    
    const result = await c.env.DB.prepare(`
      INSERT INTO calendar_events (
        user_id, title, start_datetime, end_datetime, all_day
      ) VALUES (?, ?, ?, ?, ?)
    `).bind(
      userId, parsedEvent.title, parsedEvent.start, parsedEvent.end, parsedEvent.allDay ? 1 : 0
    ).run()
    
    return c.json({ 
      success: true,
      id: result.meta.last_row_id,
      message: 'イベントを作成しました',
      event: parsedEvent
    })
  } catch (error) {
    console.error('Failed to create quick event:', error)
    return c.json({ error: 'イベント作成に失敗しました' }, 500)
  }
})

// Simple natural language parser
function parseNaturalLanguage(text: string) {
  const now = new Date()
  let title = text
  let start = new Date(now.getTime() + 60 * 60 * 1000) // Default to 1 hour from now
  let end = new Date(start.getTime() + 60 * 60 * 1000) // Default to 1 hour duration
  let allDay = false
  
  // Extract time patterns
  const timePattern = /(\d{1,2}):(\d{2})|(\d{1,2})時/g
  const timeMatches = text.match(timePattern)
  
  if (timeMatches) {
    const timeStr = timeMatches[0]
    let hour = 9, minute = 0
    
    if (timeStr.includes(':')) {
      const [h, m] = timeStr.split(':').map(Number)
      hour = h
      minute = m
    } else if (timeStr.includes('時')) {
      hour = parseInt(timeStr.replace('時', ''))
    }
    
    start = new Date()
    start.setHours(hour, minute, 0, 0)
    end = new Date(start.getTime() + 60 * 60 * 1000)
    
    // Remove time from title
    title = text.replace(timePattern, '').trim()
  }
  
  // Check for date patterns
  const datePattern = /(明日|今日|明後日|\d+月\d+日)/
  const dateMatch = text.match(datePattern)
  
  if (dateMatch) {
    const dateStr = dateMatch[0]
    if (dateStr === '明日') {
      start.setDate(start.getDate() + 1)
      end.setDate(end.getDate() + 1)
    } else if (dateStr === '明後日') {
      start.setDate(start.getDate() + 2) 
      end.setDate(end.getDate() + 2)
    }
    
    // Remove date from title
    title = title.replace(datePattern, '').trim()
  }
  
  // Clean up title
  title = title.replace(/(に|で|を|の|は|が)$/, '').trim()
  if (!title) title = '新しいイベント'
  
  return {
    title,
    start: start.toISOString(),
    end: end.toISOString(),
    allDay
  }
}

export default calendarRouter