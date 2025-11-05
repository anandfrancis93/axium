-- Add DELETE policies to allow users to delete their own data
-- This is needed for the reset progress functionality

-- User Responses: Allow users to delete their own responses
CREATE POLICY "Users can delete their own responses"
  ON user_responses FOR DELETE
  USING (auth.uid() = user_id);

-- Learning Sessions: Allow users to delete their own sessions
CREATE POLICY "Users can delete their own sessions"
  ON learning_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- User Topic Mastery: Allow users to delete their own mastery records
CREATE POLICY "Users can delete their own mastery records"
  ON user_topic_mastery FOR DELETE
  USING (auth.uid() = user_id);

-- RL Arm Stats: Allow users to delete their own arm stats
CREATE POLICY "Users can delete their own arm stats"
  ON rl_arm_stats FOR DELETE
  USING (auth.uid() = user_id);

-- Confirmation
DO $$
BEGIN
  RAISE NOTICE 'DELETE policies added for reset progress functionality';
END $$;
