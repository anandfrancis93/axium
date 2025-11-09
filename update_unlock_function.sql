-- Update get_unlocked_topic_arms function to remove questions_correct requirement
-- Only 80% mastery is needed to unlock next Bloom level

CREATE OR REPLACE FUNCTION get_unlocked_topic_arms(
  p_user_id UUID,
  p_chapter_id UUID
)
RETURNS TABLE (
  topic_id UUID,
  topic TEXT,
  topic_full_name TEXT,
  bloom_level INT,
  mastery_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH user_mastery_data AS (
    SELECT
      utm.topic_id,
      utm.bloom_level,
      utm.mastery_score
    FROM user_topic_mastery utm
    WHERE utm.user_id = p_user_id
  ),
  topic_bloom_combinations AS (
    SELECT
      t.id as topic_id,
      t.name as topic,
      t.full_name as topic_full_name,
      bl.bloom_level,
      t.chapter_id
    FROM topics t
    CROSS JOIN (
      SELECT 1 as bloom_level UNION ALL
      SELECT 2 UNION ALL
      SELECT 3 UNION ALL
      SELECT 4 UNION ALL
      SELECT 5 UNION ALL
      SELECT 6
    ) bl
    WHERE t.chapter_id = p_chapter_id
      AND t.depth IN (0, 2, 3, 4, 5, 6, 7, 8, 9, 10)
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
            AND utm_prev.mastery_score >= 80.0
        )
        ELSE false
      END as arm_is_unlocked
    FROM topic_bloom_combinations tbc
    LEFT JOIN user_mastery_data umd
      ON umd.topic_id = tbc.topic_id
      AND umd.bloom_level = tbc.bloom_level
  )
  SELECT
    unlocked_arms.topic_id,
    unlocked_arms.topic,
    unlocked_arms.topic_full_name,
    unlocked_arms.bloom_level,
    unlocked_arms.mastery_score
  FROM unlocked_arms
  WHERE unlocked_arms.arm_is_unlocked = true;
END;
$$ LANGUAGE plpgsql STABLE;
