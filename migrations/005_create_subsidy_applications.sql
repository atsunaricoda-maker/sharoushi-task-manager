-- Create subsidy_applications table for tracking application projects
CREATE TABLE IF NOT EXISTS subsidy_applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subsidy_name TEXT NOT NULL,
    client_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'preparing', -- 'preparing', 'submitted', 'approved', 'rejected'
    application_date DATE,
    deadline_date DATE,
    expected_amount INTEGER, -- Amount in yen
    actual_amount INTEGER, -- Actual received amount
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_subsidy_applications_client_id ON subsidy_applications(client_id);
CREATE INDEX IF NOT EXISTS idx_subsidy_applications_status ON subsidy_applications(status);
CREATE INDEX IF NOT EXISTS idx_subsidy_applications_deadline ON subsidy_applications(deadline_date);

-- Insert some sample data for testing
INSERT OR IGNORE INTO subsidy_applications (subsidy_name, client_id, status, deadline_date, expected_amount, notes) VALUES
('雇用調整助成金', 1, 'preparing', '2025-12-31', 500000, 'COVID-19対応の雇用維持支援'),
('キャリアアップ助成金', 2, 'submitted', '2025-11-30', 300000, '正社員化支援'),
('人材開発支援助成金', 1, 'approved', '2025-10-15', 200000, '従業員研修費用支援');