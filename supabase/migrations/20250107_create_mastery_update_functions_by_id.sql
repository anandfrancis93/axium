-- Create RPC functions that use topic_id instead of topic name
-- These functions update mastery and arm stats for the RL system

-- Function: Update topic mastery using topic_id
CREATE OR REPLACE FUNCTION update_topic_mastery_by_id(
  p_user_id UUID,
  p_topic_id UUID,
  p_bloom_level INT,
  p_chapter_id UUID,
  p_is_correct BOOLEAN,
  p_confidence INT,
  p_learning_gain DECIMAL,
  p_weight DECIMAL DEFAULT 1.0
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

  v_current_mastery := COALESCE(v_current_mastery, 0.0);

  -- Calculate new mastery with weighted learning gain
  v_new_mastery := v_current_mastery + (p_learning_gain * p_weight);
  v_new_mastery := GREATEST(0, LEAST(100, v_new_mastery)); -- Clamp to 0-100

  -- Insert or update mastery record
  INSERT INTO user_topic_mastery (
    user_id,
    topic_id,
    bloom_level,
    chapter_id,
    mastery_score,
    questions_attempted,
    questions_correct,
    last_practiced_at
  ) VALUES (
    p_user_id,
    p_topic_id,
    p_bloom_level,
    p_chapter_id,
    v_new_mastery,
    1,
    CASE WHEN p_is_correct THEN 1 ELSE 0 END,
    NOW()
  )
  ON CONFLICT (user_id, topic_id, bloom_level, chapter_id)
  DO UPDATE SET
    mastery_score = v_new_mastery,
    questions_attempted = user_topic_mastery.questions_attempted + 1,
    questions_correct = user_topic_mastery.questions_correct + CASE WHEN p_is_correct THEN 1 ELSE 0 END,
    last_practiced_at = NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_topic_mastery_by_id IS 'Updates mastery score for a topic using topic_id. Uses exponential moving average with learning gain.';

-- Function: Update arm stats using topic_id
CREATE OR REPLACE FUNCTION update_arm_stats_by_id(
  p_user_id UUID,
  p_chapter_id UUID,
  p_topic_id UUID,
  p_bloom_level INT,
  p_reward DECIMAL
)
RETURNS VOID AS $$
DECLARE
  v_alpha DECIMAL;
  v_beta DECIMAL;
BEGIN
  -- Get current alpha and beta (default to 1.0 each for uniform prior)
  SELECT alpha, beta INTO v_alpha, v_beta
  FROM rl_arm_stats
  WHERE user_id = p_user_id
    AND chapter_id = p_chapter_id
    AND topic_id = p_topic_id
    AND bloom_level = p_bloom_level;

  v_alpha := COALESCE(v_alpha, 1.0);
  v_beta := COALESCE(v_beta, 1.0);

  -- Normalize reward to 0-1 range (assuming rewards are roughly -10 to +10)
  -- Use sigmoid-like transformation: (reward + 10) / 20
  DECLARE
    v_normalized_reward DECIMAL := GREATEST(0, LEAST(1, (p_reward + 10.0) / 20.0));
  BEGIN
    -- Update Beta distribution parameters
    -- Alpha increases with positive outcomes, Beta with negative outcomes
    INSERT INTO rl_arm_stats (
      user_id,
      chapter_id,
      topic_id,
      bloom_level,
      alpha,
      beta,
      times_selected,
      total_reward
    ) VALUES (
      p_user_id,
      p_chapter_id,
      p_topic_id,
      p_bloom_level,
      v_alpha + v_normalized_reward,
      v_beta + (1 - v_normalized_reward),
      1,
      p_reward
    )
    ON CONFLICT (user_id, chapter_id, topic_id, bloom_level)
    DO UPDATE SET
      alpha = rl_arm_stats.alpha + v_normalized_reward,
      beta = rl_arm_stats.beta + (1 - v_normalized_reward),
      times_selected = rl_arm_stats.times_selected + 1,
      total_reward = rl_arm_stats.total_reward + p_reward,
      last_selected_at = NOW();
  END;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_arm_stats_by_id IS 'Updates Thompson Sampling Beta distribution parameters for an arm using topic_id. Alpha increases with success, beta with failure.';

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Created mastery update functions using topic_id!';
  RAISE NOTICE 'Created: update_topic_mastery_by_id (updates user_topic_mastery table)';
  RAISE NOTICE 'Created: update_arm_stats_by_id (updates rl_arm_stats for Thompson Sampling)';
END $$;
