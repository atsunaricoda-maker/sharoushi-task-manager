-- Gmail連携用テーブル

-- メール送受信ログ
CREATE TABLE IF NOT EXISTS email_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  direction TEXT NOT NULL CHECK(direction IN ('sent', 'received')),
  recipients TEXT NOT NULL, -- JSON array of email addresses
  subject TEXT NOT NULL,
  message_id TEXT,
  thread_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- メールテンプレート
CREATE TABLE IF NOT EXISTS email_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- タスクとGmailの関連付け（メールからタスクを生成した場合）
ALTER TABLE tasks ADD COLUMN gmail_message_id TEXT;
ALTER TABLE tasks ADD COLUMN gmail_thread_id TEXT;

-- インデックスの追加
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_message_id ON email_logs(message_id);
CREATE INDEX IF NOT EXISTS idx_tasks_gmail_message_id ON tasks(gmail_message_id);