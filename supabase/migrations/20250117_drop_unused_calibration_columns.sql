-- Drop unused calibration statistics columns from user_progress
-- These columns were never updated (always showed 0.00) and aren't used anywhere

ALTER TABLE user_progress
DROP COLUMN IF EXISTS avg_confidence,
DROP COLUMN IF EXISTS avg_response_time_seconds,
DROP COLUMN IF EXISTS confidence_calibration_error;
