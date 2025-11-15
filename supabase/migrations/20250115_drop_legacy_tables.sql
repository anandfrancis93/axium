-- Drop Legacy Tables Migration
-- These tables are from the old quiz flow and are no longer used

-- Drop learning_sessions table (replaced by session storage in browser)
DROP TABLE IF EXISTS learning_sessions CASCADE;

-- Drop rl_state table (RL state now stored in user_progress.rl_metadata)
DROP TABLE IF EXISTS rl_state CASCADE;
