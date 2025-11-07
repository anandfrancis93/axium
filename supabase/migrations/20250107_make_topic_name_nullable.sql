-- Make topic column nullable since we're using topic_id now
-- The topic name is redundant when we have topic_id (can join to topics table)

-- Make topic nullable in user_topic_mastery
ALTER TABLE user_topic_mastery
ALTER COLUMN topic DROP NOT NULL;

-- Make topic nullable in rl_arm_stats
ALTER TABLE rl_arm_stats
ALTER COLUMN topic DROP NOT NULL;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Made topic column nullable in mastery tables';
  RAISE NOTICE 'Now using topic_id as primary reference, topic name is optional';
END $$;
