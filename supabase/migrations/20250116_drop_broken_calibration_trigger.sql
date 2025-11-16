-- Drop Broken Calibration Statistics Trigger and Functions
-- The trigger references deleted rl_phase functions and is broken
-- Statistics are not used in the application

-- Drop trigger first
DROP TRIGGER IF EXISTS trigger_update_calibration_statistics ON user_responses;

-- Drop the main trigger function
DROP FUNCTION IF EXISTS update_calibration_statistics();

-- Drop helper functions
DROP FUNCTION IF EXISTS calculate_calibration_regression(UUID, UUID);
DROP FUNCTION IF EXISTS calculate_calibration_stddev(UUID, UUID);
DROP FUNCTION IF EXISTS project_questions_to_mastery(NUMERIC, NUMERIC, NUMERIC, INTEGER);

-- Drop unused legacy mastery functions
DROP FUNCTION IF EXISTS is_legacy_mastery_scores(JSONB);
DROP FUNCTION IF EXISTS migrate_legacy_mastery_scores(JSONB);

-- Add comment explaining removal
COMMENT ON TABLE user_progress IS 'User learning progress - tracks mastery, attempts, and last practiced time. Statistics removed as they were broken and unused.';
