-- Update update_topic_mastery_by_id function to include streak parameter
-- Replaces the function to add p_new_streak parameter

CREATE OR REPLACE FUNCTION update_topic_mastery_by_id(
  p_user_id UUID,
  p_topic_id UUID,
  p_bloom_level INT,
  p_chapter_id UUID,
  p_is_correct BOOLEAN,
  p_confidence INT,
  p_learning_gain DECIMAL,
  p_weight DECIMAL DEFAULT 1.0,
  p_new_streak INT DEFAULT NULL  -- NEW: Allow updating streak
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

  -- Calculate new mastery score
  v_new_mastery := COALESCE(v_current_mastery, 0) + p_learning_gain;
  v_new_mastery := GREATEST(0, LEAST(100, v_new_mastery));

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
    current_streak  -- NEW
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
    COALESCE(p_new_streak, 0)  -- NEW: Use provided streak or 0
  )
  ON CONFLICT (user_id, topic_id, bloom_level, chapter_id)
  DO UPDATE SET
    mastery_score = v_new_mastery,
    questions_attempted = user_topic_mastery.questions_attempted + 1,
    questions_correct = user_topic_mastery.questions_correct + CASE WHEN p_is_correct THEN 1 ELSE 0 END,
    last_practiced_at = NOW(),
    current_streak = COALESCE(p_new_streak, user_topic_mastery.current_streak)  -- NEW: Update if provided
;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON FUNCTION update_topic_mastery_by_id IS 'Updates user topic mastery using topic_id. Now includes optional streak parameter.';
