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
    total_attempts,
    correct_attempts,
    confidence_weighted_score,
    last_practiced_at,
    current_streak,  -- NEW
    created_at,
    updated_at
  )
  VALUES (
    p_user_id,
    p_topic_id,
    p_bloom_level,
    p_chapter_id,
    v_new_mastery,
    1,
    CASE WHEN p_is_correct THEN 1 ELSE 0 END,
    p_confidence * p_weight,
    NOW(),
    COALESCE(p_new_streak, 0),  -- NEW: Use provided streak or 0
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id, topic_id, bloom_level, chapter_id)
  DO UPDATE SET
    mastery_score = v_new_mastery,
    total_attempts = user_topic_mastery.total_attempts + 1,
    correct_attempts = user_topic_mastery.correct_attempts + CASE WHEN p_is_correct THEN 1 ELSE 0 END,
    confidence_weighted_score = (
      (user_topic_mastery.confidence_weighted_score * user_topic_mastery.total_attempts) +
      (p_confidence * p_weight)
    ) / (user_topic_mastery.total_attempts + 1),
    last_practiced_at = NOW(),
    current_streak = COALESCE(p_new_streak, user_topic_mastery.current_streak),  -- NEW: Update if provided
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON FUNCTION update_topic_mastery_by_id IS 'Updates user topic mastery using topic_id. Now includes optional streak parameter.';
