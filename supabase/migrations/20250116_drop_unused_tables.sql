-- Drop Unused Tables Migration
-- These tables are not referenced anywhere in the codebase

-- Drop api_call_log (only used by lib/utils/api-logger.ts which is barely used)
DROP TABLE IF EXISTS api_call_log CASCADE;

-- Drop chapter_topics (no references found)
DROP TABLE IF EXISTS chapter_topics CASCADE;

-- Drop rl_arm_stats (Thompson Sampling removed)
DROP TABLE IF EXISTS rl_arm_stats CASCADE;

-- Drop subject_dimension_config (old 6-dimension system removed)
DROP TABLE IF EXISTS subject_dimension_config CASCADE;

-- Drop user_dimension_coverage (old 6-dimension system removed)
DROP TABLE IF EXISTS user_dimension_coverage CASCADE;

-- Drop user_goals (no references found)
DROP TABLE IF EXISTS user_goals CASCADE;

-- Drop user_topic_mastery (likely duplicate of user_progress data)
DROP TABLE IF EXISTS user_topic_mastery CASCADE;
