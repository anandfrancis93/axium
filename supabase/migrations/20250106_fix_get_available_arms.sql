-- Fix get_available_arms to use topics table instead of chapter_topics
-- This ensures topic names match between Thompson Sampling selection and question generation

CREATE OR REPLACE FUNCTION get_available_arms(
  p_user_id UUID,
  p_chapter_id UUID
)
RETURNS TABLE (
  topic TEXT,
  bloom_level INT,
  mastery_score DECIMAL,
  is_unlocked BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH topic_bloom_combinations AS (
    -- Get all (topic, bloom_level) combinations from topics table
    SELECT
      t.name as topic,
      unnest(t.available_bloom_levels) as bloom_level
    FROM topics t
    WHERE t.chapter_id = p_chapter_id
  ),
  user_mastery AS (
    -- Get user's current mastery (from user_topic_mastery or user_progress)
    -- First try user_topic_mastery, fallback to user_progress
    SELECT
      t.name as topic,
      1 as bloom_level,  -- For now, assume bloom level 1
      COALESCE(
        (SELECT mastery_score FROM user_topic_mastery utm
         WHERE utm.user_id = p_user_id
         AND utm.chapter_id = p_chapter_id
         AND utm.topic = t.name
         LIMIT 1),
        0.0
      ) as mastery_score,
      COALESCE(
        (SELECT questions_correct FROM user_topic_mastery utm
         WHERE utm.user_id = p_user_id
         AND utm.chapter_id = p_chapter_id
         AND utm.topic = t.name
         LIMIT 1),
        0
      ) as questions_correct
    FROM topics t
    WHERE t.chapter_id = p_chapter_id
  )
  SELECT
    tbc.topic,
    tbc.bloom_level,
    COALESCE(um.mastery_score, 0.0) as mastery_score,
    CASE
      -- Bloom Level 1 is always unlocked
      WHEN tbc.bloom_level = 1 THEN true
      -- Higher levels require prerequisite mastery
      ELSE EXISTS (
        SELECT 1
        FROM user_mastery um_prereq
        WHERE um_prereq.topic = tbc.topic
          AND um_prereq.mastery_score >= 80
          AND um_prereq.questions_correct >= 3
      )
    END as is_unlocked
  FROM topic_bloom_combinations tbc
  LEFT JOIN user_mastery um
    ON um.topic = tbc.topic;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_available_arms IS 'Get available (topic, bloom_level) arms for Thompson Sampling, sourced from topics table';
