-- Add user_id column to questions table to track question ownership
-- This allows each user to have their own generated questions for spaced repetition
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add index for faster filtering by user_id
CREATE INDEX IF NOT EXISTS idx_questions_user_id ON questions(user_id);

-- Add composite index for common query pattern (user + chapter via topic)
CREATE INDEX IF NOT EXISTS idx_questions_user_source ON questions(user_id, source_type);

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Added user_id column to questions table';
  RAISE NOTICE 'AI-generated questions are now user-specific';
END $$;
