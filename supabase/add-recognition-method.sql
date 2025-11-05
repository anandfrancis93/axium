-- Add recognition_method to user_responses table
-- Tracks HOW the user arrived at their answer (memory, recognition, educated guess, random)

-- Add recognition_method column
ALTER TABLE user_responses
ADD COLUMN IF NOT EXISTS recognition_method TEXT CHECK (
  recognition_method IN ('memory', 'recognition', 'educated_guess', 'random')
);

-- Add comment explaining the field
COMMENT ON COLUMN user_responses.recognition_method IS
'How user arrived at answer: memory (knew before seeing options), recognition (recognized correct answer), educated_guess (narrowed down), random (guessed randomly)';

-- Add index for analysis
CREATE INDEX IF NOT EXISTS idx_user_responses_recognition ON user_responses(user_id, recognition_method);

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Recognition method column added to user_responses table';
END $$;
