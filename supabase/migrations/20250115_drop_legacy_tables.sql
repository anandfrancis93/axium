-- Drop Legacy Tables Migration
-- These tables are from old features that are no longer used

-- Drop learning_sessions table (replaced by session storage in browser)
DROP TABLE IF EXISTS learning_sessions CASCADE;

-- Drop rl_state table (RL state now stored in user_progress.rl_metadata)
DROP TABLE IF EXISTS rl_state CASCADE;

-- Drop rl_decision_log table (Thompson Sampling removed, no longer needed)
DROP TABLE IF EXISTS rl_decision_log CASCADE;

-- Drop topic_relationships table (unused knowledge graph table)
DROP TABLE IF EXISTS topic_relationships CASCADE;
