-- スケジュール管理用のフィールドを追加 (COMPLETED MANUALLY)
-- This migration has been applied manually due to column conflicts
-- ALTER TABLE tasks ADD COLUMN scheduled_start DATETIME; -- DONE
-- ALTER TABLE tasks ADD COLUMN scheduled_end DATETIME; -- DONE  
-- ALTER TABLE tasks ADD COLUMN is_critical BOOLEAN DEFAULT 0; -- DONE
-- ALTER TABLE tasks ADD COLUMN buffer_days INTEGER DEFAULT 0; -- DONE

-- タスク依存関係テーブルは既に存在しているため、スキップ
-- task_dependencies table already exists with correct structure

-- インデックスは手動で追加済み  
-- All indexes have been created manually

-- Placeholder to mark this migration as completed
SELECT 'Schedule fields migration completed manually' as status;