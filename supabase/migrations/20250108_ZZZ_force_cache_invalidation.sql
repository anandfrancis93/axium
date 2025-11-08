-- ========================================
-- FORCE CACHE INVALIDATION
-- ========================================
-- Drop and recreate function to force Supabase pooler to invalidate cache
-- Named with ZZZ_ prefix to ensure it runs absolutely last

DROP FUNCTION IF EXISTS get_available_arms(UUID, UUID);

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
    -- FILTER: Exclude objectives (depth = 1) only
    -- INCLUDE: Domains (depth 0), topics (depth 2), subtopics (depth 3+)
    SELECT
      t.id as topic_id,
      t.name as topic,
      COALESCE(t.full_name, t.name) as topic_full_name,
      unnest(t.available_bloom_levels) as bloom_level
    FROM topics t
    WHERE t.chapter_id = p_chapter_id
      AND t.depth != 1  -- Exclude objectives only (## in markdown)
  ),
  user_mastery_data AS (
    -- Get user's mastery for each (topic_id, bloom_level) pair
    SELECT
      utm.topic_id,
      utm.bloom_level,
      utm.mastery_score,
      utm.questions_correct,
      utm.questions_attempted
    FROM user_topic_mastery utm
    WHERE utm.user_id = p_user_id
      AND utm.chapter_id = p_chapter_id
  )
  SELECT
    tbc.topic_id,
    tbc.topic,
    tbc.topic_full_name,
    tbc.bloom_level,
    COALESCE(umd.mastery_score, 0.0) as mastery_score,
    CASE
      -- Bloom Level 1 is ALWAYS unlocked for all topics
      WHEN tbc.bloom_level = 1 THEN true

      -- Higher Bloom levels unlock when PREVIOUS level for THIS TOPIC meets threshold
      -- Threshold: 80% mastery AND at least 3 correct answers
      WHEN tbc.bloom_level > 1 THEN EXISTS (
        SELECT 1
        FROM user_topic_mastery utm_prev
        WHERE utm_prev.user_id = p_user_id
          AND utm_prev.topic_id = tbc.topic_id  -- Same topic
          AND utm_prev.bloom_level = (tbc.bloom_level - 1)  -- Previous Bloom level
          AND utm_prev.questions_correct >= 3
          AND utm_prev.mastery_score >= 80.0
      )

      ELSE false
    END as is_unlocked
  FROM topic_bloom_combinations tbc
  LEFT JOIN user_mastery_data umd
    ON umd.topic_id = tbc.topic_id
    AND umd.bloom_level = tbc.bloom_level
  ORDER BY tbc.topic, tbc.bloom_level;
END;
$$ LANGUAGE plpgsql STABLE;  -- Added STABLE hint

COMMENT ON FUNCTION get_available_arms IS 'Get available (topic, bloom_level) arms for Thompson Sampling. Per-topic Bloom progression: each topic unlocks higher Bloom levels independently based on mastery of that specific topic. Updated to force cache invalidation.';

-- Verify
DO $$
BEGIN
  RAISE NOTICE 'Function recreated with STABLE hint to force cache invalidation';
END $$;
