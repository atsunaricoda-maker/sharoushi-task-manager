#!/bin/bash

# Production Database Migration Script
# This script applies the latest schema improvements to production

echo "🚀 Starting production database migration..."

# Apply the schema improvements
echo "📋 Applying schema improvements (0008_improve_task_schema.sql)..."
npx wrangler d1 execute sharoushi-task-manager-db --file=./migrations/0008_improve_task_schema.sql --env production

if [ $? -eq 0 ]; then
    echo "✅ Schema migration completed successfully!"
else
    echo "❌ Schema migration failed!"
    exit 1
fi

# Verify migration
echo "🔍 Verifying migration..."
npx wrangler d1 execute sharoushi-task-manager-db --command="SELECT name FROM sqlite_master WHERE type='table' AND name IN ('task_comments', 'tasks');" --env production

echo "🎉 Production migration completed!"