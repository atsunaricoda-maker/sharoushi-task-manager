-- Fix all missing tables and columns for full functionality

-- 1. Create task_templates table
CREATE TABLE IF NOT EXISTS task_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  task_type TEXT,
  frequency TEXT,
  estimated_hours INTEGER,
  priority TEXT DEFAULT 'medium',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create client_task_templates table
CREATE TABLE IF NOT EXISTS client_task_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  template_id INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  custom_due_day INTEGER,
  assigned_user_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (template_id) REFERENCES task_templates(id),
  FOREIGN KEY (assigned_user_id) REFERENCES users(id)
);

-- 3. Create task_history table
CREATE TABLE IF NOT EXISTS task_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  user_id INTEGER,
  action TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT,
  completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 4. Create notification_settings table
CREATE TABLE IF NOT EXISTS notification_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL,
  email_enabled BOOLEAN DEFAULT TRUE,
  browser_enabled BOOLEAN DEFAULT FALSE,
  frequency TEXT DEFAULT 'daily',
  reminder_time TEXT DEFAULT '09:00',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 5. Create subsidy_applications table
CREATE TABLE IF NOT EXISTS subsidy_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subsidy_id INTEGER NOT NULL,
  client_id INTEGER NOT NULL,
  status TEXT DEFAULT 'preparing',
  progress INTEGER DEFAULT 0,
  amount_requested INTEGER,
  amount_approved INTEGER,
  application_date DATE,
  approval_date DATE,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subsidy_id) REFERENCES subsidies(id),
  FOREIGN KEY (client_id) REFERENCES clients(id)
);

-- 6. Create project_tasks table
CREATE TABLE IF NOT EXISTS project_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  task_id INTEGER NOT NULL,
  order_index INTEGER DEFAULT 0,
  milestone TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (task_id) REFERENCES tasks(id)
);

-- 7. Create schedule_entries table
CREATE TABLE IF NOT EXISTS schedule_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER,
  task_id INTEGER,
  start_date DATETIME NOT NULL,
  end_date DATETIME NOT NULL,
  buffer_time INTEGER DEFAULT 0,
  is_critical_path BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (task_id) REFERENCES tasks(id)
);

-- 8. Add missing columns to existing tables (if not exist)
-- Note: SQLite doesn't support "ADD COLUMN IF NOT EXISTS", so we need to handle this carefully

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_task_history_task ON task_history(task_id);
CREATE INDEX IF NOT EXISTS idx_task_history_user ON task_history(user_id);
CREATE INDEX IF NOT EXISTS idx_client_templates ON client_task_templates(client_id);
CREATE INDEX IF NOT EXISTS idx_subsidy_apps_client ON subsidy_applications(client_id);
CREATE INDEX IF NOT EXISTS idx_subsidy_apps_subsidy ON subsidy_applications(subsidy_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_project ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_schedule_entries_project ON schedule_entries(project_id);

-- Insert default task templates
INSERT OR IGNORE INTO task_templates (name, description, task_type, frequency, estimated_hours, priority) VALUES
('給与計算', '月次給与計算業務', 'payroll', 'monthly', 8, 'high'),
('社会保険手続き', '社会保険関連の手続き', 'insurance', 'as_needed', 4, 'high'),
('労働保険手続き', '労働保険関連の手続き', 'labor_insurance', 'as_needed', 3, 'medium'),
('年末調整', '年末調整業務', 'year_end', 'yearly', 16, 'urgent'),
('算定基礎届', '算定基礎届の作成・提出', 'insurance', 'yearly', 6, 'high'),
('労働保険年度更新', '労働保険の年度更新手続き', 'labor_insurance', 'yearly', 8, 'high'),
('36協定更新', '36協定の更新手続き', 'legal', 'yearly', 4, 'medium'),
('就業規則改定', '就業規則の見直し・改定', 'legal', 'as_needed', 12, 'medium'),
('入社手続き', '新規入社者の手続き', 'hr', 'as_needed', 3, 'high'),
('退職手続き', '退職者の手続き', 'hr', 'as_needed', 3, 'high');