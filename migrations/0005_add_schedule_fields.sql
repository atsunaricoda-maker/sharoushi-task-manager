-- スケジュール管理用のフィールドを追加
ALTER TABLE tasks ADD COLUMN scheduled_start DATETIME;
ALTER TABLE tasks ADD COLUMN scheduled_end DATETIME;
ALTER TABLE tasks ADD COLUMN estimated_hours INTEGER DEFAULT 8;
ALTER TABLE tasks ADD COLUMN is_critical BOOLEAN DEFAULT 0;
ALTER TABLE tasks ADD COLUMN buffer_days INTEGER DEFAULT 0;

-- タスク依存関係テーブル
CREATE TABLE IF NOT EXISTS task_dependencies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  depends_on_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (depends_on_id) REFERENCES tasks(id) ON DELETE CASCADE,
  UNIQUE(task_id, depends_on_id)
);

-- インデックスを追加
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_start ON tasks(scheduled_start);
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_end ON tasks(scheduled_end);
CREATE INDEX IF NOT EXISTS idx_tasks_is_critical ON tasks(is_critical);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_task_id ON task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_depends_on_id ON task_dependencies(depends_on_id);