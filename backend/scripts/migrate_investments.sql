-- Investment Table Migration
-- Adds additional columns to the investments table for enhanced tracking

-- Add columns if they don't exist (for backward compatibility)
ALTER TABLE investments
ADD COLUMN IF NOT EXISTS investment_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS quantity DECIMAL(15, 4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS purchase_date DATE,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update existing records with default values
UPDATE investments
SET
    investment_name = COALESCE(NULLIF(investment_name, ''), description, 'Investment'),
    quantity = COALESCE(quantity, 0),
    purchase_date = COALESCE(purchase_date, DATE(created_at))
WHERE investment_name IS NULL
    OR investment_name = ''
    OR quantity IS NULL
    OR purchase_date IS NULL;

