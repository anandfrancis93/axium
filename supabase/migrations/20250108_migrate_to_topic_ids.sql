-- Migration: Convert text-based topics to database references
-- This migration adds topic_id columns alongside existing topic TEXT columns
-- The TEXT columns will be dropped after data migration is complete

-- ============================================
-- STEP 1: Add topic_id columns to all tables
-- ============================================

-- user_topic_mastery
ALTER TABLE user_topic_mastery
ADD COLUMN topic_id UUID REFERENCES topics(id) ON DELETE CASCADE;

CREATE INDEX idx_user_topic_mastery_topic_id ON user_topic_mastery(topic_id);

-- rl_arm_stats (previously arm_stats)
ALTER TABLE arm_stats
ADD COLUMN topic_id UUID REFERENCES topics(id) ON DELETE CASCADE;

CREATE INDEX idx_arm_stats_topic_id ON arm_stats(topic_id);

-- questions
ALTER TABLE questions
ADD COLUMN topic_id UUID REFERENCES topics(id) ON DELETE SET NULL;

CREATE INDEX idx_questions_topic_id ON questions(topic_id);

-- user_dimension_coverage
ALTER TABLE user_dimension_coverage
ADD COLUMN topic_id UUID REFERENCES topics(id) ON DELETE CASCADE;

CREATE INDEX idx_user_dimension_coverage_topic_id ON user_dimension_coverage(topic_id);

-- ============================================
-- STEP 2: Update RPC functions to support topic_id
-- ============================================

-- Update get_available_arms to use topic_id
DROP FUNCTION IF EXISTS get_available_arms(UUID, UUID);

CREATE OR REPLACE FUNCTION get_available_arms(
  p_user_id UUID,
  p_chapter_id UUID
)
RETURNS TABLE (
  topic_id UUID,
  topic TEXT,
  bloom_level INTEGER,
  mastery_score NUMERIC,
  is_unlocked BOOLEAN
) AS $
DECLARE
  user_current_bloom INTEGER;
BEGIN
  -- Get user's current Bloom level for this chapter
  SELECT COALESCE(current_bloom_level, 1)
  INTO user_current_bloom
  FROM user_progress
  WHERE user_id = p_user_id AND chapter_id = p_chapter_id;

  -- If no progress record, default to level 1
  IF user_current_bloom IS NULL THEN
    user_current_bloom := 1;
  END IF;

  RETURN QUERY
  SELECT
    t.id as topic_id,
    t.name as topic,
    bl.level as bloom_level,
    COALESCE(utm.mastery_score, 0) as mastery_score,
    (bl.level <= user_current_bloom) as is_unlocked
  FROM topics t
  CROSS JOIN (
    SELECT generate_series(1, 6) as level
  ) bl
  LEFT JOIN user_topic_mastery utm ON (
    utm.user_id = p_user_id
    AND utm.topic_id = t.id
    AND utm.bloom_level = bl.level
  )
  WHERE t.chapter_id = p_chapter_id
  ORDER BY t.sequence_order, bl.level;
END;
$ LANGUAGE plpgsql STABLE;

-- ============================================
-- STEP 3: Create helper function to find topic by name
-- ============================================

CREATE OR REPLACE FUNCTION find_or_create_topic(
  p_chapter_id UUID,
  p_topic_name TEXT
)
RETURNS UUID AS $
DECLARE
  v_topic_id UUID;
  v_normalized_name TEXT;
BEGIN
  -- Normalize topic name (trim, lowercase for matching)
  v_normalized_name := TRIM(LOWER(p_topic_name));

  -- Try to find existing topic (case-insensitive)
  SELECT id INTO v_topic_id
  FROM topics
  WHERE chapter_id = p_chapter_id
    AND LOWER(TRIM(name)) = v_normalized_name
  LIMIT 1;

  -- If not found, create new topic
  IF v_topic_id IS NULL THEN
    INSERT INTO topics (chapter_id, name, parent_topic_id, sequence_order, description)
    VALUES (
      p_chapter_id,
      TRIM(p_topic_name),  -- Use original case for display
      NULL,
      (SELECT COALESCE(MAX(sequence_order), 0) + 1 FROM topics WHERE chapter_id = p_chapter_id AND parent_topic_id IS NULL),
      'Auto-created from legacy text topic'
    )
    RETURNING id INTO v_topic_id;
  END IF;

  RETURN v_topic_id;
END;
$ LANGUAGE plpgsql;

-- ============================================
-- STEP 4: Create migration helper function
-- ============================================

CREATE OR REPLACE FUNCTION migrate_text_topics_to_ids()
RETURNS TABLE (
  table_name TEXT,
  rows_migrated INTEGER,
  topics_created INTEGER
) AS $
DECLARE
  v_rows_migrated INTEGER;
  v_topics_before INTEGER;
  v_topics_after INTEGER;
BEGIN
  -- Count topics before
  SELECT COUNT(*) INTO v_topics_before FROM topics;

  -- Migrate user_topic_mastery
  UPDATE user_topic_mastery
  SET topic_id = find_or_create_topic(chapter_id, topic)
  WHERE topic_id IS NULL AND topic IS NOT NULL;

  GET DIAGNOSTICS v_rows_migrated = ROW_COUNT;
  table_name := 'user_topic_mastery';
  rows_migrated := v_rows_migrated;
  SELECT COUNT(*) INTO v_topics_after FROM topics;
  topics_created := v_topics_after - v_topics_before;
  RETURN NEXT;

  -- Reset counter
  v_topics_before := v_topics_after;

  -- Migrate arm_stats
  UPDATE arm_stats
  SET topic_id = find_or_create_topic(chapter_id, topic)
  WHERE topic_id IS NULL AND topic IS NOT NULL;

  GET DIAGNOSTICS v_rows_migrated = ROW_COUNT;
  table_name := 'arm_stats';
  rows_migrated := v_rows_migrated;
  SELECT COUNT(*) INTO v_topics_after FROM topics;
  topics_created := v_topics_after - v_topics_before;
  RETURN NEXT;

  -- Reset counter
  v_topics_before := v_topics_after;

  -- Migrate questions
  UPDATE questions
  SET topic_id = find_or_create_topic(chapter_id, topic)
  WHERE topic_id IS NULL AND topic IS NOT NULL;

  GET DIAGNOSTICS v_rows_migrated = ROW_COUNT;
  table_name := 'questions';
  rows_migrated := v_rows_migrated;
  SELECT COUNT(*) INTO v_topics_after FROM topics;
  topics_created := v_topics_after - v_topics_before;
  RETURN NEXT;

  -- Reset counter
  v_topics_before := v_topics_after;

  -- Migrate user_dimension_coverage
  UPDATE user_dimension_coverage
  SET topic_id = find_or_create_topic(chapter_id, topic)
  WHERE topic_id IS NULL AND topic IS NOT NULL;

  GET DIAGNOSTICS v_rows_migrated = ROW_COUNT;
  table_name := 'user_dimension_coverage';
  rows_migrated := v_rows_migrated;
  SELECT COUNT(*) INTO v_topics_after FROM topics;
  topics_created := v_topics_after - v_topics_before;
  RETURN NEXT;

  RETURN;
END;
$ LANGUAGE plpgsql;

-- ============================================
-- STEP 5: Update dependent RPC functions
-- ============================================

-- Create topic_id version of get_least_tested_dimension
CREATE OR REPLACE FUNCTION get_least_tested_dimension_by_id(
  p_user_id UUID,
  p_chapter_id UUID,
  p_topic_id UUID,
  p_bloom_level INTEGER
)
RETURNS TEXT AS $
DECLARE
  v_least_tested_dimension TEXT;
BEGIN
  SELECT dimension
  INTO v_least_tested_dimension
  FROM user_dimension_coverage
  WHERE user_id = p_user_id
    AND chapter_id = p_chapter_id
    AND topic_id = p_topic_id
    AND bloom_level = p_bloom_level
  ORDER BY questions_attempted ASC, last_tested_at ASC NULLS FIRST
  LIMIT 1;

  -- If no data, return NULL (will default to 'core_understanding')
  RETURN v_least_tested_dimension;
END;
$ LANGUAGE plpgsql STABLE;

-- ============================================
-- NOTES FOR MANUAL MIGRATION
-- ============================================

-- After running this migration:
--
-- 1. Run the migration function:
--    SELECT * FROM migrate_text_topics_to_ids();
--
-- 2. Verify all topic_id columns are populated:
--    SELECT COUNT(*) FROM user_topic_mastery WHERE topic_id IS NULL;
--    SELECT COUNT(*) FROM arm_stats WHERE topic_id IS NULL;
--    SELECT COUNT(*) FROM questions WHERE topic_id IS NULL;
--    SELECT COUNT(*) FROM user_dimension_coverage WHERE topic_id IS NULL;
--
-- 3. After verification and code deployment, drop TEXT columns:
--    ALTER TABLE user_topic_mastery DROP COLUMN topic;
--    ALTER TABLE arm_stats DROP COLUMN topic;
--    ALTER TABLE questions DROP COLUMN topic;
--    ALTER TABLE user_dimension_coverage DROP COLUMN topic;
--
-- 4. Make topic_id NOT NULL:
--    ALTER TABLE user_topic_mastery ALTER COLUMN topic_id SET NOT NULL;
--    ALTER TABLE arm_stats ALTER COLUMN topic_id SET NOT NULL;
--    ALTER TABLE user_dimension_coverage ALTER COLUMN topic_id SET NOT NULL;
