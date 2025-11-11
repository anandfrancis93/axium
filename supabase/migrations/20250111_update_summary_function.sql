-- Update get_topic_dimension_summary to work with updated matrix function

DROP FUNCTION IF EXISTS get_topic_dimension_summary(UUID, UUID, TEXT);

CREATE OR REPLACE FUNCTION get_topic_dimension_summary(
  p_user_id UUID,
  p_chapter_id UUID,
  p_topic TEXT
)
RETURNS TABLE (
  topic_id UUID,
  total_cells INT,
  tested_cells INT,
  cells_with_min_questions INT,
  mastered_cells INT,
  deep_mastery_cells INT,
  coverage_percentage DECIMAL,
  mastery_percentage DECIMAL,
  dimensions_per_bloom JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH matrix AS (
    SELECT * FROM get_topic_dimension_matrix(p_user_id, p_chapter_id, p_topic)
  )
  SELECT
    (SELECT topic_id FROM matrix LIMIT 1) as topic_id,
    COUNT(*)::INT as total_cells,
    COUNT(*) FILTER (WHERE unique_questions_count > 0)::INT as tested_cells,
    COUNT(*) FILTER (WHERE unique_questions_count >= 3)::INT as cells_with_min_questions,
    COUNT(*) FILTER (WHERE mastery_status = 'mastered')::INT as mastered_cells,
    COUNT(*) FILTER (WHERE mastery_level = 'deep')::INT as deep_mastery_cells,
    ROUND((COUNT(*) FILTER (WHERE unique_questions_count > 0)::DECIMAL / NULLIF(COUNT(*), 0) * 100), 1) as coverage_percentage,
    ROUND((COUNT(*) FILTER (WHERE mastery_status = 'mastered')::DECIMAL / NULLIF(COUNT(*), 0) * 100), 1) as mastery_percentage,
    (
      SELECT jsonb_object_agg(
        bloom_level::TEXT,
        jsonb_build_object(
          'tested', COUNT(*) FILTER (WHERE unique_questions_count > 0),
          'mastered', COUNT(*) FILTER (WHERE mastery_status = 'mastered'),
          'deep', COUNT(*) FILTER (WHERE mastery_level = 'deep'),
          'total', COUNT(*)
        )
      )
      FROM matrix
      GROUP BY bloom_level
    ) as dimensions_per_bloom
  FROM matrix;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_topic_dimension_summary IS 'Returns summary statistics for topic dimension coverage with all 7 dimensions including pitfalls';
