-- Create user_global_progress table to track overall learning curve
-- This table stores aggregated metrics across ALL topics for a user

CREATE TABLE IF NOT EXISTS user_global_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Global Calibration Metrics (TRACK 1 - Format Independent)
  calibration_mean DECIMAL(4,2) DEFAULT 0.0,           -- Average calibration score (-1.5 to +1.5)
  calibration_stddev DECIMAL(4,2) DEFAULT 0.0,         -- Standard deviation (consistency)
  calibration_slope DECIMAL(6,4) DEFAULT 0.0,          -- Linear regression slope (improvement rate)
  calibration_r_squared DECIMAL(3,2) DEFAULT 0.0,      -- Regression fit quality (0-1)
  
  -- Metadata
  total_responses_analyzed INTEGER DEFAULT 0,          -- Number of responses used for this calculation
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE user_global_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own global progress"
  ON user_global_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own global progress"
  ON user_global_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own global progress"
  ON user_global_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX idx_user_global_progress_user_id ON user_global_progress(user_id);

-- Trigger to update last_updated_at
CREATE TRIGGER update_user_global_progress_updated_at BEFORE UPDATE ON user_global_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
