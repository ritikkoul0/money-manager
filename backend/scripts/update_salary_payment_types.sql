-- Update salary_entries table to support yearly-based payment types

-- Drop the old constraint
ALTER TABLE salary_entries DROP CONSTRAINT IF EXISTS salary_entries_payment_type_check;

-- Update existing rows to use yearly-based payment types
UPDATE salary_entries SET payment_type = 'yearly' WHERE payment_type = 'monthly';
UPDATE salary_entries SET payment_type = 'bi-yearly' WHERE payment_type = 'bi-weekly';
UPDATE salary_entries SET payment_type = 'yearly' WHERE payment_type = 'weekly';

-- Add new constraint with yearly-based payment types
ALTER TABLE salary_entries ADD CONSTRAINT salary_entries_payment_type_check
    CHECK (payment_type IN ('yearly', 'bi-yearly', 'quarterly', 'one-time'));

-- Update default value for payment_type column
ALTER TABLE salary_entries ALTER COLUMN payment_type SET DEFAULT 'yearly';

