-- Migration: Update confidence scale from 1-3 to 1-5
-- This aligns the database constraint with the UI slider

-- Drop the old constraint
ALTER TABLE user_responses DROP CONSTRAINT IF EXISTS user_responses_confidence_check;

-- Add new constraint for 1-5 scale
ALTER TABLE user_responses ADD CONSTRAINT user_responses_confidence_check
  CHECK (confidence BETWEEN 1 AND 5);

-- Add comment explaining the scale
COMMENT ON COLUMN user_responses.confidence IS
  'User self-reported confidence (1-5 scale): 1=Guessing, 2=Unsure, 3=Moderate, 4=Confident, 5=Certain';
