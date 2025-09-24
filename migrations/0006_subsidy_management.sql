-- 助成金マスターテーブル
CREATE TABLE IF NOT EXISTS subsidies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL, -- 助成金名（例：雇用調整助成金）
  category TEXT NOT NULL, -- カテゴリ（雇用系、育成系、福祉系、創業系など）
  managing_organization TEXT NOT NULL, -- 管理団体（厚生労働省、経済産業省など）
  description TEXT,
  max_amount INTEGER, -- 最大支給額
  subsidy_rate REAL, -- 助成率（%）
  requirements TEXT, -- 申請要件（JSON形式）
  required_documents TEXT, -- 必要書類リスト（JSON形式）
  application_period_type TEXT CHECK(application_period_type IN ('fixed', 'anytime', 'periodic')), -- 申請時期（固定期間、随時、定期）
  application_start_date DATE,
  application_end_date DATE,
  url TEXT, -- 参考URL
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 既存の subsidy_applications テーブルに不足しているカラムを追加
ALTER TABLE subsidy_applications ADD COLUMN subsidy_id INTEGER;
ALTER TABLE subsidy_applications ADD COLUMN project_id INTEGER;
ALTER TABLE subsidy_applications ADD COLUMN application_number TEXT;
ALTER TABLE subsidy_applications ADD COLUMN approval_date DATE;
ALTER TABLE subsidy_applications ADD COLUMN amount_requested INTEGER;
ALTER TABLE subsidy_applications ADD COLUMN amount_approved INTEGER;
ALTER TABLE subsidy_applications ADD COLUMN amount_received INTEGER;
ALTER TABLE subsidy_applications ADD COLUMN submission_deadline DATE;
ALTER TABLE subsidy_applications ADD COLUMN rejection_reason TEXT;
ALTER TABLE subsidy_applications ADD COLUMN created_by INTEGER;

-- 申請書類管理
CREATE TABLE IF NOT EXISTS subsidy_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL,
  document_name TEXT NOT NULL,
  document_type TEXT NOT NULL, -- 申請書、添付書類、証明書など
  status TEXT DEFAULT 'not_started' CHECK(status IN ('not_started', 'in_progress', 'completed', 'submitted', 'rejected')),
  drive_file_id TEXT, -- Google Drive連携
  file_url TEXT,
  due_date DATE,
  completed_date DATE,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES subsidy_applications(id)
);

-- 申請チェックリスト
CREATE TABLE IF NOT EXISTS subsidy_checklists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL,
  item_name TEXT NOT NULL,
  category TEXT, -- 要件確認、書類準備、提出前確認など
  is_required BOOLEAN DEFAULT 1,
  is_completed BOOLEAN DEFAULT 0,
  completed_by INTEGER,
  completed_at DATETIME,
  notes TEXT,
  display_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES subsidy_applications(id),
  FOREIGN KEY (completed_by) REFERENCES users(id)
);

-- 助成金スケジュール（締切管理）
CREATE TABLE IF NOT EXISTS subsidy_schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL,
  event_type TEXT NOT NULL, -- 書類提出、面談、審査、報告書提出など
  event_name TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  completed_date DATE,
  location TEXT,
  attendees TEXT, -- JSON形式
  notes TEXT,
  reminder_days_before INTEGER DEFAULT 7, -- リマインダー日数
  calendar_event_id TEXT, -- Google Calendar連携
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES subsidy_applications(id)
);

-- 助成金進捗履歴
CREATE TABLE IF NOT EXISTS subsidy_progress_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL,
  action_type TEXT NOT NULL, -- status_change, document_upload, checklist_update など
  action_detail TEXT,
  old_value TEXT,
  new_value TEXT,
  user_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES subsidy_applications(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 助成金受給実績
CREATE TABLE IF NOT EXISTS subsidy_receipts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL,
  receipt_date DATE NOT NULL,
  amount INTEGER NOT NULL,
  payment_method TEXT, -- 振込、小切手など
  bank_account TEXT,
  tax_treatment TEXT, -- 課税、非課税など
  accounting_period TEXT, -- 会計期間
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES subsidy_applications(id)
);

-- 助成金テンプレート（よく使う助成金の申請テンプレート）
CREATE TABLE IF NOT EXISTS subsidy_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subsidy_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  checklist_items TEXT, -- JSON形式のチェックリスト
  document_list TEXT, -- JSON形式の書類リスト
  timeline_template TEXT, -- JSON形式のタイムライン
  tips TEXT, -- 申請のコツやポイント
  success_rate REAL, -- 成功率
  created_by INTEGER,
  is_public BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subsidy_id) REFERENCES subsidies(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 助成金情報更新履歴
CREATE TABLE IF NOT EXISTS subsidy_updates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subsidy_id INTEGER NOT NULL,
  update_type TEXT NOT NULL, -- 要件変更、金額変更、期限変更など
  update_content TEXT NOT NULL,
  effective_date DATE,
  source_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subsidy_id) REFERENCES subsidies(id)
);

-- インデックス追加
CREATE INDEX IF NOT EXISTS idx_subsidy_applications_client_id ON subsidy_applications(client_id);
CREATE INDEX IF NOT EXISTS idx_subsidy_applications_status ON subsidy_applications(status);
CREATE INDEX IF NOT EXISTS idx_subsidy_applications_submission_deadline ON subsidy_applications(submission_deadline);
CREATE INDEX IF NOT EXISTS idx_subsidy_applications_subsidy_id ON subsidy_applications(subsidy_id);
CREATE INDEX IF NOT EXISTS idx_subsidy_documents_application_id ON subsidy_documents(application_id);
CREATE INDEX IF NOT EXISTS idx_subsidy_checklists_application_id ON subsidy_checklists(application_id);
CREATE INDEX IF NOT EXISTS idx_subsidy_schedules_application_id ON subsidy_schedules(application_id);
CREATE INDEX IF NOT EXISTS idx_subsidy_schedules_scheduled_date ON subsidy_schedules(scheduled_date);