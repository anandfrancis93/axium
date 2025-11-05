-- Add chapter_id column to questions table
-- This allows questions to be linked directly to chapters (without requiring topics)

-- Add the column as nullable first
ALTER TABLE questions
ADD COLUMN chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE;

-- Make topic_id nullable (questions can be linked to chapter OR topic)
ALTER TABLE questions
ALTER COLUMN topic_id DROP NOT NULL;

-- Add check constraint to ensure either chapter_id or topic_id is set
ALTER TABLE questions
ADD CONSTRAINT questions_chapter_or_topic_check
CHECK (
  (chapter_id IS NOT NULL AND topic_id IS NULL) OR
  (chapter_id IS NULL AND topic_id IS NOT NULL)
);

-- Add index for chapter-based queries
CREATE INDEX idx_questions_chapter_bloom ON questions(chapter_id, bloom_level);

-- Add some missing columns that the code expects
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS topic TEXT,
ADD COLUMN IF NOT EXISTS difficulty_estimated TEXT,
ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'ai_generated';

-- Update question_type to have a default for MCQs
ALTER TABLE questions
ALTER COLUMN question_type SET DEFAULT 'mcq';
