-- Add question_position to user_global_progress for global 7-2-1 cycle tracking
ALTER TABLE user_global_progress 
ADD COLUMN IF NOT EXISTS question_position INTEGER DEFAULT 1;

-- Comment on column
COMMENT ON COLUMN user_global_progress.question_position IS 'Current position (1-10) in the 7-2-1 learning cycle (7 new, 2 review, 1 dimension)';
