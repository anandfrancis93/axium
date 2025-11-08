-- Add current_streak column to user_topic_mastery table
-- Tracks consecutive correct answers for each topic (across all Bloom levels)

ALTER TABLE user_topic_mastery
ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;

-- Add comment explaining the column
COMMENT ON COLUMN user_topic_mastery.current_streak IS 'Consecutive correct answers for this topic at this Bloom level. Resets to 0 on incorrect answer. Persists across sessions.';
