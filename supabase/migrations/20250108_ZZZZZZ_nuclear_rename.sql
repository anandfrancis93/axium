-- ========================================
-- NUCLEAR OPTION: Completely new function name
-- ========================================
-- Even with cache buster, still getting 167 arms
-- Create entirely new function name: get_unlocked_topic_arms

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
      AND t.depth != 1  -- Exclude objectives only (## in markdown)
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
      -- Bloom Level 1 is ALWAYS unlocked for all topics
      WHEN tbc.bloom_level = 1 THEN true

      -- Higher Bloom levels unlock when PREVIOUS level for THIS TOPIC meets threshold
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
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_unlocked_topic_arms IS 'Get available (topic, bloom_level) arms - NEW NAME to bypass all caching';

-- Test it immediately
DO $$
DECLARE
  arm_count INT;
BEGIN
  SELECT COUNT(*) INTO arm_count
  FROM get_unlocked_topic_arms(
    'c22146aa-9056-4d5d-975e-f99ad2a5b8e3'::uuid,
    '0517450a-61b2-4fa2-a425-5846b21ba4b0'::uuid
  )
  WHERE bloom_level = 1 AND is_unlocked = true;

  RAISE NOTICE 'Bloom 1 unlocked arms: %', arm_count;

  IF arm_count != 809 THEN
    RAISE EXCEPTION 'EXPECTED 809 arms, got %', arm_count;
  END IF;

  RAISE NOTICE 'SUCCESS! Function returns correct 809 arms';
END $$;
