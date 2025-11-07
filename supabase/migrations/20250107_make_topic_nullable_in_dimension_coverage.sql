-- Make topic column nullable in user_dimension_coverage table
-- We're using topic_id as the primary reference, topic name is optional

ALTER TABLE user_dimension_coverage
ALTER COLUMN topic DROP NOT NULL;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Made topic column nullable in user_dimension_coverage table';
  RAISE NOTICE 'Now using topic_id as primary reference';
END $$;
