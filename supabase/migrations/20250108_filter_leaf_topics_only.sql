-- Filter get_available_arms to only return leaf topics (depth >= 2)
-- This prevents questions from being generated for high-level objectives

CREATE OR REPLACE FUNCTION get_available_arms(
  p_user_id UUID,
  p_chapter_id UUID
)
RETURNS TABLE (
  topic_id UUID,
  topic TEXT,
  topic_full_name TEXT,
  bloom_level INT,
  mastery_score DECIMAL,
  is_unlocked BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH topic_bloom_combinations AS (
    -- Get all (topic, bloom_level) combinations from topics table
    -- FILTER: Only leaf topics (depth >= 2) - excludes high-level objectives
    SELECT
      t.id as topic_id,
      t.name as topic,
      COALESCE(t.full_name, t.name) as topic_full_name,
      unnest(t.available_bloom_levels) as bloom_level
    FROM topics t
    WHERE t.chapter_id = p_chapter_id
      AND t.depth >= 2  -- Only leaf topics (### or deeper in markdown)
  ),
  user_progress_data AS (
    -- Get user's progress for each topic
    SELECT
      up.topic_id,
      t.name as topic,
      up.current_bloom_level,
      up.total_attempts,
      up.correct_answers,
      CASE
        WHEN up.total_attempts > 0
        THEN ROUND((up.correct_answers::DECIMAL / up.total_attempts::DECIMAL) * 100, 1)
        ELSE 0.0
      END as mastery_score
    FROM user_progress up
    INNER JOIN topics t ON t.id = up.topic_id
    WHERE up.user_id = p_user_id
      AND t.chapter_id = p_chapter_id
  )
  SELECT
    tbc.topic_id,
    tbc.topic,
    tbc.topic_full_name,
    tbc.bloom_level,
    COALESCE(upd.mastery_score, 0.0) as mastery_score,
    CASE
      -- Bloom Level 1 is always unlocked
      WHEN tbc.bloom_level = 1 THEN true

      -- Higher levels require mastery of the previous level
      -- Mastery threshold: 80% accuracy AND at least 3 correct answers
      WHEN tbc.bloom_level > 1 THEN EXISTS (
        SELECT 1
        FROM user_progress up2
        INNER JOIN topics t2 ON t2.id = up2.topic_id
        WHERE up2.user_id = p_user_id
          AND t2.id = tbc.topic_id  -- Match by ID, not name
          AND up2.current_bloom_level >= (tbc.bloom_level - 1)
          AND up2.correct_answers >= 3
          AND (up2.correct_answers::DECIMAL / NULLIF(up2.total_attempts, 0)::DECIMAL) >= 0.80
      )

      ELSE false
    END as is_unlocked
  FROM topic_bloom_combinations tbc
  LEFT JOIN user_progress_data upd
    ON upd.topic_id = tbc.topic_id  -- Match by ID, not name
  ORDER BY tbc.topic, tbc.bloom_level;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_available_arms IS 'Get available (topic, bloom_level) arms for Thompson Sampling. Returns only leaf topics (depth >= 2) to prevent questions on high-level objectives.';
