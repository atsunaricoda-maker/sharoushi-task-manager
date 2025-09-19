-- ユーザー（社労士）マスタ
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'sharoushi',
  avatar_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 顧問先マスタ
CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  name_kana TEXT,
  address TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  employee_count INTEGER DEFAULT 0,
  health_insurance_type TEXT,
  contract_plan TEXT,
  primary_contact_name TEXT,
  monthly_fee DECIMAL(10,2),
  contract_start_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- タスクマスタ
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  client_id INTEGER NOT NULL,
  assignee_id INTEGER NOT NULL,
  task_type TEXT NOT NULL, -- 'regular' or 'irregular'
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'overdue'
  priority TEXT DEFAULT 'medium', -- 'urgent', 'high', 'medium', 'low'
  due_date DATE,
  estimated_hours DECIMAL(4,1),
  actual_hours DECIMAL(4,1),
  progress INTEGER DEFAULT 0, -- 0-100
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients (id),
  FOREIGN KEY (assignee_id) REFERENCES users (id)
);

-- 定期業務テンプレート
CREATE TABLE IF NOT EXISTS task_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  task_type TEXT DEFAULT 'regular',
  frequency TEXT, -- 'monthly', 'quarterly', 'yearly'
  target_month INTEGER, -- 1-12 for yearly tasks
  estimated_hours DECIMAL(4,1),
  priority TEXT DEFAULT 'medium',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 顧問先-テンプレート関連
CREATE TABLE IF NOT EXISTS client_task_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  template_id INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  custom_due_day INTEGER, -- 月内の期限日
  assigned_user_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients (id),
  FOREIGN KEY (template_id) REFERENCES task_templates (id),
  FOREIGN KEY (assigned_user_id) REFERENCES users (id),
  UNIQUE(client_id, template_id)
);

-- タスク履歴
CREATE TABLE IF NOT EXISTS task_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  action TEXT NOT NULL, -- 'created', 'updated', 'completed', 'assigned'
  old_status TEXT,
  new_status TEXT,
  comment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks (id),
  FOREIGN KEY (user_id) REFERENCES users (id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_status ON tasks (assignee_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_client_due_date ON tasks (client_id, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status_priority ON tasks (status, priority);
CREATE INDEX IF NOT EXISTS idx_task_history_task_id ON task_history (task_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients (name);