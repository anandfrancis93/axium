-- Create chapter_topics table to store available topics for each chapter
-- This replaces the need to read from the questions table

CREATE TABLE IF NOT EXISTS chapter_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  bloom_level INT NOT NULL CHECK (bloom_level >= 1 AND bloom_level <= 6),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(chapter_id, topic, bloom_level)
);

CREATE INDEX IF NOT EXISTS idx_chapter_topics_chapter ON chapter_topics(chapter_id);
CREATE INDEX IF NOT EXISTS idx_chapter_topics_topic ON chapter_topics(topic);

COMMENT ON TABLE chapter_topics IS 'Available (topic, bloom_level) combinations for each chapter, extracted from knowledge chunks';

-- Update get_available_arms to read from chapter_topics instead of questions
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
    -- Get all (topic, bloom_level) combinations from chapter_topics
    SELECT
      ct.topic,
      ct.bloom_level
    FROM chapter_topics ct
    WHERE ct.chapter_id = p_chapter_id
  ),
  user_mastery AS (
    -- Get user's current mastery
    SELECT
      utm.topic,
      utm.bloom_level,
      utm.mastery_score,
      utm.questions_correct
    FROM user_topic_mastery utm
    WHERE utm.user_id = p_user_id
      AND utm.chapter_id = p_chapter_id
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
          AND um_prereq.bloom_level = tbc.bloom_level - 1
          AND um_prereq.mastery_score >= 80
          AND um_prereq.questions_correct >= 3
      )
    END as is_unlocked
  FROM topic_bloom_combinations tbc
  LEFT JOIN user_mastery um
    ON um.topic = tbc.topic
    AND um.bloom_level = tbc.bloom_level
  ORDER BY tbc.topic, tbc.bloom_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
