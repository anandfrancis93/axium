-- Migration: Fix determine_rl_phase function to return rl_phase enum type
-- The column is type rl_phase (enum), but function was returning TEXT

-- Drop the old function
DROP FUNCTION IF EXISTS determine_rl_phase(BIGINT, DECIMAL, DECIMAL, DECIMAL);

-- Recreate with correct return type
CREATE OR REPLACE FUNCTION determine_rl_phase(
  p_total_attempts BIGINT,
  p_calibration_stddev DECIMAL,
  p_calibration_slope DECIMAL,
  p_r_squared DECIMAL
)
RETURNS rl_phase AS $$  -- Changed from TEXT to rl_phase enum
BEGIN
  -- Cold Start: < 10 attempts
  IF p_total_attempts < 10 THEN
    RETURN 'cold_start'::rl_phase;
  END IF;

  -- Exploration: 10-50 attempts
  IF p_total_attempts BETWEEN 10 AND 50 THEN
    RETURN 'exploration'::rl_phase;
  END IF;

  -- Stabilization: 150+ attempts, low variance, good fit
  IF p_total_attempts >= 150 AND p_calibration_stddev < 0.3 AND p_r_squared > 0.7 THEN
    RETURN 'stabilization'::rl_phase;
  END IF;

  -- Optimization: 50-150 attempts OR high variance/poor fit
  RETURN 'optimization'::rl_phase;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
