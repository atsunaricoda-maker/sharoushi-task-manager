-- 通知ログテーブル
CREATE TABLE IF NOT EXISTS notification_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'task_reminder', 'task_overdue', 'task_completed', 'daily_summary', 'weekly_report'
  task_id INTEGER,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'sent', -- 'sent', 'failed'
  error_message TEXT,
  FOREIGN KEY (user_id) REFERENCES users (id),
  FOREIGN KEY (task_id) REFERENCES tasks (id)
);

-- ユーザー通知設定テーブル
CREATE TABLE IF NOT EXISTS user_notification_settings (
  user_id INTEGER PRIMARY KEY,
  email BOOLEAN DEFAULT TRUE,
  browser BOOLEAN DEFAULT FALSE,
  slack BOOLEAN DEFAULT FALSE,
  reminder_days INTEGER DEFAULT 3, -- 何日前に通知するか
  daily_summary BOOLEAN DEFAULT TRUE,
  weekly_report BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

-- 予約通知テーブル（Cron的な処理用）
CREATE TABLE IF NOT EXISTS scheduled_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  scheduled_for DATETIME NOT NULL,
  target_id INTEGER, -- user_id or task_id
  metadata TEXT, -- JSON形式の追加データ
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'cancelled'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_sent ON notification_logs (user_id, sent_at);
CREATE INDEX IF NOT EXISTS idx_notification_logs_task ON notification_logs (task_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_status ON scheduled_notifications (status, scheduled_for);