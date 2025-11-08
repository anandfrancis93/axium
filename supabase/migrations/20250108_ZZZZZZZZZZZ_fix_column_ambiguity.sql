-- ========================================
-- Thompson Sampling: Get Available Arms
-- ========================================
-- Returns unlocked (topic, bloom_level) arms for Thompson Sampling algorithm
--
-- Key features:
-- 1. Includes domains (depth 0), topics (depth 2+), excludes objectives (depth 1)
-- 2. Per-topic Bloom progression (each topic unlocks independently)
-- 3. Returns ONLY unlocked arms (server-side filter to stay under PostgREST 1000 row limit)
-- 4. Bloom 1 always unlocked; higher levels require 80% mastery + 3 correct on previous level
--
-- Expected results:
-- - ~809 topics at Bloom 1 (all unlocked)
-- - Fewer at higher levels (requires mastery)

DROP FUNCTION IF EXISTS get_unlocked_topic_arms(UUID, UUID);

CREATE OR REPLACE FUNCTION get_unlocked_topic_arms(
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
    SELECT
      t.id as topic_id,
      t.name as topic,
      COALESCE(t.full_name, t.name) as topic_full_name,
      unnest(t.available_bloom_levels) as bloom_level
    FROM topics t
    WHERE t.chapter_id = p_chapter_id
      AND t.depth != 1
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
  ),
  unlocked_arms AS (
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
      END as arm_is_unlocked  -- Renamed to avoid conflict
    FROM topic_bloom_combinations tbc
    LEFT JOIN user_mastery_data umd
      ON umd.topic_id = tbc.topic_id
      AND umd.bloom_level = tbc.bloom_level
  )
  -- ONLY return unlocked arms to stay under 1000 row limit
  SELECT
    unlocked_arms.topic_id,
    unlocked_arms.topic,
    unlocked_arms.topic_full_name,
    unlocked_arms.bloom_level,
    unlocked_arms.mastery_score,
    unlocked_arms.arm_is_unlocked as is_unlocked  -- Map back to expected column name
  FROM unlocked_arms
  WHERE unlocked_arms.arm_is_unlocked = true
  ORDER BY unlocked_arms.topic, unlocked_arms.bloom_level;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_unlocked_topic_arms IS 'Get unlocked (topic, bloom_level) arms for Thompson Sampling. Filters server-side for PostgREST efficiency.';
