-- Migration: Add salary_entries table for salary tracking
-- This table tracks salary payments and history

CREATE TABLE IF NOT EXISTS salary_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    company_name VARCHAR(255) NOT NULL,
    payment_date DATE NOT NULL,
    payment_type VARCHAR(50) DEFAULT 'yearly' CHECK (payment_type IN ('yearly', 'bi-yearly', 'quarterly', 'one-time')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_salary_entries_user_id ON salary_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_salary_entries_payment_date ON salary_entries(payment_date);
CREATE INDEX IF NOT EXISTS idx_salary_entries_created_at ON salary_entries(created_at);

