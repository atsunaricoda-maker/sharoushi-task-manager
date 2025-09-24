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

-- Sample data will be inserted later in seed scripts after clients are created