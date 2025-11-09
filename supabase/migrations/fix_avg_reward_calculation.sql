-- Fix update_arm_stats_by_id to calculate avg_reward
-- Issue: avg_reward column was not being updated, always stayed at 0.0

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
      total_reward,
      avg_reward  -- Add avg_reward to INSERT
    ) VALUES (
      p_user_id,
      p_chapter_id,
      p_topic_id,
      p_bloom_level,
      v_alpha + v_normalized_reward,
      v_beta + (1 - v_normalized_reward),
      1,
      p_reward,
      p_reward  -- First selection: avg = total
    )
    ON CONFLICT (user_id, chapter_id, topic_id, bloom_level)
    DO UPDATE SET
      alpha = rl_arm_stats.alpha + v_normalized_reward,
      beta = rl_arm_stats.beta + (1 - v_normalized_reward),
      times_selected = rl_arm_stats.times_selected + 1,
      total_reward = rl_arm_stats.total_reward + p_reward,
      avg_reward = (rl_arm_stats.total_reward + p_reward) / (rl_arm_stats.times_selected + 1),  -- Calculate average
      last_selected_at = NOW();
  END;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_arm_stats_by_id IS 'Updates Thompson Sampling Beta distribution parameters for an arm using topic_id. Alpha increases with success, beta with failure. NOW INCLUDES avg_reward calculation.';

-- Also update any existing records to have correct avg_reward
UPDATE rl_arm_stats
SET avg_reward = CASE
  WHEN times_selected > 0 THEN total_reward / times_selected
  ELSE 0.0
END
WHERE avg_reward = 0.0 AND times_selected > 0;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Fixed update_arm_stats_by_id to calculate avg_reward!';
  RAISE NOTICE 'Updated existing records to have correct avg_reward values.';
END $$;
