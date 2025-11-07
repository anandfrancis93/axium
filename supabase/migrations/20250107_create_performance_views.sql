-- Create views for performance dashboard
-- These views aggregate mastery data for easy querying

-- View: Mastery heatmap showing mastery scores across all Bloom levels for each topic
CREATE OR REPLACE VIEW user_mastery_heatmap AS
SELECT
  utm.user_id,
  utm.chapter_id,
  t.name as topic,
  MAX(CASE WHEN utm.bloom_level = 1 THEN utm.mastery_score END) as bloom_1,
  MAX(CASE WHEN utm.bloom_level = 2 THEN utm.mastery_score END) as bloom_2,
  MAX(CASE WHEN utm.bloom_level = 3 THEN utm.mastery_score END) as bloom_3,
  MAX(CASE WHEN utm.bloom_level = 4 THEN utm.mastery_score END) as bloom_4,
  MAX(CASE WHEN utm.bloom_level = 5 THEN utm.mastery_score END) as bloom_5,
  MAX(CASE WHEN utm.bloom_level = 6 THEN utm.mastery_score END) as bloom_6,
  AVG(utm.mastery_score) as avg_mastery
FROM user_topic_mastery utm
INNER JOIN topics t ON t.id = utm.topic_id
GROUP BY utm.user_id, utm.chapter_id, t.name;

COMMENT ON VIEW user_mastery_heatmap IS 'Pivot table showing mastery scores for each topic across all Bloom levels';

-- View: User's learning progress summary for overall statistics
CREATE OR REPLACE VIEW user_progress_summary AS
SELECT
  utm.user_id,
  utm.chapter_id,
  COUNT(DISTINCT utm.topic_id) as topics_started,
  COUNT(*) FILTER (WHERE utm.mastery_score >= 80) as topics_mastered,
  AVG(utm.mastery_score) as overall_mastery,
  SUM(utm.questions_attempted) as total_questions_attempted,
  SUM(utm.questions_correct) as total_questions_correct,
  CASE
    WHEN SUM(utm.questions_attempted) > 0
    THEN (SUM(utm.questions_correct)::DECIMAL / SUM(utm.questions_attempted) * 100)
    ELSE 0
  END as overall_accuracy,
  MAX(utm.last_practiced_at) as last_activity
FROM user_topic_mastery utm
GROUP BY utm.user_id, utm.chapter_id;

COMMENT ON VIEW user_progress_summary IS 'Aggregate statistics for user progress in a chapter (topics started, mastered, accuracy, etc.)';

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Performance views created successfully!';
  RAISE NOTICE 'Created: user_mastery_heatmap (for heatmap visualization)';
  RAISE NOTICE 'Created: user_progress_summary (for overall statistics)';
END $$;
