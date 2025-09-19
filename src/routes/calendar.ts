/**
 * Google Calendar API Routes
 * カレンダー連携のAPIエンドポイント
 */

import { Hono } from 'hono'
import { CalendarService, TaskCalendarSync } from '../lib/calendar'

type Bindings = {
  DB: D1Database
  KV: KVNamespace
}

const calendarRouter = new Hono<{ Bindings: Bindings }>()

/**
 * カレンダー一覧取得
 */
calendarRouter.get('/list', async (c) => {
  try {
    const user = c.get('user')

    // ユーザーのGoogleアクセストークンを取得
    const tokenData = await c.env.KV.get(`google_token_${user.id}`)
    if (!tokenData) {
      return c.json({ error: 'Google authentication required' }, 401)
    }

    const { access_token } = JSON.parse(tokenData)
    const calendarService = new CalendarService({ accessToken: access_token })

    const calendars = await calendarService.listCalendars()

    return c.json({
      calendars: calendars.map(cal => ({
        id: cal.id,
        name: cal.summary,
        description: cal.description,
        isPrimary: cal.primary,
        selected: cal.selected,
        backgroundColor: cal.backgroundColor,
        foregroundColor: cal.foregroundColor
      }))
    })
  } catch (error: any) {
    console.error('Failed to list calendars:', error)
    return c.json({ 
      error: 'Failed to list calendars', 
      message: error.message 
    }, 500)
  }
})

/**
 * イベント一覧取得
 */
calendarRouter.get('/events', async (c) => {
  try {
    const user = c.get('user')
    const calendarId = c.req.query('calendarId') || 'primary'
    const timeMin = c.req.query('timeMin')
    const timeMax = c.req.query('timeMax')
    const maxResults = parseInt(c.req.query('maxResults') || '50')

    const tokenData = await c.env.KV.get(`google_token_${user.id}`)
    if (!tokenData) {
      return c.json({ error: 'Google authentication required' }, 401)
    }

    const { access_token } = JSON.parse(tokenData)
    const calendarService = new CalendarService({ accessToken: access_token })

    const events = await calendarService.listEvents(calendarId, {
      timeMin,
      timeMax,
      maxResults
    })

    return c.json({
      events: events.map(event => ({
        id: event.id,
        title: event.summary,
        description: event.description,
        location: event.location,
        start: event.start,
        end: event.end,
        isAllDay: !event.start.dateTime,
        attendees: event.attendees,
        reminders: event.reminders,
        colorId: event.colorId
      }))
    })
  } catch (error: any) {
    console.error('Failed to list events:', error)
    return c.json({ 
      error: 'Failed to list events', 
      message: error.message 
    }, 500)
  }
})

/**
 * イベント作成
 */
calendarRouter.post('/events', async (c) => {
  try {
    const user = c.get('user')
    const { calendarId = 'primary', event } = await c.req.json()

    const tokenData = await c.env.KV.get(`google_token_${user.id}`)
    if (!tokenData) {
      return c.json({ error: 'Google authentication required' }, 401)
    }

    const { access_token } = JSON.parse(tokenData)
    const calendarService = new CalendarService({ accessToken: access_token })

    const createdEvent = await calendarService.createEvent(calendarId, event)

    return c.json({
      success: true,
      event: {
        id: createdEvent.id,
        title: createdEvent.summary,
        start: createdEvent.start,
        end: createdEvent.end,
        htmlLink: createdEvent.htmlLink
      }
    })
  } catch (error: any) {
    console.error('Failed to create event:', error)
    return c.json({ 
      error: 'Failed to create event', 
      message: error.message 
    }, 500)
  }
})

/**
 * イベント更新
 */
calendarRouter.put('/events/:eventId', async (c) => {
  try {
    const user = c.get('user')
    const eventId = c.req.param('eventId')
    const { calendarId = 'primary', updates } = await c.req.json()

    const tokenData = await c.env.KV.get(`google_token_${user.id}`)
    if (!tokenData) {
      return c.json({ error: 'Google authentication required' }, 401)
    }

    const { access_token } = JSON.parse(tokenData)
    const calendarService = new CalendarService({ accessToken: access_token })

    const updatedEvent = await calendarService.updateEvent(calendarId, eventId, updates)

    return c.json({
      success: true,
      event: updatedEvent
    })
  } catch (error: any) {
    console.error('Failed to update event:', error)
    return c.json({ 
      error: 'Failed to update event', 
      message: error.message 
    }, 500)
  }
})

/**
 * イベント削除
 */
calendarRouter.delete('/events/:eventId', async (c) => {
  try {
    const user = c.get('user')
    const eventId = c.req.param('eventId')
    const calendarId = c.req.query('calendarId') || 'primary'

    const tokenData = await c.env.KV.get(`google_token_${user.id}`)
    if (!tokenData) {
      return c.json({ error: 'Google authentication required' }, 401)
    }

    const { access_token } = JSON.parse(tokenData)
    const calendarService = new CalendarService({ accessToken: access_token })

    await calendarService.deleteEvent(calendarId, eventId)

    return c.json({ success: true })
  } catch (error: any) {
    console.error('Failed to delete event:', error)
    return c.json({ 
      error: 'Failed to delete event', 
      message: error.message 
    }, 500)
  }
})

/**
 * クイック追加（自然言語）
 */
calendarRouter.post('/quick-add', async (c) => {
  try {
    const user = c.get('user')
    const { text, calendarId = 'primary' } = await c.req.json()

    if (!text) {
      return c.json({ error: 'Text is required' }, 400)
    }

    const tokenData = await c.env.KV.get(`google_token_${user.id}`)
    if (!tokenData) {
      return c.json({ error: 'Google authentication required' }, 401)
    }

    const { access_token } = JSON.parse(tokenData)
    const calendarService = new CalendarService({ accessToken: access_token })

    const event = await calendarService.quickAdd(calendarId, text)

    return c.json({
      success: true,
      event: {
        id: event.id,
        title: event.summary,
        start: event.start,
        end: event.end
      }
    })
  } catch (error: any) {
    console.error('Failed to quick add event:', error)
    return c.json({ 
      error: 'Failed to quick add event', 
      message: error.message 
    }, 500)
  }
})

/**
 * タスクをカレンダーに同期
 */
calendarRouter.post('/sync-task/:taskId', async (c) => {
  try {
    const user = c.get('user')
    const taskId = parseInt(c.req.param('taskId'))

    const tokenData = await c.env.KV.get(`google_token_${user.id}`)
    if (!tokenData) {
      return c.json({ error: 'Google authentication required' }, 401)
    }

    const { access_token } = JSON.parse(tokenData)
    const calendarService = new CalendarService({ accessToken: access_token })
    const syncService = new TaskCalendarSync(calendarService, c.env.DB)

    const eventId = await syncService.syncTaskToCalendar(taskId)

    return c.json({
      success: true,
      eventId,
      message: 'タスクをカレンダーに同期しました'
    })
  } catch (error: any) {
    console.error('Failed to sync task to calendar:', error)
    return c.json({ 
      error: 'Failed to sync task', 
      message: error.message 
    }, 500)
  }
})

/**
 * カレンダーイベントからタスク作成
 */
calendarRouter.post('/create-task-from-event/:eventId', async (c) => {
  try {
    const user = c.get('user')
    const eventId = c.req.param('eventId')

    const tokenData = await c.env.KV.get(`google_token_${user.id}`)
    if (!tokenData) {
      return c.json({ error: 'Google authentication required' }, 401)
    }

    const { access_token } = JSON.parse(tokenData)
    const calendarService = new CalendarService({ accessToken: access_token })
    const syncService = new TaskCalendarSync(calendarService, c.env.DB)

    const taskId = await syncService.createTaskFromEvent(eventId, user.id)

    return c.json({
      success: true,
      taskId,
      message: 'カレンダーイベントからタスクを作成しました'
    })
  } catch (error: any) {
    console.error('Failed to create task from event:', error)
    return c.json({ 
      error: 'Failed to create task', 
      message: error.message 
    }, 500)
  }
})

/**
 * 完全同期
 */
calendarRouter.post('/full-sync', async (c) => {
  try {
    const user = c.get('user')

    const tokenData = await c.env.KV.get(`google_token_${user.id}`)
    if (!tokenData) {
      return c.json({ error: 'Google authentication required' }, 401)
    }

    const { access_token } = JSON.parse(tokenData)
    const calendarService = new CalendarService({ accessToken: access_token })
    const syncService = new TaskCalendarSync(calendarService, c.env.DB)

    const result = await syncService.fullSync(user.id)

    return c.json({
      success: true,
      ...result,
      message: `カレンダーに${result.syncedToCalendar}件同期、タスクを${result.syncedFromCalendar}件作成しました`
    })
  } catch (error: any) {
    console.error('Failed to perform full sync:', error)
    return c.json({ 
      error: 'Failed to sync', 
      message: error.message 
    }, 500)
  }
})

/**
 * 今週のタスクイベント取得
 */
calendarRouter.get('/weekly-tasks', async (c) => {
  try {
    const user = c.get('user')

    const tokenData = await c.env.KV.get(`google_token_${user.id}`)
    if (!tokenData) {
      return c.json({ error: 'Google authentication required' }, 401)
    }

    const { access_token } = JSON.parse(tokenData)
    const calendarService = new CalendarService({ accessToken: access_token })
    const syncService = new TaskCalendarSync(calendarService, c.env.DB)

    const events = await syncService.getWeeklyTasksFromCalendar()

    return c.json({
      events: events.map(event => ({
        id: event.id,
        title: event.summary,
        start: event.start,
        end: event.end,
        description: event.description
      })),
      totalCount: events.length
    })
  } catch (error: any) {
    console.error('Failed to get weekly tasks:', error)
    return c.json({ 
      error: 'Failed to get weekly tasks', 
      message: error.message 
    }, 500)
  }
})

/**
 * 空き時間検索
 */
calendarRouter.post('/freebusy', async (c) => {
  try {
    const user = c.get('user')
    const { timeMin, timeMax, calendars = ['primary'] } = await c.req.json()

    if (!timeMin || !timeMax) {
      return c.json({ error: 'timeMin and timeMax are required' }, 400)
    }

    const tokenData = await c.env.KV.get(`google_token_${user.id}`)
    if (!tokenData) {
      return c.json({ error: 'Google authentication required' }, 401)
    }

    const { access_token } = JSON.parse(tokenData)
    const calendarService = new CalendarService({ accessToken: access_token })

    const freeBusy = await calendarService.findFreeBusy(timeMin, timeMax, calendars)

    return c.json(freeBusy)
  } catch (error: any) {
    console.error('Failed to find free/busy:', error)
    return c.json({ 
      error: 'Failed to find free/busy', 
      message: error.message 
    }, 500)
  }
})

export { calendarRouter }