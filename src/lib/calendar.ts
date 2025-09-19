/**
 * Google Calendar API Service
 * Google Calendar APIとの連携を管理
 */

interface CalendarConfig {
  accessToken: string
  refreshToken?: string
}

interface CalendarEvent {
  id?: string
  summary: string
  description?: string
  location?: string
  start: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  end: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  attendees?: Array<{
    email: string
    displayName?: string
    responseStatus?: string
  }>
  reminders?: {
    useDefault: boolean
    overrides?: Array<{
      method: 'email' | 'popup'
      minutes: number
    }>
  }
  recurrence?: string[]
  colorId?: string
}

interface CalendarList {
  id: string
  summary: string
  description?: string
  primary?: boolean
  selected?: boolean
  backgroundColor?: string
  foregroundColor?: string
}

export class CalendarService {
  private config: CalendarConfig
  private readonly API_BASE = 'https://www.googleapis.com/calendar/v3'

  constructor(config: CalendarConfig) {
    this.config = config
  }

  /**
   * カレンダーリストを取得
   */
  async listCalendars(): Promise<CalendarList[]> {
    const response = await fetch(`${this.API_BASE}/users/me/calendarList`, {
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to list calendars: ${response.statusText}`)
    }

    const data = await response.json()
    return data.items || []
  }

  /**
   * イベント一覧を取得
   */
  async listEvents(
    calendarId: string = 'primary',
    options: {
      timeMin?: string
      timeMax?: string
      maxResults?: number
      q?: string
      orderBy?: 'startTime' | 'updated'
    } = {}
  ): Promise<CalendarEvent[]> {
    const params = new URLSearchParams({
      ...(options.timeMin && { timeMin: options.timeMin }),
      ...(options.timeMax && { timeMax: options.timeMax }),
      ...(options.maxResults && { maxResults: options.maxResults.toString() }),
      ...(options.q && { q: options.q }),
      ...(options.orderBy && { orderBy: options.orderBy }),
      singleEvents: 'true',
      orderBy: options.orderBy || 'startTime'
    })

    const response = await fetch(
      `${this.API_BASE}/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to list events: ${response.statusText}`)
    }

    const data = await response.json()
    return data.items || []
  }

  /**
   * イベントを作成
   */
  async createEvent(
    calendarId: string = 'primary',
    event: CalendarEvent
  ): Promise<CalendarEvent> {
    const response = await fetch(
      `${this.API_BASE}/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to create event: ${error.error?.message || response.statusText}`)
    }

    return await response.json()
  }

  /**
   * イベントを更新
   */
  async updateEvent(
    calendarId: string = 'primary',
    eventId: string,
    event: Partial<CalendarEvent>
  ): Promise<CalendarEvent> {
    const response = await fetch(
      `${this.API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to update event: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * イベントを削除
   */
  async deleteEvent(
    calendarId: string = 'primary',
    eventId: string
  ): Promise<void> {
    const response = await fetch(
      `${this.API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to delete event: ${response.statusText}`)
    }
  }

  /**
   * イベントの詳細を取得
   */
  async getEvent(
    calendarId: string = 'primary',
    eventId: string
  ): Promise<CalendarEvent> {
    const response = await fetch(
      `${this.API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to get event: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * クイック追加（自然言語でイベント作成）
   */
  async quickAdd(
    calendarId: string = 'primary',
    text: string
  ): Promise<CalendarEvent> {
    const params = new URLSearchParams({ text })
    
    const response = await fetch(
      `${this.API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/quickAdd?${params}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to quick add event: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * 空き時間を検索
   */
  async findFreeBusy(
    timeMin: string,
    timeMax: string,
    calendars: string[]
  ): Promise<any> {
    const response = await fetch(`${this.API_BASE}/freeBusy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        timeMin,
        timeMax,
        items: calendars.map(id => ({ id }))
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to find free/busy: ${response.statusText}`)
    }

    return await response.json()
  }
}

/**
 * タスクとカレンダーの同期サービス
 */
export class TaskCalendarSync {
  private calendarService: CalendarService
  private db: D1Database

  constructor(calendarService: CalendarService, db: D1Database) {
    this.calendarService = calendarService
    this.db = db
  }

  /**
   * タスクをカレンダーイベントとして作成
   */
  async syncTaskToCalendar(taskId: number): Promise<string> {
    // タスク情報を取得
    const task = await this.db.prepare(`
      SELECT t.*, c.name as client_name, u.name as assignee_name
      FROM tasks t
      LEFT JOIN clients c ON t.client_id = c.id
      LEFT JOIN users u ON t.assignee_id = u.id
      WHERE t.id = ?
    `).bind(taskId).first()

    if (!task) {
      throw new Error('Task not found')
    }

    // カレンダーイベントを作成
    const event: CalendarEvent = {
      summary: `[タスク] ${task.title}`,
      description: `
顧客: ${task.client_name || '未設定'}
担当者: ${task.assignee_name || '未設定'}
優先度: ${task.priority}
種別: ${task.task_type}

詳細:
${task.description || '詳細なし'}

---
タスクID: ${task.id}
      `.trim(),
      start: {
        dateTime: new Date(task.due_date).toISOString(),
        timeZone: 'Asia/Tokyo'
      },
      end: {
        dateTime: new Date(new Date(task.due_date).getTime() + 60 * 60 * 1000).toISOString(),
        timeZone: 'Asia/Tokyo'
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 60 },
          { method: 'email', minutes: 24 * 60 }
        ]
      },
      colorId: this.getColorIdByPriority(task.priority)
    }

    const createdEvent = await this.calendarService.createEvent('primary', event)

    // カレンダーイベントIDをタスクに保存
    await this.db.prepare(`
      UPDATE tasks 
      SET calendar_event_id = ?, 
          updated_at = datetime('now')
      WHERE id = ?
    `).bind(createdEvent.id, taskId).run()

    return createdEvent.id!
  }

  /**
   * カレンダーイベントからタスクを作成
   */
  async createTaskFromEvent(eventId: string, userId: number): Promise<number> {
    const event = await this.calendarService.getEvent('primary', eventId)

    // タイトルからタスクプレフィックスを除去
    const title = event.summary.replace(/^\[タスク\]\s*/, '')

    // 期限日を決定
    const dueDate = event.start.dateTime 
      ? new Date(event.start.dateTime)
      : event.start.date 
      ? new Date(event.start.date)
      : new Date()

    // タスクを作成
    const result = await this.db.prepare(`
      INSERT INTO tasks (
        title, description, assignee_id, priority,
        task_type, status, due_date, calendar_event_id,
        created_at, updated_at
      ) VALUES (
        ?, ?, ?, 'medium', 'other', 'pending',
        ?, ?, datetime('now'), datetime('now')
      )
    `).bind(
      title,
      event.description || '',
      userId,
      dueDate.toISOString(),
      event.id
    ).run()

    return result.meta.last_row_id as number
  }

  /**
   * タスクの完了状態をカレンダーに反映
   */
  async updateCalendarOnTaskComplete(taskId: number): Promise<void> {
    const task = await this.db.prepare(`
      SELECT calendar_event_id, title FROM tasks WHERE id = ?
    `).bind(taskId).first()

    if (!task?.calendar_event_id) {
      return
    }

    // イベントのタイトルを更新して完了を示す
    await this.calendarService.updateEvent('primary', task.calendar_event_id as string, {
      summary: `✅ [完了] ${task.title}`
    })
  }

  /**
   * 定期タスクの繰り返しルールを設定
   */
  async setRecurrenceRule(taskId: number, recurrence: string[]): Promise<void> {
    const task = await this.db.prepare(`
      SELECT calendar_event_id FROM tasks WHERE id = ?
    `).bind(taskId).first()

    if (!task?.calendar_event_id) {
      throw new Error('Calendar event not found for task')
    }

    await this.calendarService.updateEvent('primary', task.calendar_event_id as string, {
      recurrence
    })
  }

  /**
   * 今週のタスクをカレンダーから取得
   */
  async getWeeklyTasksFromCalendar(): Promise<any[]> {
    const now = new Date()
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)

    const events = await this.calendarService.listEvents('primary', {
      timeMin: weekStart.toISOString(),
      timeMax: weekEnd.toISOString(),
      q: '[タスク]'
    })

    return events
  }

  /**
   * 優先度に応じたカラーIDを取得
   */
  private getColorIdByPriority(priority: string): string {
    const colorMap: Record<string, string> = {
      high: '11',    // 赤
      medium: '5',   // 黄
      low: '10'      // 緑
    }
    return colorMap[priority] || '1'
  }

  /**
   * カレンダーとタスクの双方向同期
   */
  async fullSync(userId: number): Promise<{ 
    syncedToCalendar: number, 
    syncedFromCalendar: number 
  }> {
    let syncedToCalendar = 0
    let syncedFromCalendar = 0

    // タスク→カレンダー同期
    const tasksWithoutEvent = await this.db.prepare(`
      SELECT id FROM tasks 
      WHERE calendar_event_id IS NULL 
      AND status != 'completed'
      AND assignee_id = ?
    `).bind(userId).all()

    for (const task of tasksWithoutEvent.results) {
      try {
        await this.syncTaskToCalendar(task.id as number)
        syncedToCalendar++
      } catch (error) {
        console.error(`Failed to sync task ${task.id} to calendar:`, error)
      }
    }

    // カレンダー→タスク同期
    const events = await this.calendarService.listEvents('primary', {
      timeMin: new Date().toISOString(),
      q: '[タスク]'
    })

    for (const event of events) {
      if (!event.id) continue

      // 既存のタスクがあるか確認
      const existingTask = await this.db.prepare(`
        SELECT id FROM tasks WHERE calendar_event_id = ?
      `).bind(event.id).first()

      if (!existingTask) {
        try {
          await this.createTaskFromEvent(event.id, userId)
          syncedFromCalendar++
        } catch (error) {
          console.error(`Failed to create task from event ${event.id}:`, error)
        }
      }
    }

    return { syncedToCalendar, syncedFromCalendar }
  }
}