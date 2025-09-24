-- Task schema improvements and fixes
-- Fix NOT NULL constraints that are too restrictive

-- Add missing column to clients table (if not exists)
ALTER TABLE clients ADD COLUMN last_contact_date TEXT;

-- Note: SQLite doesn't support ALTER COLUMN directly
-- We need to recreate the table with correct schema

-- Create new tasks table with improved schema
CREATE TABLE IF NOT EXISTS tasks_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  client_id INTEGER, -- Allow NULL for general tasks
  assignee_id INTEGER, -- Allow NULL for unassigned tasks
  task_type TEXT DEFAULT 'regular', -- Set default value
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  due_date DATE,
  estimated_hours DECIMAL(4,1),
  actual_hours DECIMAL(4,1),
  progress INTEGER DEFAULT 0,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (client_id) REFERENCES clients (id),
  FOREIGN KEY (assignee_id) REFERENCES users (id)
);

-- Copy existing data
INSERT INTO tasks_new (
  id, title, description, client_id, assignee_id, task_type,
  status, priority, due_date, estimated_hours, actual_hours,
  progress, notes, created_at, updated_at
)
SELECT 
  id, title, description, client_id, assignee_id, 
  COALESCE(task_type, 'regular') as task_type,
  status, priority, due_date, estimated_hours, actual_hours,
  progress, notes, created_at, updated_at
FROM tasks;

-- Drop old table and rename new one
DROP TABLE tasks;
ALTER TABLE tasks_new RENAME TO tasks;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_status ON tasks (assignee_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_client_due_date ON tasks (client_id, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status_priority ON tasks (status, priority);
CREATE INDEX IF NOT EXISTS idx_tasks_status_priority_due ON tasks(status, priority, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_status_due ON tasks(assignee_id, status, due_date);

-- Create task comments table for proper comment persistence
CREATE TABLE IF NOT EXISTS task_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  comment_text TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_created_at ON task_comments(created_at DESC);