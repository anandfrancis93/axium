-- Add next_review_date to questions table for spaced repetition
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS next_review_date TIMESTAMPTZ;

-- Add global question counter to user_progress for 7-2-1 split tracking
ALTER TABLE user_progress
ADD COLUMN IF NOT EXISTS question_position INTEGER DEFAULT 1;

-- Add round-robin dimension index for dimension practice
ALTER TABLE user_progress
ADD COLUMN IF NOT EXISTS dimension_round_robin_index INTEGER DEFAULT 0;

-- Add comments
COMMENT ON COLUMN questions.next_review_date IS 'Next review date for spaced repetition based on calibration score';
COMMENT ON COLUMN user_progress.question_position IS 'Global question position (1-10) for 7-2-1 split pattern';
COMMENT ON COLUMN user_progress.dimension_round_robin_index IS 'Round-robin index for cycling through uncovered dimensions';

-- Create index for faster spaced repetition queries
CREATE INDEX IF NOT EXISTS idx_questions_next_review_date 
ON questions(next_review_date) 
WHERE next_review_date IS NOT NULL;
