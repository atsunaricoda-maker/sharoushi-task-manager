import { Hono } from 'hono'
import type { Bindings } from '../types'

export const gmailRouter = new Hono<{ Bindings: Bindings }>()

// Gmail integration placeholder
// These endpoints will be implemented when Gmail OAuth is configured

gmailRouter.get('/auth', async (c) => {
  return c.json({ 
    message: 'Gmail連携はまだ設定されていません。',
    status: 'not_configured'
  })
})

gmailRouter.get('/messages', async (c) => {
  return c.json({ 
    messages: [],
    message: 'Gmail連携を設定してください'
  })
})

gmailRouter.post('/send', async (c) => {
  return c.json({ 
    error: 'Gmail連携が設定されていません'
  }, 503)
})

export default gmailRouter