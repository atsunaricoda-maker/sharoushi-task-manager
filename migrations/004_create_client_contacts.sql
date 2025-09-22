-- Create client_contacts table for storing contact history
CREATE TABLE IF NOT EXISTS client_contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    contact_type TEXT NOT NULL, -- 'phone', 'email', 'meeting', 'visit', 'other'
    subject TEXT NOT NULL,
    notes TEXT NOT NULL,
    contact_date DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_client_contacts_client_id ON client_contacts(client_id);
CREATE INDEX IF NOT EXISTS idx_client_contacts_date ON client_contacts(contact_date DESC);

-- Add last_contact_date column to clients table if it doesn't exist
ALTER TABLE clients ADD COLUMN last_contact_date DATETIME;