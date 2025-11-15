-- Migration: Fix determine_rl_phase function signature
-- Change parameter type from INTEGER to BIGINT to match COUNT(*) return type

CREATE OR REPLACE FUNCTION determine_rl_phase(
  p_total_attempts BIGINT,  -- Changed from INTEGER to BIGINT
  p_calibration_stddev DECIMAL,
  p_calibration_slope DECIMAL,
  p_r_squared DECIMAL
)
RETURNS TEXT AS $$
BEGIN
  -- Cold Start: < 10 attempts
  IF p_total_attempts < 10 THEN
    RETURN 'cold_start';
  END IF;

  -- Exploration: 10-50 attempts
  IF p_total_attempts BETWEEN 10 AND 50 THEN
    RETURN 'exploration';
  END IF;

  -- Stabilization: 150+ attempts, low variance, good fit
  IF p_total_attempts >= 150 AND p_calibration_stddev < 0.3 AND p_r_squared > 0.7 THEN
    RETURN 'stabilization';
  END IF;

  -- Optimization: 50-150 attempts OR high variance/poor fit
  RETURN 'optimization';
END;
$$ LANGUAGE plpgsql IMMUTABLE;
