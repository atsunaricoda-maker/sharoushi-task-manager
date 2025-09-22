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
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
