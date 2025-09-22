#!/bin/bash

# 🔧 Production Schedule Table Fix Script
# This script creates the missing schedule_entries table that the application expects

echo "🔄 Creating schedule_entries table in production database..."

# Check if wrangler is authenticated
if ! wrangler whoami &>/dev/null; then
    echo "❌ Wrangler is not authenticated!"
    echo "💡 Please run: wrangler login"
    exit 1
fi

echo "✅ Wrangler authentication verified"

# Check if database exists
if ! wrangler d1 list | grep -q "sharoushi-task-manager-db"; then
    echo "❌ Database 'sharoushi-task-manager-db' not found!"
    echo "💡 Please create the database first or check the name in wrangler.jsonc"
    exit 1
fi

echo "✅ Database 'sharoushi-task-manager-db' found"

# Create the schedule_entries table that matches application expectations
echo "📋 Creating schedule_entries table..."
wrangler d1 execute sharoushi-task-manager-db --remote --command="
-- Create the schedule_entries table that the application expects
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_schedule_entries_start_time ON schedule_entries(start_time);
CREATE INDEX IF NOT EXISTS idx_schedule_entries_client_id ON schedule_entries(client_id);
CREATE INDEX IF NOT EXISTS idx_schedule_entries_user_id ON schedule_entries(user_id);
"

if [ $? -eq 0 ]; then
    echo "✅ Schedule_entries table created successfully"
else
    echo "❌ Failed to create schedule_entries table"
    exit 1
fi

# Verify table structure
echo "📋 Verifying schedule_entries table structure..."
echo "Table info:"
wrangler d1 execute sharoushi-task-manager-db --remote --command="PRAGMA table_info(schedule_entries);"

echo ""
echo "🎉 Schedule table fix deployment complete!"
echo "💡 Next steps:"
echo "   1. Test the schedule functionality at: https://sharoushi-task-manager.pages.dev"
echo "   2. Try creating a schedule entry to verify it works"
echo "   3. Check the browser console for any remaining errors"

echo ""
echo "🔍 To test the table exists:"
echo "   wrangler d1 execute sharoushi-task-manager-db --remote --command='SELECT COUNT(*) as count FROM schedule_entries;'"