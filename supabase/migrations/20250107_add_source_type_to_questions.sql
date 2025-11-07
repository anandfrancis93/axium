-- Add source_type column to questions table to track question origin
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'manual';

-- Add index for faster filtering by source_type
CREATE INDEX IF NOT EXISTS idx_questions_source_type ON questions(source_type);

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Added source_type column to questions table';
  RAISE NOTICE 'Values: manual (admin-created), ai_generated_realtime (session questions)';
END $$;
