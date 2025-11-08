-- ========================================
-- FIX RESPONSE TIME DATA TYPE
-- ========================================
-- Run this in Supabase SQL Editor
-- Changes response_time_seconds from INTEGER to DECIMAL to support fractional seconds

ALTER TABLE rl_decision_log
ALTER COLUMN response_time_seconds TYPE DECIMAL(10,3);

COMMENT ON COLUMN rl_decision_log.response_time_seconds IS 'Response time in seconds (supports fractional values like 8.256)';
