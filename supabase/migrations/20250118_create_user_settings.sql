-- Create user_settings table for storing user-level preferences and state
-- This includes global round robin format cycling state

CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Round robin state for question formats (global across all topics)
  -- Structure: { "bloom_1": 0, "bloom_2": 1, ... } where number is last used index
  format_round_robin JSONB DEFAULT '{}'::jsonb,

  -- Other user preferences can be added here
  preferences JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

-- RLS policies
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their own settings
CREATE POLICY "Users can view own settings"
  ON user_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE user_settings IS 'User-level settings and state (e.g., global round robin for question formats)';
COMMENT ON COLUMN user_settings.format_round_robin IS 'Global round robin state for question formats across all topics. Keys are bloom_1..bloom_6, values are last used format index.';
