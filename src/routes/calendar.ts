import { Hono } from 'hono'
import type { Bindings } from '../types'

export const calendarRouter = new Hono<{ Bindings: Bindings }>()

// Calendar integration placeholder
// These endpoints will be implemented when Google Calendar OAuth is configured

calendarRouter.get('/auth', async (c) => {
  return c.json({ 
    message: 'Googleカレンダー連携はまだ設定されていません。',
    status: 'not_configured'
  })
})

calendarRouter.get('/events', async (c) => {
  return c.json({ 
    events: [],
    message: 'Googleカレンダー連携を設定してください'
  })
})

calendarRouter.post('/events', async (c) => {
  return c.json({ 
    error: 'Googleカレンダー連携が設定されていません'
  }, 503)
})

export default calendarRouter