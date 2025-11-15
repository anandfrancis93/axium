-- Migration: Ensure confidence scale is 1-3 (Low, Medium, High)
-- This aligns the database constraint with the UI 3-option selector

-- Drop the old constraint
ALTER TABLE user_responses DROP CONSTRAINT IF EXISTS user_responses_confidence_check;

-- Add constraint for 1-3 scale
ALTER TABLE user_responses ADD CONSTRAINT user_responses_confidence_check
  CHECK (confidence IN (1, 2, 3));

-- Add comment explaining the scale
COMMENT ON COLUMN user_responses.confidence IS
  'User self-reported confidence (1-3 scale): 1=Low, 2=Medium, 3=High';
