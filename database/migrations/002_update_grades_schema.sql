-- Migration to update grades table schema
-- Add missing columns and update type constraint

-- Add new columns to grades table
ALTER TABLE grades 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS weight DECIMAL(3,2) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS date_taken DATE,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS duration TEXT;

-- Update the type constraint to include 'individual'
ALTER TABLE grades DROP CONSTRAINT IF EXISTS grades_type_check;
ALTER TABLE grades ADD CONSTRAINT grades_type_check 
CHECK (type IN ('experience', 'exam', 'semester', 'individual'));

-- Create additional indexes for new columns
CREATE INDEX IF NOT EXISTS idx_grades_name ON grades(name);
CREATE INDEX IF NOT EXISTS idx_grades_date_taken ON grades(date_taken);
