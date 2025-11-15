-- Drop RL Phase Tracking
-- These phases were cosmetic labels without actual reinforcement learning
-- Epsilon rates are now calculated directly from total_attempts

-- Drop trigger first
DROP TRIGGER IF EXISTS trigger_update_rl_phase ON user_progress;

-- Drop functions
DROP FUNCTION IF EXISTS update_rl_phase();
DROP FUNCTION IF EXISTS calculate_rl_phase(INTEGER, JSONB, INTEGER, DECIMAL, JSONB);

-- Drop columns from user_progress
ALTER TABLE user_progress
DROP COLUMN IF EXISTS rl_phase,
DROP COLUMN IF EXISTS rl_metadata;

-- Drop enum type
DROP TYPE IF EXISTS rl_phase;

-- Add comment explaining removal
COMMENT ON TABLE user_progress IS 'User learning progress - tracks mastery, calibration, and attempts per topic. Epsilon exploration rate calculated directly from total_attempts.';
