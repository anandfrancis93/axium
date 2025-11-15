-- Migration: Make question_id nullable in user_responses
-- This allows storing responses for on-the-fly generated questions
-- that don't exist in the questions table

ALTER TABLE user_responses
ALTER COLUMN question_id DROP NOT NULL;

-- Add comment explaining the change
COMMENT ON COLUMN user_responses.question_id IS 'Foreign key to questions table. NULL for on-the-fly generated questions.';
