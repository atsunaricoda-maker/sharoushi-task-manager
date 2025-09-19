-- Google Calendar連携用のカラム追加

-- タスクテーブルにカレンダーイベントID列を追加
ALTER TABLE tasks ADD COLUMN calendar_event_id TEXT;

-- カレンダー同期ログテーブル
CREATE TABLE IF NOT EXISTS calendar_sync_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  sync_type TEXT NOT NULL CHECK(sync_type IN ('task_to_calendar', 'calendar_to_task', 'full_sync')),
  sync_direction TEXT CHECK(sync_direction IN ('push', 'pull', 'both')),
  items_synced INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  error_message TEXT,
  synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- カレンダー設定テーブル
CREATE TABLE IF NOT EXISTS calendar_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  primary_calendar_id TEXT DEFAULT 'primary',
  sync_enabled BOOLEAN DEFAULT 1,
  auto_sync_interval INTEGER DEFAULT 30, -- 自動同期間隔（分）
  sync_tasks_to_calendar BOOLEAN DEFAULT 1,
  sync_calendar_to_tasks BOOLEAN DEFAULT 1,
  reminder_minutes INTEGER DEFAULT 60,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 定期タスクのスケジュール管理
CREATE TABLE IF NOT EXISTS recurring_task_schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_template_id INTEGER,
  recurrence_rule TEXT NOT NULL, -- RFC 5545形式のRRULE
  calendar_event_id TEXT,
  next_occurrence DATETIME,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_template_id) REFERENCES task_templates(id)
);

-- インデックス追加
CREATE INDEX IF NOT EXISTS idx_tasks_calendar_event_id ON tasks(calendar_event_id);
CREATE INDEX IF NOT EXISTS idx_calendar_sync_logs_user_id ON calendar_sync_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_settings_user_id ON calendar_settings(user_id);