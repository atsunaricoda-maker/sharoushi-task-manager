import type { D1Database } from '@cloudflare/workers-types'

// 通知タイプ
export type NotificationType = 
  | 'task_reminder'      // タスクリマインダー
  | 'task_overdue'       // タスク遅延
  | 'task_completed'     // タスク完了
  | 'daily_summary'      // 日次サマリー
  | 'weekly_report'      // 週次レポート

// メール送信インターフェース
interface EmailData {
  to: string
  subject: string
  body: string
  html?: string
}

// 通知設定
interface NotificationSettings {
  email: boolean
  browser: boolean
  slack?: boolean
  reminderDays: number // 何日前に通知するか
}

export class NotificationService {
  private db: D1Database
  private sendgridApiKey?: string
  
  constructor(db: D1Database, sendgridApiKey?: string) {
    this.db = db
    this.sendgridApiKey = sendgridApiKey
  }
  
  // SendGrid経由でメール送信
  async sendEmail(data: EmailData): Promise<boolean> {
    if (!this.sendgridApiKey) {
      console.warn('SendGrid API key not configured')
      return false
    }
    
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.sendgridApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: data.to }]
          }],
          from: { 
            email: 'noreply@sharoushi-task.com',
            name: '社労士タスク管理システム'
          },
          subject: data.subject,
          content: [
            {
              type: 'text/plain',
              value: data.body
            },
            ...(data.html ? [{
              type: 'text/html',
              value: data.html
            }] : [])
          ]
        })
      })
      
      return response.ok
    } catch (error) {
      console.error('Email send error:', error)
      return false
    }
  }
  
  // タスクリマインダーを送信
  async sendTaskReminder(taskId: number): Promise<void> {
    const task = await this.db.prepare(`
      SELECT 
        t.*,
        u.email as assignee_email,
        u.name as assignee_name,
        c.name as client_name
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      LEFT JOIN clients c ON t.client_id = c.id
      WHERE t.id = ?
    `).bind(taskId).first()
    
    if (!task || !task.assignee_email) return
    
    const daysUntilDue = Math.ceil(
      (new Date(task.due_date as string).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
    
    const subject = `【リマインダー】タスク期限まであと${daysUntilDue}日: ${task.title}`
    
    const body = `
${task.assignee_name}様

以下のタスクの期限が近づいています。

━━━━━━━━━━━━━━━━━━━━
タスク: ${task.title}
顧問先: ${task.client_name}
期限: ${new Date(task.due_date as string).toLocaleDateString('ja-JP')}
残り日数: ${daysUntilDue}日
進捗: ${task.progress}%
━━━━━━━━━━━━━━━━━━━━

詳細はシステムにログインしてご確認ください。

社労士タスク管理システム
    `.trim()
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Hiragino Sans', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #0066cc; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
    .task-info { background: white; padding: 15px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #0066cc; }
    .urgency-${daysUntilDue <= 2 ? 'high' : daysUntilDue <= 5 ? 'medium' : 'low'} { border-left-color: ${daysUntilDue <= 2 ? '#ff4444' : daysUntilDue <= 5 ? '#ff9900' : '#0066cc'}; }
    .button { display: inline-block; padding: 12px 24px; background: #0066cc; color: white; text-decoration: none; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>タスク期限のお知らせ</h2>
    </div>
    <div class="content">
      <p>${task.assignee_name}様</p>
      <p>以下のタスクの期限が<strong>${daysUntilDue}日後</strong>に迫っています。</p>
      
      <div class="task-info urgency-${daysUntilDue <= 2 ? 'high' : daysUntilDue <= 5 ? 'medium' : 'low'}">
        <h3>${task.title}</h3>
        <table style="width: 100%;">
          <tr><td style="width: 100px;">顧問先:</td><td><strong>${task.client_name}</strong></td></tr>
          <tr><td>期限:</td><td><strong>${new Date(task.due_date as string).toLocaleDateString('ja-JP')}</strong></td></tr>
          <tr><td>進捗:</td><td><strong>${task.progress}%</strong></td></tr>
          <tr><td>予定工数:</td><td>${task.estimated_hours}時間</td></tr>
        </table>
      </div>
      
      <p style="text-align: center; margin-top: 30px;">
        <a href="https://3000-ivn6amwip8uhxdg63ar73-6532622b.e2b.dev/" class="button">タスクを確認する</a>
      </p>
    </div>
  </div>
</body>
</html>
    `
    
    await this.sendEmail({
      to: task.assignee_email as string,
      subject,
      body,
      html
    })
    
    // 通知履歴を記録
    await this.db.prepare(`
      INSERT INTO notification_logs (
        user_id, type, task_id, sent_at
      ) VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(task.assignee_id, 'task_reminder', taskId).run()
  }
  
  // 日次サマリーを送信
  async sendDailySummary(userId: number): Promise<void> {
    const user = await this.db.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).bind(userId).first()
    
    if (!user || !user.email) return
    
    // 今日のタスクを取得
    const tasks = await this.db.prepare(`
      SELECT 
        t.*,
        c.name as client_name
      FROM tasks t
      LEFT JOIN clients c ON t.client_id = c.id
      WHERE t.assignee_id = ?
        AND date(t.due_date) = date('now')
        AND t.status != 'completed'
      ORDER BY t.priority DESC, t.due_date ASC
    `).bind(userId).all()
    
    if (!tasks.results || tasks.results.length === 0) return
    
    const subject = `【日次サマリー】本日のタスク ${tasks.results.length}件`
    
    const taskList = tasks.results.map((t, i) => 
      `${i + 1}. ${t.title} (${t.client_name}) - 優先度: ${t.priority}`
    ).join('\n')
    
    const body = `
${user.name}様

本日のタスクをお知らせします。

━━━━━━━━━━━━━━━━━━━━
本日のタスク: ${tasks.results.length}件
━━━━━━━━━━━━━━━━━━━━

${taskList}

詳細はシステムにログインしてご確認ください。

良い一日をお過ごしください。

社労士タスク管理システム
    `.trim()
    
    await this.sendEmail({
      to: user.email as string,
      subject,
      body
    })
  }
  
  // 遅延タスクの通知
  async notifyOverdueTasks(): Promise<void> {
    const overdueTasks = await this.db.prepare(`
      SELECT 
        t.*,
        u.email as assignee_email,
        u.name as assignee_name,
        c.name as client_name
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      LEFT JOIN clients c ON t.client_id = c.id
      WHERE date(t.due_date) < date('now')
        AND t.status != 'completed'
        AND NOT EXISTS (
          SELECT 1 FROM notification_logs nl
          WHERE nl.task_id = t.id
            AND nl.type = 'task_overdue'
            AND date(nl.sent_at) = date('now')
        )
    `).all()
    
    for (const task of overdueTasks.results || []) {
      if (!task.assignee_email) continue
      
      const subject = `【重要】タスクが遅延しています: ${task.title}`
      const body = `
${task.assignee_name}様

以下のタスクが期限を過ぎています。
至急対応をお願いします。

タスク: ${task.title}
顧問先: ${task.client_name}
期限: ${new Date(task.due_date as string).toLocaleDateString('ja-JP')}

社労士タスク管理システム
      `.trim()
      
      await this.sendEmail({
        to: task.assignee_email as string,
        subject,
        body
      })
      
      // 通知履歴を記録
      await this.db.prepare(`
        INSERT INTO notification_logs (
          user_id, type, task_id, sent_at
        ) VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(task.assignee_id, 'task_overdue', task.id).run()
    }
  }
  
  // ユーザーの通知設定を取得
  async getUserNotificationSettings(userId: number): Promise<NotificationSettings> {
    const settings = await this.db.prepare(`
      SELECT * FROM user_notification_settings WHERE user_id = ?
    `).bind(userId).first()
    
    return settings || {
      email: true,
      browser: false,
      slack: false,
      reminderDays: 3
    }
  }
  
  // 通知設定を更新
  async updateNotificationSettings(
    userId: number, 
    settings: Partial<NotificationSettings>
  ): Promise<void> {
    await this.db.prepare(`
      INSERT OR REPLACE INTO user_notification_settings (
        user_id, email, browser, slack, reminder_days, updated_at
      ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      userId,
      settings.email ?? true,
      settings.browser ?? false,
      settings.slack ?? false,
      settings.reminderDays ?? 3
    ).run()
  }
}