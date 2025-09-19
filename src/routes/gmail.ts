/**
 * Gmail API Routes
 * Gmail連携のAPIエンドポイント
 */

import { Hono } from 'hono'
import { GmailService, GmailTaskProcessor } from '../lib/gmail'

type Bindings = {
  DB: D1Database
  KV: KVNamespace
}

const gmailRouter = new Hono<{ Bindings: Bindings }>()

/**
 * メール送信
 */
gmailRouter.post('/send', async (c) => {
  try {
    const { to, subject, body, cc, bcc } = await c.req.json()
    const user = c.get('user')

    // ユーザーのGoogleアクセストークンを取得
    const tokenData = await c.env.KV.get(`google_token_${user.id}`)
    if (!tokenData) {
      return c.json({ error: 'Google authentication required' }, 401)
    }

    const { access_token } = JSON.parse(tokenData)
    const gmailService = new GmailService({ accessToken: access_token })

    const result = await gmailService.sendEmail({
      to: Array.isArray(to) ? to : [to],
      subject,
      body,
      cc,
      bcc
    })

    // 送信履歴をDBに保存
    await c.env.DB.prepare(`
      INSERT INTO email_logs (
        user_id, direction, recipients, subject, 
        message_id, thread_id, created_at
      ) VALUES (?, 'sent', ?, ?, ?, ?, datetime('now'))
    `).bind(
      user.id,
      JSON.stringify(to),
      subject,
      result.id,
      result.threadId
    ).run()

    return c.json({
      success: true,
      messageId: result.id,
      threadId: result.threadId
    })
  } catch (error: any) {
    console.error('Failed to send email:', error)
    return c.json({ 
      error: 'Failed to send email', 
      message: error.message 
    }, 500)
  }
})

/**
 * メール一覧取得
 */
gmailRouter.get('/messages', async (c) => {
  try {
    const user = c.get('user')
    const query = c.req.query('q')
    const maxResults = parseInt(c.req.query('maxResults') || '10')

    // ユーザーのGoogleアクセストークンを取得
    const tokenData = await c.env.KV.get(`google_token_${user.id}`)
    if (!tokenData) {
      return c.json({ error: 'Google authentication required' }, 401)
    }

    const { access_token } = JSON.parse(tokenData)
    const gmailService = new GmailService({ accessToken: access_token })

    const messages = await gmailService.listMessages(query, maxResults)

    // メッセージを整形
    const formattedMessages = messages.map(msg => {
      const from = gmailService.getHeader(msg, 'From') || 'Unknown'
      const subject = gmailService.getHeader(msg, 'Subject') || 'No subject'
      const date = gmailService.getHeader(msg, 'Date') || ''
      const body = gmailService.extractMessageBody(msg)

      return {
        id: msg.id,
        threadId: msg.threadId,
        from,
        subject,
        date,
        snippet: msg.snippet,
        body: body.substring(0, 500),
        labels: msg.labelIds,
        isUnread: msg.labelIds.includes('UNREAD')
      }
    })

    return c.json({
      messages: formattedMessages,
      totalCount: formattedMessages.length
    })
  } catch (error: any) {
    console.error('Failed to fetch messages:', error)
    return c.json({ 
      error: 'Failed to fetch messages', 
      message: error.message 
    }, 500)
  }
})

/**
 * 特定のメッセージ取得
 */
gmailRouter.get('/messages/:messageId', async (c) => {
  try {
    const user = c.get('user')
    const messageId = c.req.param('messageId')

    const tokenData = await c.env.KV.get(`google_token_${user.id}`)
    if (!tokenData) {
      return c.json({ error: 'Google authentication required' }, 401)
    }

    const { access_token } = JSON.parse(tokenData)
    const gmailService = new GmailService({ accessToken: access_token })

    const message = await gmailService.getMessage(messageId)
    if (!message) {
      return c.json({ error: 'Message not found' }, 404)
    }

    return c.json({
      id: message.id,
      threadId: message.threadId,
      from: gmailService.getHeader(message, 'From'),
      to: gmailService.getHeader(message, 'To'),
      subject: gmailService.getHeader(message, 'Subject'),
      date: gmailService.getHeader(message, 'Date'),
      body: gmailService.extractMessageBody(message),
      labels: message.labelIds
    })
  } catch (error: any) {
    console.error('Failed to fetch message:', error)
    return c.json({ 
      error: 'Failed to fetch message', 
      message: error.message 
    }, 500)
  }
})

/**
 * クライアントメールからタスク自動生成
 */
gmailRouter.post('/process-client-emails', async (c) => {
  try {
    const user = c.get('user')

    // 管理者権限チェック
    if (user.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403)
    }

    const tokenData = await c.env.KV.get(`google_token_${user.id}`)
    if (!tokenData) {
      return c.json({ error: 'Google authentication required' }, 401)
    }

    const { access_token } = JSON.parse(tokenData)
    const gmailService = new GmailService({ accessToken: access_token })
    const processor = new GmailTaskProcessor(gmailService, c.env.DB)

    const tasksCreated = await processor.processClientEmails()

    return c.json({
      success: true,
      tasksCreated,
      message: `${tasksCreated}件のタスクを作成しました`
    })
  } catch (error: any) {
    console.error('Failed to process client emails:', error)
    return c.json({ 
      error: 'Failed to process emails', 
      message: error.message 
    }, 500)
  }
})

/**
 * 進捗報告メール送信
 */
gmailRouter.post('/send-progress-report/:clientId', async (c) => {
  try {
    const user = c.get('user')
    const clientId = parseInt(c.req.param('clientId'))

    const tokenData = await c.env.KV.get(`google_token_${user.id}`)
    if (!tokenData) {
      return c.json({ error: 'Google authentication required' }, 401)
    }

    const { access_token } = JSON.parse(tokenData)
    const gmailService = new GmailService({ accessToken: access_token })
    const processor = new GmailTaskProcessor(gmailService, c.env.DB)

    await processor.sendProgressReport(clientId)

    return c.json({
      success: true,
      message: '進捗報告メールを送信しました'
    })
  } catch (error: any) {
    console.error('Failed to send progress report:', error)
    return c.json({ 
      error: 'Failed to send report', 
      message: error.message 
    }, 500)
  }
})

/**
 * メールを既読にする
 */
gmailRouter.put('/messages/:messageId/mark-read', async (c) => {
  try {
    const user = c.get('user')
    const messageId = c.req.param('messageId')

    const tokenData = await c.env.KV.get(`google_token_${user.id}`)
    if (!tokenData) {
      return c.json({ error: 'Google authentication required' }, 401)
    }

    const { access_token } = JSON.parse(tokenData)
    const gmailService = new GmailService({ accessToken: access_token })

    await gmailService.markAsRead(messageId)

    return c.json({ success: true })
  } catch (error: any) {
    console.error('Failed to mark as read:', error)
    return c.json({ 
      error: 'Failed to mark as read', 
      message: error.message 
    }, 500)
  }
})

/**
 * メールをアーカイブ
 */
gmailRouter.put('/messages/:messageId/archive', async (c) => {
  try {
    const user = c.get('user')
    const messageId = c.req.param('messageId')

    const tokenData = await c.env.KV.get(`google_token_${user.id}`)
    if (!tokenData) {
      return c.json({ error: 'Google authentication required' }, 401)
    }

    const { access_token } = JSON.parse(tokenData)
    const gmailService = new GmailService({ accessToken: access_token })

    await gmailService.archiveMessage(messageId)

    return c.json({ success: true })
  } catch (error: any) {
    console.error('Failed to archive message:', error)
    return c.json({ 
      error: 'Failed to archive', 
      message: error.message 
    }, 500)
  }
})

/**
 * メールをゴミ箱に移動
 */
gmailRouter.delete('/messages/:messageId', async (c) => {
  try {
    const user = c.get('user')
    const messageId = c.req.param('messageId')

    const tokenData = await c.env.KV.get(`google_token_${user.id}`)
    if (!tokenData) {
      return c.json({ error: 'Google authentication required' }, 401)
    }

    const { access_token } = JSON.parse(tokenData)
    const gmailService = new GmailService({ accessToken: access_token })

    await gmailService.trashMessage(messageId)

    return c.json({ success: true })
  } catch (error: any) {
    console.error('Failed to trash message:', error)
    return c.json({ 
      error: 'Failed to trash message', 
      message: error.message 
    }, 500)
  }
})

export { gmailRouter }