-- Migration: Add recognition_method to user_responses
-- Adds metacognitive tracking: HOW did the user arrive at their answer?

-- Create recognition_method enum type
CREATE TYPE recognition_method AS ENUM (
  'memory',          -- Recalled from memory
  'recognition',     -- Recognized from options
  'educated_guess',  -- Made an educated guess
  'random_guess'     -- Made a random guess
);

-- Add recognition_method column to user_responses
ALTER TABLE user_responses
ADD COLUMN recognition_method recognition_method;

-- Add comment explaining the column
COMMENT ON COLUMN user_responses.recognition_method IS
  'How the user arrived at their answer (metacognition): memory=Recalled, recognition=Recognized from options, educated_guess=Used logic/reasoning, random_guess=Complete guess';

-- Add index for analysis queries
CREATE INDEX idx_user_responses_recognition_method
  ON user_responses(recognition_method);
