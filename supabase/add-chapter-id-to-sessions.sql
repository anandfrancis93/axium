-- Add chapter_id column to learning_sessions table
ALTER TABLE learning_sessions
ADD COLUMN IF NOT EXISTS chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_learning_sessions_chapter_id ON learning_sessions(chapter_id);

-- Create index for user + chapter queries
CREATE INDEX IF NOT EXISTS idx_learning_sessions_user_chapter ON learning_sessions(user_id, chapter_id);
