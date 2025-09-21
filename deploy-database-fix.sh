#!/bin/bash

# 🔧 Production Database Fix Script
# This script applies the complete database schema to fix the "created_by" column error

echo "🔄 Applying database schema fixes to production..."

# Step 1: Apply complete schema
echo "📋 Step 1: Applying complete database schema..."
if wrangler d1 execute sharoushi-task-manager-db --file=./migrations/production_complete_schema.sql --remote; then
    echo "✅ Complete schema applied successfully"
else
    echo "❌ Failed to apply complete schema"
    exit 1
fi

# Step 2: Apply sample data (optional)
echo "📋 Step 2: Adding sample data..."
if wrangler d1 execute sharoushi-task-manager-db --file=./migrations/production_sample_data.sql --remote; then
    echo "✅ Sample data added successfully"
else
    echo "⚠️  Warning: Sample data may have failed (possibly already exists)"
fi

# Step 3: Verify table structure
echo "📋 Step 3: Verifying table structure..."
echo "Checking if subsidy_applications table has created_by column..."
wrangler d1 execute sharoushi-task-manager-db --remote --command="PRAGMA table_info(subsidy_applications);"

echo ""
echo "🎉 Database fix deployment complete!"
echo "💡 Next steps:"
echo "   1. Test the subsidy functionality at: https://sharoushi-task-manager.pages.dev"
echo "   2. Check the browser console for any remaining errors"
echo "   3. Verify that all CRUD operations work properly"

echo ""
echo "🔍 To check subsidy applications table data:"
echo "   wrangler d1 execute sharoushi-task-manager-db --remote --command='SELECT * FROM subsidy_applications LIMIT 5;'"

echo ""
echo "📊 To check all tables:"
echo "   wrangler d1 execute sharoushi-task-manager-db --remote --command=\"SELECT name FROM sqlite_master WHERE type='table';\""