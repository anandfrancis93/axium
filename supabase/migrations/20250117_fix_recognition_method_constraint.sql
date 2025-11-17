-- Fix recognition_method constraint to match codebase
-- Database had 'random' but code uses 'random_guess'

ALTER TABLE user_responses DROP CONSTRAINT IF EXISTS user_responses_recognition_method_check;

ALTER TABLE user_responses ADD CONSTRAINT user_responses_recognition_method_check
  CHECK (recognition_method IN ('memory', 'recognition', 'educated_guess', 'random_guess'));

COMMENT ON CONSTRAINT user_responses_recognition_method_check ON user_responses IS
  'Allowed recognition methods: memory (recalled from memory), recognition (recognized from options), educated_guess (used logic/reasoning), random_guess (complete guess)';
