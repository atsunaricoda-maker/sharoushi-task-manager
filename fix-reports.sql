-- Add missing columns to tasks table for report functionality
ALTER TABLE tasks ADD COLUMN completed_at DATETIME;

-- Update completed_at for already completed tasks
UPDATE tasks 
SET completed_at = updated_at 
WHERE status = 'completed' AND completed_at IS NULL;

-- Add indexes for better performance on report queries
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_completed_at ON tasks(completed_at);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_client_status ON tasks(client_id, status);