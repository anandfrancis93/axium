-- ========================================
-- RETURN DIAGNOSTIC INFO AS FIRST ROW
-- ========================================

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
DECLARE
  v_topic_count INT;
  v_depth_0_count INT;
  v_depth_1_count INT;
  v_depth_2_plus_count INT;
BEGIN
  -- Count topics to diagnose the issue
  SELECT COUNT(*) INTO v_topic_count FROM topics WHERE chapter_id = p_chapter_id;
  SELECT COUNT(*) INTO v_depth_0_count FROM topics WHERE chapter_id = p_chapter_id AND depth = 0;
  SELECT COUNT(*) INTO v_depth_1_count FROM topics WHERE chapter_id = p_chapter_id AND depth = 1;
  SELECT COUNT(*) INTO v_depth_2_plus_count FROM topics WHERE chapter_id = p_chapter_id AND depth >= 2;

  -- Return diagnostic info as FIRST ROW (will be filtered out by TypeScript)
  RETURN QUERY
  SELECT
    '00000000-0000-0000-0000-000000000000'::UUID as topic_id,
    format('DIAGNOSTIC: Total=%s D0=%s D1=%s D2+=%s', v_topic_count, v_depth_0_count, v_depth_1_count, v_depth_2_plus_count) as topic,
    'DIAGNOSTIC ROW' as topic_full_name,
    -1 as bloom_level,
    0.0::DECIMAL as mastery_score,
    false as is_unlocked;

  -- Now return actual data
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
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_unlocked_topic_arms IS 'Returns diagnostic row as first result';
