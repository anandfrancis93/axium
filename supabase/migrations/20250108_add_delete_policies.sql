-- Add DELETE policies for user data tables
-- These were missing and preventing users from resetting their progress

-- User Progress
CREATE POLICY "Users can delete their own progress"
  ON user_progress FOR DELETE
  USING (auth.uid() = user_id);

-- User Topic Mastery
CREATE POLICY "Users can delete their own mastery records"
  ON user_topic_mastery FOR DELETE
  USING (auth.uid() = user_id);

-- RL Arm Stats
CREATE POLICY "Users can delete their own arm stats"
  ON rl_arm_stats FOR DELETE
  USING (auth.uid() = user_id);

-- User Dimension Coverage
CREATE POLICY "Users can delete their own dimension coverage"
  ON user_dimension_coverage FOR DELETE
  USING (auth.uid() = user_id);

-- User Responses
CREATE POLICY "Users can delete their own responses"
  ON user_responses FOR DELETE
  USING (auth.uid() = user_id);

-- Learning Sessions
CREATE POLICY "Users can delete their own sessions"
  ON learning_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Questions (user-generated only)
CREATE POLICY "Users can delete their own generated questions"
  ON questions FOR DELETE
  USING (auth.uid() = user_id AND source_type = 'ai_generated_realtime');
