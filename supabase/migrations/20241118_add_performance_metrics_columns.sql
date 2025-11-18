-- Add performance metrics columns to user_progress table
ALTER TABLE user_progress 
ADD COLUMN IF NOT EXISTS calibration_mean DECIMAL(4,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS calibration_stddev DECIMAL(4,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS calibration_slope DECIMAL(6,4) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS calibration_r_squared DECIMAL(3,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS questions_to_mastery INTEGER;
