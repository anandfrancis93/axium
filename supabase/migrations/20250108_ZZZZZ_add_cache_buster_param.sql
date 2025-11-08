-- ========================================
-- ADD CACHE BUSTER PARAMETER
-- ========================================
-- Supabase PostgREST caches RPC responses aggressively
-- Add an optional cache_buster parameter to force fresh results

DROP FUNCTION IF EXISTS get_available_arms_v2(UUID, UUID);

CREATE OR REPLACE FUNCTION get_available_arms_v2(
  p_user_id UUID,
  p_chapter_id UUID,
  p_cache_buster BIGINT DEFAULT NULL  -- Cache buster parameter (ignored, just forces new cache key)
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
    SELECT
      t.id as topic_id,
      t.name as topic,
      COALESCE(t.full_name, t.name) as topic_full_name,
      unnest(t.available_bloom_levels) as bloom_level
    FROM topics t
    WHERE t.chapter_id = p_chapter_id
      AND t.depth != 1  -- Exclude objectives only
  ),
  user_mastery_data AS (
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
      WHEN tbc.bloom_level = 1 THEN true
      WHEN tbc.bloom_level > 1 THEN EXISTS (
        SELECT 1
        FROM user_topic_mastery utm_prev
        WHERE utm_prev.user_id = p_user_id
          AND utm_prev.topic_id = tbc.topic_id
          AND utm_prev.bloom_level = (tbc.bloom_level - 1)
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
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_available_arms_v2 IS 'Get available arms with optional cache buster parameter';
