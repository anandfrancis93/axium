-- Add topic_id column to mastery tables and update constraints
-- This allows us to use topic_id (UUID) instead of topic name (TEXT)

-- Fix user_topic_mastery table
ALTER TABLE user_topic_mastery
ADD COLUMN IF NOT EXISTS topic_id UUID REFERENCES topics(id) ON DELETE CASCADE;

-- Create index for topic_id
CREATE INDEX IF NOT EXISTS idx_user_mastery_topic_id ON user_topic_mastery(user_id, topic_id, bloom_level);

-- Drop old unique constraint (uses topic name)
ALTER TABLE user_topic_mastery
DROP CONSTRAINT IF EXISTS user_topic_mastery_user_id_topic_bloom_level_chapter_id_key;

-- Add new unique constraint (uses topic_id)
ALTER TABLE user_topic_mastery
ADD CONSTRAINT user_topic_mastery_unique_by_id
UNIQUE(user_id, topic_id, bloom_level, chapter_id);

-- Fix rl_arm_stats table
ALTER TABLE rl_arm_stats
ADD COLUMN IF NOT EXISTS topic_id UUID REFERENCES topics(id) ON DELETE CASCADE;

-- Add last_selected_at column (used by update function)
ALTER TABLE rl_arm_stats
ADD COLUMN IF NOT EXISTS last_selected_at TIMESTAMPTZ;

-- Create index for topic_id
CREATE INDEX IF NOT EXISTS idx_rl_arms_topic_id ON rl_arm_stats(user_id, topic_id, bloom_level);

-- Drop old unique constraint (uses topic name)
ALTER TABLE rl_arm_stats
DROP CONSTRAINT IF EXISTS rl_arm_stats_user_id_chapter_id_topic_bloom_level_key;

-- Add new unique constraint (uses topic_id)
ALTER TABLE rl_arm_stats
ADD CONSTRAINT rl_arm_stats_unique_by_id
UNIQUE(user_id, chapter_id, topic_id, bloom_level);

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Updated mastery tables to use topic_id!';
  RAISE NOTICE 'Added topic_id column to user_topic_mastery';
  RAISE NOTICE 'Added topic_id and last_selected_at columns to rl_arm_stats';
  RAISE NOTICE 'Updated UNIQUE constraints to use topic_id instead of topic name';
END $$;
