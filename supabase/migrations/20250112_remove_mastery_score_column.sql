-- Migration: Remove mastery_score column from user_topic_mastery
-- Date: 2025-01-12
-- Description: Remove progressive mastery tracking since we now use accuracy-based mastery
--
-- Background:
-- - Old system: Progressive mastery updated via learning_gain (mastery_score column)
-- - New system: Accuracy-based mastery = (high-confidence correct / high-confidence total) × 100%
-- - The mastery_score column is no longer updated or displayed anywhere
--
-- This migration:
-- 1. Backs up existing mastery_score data (just in case)
-- 2. Removes mastery_score column
-- 3. Updates RPC function to not use p_learning_gain parameter

BEGIN;

-- Step 1: Create backup table with mastery_score data (optional, for rollback safety)
CREATE TABLE IF NOT EXISTS user_topic_mastery_score_backup AS
SELECT
  id,
  user_id,
  topic_id,
  bloom_level,
  chapter_id,
  mastery_score,
  updated_at
FROM user_topic_mastery
WHERE mastery_score IS NOT NULL AND mastery_score != 0;

RAISE NOTICE 'Backed up % rows with non-zero mastery_score', (SELECT COUNT(*) FROM user_topic_mastery_score_backup);

-- Step 2: Drop the mastery_score column
ALTER TABLE user_topic_mastery
DROP COLUMN IF EXISTS mastery_score;

RAISE NOTICE 'Dropped mastery_score column from user_topic_mastery';

-- Step 3: Update RPC function to remove p_learning_gain parameter
DROP FUNCTION IF EXISTS update_topic_mastery_by_id(UUID, UUID, INT, UUID, BOOLEAN, INT, DECIMAL, DECIMAL, INT);

CREATE OR REPLACE FUNCTION update_topic_mastery_by_id(
  p_user_id UUID,
  p_topic_id UUID,
  p_bloom_level INT,
  p_chapter_id UUID,
  p_is_correct BOOLEAN,
  p_confidence INT,
  p_weight DECIMAL DEFAULT 1.0,
  p_new_streak INT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Upsert mastery record (just tracking attempts/correct/streak, no mastery_score)
  INSERT INTO user_topic_mastery (
    user_id,
    topic_id,
    bloom_level,
    chapter_id,
    questions_attempted,
    questions_correct,
    last_practiced_at,
    current_streak
  )
  VALUES (
    p_user_id,
    p_topic_id,
    p_bloom_level,
    p_chapter_id,
    1,
    CASE WHEN p_is_correct THEN 1 ELSE 0 END,
    NOW(),
    COALESCE(p_new_streak, 0)
  )
  ON CONFLICT (user_id, topic_id, bloom_level, chapter_id)
  DO UPDATE SET
    questions_attempted = user_topic_mastery.questions_attempted + 1,
    questions_correct = user_topic_mastery.questions_correct + CASE WHEN p_is_correct THEN 1 ELSE 0 END,
    last_practiced_at = NOW(),
    current_streak = COALESCE(p_new_streak, user_topic_mastery.current_streak)
;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_topic_mastery_by_id IS 'Updates user topic mastery tracking (attempts, correct, streak). No longer updates mastery_score.';

RAISE NOTICE 'Updated update_topic_mastery_by_id function - removed p_learning_gain parameter';

-- Step 4: Verify table structure
DO $$
DECLARE
  has_mastery_score BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'user_topic_mastery'
    AND column_name = 'mastery_score'
  ) INTO has_mastery_score;

  IF has_mastery_score THEN
    RAISE EXCEPTION 'Migration failed: mastery_score column still exists!';
  ELSE
    RAISE NOTICE '✓ Verified: mastery_score column successfully removed';
  END IF;
END $$;

COMMIT;
