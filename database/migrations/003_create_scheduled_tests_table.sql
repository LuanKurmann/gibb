-- Migration: Create scheduled_tests table for test calendar functionality
-- This table stores future tests/exams that can be converted to grades after completion

CREATE TABLE IF NOT EXISTS scheduled_tests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    test_type TEXT NOT NULL CHECK (test_type IN ('exam', 'test', 'presentation', 'project', 'homework')),
    scheduled_date TIMESTAMPTZ NOT NULL,
    duration INTEGER, -- in minutes
    weight DECIMAL(3,1) DEFAULT 1.0,
    semester INTEGER CHECK (semester >= 1 AND semester <= 4),
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    grade_id UUID REFERENCES grades(id) ON DELETE SET NULL, -- Link to grade when converted
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_scheduled_tests_user_id ON scheduled_tests(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_tests_scheduled_date ON scheduled_tests(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_tests_status ON scheduled_tests(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_tests_subject_id ON scheduled_tests(subject_id);

-- Enable Row Level Security
ALTER TABLE scheduled_tests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own scheduled tests" ON scheduled_tests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scheduled tests" ON scheduled_tests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled tests" ON scheduled_tests
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled tests" ON scheduled_tests
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_scheduled_tests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER trigger_update_scheduled_tests_updated_at
    BEFORE UPDATE ON scheduled_tests
    FOR EACH ROW
    EXECUTE FUNCTION update_scheduled_tests_updated_at();

-- Add additional columns to grades table to support test conversion
ALTER TABLE grades ADD COLUMN IF NOT EXISTS date_taken TIMESTAMPTZ;
ALTER TABLE grades ADD COLUMN IF NOT EXISTS duration TEXT;

-- Update existing grade type constraints to include new types
ALTER TABLE grades DROP CONSTRAINT IF EXISTS grades_type_check;
ALTER TABLE grades ADD CONSTRAINT grades_type_check 
    CHECK (type IN ('individual', 'exam', 'experience', 'semester', 'project'));

-- Comments for documentation
COMMENT ON TABLE scheduled_tests IS 'Stores scheduled tests and exams that can be converted to grades';
COMMENT ON COLUMN scheduled_tests.test_type IS 'Type of test: exam, test, presentation, project, homework';
COMMENT ON COLUMN scheduled_tests.status IS 'Status: scheduled, completed, cancelled';
COMMENT ON COLUMN scheduled_tests.grade_id IS 'Links to grades table when test is converted to grade';
COMMENT ON COLUMN scheduled_tests.weight IS 'Weight factor for grade calculation (0.1-3.0)';
COMMENT ON COLUMN scheduled_tests.duration IS 'Test duration in minutes';
