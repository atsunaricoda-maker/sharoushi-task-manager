-- Migration: Create schedule_entries table for calendar functionality
-- Date: 2025-01-22

CREATE TABLE IF NOT EXISTS schedule_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  client_id INTEGER,
  title TEXT NOT NULL,
  description TEXT,
  entry_type TEXT DEFAULT 'other',
  start_time DATETIME NOT NULL,
  end_time DATETIME,
  location TEXT,
  is_recurring INTEGER DEFAULT 0,
  recurrence_pattern TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- Add foreign key constraints (if needed)
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_schedule_entries_start_time ON schedule_entries(start_time);
CREATE INDEX IF NOT EXISTS idx_schedule_entries_client_id ON schedule_entries(client_id);
CREATE INDEX IF NOT EXISTS idx_schedule_entries_user_id ON schedule_entries(user_id);