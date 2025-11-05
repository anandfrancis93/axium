-- Fix learning_sessions table schema - add all missing columns

-- Add subject_id column (foreign key to subjects table)
ALTER TABLE learning_sessions
ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE;

-- Add questions_answered column
ALTER TABLE learning_sessions
ADD COLUMN IF NOT EXISTS questions_answered INTEGER DEFAULT 0;

-- Add total_questions column
ALTER TABLE learning_sessions
ADD COLUMN IF NOT EXISTS total_questions INTEGER DEFAULT 10;

-- Add score column
ALTER TABLE learning_sessions
ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;

-- Add selection_algorithm column
ALTER TABLE learning_sessions
ADD COLUMN IF NOT EXISTS selection_algorithm TEXT DEFAULT 'thompson_sampling';

-- Add started_at column
ALTER TABLE learning_sessions
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add completed_at column
ALTER TABLE learning_sessions
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_learning_sessions_subject_id ON learning_sessions(subject_id);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_user_completed ON learning_sessions(user_id, completed_at);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_started_at ON learning_sessions(started_at DESC);
