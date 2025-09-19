import { Hono } from 'hono'
import { NotificationService } from '../lib/notification'

type Bindings = {
  DB: D1Database
  SENDGRID_API_KEY?: string
}

export const notificationRouter = new Hono<{ Bindings: Bindings }>()

// 通知設定の取得
notificationRouter.get('/settings', async (c) => {
  try {
    const user = c.get('user')
    const userId = parseInt(user.sub)
    
    const service = new NotificationService(c.env.DB)
    const settings = await service.getUserNotificationSettings(userId)
    
    return c.json({ settings })
  } catch (error) {
    return c.json({ error: 'Failed to fetch notification settings' }, 500)
  }
})

// 通知設定の更新
notificationRouter.put('/settings', async (c) => {
  try {
    const user = c.get('user')
    const userId = parseInt(user.sub)
    const body = await c.req.json()
    
    const service = new NotificationService(c.env.DB)
    await service.updateNotificationSettings(userId, body)
    
    return c.json({ 
      success: true,
      message: '通知設定を更新しました'
    })
  } catch (error) {
    return c.json({ error: 'Failed to update notification settings' }, 500)
  }
})

// タスクリマインダーを送信（テスト用）
notificationRouter.post('/send-reminder/:taskId', async (c) => {
  try {
    const taskId = parseInt(c.req.param('taskId'))
    
    const service = new NotificationService(c.env.DB, c.env.SENDGRID_API_KEY)
    await service.sendTaskReminder(taskId)
    
    return c.json({ 
      success: true,
      message: 'リマインダーを送信しました'
    })
  } catch (error) {
    return c.json({ error: 'Failed to send reminder' }, 500)
  }
})

// 日次サマリーを送信
notificationRouter.post('/send-daily-summary', async (c) => {
  try {
    const user = c.get('user')
    const userId = parseInt(user.sub)
    
    const service = new NotificationService(c.env.DB, c.env.SENDGRID_API_KEY)
    await service.sendDailySummary(userId)
    
    return c.json({ 
      success: true,
      message: '日次サマリーを送信しました'
    })
  } catch (error) {
    return c.json({ error: 'Failed to send daily summary' }, 500)
  }
})

// 遅延タスクの通知（管理者のみ）
notificationRouter.post('/notify-overdue', async (c) => {
  try {
    const service = new NotificationService(c.env.DB, c.env.SENDGRID_API_KEY)
    await service.notifyOverdueTasks()
    
    return c.json({ 
      success: true,
      message: '遅延タスクの通知を送信しました'
    })
  } catch (error) {
    return c.json({ error: 'Failed to notify overdue tasks' }, 500)
  }
})

// 通知履歴の取得
notificationRouter.get('/history', async (c) => {
  try {
    const user = c.get('user')
    const userId = parseInt(user.sub)
    const { limit = 50, offset = 0 } = c.req.query()
    
    const logs = await c.env.DB.prepare(`
      SELECT 
        nl.*,
        t.title as task_title
      FROM notification_logs nl
      LEFT JOIN tasks t ON nl.task_id = t.id
      WHERE nl.user_id = ?
      ORDER BY nl.sent_at DESC
      LIMIT ? OFFSET ?
    `).bind(userId, parseInt(limit as string), parseInt(offset as string)).all()
    
    return c.json({ 
      logs: logs.results,
      total: logs.results?.length || 0
    })
  } catch (error) {
    return c.json({ error: 'Failed to fetch notification history' }, 500)
  }
})

// スケジュール通知の作成
notificationRouter.post('/schedule', async (c) => {
  try {
    const body = await c.req.json()
    const { type, scheduledFor, targetId, metadata } = body
    
    const result = await c.env.DB.prepare(`
      INSERT INTO scheduled_notifications (
        type, scheduled_for, target_id, metadata
      ) VALUES (?, ?, ?, ?)
    `).bind(
      type,
      scheduledFor,
      targetId,
      JSON.stringify(metadata)
    ).run()
    
    return c.json({ 
      success: true,
      id: result.meta.last_row_id,
      message: '通知をスケジュールしました'
    })
  } catch (error) {
    return c.json({ error: 'Failed to schedule notification' }, 500)
  }
})

// Cronジョブ用：スケジュール通知の処理
notificationRouter.post('/process-scheduled', async (c) => {
  try {
    const now = new Date().toISOString()
    
    // 処理対象の通知を取得
    const notifications = await c.env.DB.prepare(`
      SELECT * FROM scheduled_notifications
      WHERE status = 'pending'
        AND scheduled_for <= ?
      LIMIT 10
    `).bind(now).all()
    
    const service = new NotificationService(c.env.DB, c.env.SENDGRID_API_KEY)
    let processedCount = 0
    
    for (const notification of notifications.results || []) {
      try {
        // 通知タイプに応じて処理
        switch (notification.type) {
          case 'task_reminder':
            await service.sendTaskReminder(notification.target_id as number)
            break
          case 'daily_summary':
            await service.sendDailySummary(notification.target_id as number)
            break
          case 'overdue_check':
            await service.notifyOverdueTasks()
            break
        }
        
        // 処理済みにマーク
        await c.env.DB.prepare(`
          UPDATE scheduled_notifications
          SET status = 'sent', processed_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(notification.id).run()
        
        processedCount++
      } catch (error) {
        // エラーの場合は失敗にマーク
        await c.env.DB.prepare(`
          UPDATE scheduled_notifications
          SET status = 'failed', processed_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(notification.id).run()
      }
    }
    
    return c.json({ 
      success: true,
      processed: processedCount,
      message: `${processedCount}件の通知を処理しました`
    })
  } catch (error) {
    return c.json({ error: 'Failed to process scheduled notifications' }, 500)
  }
})