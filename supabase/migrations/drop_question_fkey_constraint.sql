-- Migration: Drop foreign key constraint on user_responses.question_id
-- This allows storing responses for on-the-fly generated questions
-- that don't exist in the questions table

-- Drop the foreign key constraint
ALTER TABLE user_responses
DROP CONSTRAINT IF EXISTS user_responses_question_id_fkey;

-- Add comment explaining why constraint was removed
COMMENT ON COLUMN user_responses.question_id IS 'Question identifier. May reference questions table or be a generated UUID for on-the-fly questions. No foreign key constraint to allow flexibility.';
