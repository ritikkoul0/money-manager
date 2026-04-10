-- Migration to add half-yearly recurrence option to bills table
-- This updates the CHECK constraint to include 'half-yearly'

-- Drop the old constraint
ALTER TABLE bills DROP CONSTRAINT IF EXISTS bills_recurrence_check;

-- Add the new constraint with half-yearly included
ALTER TABLE bills ADD CONSTRAINT bills_recurrence_check 
CHECK (recurrence IN ('none', 'daily', 'weekly', 'monthly', 'half-yearly', 'yearly'));

