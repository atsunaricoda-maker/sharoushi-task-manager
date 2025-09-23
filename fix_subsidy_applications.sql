-- Fix subsidy_applications table by adding missing created_by column

-- Add the missing created_by column
ALTER TABLE subsidy_applications ADD COLUMN created_by INTEGER;

-- Add foreign key constraint (note: SQLite doesn't support adding FK constraints to existing tables)
-- We'll handle this in the application layer for now

-- Update existing records to have a default created_by value (assuming user ID 1 exists)
UPDATE subsidy_applications SET created_by = 1 WHERE created_by IS NULL;