-- Create BM Settings table
CREATE TABLE IF NOT EXISTS bm_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bm_type TEXT NOT NULL CHECK (bm_type IN ('tals', 'wd-d', 'arte', 'gesundheit')),
    study_mode TEXT NOT NULL DEFAULT 'fulltime' CHECK (study_mode IN ('fulltime', 'parttime')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create Grades table
CREATE TABLE IF NOT EXISTS grades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('experience', 'exam', 'semester', 'individual')),
    value DECIMAL(3,1) NOT NULL CHECK (value >= 1.0 AND value <= 6.0),
    semester INTEGER CHECK (semester >= 1 AND semester <= 4),
    name TEXT,
    weight DECIMAL(3,2) DEFAULT 1.0,
    date_taken DATE,
    description TEXT,
    duration TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bm_settings_user_id ON bm_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_grades_user_id ON grades(user_id);
CREATE INDEX IF NOT EXISTS idx_grades_subject_id ON grades(subject_id);
CREATE INDEX IF NOT EXISTS idx_grades_type ON grades(type);

-- Enable Row Level Security (RLS)
ALTER TABLE bm_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for bm_settings
CREATE POLICY "Users can view their own BM settings" ON bm_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own BM settings" ON bm_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own BM settings" ON bm_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own BM settings" ON bm_settings
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for grades
CREATE POLICY "Users can view their own grades" ON grades
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own grades" ON grades
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own grades" ON grades
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own grades" ON grades
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_bm_settings_updated_at 
    BEFORE UPDATE ON bm_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_grades_updated_at 
    BEFORE UPDATE ON grades 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
