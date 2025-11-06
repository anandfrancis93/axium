-- Add RL Phase Tracking to User Progress
-- This migration adds the ability to track which Reinforcement Learning phase
-- each user is in for each topic

-- Create enum type for RL phases
CREATE TYPE rl_phase AS ENUM (
  'cold_start',           -- No prior knowledge, starting from zero
  'exploration',          -- Testing different actions to gather data
  'optimization',         -- Focusing on high-reward actions
  'stabilization',        -- Converged to stable policy
  'adaptation',           -- Continually adapting to changes
  'meta_learning'         -- Learning how to learn better
);

-- Add RL phase column to user_progress
ALTER TABLE user_progress
ADD COLUMN rl_phase rl_phase DEFAULT 'cold_start',
ADD COLUMN rl_metadata JSONB DEFAULT '{
  "exploration_count": 0,
  "optimization_count": 0,
  "total_rewards": 0,
  "policy_updates": 0,
  "phase_transitions": [],
  "last_phase_change": null
}'::jsonb;

-- Add index for querying by RL phase
CREATE INDEX idx_user_progress_rl_phase ON user_progress(rl_phase);

-- Create function to calculate RL phase based on metrics
CREATE OR REPLACE FUNCTION calculate_rl_phase(
  p_total_attempts INTEGER,
  p_mastery_scores JSONB,
  p_current_bloom_level INTEGER,
  p_confidence_calibration_error DECIMAL,
  p_rl_metadata JSONB
)
RETURNS rl_phase AS $$
DECLARE
  v_avg_mastery DECIMAL;
  v_exploration_count INTEGER;
  v_optimization_count INTEGER;
  v_mastery_variance DECIMAL;
  v_phase rl_phase;
BEGIN
  -- Extract metadata
  v_exploration_count := COALESCE((p_rl_metadata->>'exploration_count')::INTEGER, 0);
  v_optimization_count := COALESCE((p_rl_metadata->>'optimization_count')::INTEGER, 0);

  -- Calculate average mastery across all bloom levels
  v_avg_mastery := (
    COALESCE((p_mastery_scores->>'1')::DECIMAL, 0) +
    COALESCE((p_mastery_scores->>'2')::DECIMAL, 0) +
    COALESCE((p_mastery_scores->>'3')::DECIMAL, 0) +
    COALESCE((p_mastery_scores->>'4')::DECIMAL, 0) +
    COALESCE((p_mastery_scores->>'5')::DECIMAL, 0) +
    COALESCE((p_mastery_scores->>'6')::DECIMAL, 0)
  ) / 6.0;

  -- Calculate variance in mastery scores (measure of stability)
  v_mastery_variance := (
    POWER(COALESCE((p_mastery_scores->>'1')::DECIMAL, 0) - v_avg_mastery, 2) +
    POWER(COALESCE((p_mastery_scores->>'2')::DECIMAL, 0) - v_avg_mastery, 2) +
    POWER(COALESCE((p_mastery_scores->>'3')::DECIMAL, 0) - v_avg_mastery, 2) +
    POWER(COALESCE((p_mastery_scores->>'4')::DECIMAL, 0) - v_avg_mastery, 2) +
    POWER(COALESCE((p_mastery_scores->>'5')::DECIMAL, 0) - v_avg_mastery, 2) +
    POWER(COALESCE((p_mastery_scores->>'6')::DECIMAL, 0) - v_avg_mastery, 2)
  ) / 6.0;

  -- Phase determination logic
  -- 1. Cold Start: < 10 total attempts
  IF p_total_attempts < 10 THEN
    v_phase := 'cold_start';

  -- 2. Exploration: 10-50 attempts, still gathering data
  ELSIF p_total_attempts >= 10 AND p_total_attempts < 50 THEN
    v_phase := 'exploration';

  -- 3. Optimization: 50-150 attempts, focusing on high-reward actions
  ELSIF p_total_attempts >= 50 AND p_total_attempts < 150 THEN
    v_phase := 'optimization';

  -- 4. Stabilization: 150+ attempts, low variance, good calibration
  ELSIF p_total_attempts >= 150 AND v_mastery_variance < 400 AND p_confidence_calibration_error < 0.3 THEN
    v_phase := 'stabilization';

  -- 5. Meta-Learning: Very experienced (500+ attempts), excellent calibration
  ELSIF p_total_attempts >= 500 AND p_confidence_calibration_error < 0.15 THEN
    v_phase := 'meta_learning';

  -- 6. Adaptation: High attempts but changing performance (high variance or calibration issues)
  ELSIF p_total_attempts >= 150 THEN
    v_phase := 'adaptation';

  -- Default to exploration if none of the above
  ELSE
    v_phase := 'exploration';
  END IF;

  RETURN v_phase;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to update RL phase
CREATE OR REPLACE FUNCTION update_rl_phase()
RETURNS TRIGGER AS $$
DECLARE
  v_old_phase rl_phase;
  v_new_phase rl_phase;
  v_updated_metadata JSONB;
BEGIN
  -- Get current phase
  v_old_phase := OLD.rl_phase;

  -- Calculate new phase
  v_new_phase := calculate_rl_phase(
    NEW.total_attempts,
    NEW.mastery_scores,
    NEW.current_bloom_level,
    NEW.confidence_calibration_error,
    NEW.rl_metadata
  );

  -- Update phase
  NEW.rl_phase := v_new_phase;

  -- If phase changed, record the transition
  IF v_old_phase IS DISTINCT FROM v_new_phase THEN
    v_updated_metadata := NEW.rl_metadata;

    -- Add phase transition to history
    v_updated_metadata := jsonb_set(
      v_updated_metadata,
      '{phase_transitions}',
      COALESCE(v_updated_metadata->'phase_transitions', '[]'::jsonb) ||
      jsonb_build_object(
        'from', v_old_phase,
        'to', v_new_phase,
        'timestamp', NOW(),
        'total_attempts', NEW.total_attempts
      )
    );

    -- Update last phase change timestamp
    v_updated_metadata := jsonb_set(
      v_updated_metadata,
      '{last_phase_change}',
      to_jsonb(NOW())
    );

    NEW.rl_metadata := v_updated_metadata;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update RL phase
CREATE TRIGGER trigger_update_rl_phase
  BEFORE UPDATE ON user_progress
  FOR EACH ROW
  WHEN (
    OLD.total_attempts IS DISTINCT FROM NEW.total_attempts OR
    OLD.mastery_scores IS DISTINCT FROM NEW.mastery_scores OR
    OLD.confidence_calibration_error IS DISTINCT FROM NEW.confidence_calibration_error
  )
  EXECUTE FUNCTION update_rl_phase();

-- Initialize RL phase for existing records
UPDATE user_progress
SET rl_phase = calculate_rl_phase(
  total_attempts,
  mastery_scores,
  current_bloom_level,
  confidence_calibration_error,
  rl_metadata
);

-- Add comment for documentation
COMMENT ON COLUMN user_progress.rl_phase IS 'Current Reinforcement Learning phase for this topic';
COMMENT ON COLUMN user_progress.rl_metadata IS 'Metadata tracking RL-specific metrics and phase transitions';
COMMENT ON TYPE rl_phase IS 'Reinforcement Learning phases: cold_start -> exploration -> optimization -> stabilization -> adaptation/meta_learning';
