/**
 * Gmail API Service
 * Google Gmail APIとの連携を管理
 */

interface GmailConfig {
  accessToken: string
  refreshToken?: string
}

interface EmailMessage {
  to: string[]
  subject: string
  body: string
  cc?: string[]
  bcc?: string[]
  attachments?: Array<{
    filename: string
    content: string // base64 encoded
    contentType: string
  }>
}

interface GmailMessage {
  id: string
  threadId: string
  labelIds: string[]
  snippet: string
  historyId: string
  internalDate: string
  payload: {
    headers: Array<{ name: string; value: string }>
    body?: { data?: string }
    parts?: Array<{
      mimeType: string
      body?: { data?: string }
      headers: Array<{ name: string; value: string }>
    }>
  }
}

export class GmailService {
  private config: GmailConfig
  private readonly API_BASE = 'https://gmail.googleapis.com/gmail/v1'

  constructor(config: GmailConfig) {
    this.config = config
  }

  /**
   * メールを送信
   */
  async sendEmail(message: EmailMessage): Promise<{ id: string; threadId: string }> {
    const email = this.createMimeMessage(message)
    const encodedMessage = btoa(email)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')

    const response = await fetch(`${this.API_BASE}/users/me/messages/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        raw: encodedMessage
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to send email: ${error.error?.message || response.statusText}`)
    }

    return await response.json()
  }

  /**
   * メール一覧を取得
   */
  async listMessages(query?: string, maxResults: number = 10): Promise<GmailMessage[]> {
    const params = new URLSearchParams({
      maxResults: maxResults.toString(),
      ...(query && { q: query })
    })

    const response = await fetch(`${this.API_BASE}/users/me/messages?${params}`, {
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to list messages: ${response.statusText}`)
    }

    const data = await response.json()
    const messages: GmailMessage[] = []

    // 各メッセージの詳細を取得
    for (const msg of data.messages || []) {
      const details = await this.getMessage(msg.id)
      if (details) {
        messages.push(details)
      }
    }

    return messages
  }

  /**
   * 特定のメッセージを取得
   */
  async getMessage(messageId: string): Promise<GmailMessage | null> {
    const response = await fetch(`${this.API_BASE}/users/me/messages/${messageId}`, {
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`
      }
    })

    if (!response.ok) {
      console.error(`Failed to get message ${messageId}: ${response.statusText}`)
      return null
    }

    return await response.json()
  }

  /**
   * ラベル一覧を取得
   */
  async listLabels(): Promise<Array<{ id: string; name: string; type: string }>> {
    const response = await fetch(`${this.API_BASE}/users/me/labels`, {
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to list labels: ${response.statusText}`)
    }

    const data = await response.json()
    return data.labels || []
  }

  /**
   * メールにラベルを追加
   */
  async addLabel(messageId: string, labelIds: string[]): Promise<void> {
    const response = await fetch(`${this.API_BASE}/users/me/messages/${messageId}/modify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        addLabelIds: labelIds
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to add labels: ${response.statusText}`)
    }
  }

  /**
   * メールのアーカイブ
   */
  async archiveMessage(messageId: string): Promise<void> {
    await this.addLabel(messageId, ['UNREAD'])
  }

  /**
   * メールの既読マーク
   */
  async markAsRead(messageId: string): Promise<void> {
    const response = await fetch(`${this.API_BASE}/users/me/messages/${messageId}/modify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        removeLabelIds: ['UNREAD']
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to mark as read: ${response.statusText}`)
    }
  }

  /**
   * メールのゴミ箱移動
   */
  async trashMessage(messageId: string): Promise<void> {
    const response = await fetch(`${this.API_BASE}/users/me/messages/${messageId}/trash`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to trash message: ${response.statusText}`)
    }
  }

  /**
   * スレッド単位でメールを取得
   */
  async getThread(threadId: string): Promise<any> {
    const response = await fetch(`${this.API_BASE}/users/me/threads/${threadId}`, {
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to get thread: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * MIME形式のメッセージを作成
   */
  private createMimeMessage(message: EmailMessage): string {
    const boundary = `boundary_${Date.now()}`
    const headers = [
      `To: ${message.to.join(', ')}`,
      `Subject: ${message.subject}`,
      'MIME-Version: 1.0'
    ]

    if (message.cc?.length) {
      headers.push(`Cc: ${message.cc.join(', ')}`)
    }

    if (message.bcc?.length) {
      headers.push(`Bcc: ${message.bcc.join(', ')}`)
    }

    if (message.attachments?.length) {
      headers.push(
        `Content-Type: multipart/mixed; boundary="${boundary}"`,
        '',
        `--${boundary}`,
        'Content-Type: text/html; charset="UTF-8"',
        'Content-Transfer-Encoding: base64',
        '',
        btoa(unescape(encodeURIComponent(message.body)))
      )

      for (const attachment of message.attachments) {
        headers.push(
          `--${boundary}`,
          `Content-Type: ${attachment.contentType}`,
          `Content-Disposition: attachment; filename="${attachment.filename}"`,
          'Content-Transfer-Encoding: base64',
          '',
          attachment.content
        )
      }

      headers.push(`--${boundary}--`)
    } else {
      headers.push(
        'Content-Type: text/html; charset="UTF-8"',
        '',
        message.body
      )
    }

    return headers.join('\r\n')
  }

  /**
   * メッセージ本文を抽出
   */
  extractMessageBody(message: GmailMessage): string {
    let body = ''

    // シンプルなメッセージの場合
    if (message.payload.body?.data) {
      body = this.decodeBase64(message.payload.body.data)
    }
    // マルチパートメッセージの場合
    else if (message.payload.parts) {
      for (const part of message.payload.parts) {
        if (part.mimeType === 'text/html' && part.body?.data) {
          body = this.decodeBase64(part.body.data)
          break
        } else if (part.mimeType === 'text/plain' && part.body?.data && !body) {
          body = this.decodeBase64(part.body.data)
        }
      }
    }

    return body
  }

  /**
   * メッセージヘッダーを取得
   */
  getHeader(message: GmailMessage, headerName: string): string | undefined {
    const header = message.payload.headers.find(
      h => h.name.toLowerCase() === headerName.toLowerCase()
    )
    return header?.value
  }

  /**
   * Base64デコード（URL-safe）
   */
  private decodeBase64(data: string): string {
    const base64 = data.replace(/-/g, '+').replace(/_/g, '/')
    const padding = base64.length % 4 ? '='.repeat(4 - base64.length % 4) : ''
    return decodeURIComponent(escape(atob(base64 + padding)))
  }
}

/**
 * Gmail APIと連携してタスク関連のメールを処理
 */
export class GmailTaskProcessor {
  private gmailService: GmailService
  private db: D1Database

  constructor(gmailService: GmailService, db: D1Database) {
    this.gmailService = gmailService
    this.db = db
  }

  /**
   * クライアントからのメールをチェックしてタスクを自動生成
   */
  async processClientEmails(): Promise<number> {
    // クライアントのメールアドレスを取得
    const clients = await this.db.prepare(`
      SELECT id, name, email FROM clients WHERE email IS NOT NULL
    `).all()

    let tasksCreated = 0

    for (const client of clients.results) {
      // クライアントからの未読メールを検索
      const query = `from:${client.email} is:unread`
      const messages = await this.gmailService.listMessages(query, 20)

      for (const message of messages) {
        const subject = this.gmailService.getHeader(message, 'Subject') || 'タイトルなし'
        const from = this.gmailService.getHeader(message, 'From') || ''
        const body = this.gmailService.extractMessageBody(message)

        // タスクを作成
        const result = await this.db.prepare(`
          INSERT INTO tasks (
            title, description, client_id, priority, 
            due_date, status, created_at, gmail_message_id
          ) VALUES (
            ?, ?, ?, 'medium',
            datetime('now', '+3 days'), 'pending', datetime('now'), ?
          )
        `).bind(
          `[メール] ${subject}`,
          `送信者: ${from}\n\n${body.substring(0, 500)}`,
          client.id,
          message.id
        ).run()

        if (result.success) {
          tasksCreated++
          // メールを既読にする
          await this.gmailService.markAsRead(message.id)
          // ラベルを付ける
          await this.gmailService.addLabel(message.id, ['IMPORTANT'])
        }
      }
    }

    return tasksCreated
  }

  /**
   * タスクの進捗をメールで報告
   */
  async sendProgressReport(clientId: number): Promise<void> {
    // クライアント情報を取得
    const client = await this.db.prepare(`
      SELECT * FROM clients WHERE id = ?
    `).bind(clientId).first()

    if (!client?.email) {
      throw new Error('Client email not found')
    }

    // タスク情報を取得
    const tasks = await this.db.prepare(`
      SELECT * FROM tasks 
      WHERE client_id = ? 
      ORDER BY due_date ASC
    `).bind(clientId).all()

    // メール本文を作成
    const body = this.createProgressReportHtml(client, tasks.results)

    // メールを送信
    await this.gmailService.sendEmail({
      to: [client.email],
      subject: `【進捗報告】${client.name}様の案件状況`,
      body
    })
  }

  /**
   * 進捗報告のHTML作成
   */
  private createProgressReportHtml(client: any, tasks: any[]): string {
    const statusMap: Record<string, string> = {
      pending: '未着手',
      in_progress: '進行中',
      completed: '完了',
      on_hold: '保留'
    }

    const taskRows = tasks.map(task => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${task.title}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${statusMap[task.status]}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${new Date(task.due_date).toLocaleDateString('ja-JP')}</td>
      </tr>
    `).join('')

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
      </head>
      <body style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
            進捗報告
          </h2>
          
          <p>${client.name}様</p>
          
          <p>いつもお世話になっております。<br>
          現在お預かりしている案件の進捗状況をご報告いたします。</p>
          
          <h3 style="color: #2c3e50; margin-top: 30px;">案件一覧</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background: #f8f9fa;">
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">案件名</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">状況</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">期限</th>
              </tr>
            </thead>
            <tbody>
              ${taskRows}
            </tbody>
          </table>
          
          <p>ご不明な点がございましたら、お気軽にお問い合わせください。</p>
          
          <p style="margin-top: 30px;">今後ともよろしくお願いいたします。</p>
        </div>
      </body>
      </html>
    `
  }
}