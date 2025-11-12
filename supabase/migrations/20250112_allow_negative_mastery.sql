-- Allow negative mastery scores for topics where user is performing poorly
-- This provides more accurate representation of learning state

-- 1. Drop existing constraint that limits mastery_score to 0-100
ALTER TABLE user_topic_mastery
DROP CONSTRAINT IF EXISTS user_topic_mastery_mastery_score_check;

-- 2. Add new constraint allowing negative scores (down to -100 for symmetry)
ALTER TABLE user_topic_mastery
ADD CONSTRAINT user_topic_mastery_mastery_score_check
CHECK (mastery_score BETWEEN -100 AND 100);

-- 3. Update the mastery update function to allow negative values
-- Drop existing function
DROP FUNCTION IF EXISTS update_topic_mastery_by_id(p_user_id UUID, p_topic_id UUID, p_bloom_level INT, p_chapter_id UUID, p_is_correct BOOLEAN, p_confidence INT, p_learning_gain DECIMAL, p_weight DECIMAL, p_new_streak INT);

-- Create updated function without clamping at 0
CREATE OR REPLACE FUNCTION update_topic_mastery_by_id(
  p_user_id UUID,
  p_topic_id UUID,
  p_bloom_level INT,
  p_chapter_id UUID,
  p_is_correct BOOLEAN,
  p_confidence INT,
  p_learning_gain DECIMAL,
  p_weight DECIMAL DEFAULT 1.0,
  p_new_streak INT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_current_mastery DECIMAL;
  v_new_mastery DECIMAL;
BEGIN
  -- Get current mastery (or 0 if not exists)
  SELECT mastery_score INTO v_current_mastery
  FROM user_topic_mastery
  WHERE user_id = p_user_id
    AND topic_id = p_topic_id
    AND bloom_level = p_bloom_level
    AND chapter_id = p_chapter_id;

  -- Calculate new mastery score (allow negative, clamp only at -100 and 100)
  v_new_mastery := COALESCE(v_current_mastery, 0) + p_learning_gain;
  v_new_mastery := GREATEST(-100, LEAST(100, v_new_mastery));

  -- Upsert mastery record
  INSERT INTO user_topic_mastery (
    user_id,
    topic_id,
    bloom_level,
    chapter_id,
    mastery_score,
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
    v_new_mastery,
    1,
    CASE WHEN p_is_correct THEN 1 ELSE 0 END,
    NOW(),
    COALESCE(p_new_streak, 0)
  )
  ON CONFLICT (user_id, topic_id, bloom_level, chapter_id)
  DO UPDATE SET
    mastery_score = v_new_mastery,
    questions_attempted = user_topic_mastery.questions_attempted + 1,
    questions_correct = user_topic_mastery.questions_correct + CASE WHEN p_is_correct THEN 1 ELSE 0 END,
    last_practiced_at = NOW(),
    current_streak = COALESCE(p_new_streak, user_topic_mastery.current_streak)
;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_topic_mastery_by_id IS 'Updates user topic mastery using topic_id. Allows negative mastery scores down to -100.';
