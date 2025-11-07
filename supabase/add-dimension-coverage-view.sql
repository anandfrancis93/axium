-- Create view for dimension coverage grid visualization
-- Shows full (Bloom × Dimension) matrix for each topic

CREATE OR REPLACE VIEW user_dimension_coverage_grid AS
SELECT
  udc.user_id,
  udc.chapter_id,
  udc.topic,
  udc.bloom_level,
  udc.dimension,
  udc.times_tested,
  udc.average_score,
  udc.last_tested_at,
  -- Add dimension metadata for display
  CASE udc.dimension
    WHEN 'definition' THEN 'Definition'
    WHEN 'example' THEN 'Example'
    WHEN 'comparison' THEN 'Comparison'
    WHEN 'scenario' THEN 'Scenario'
    WHEN 'implementation' THEN 'Implementation'
    WHEN 'troubleshooting' THEN 'Troubleshooting'
    ELSE udc.dimension
  END as dimension_display_name,
  -- Status flags
  CASE
    WHEN udc.times_tested = 0 THEN 'not_tested'
    WHEN udc.average_score >= 80 THEN 'mastered'
    WHEN udc.average_score >= 60 THEN 'proficient'
    WHEN udc.average_score >= 40 THEN 'developing'
    ELSE 'struggling'
  END as mastery_status
FROM user_dimension_coverage udc;

-- Function to get complete dimension coverage for a topic at all Bloom levels
CREATE OR REPLACE FUNCTION get_topic_dimension_matrix(
  p_user_id UUID,
  p_chapter_id UUID,
  p_topic TEXT
)
RETURNS TABLE (
  bloom_level INT,
  dimension TEXT,
  dimension_name TEXT,
  times_tested INT,
  average_score DECIMAL,
  mastery_status TEXT,
  last_tested_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  v_subject_id UUID;
  v_all_dimensions TEXT[];
BEGIN
  -- Get subject_id
  SELECT subject_id INTO v_subject_id
  FROM chapters
  WHERE id = p_chapter_id;

  -- Get all dimensions for this subject
  SELECT ARRAY_AGG(dimension_key ORDER BY dimension_key)
  INTO v_all_dimensions
  FROM get_subject_dimensions(v_subject_id);

  -- Fallback to NEW 6 dimensions if no dimensions configured
  IF v_all_dimensions IS NULL OR ARRAY_LENGTH(v_all_dimensions, 1) IS NULL THEN
    v_all_dimensions := ARRAY[
      'definition',
      'example',
      'comparison',
      'scenario',
      'implementation',
      'troubleshooting'
    ];
  END IF;

  -- Return complete matrix (6 Bloom levels × N dimensions)
  RETURN QUERY
  WITH bloom_levels AS (
    SELECT generate_series(1, 6) as bl
  ),
  dimensions AS (
    SELECT unnest(v_all_dimensions) as dim
  ),
  matrix AS (
    SELECT bl.bl, dim.dim
    FROM bloom_levels bl
    CROSS JOIN dimensions dim
  )
  SELECT
    matrix.bl as bloom_level,
    matrix.dim as dimension,
    CASE matrix.dim
      WHEN 'definition' THEN 'Definition'
      WHEN 'example' THEN 'Example'
      WHEN 'comparison' THEN 'Comparison'
      WHEN 'scenario' THEN 'Scenario'
      WHEN 'implementation' THEN 'Implementation'
      WHEN 'troubleshooting' THEN 'Troubleshooting'
      ELSE matrix.dim
    END as dimension_name,
    COALESCE(udc.times_tested, 0) as times_tested,
    COALESCE(udc.average_score, 0) as average_score,
    CASE
      WHEN udc.times_tested IS NULL OR udc.times_tested = 0 THEN 'not_tested'
      WHEN udc.average_score >= 80 THEN 'mastered'
      WHEN udc.average_score >= 60 THEN 'proficient'
      WHEN udc.average_score >= 40 THEN 'developing'
      ELSE 'struggling'
    END as mastery_status,
    udc.last_tested_at
  FROM matrix
  LEFT JOIN user_dimension_coverage udc
    ON udc.user_id = p_user_id
    AND udc.chapter_id = p_chapter_id
    AND udc.topic = p_topic
    AND udc.bloom_level = matrix.bl
    AND udc.dimension = matrix.dim
  ORDER BY matrix.bl, matrix.dim;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to get summary statistics for a topic
CREATE OR REPLACE FUNCTION get_topic_dimension_summary(
  p_user_id UUID,
  p_chapter_id UUID,
  p_topic TEXT
)
RETURNS TABLE (
  total_cells INT,
  tested_cells INT,
  mastered_cells INT,
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
    COUNT(*)::INT as total_cells,
    COUNT(*) FILTER (WHERE times_tested > 0)::INT as tested_cells,
    COUNT(*) FILTER (WHERE mastery_status = 'mastered')::INT as mastered_cells,
    ROUND((COUNT(*) FILTER (WHERE times_tested > 0)::DECIMAL / COUNT(*) * 100), 1) as coverage_percentage,
    ROUND((COUNT(*) FILTER (WHERE mastery_status = 'mastered')::DECIMAL / COUNT(*) * 100), 1) as mastery_percentage,
    (
      SELECT jsonb_object_agg(
        bloom_level::TEXT,
        jsonb_build_object(
          'tested', COUNT(*) FILTER (WHERE times_tested > 0),
          'mastered', COUNT(*) FILTER (WHERE mastery_status = 'mastered'),
          'total', COUNT(*)
        )
      )
      FROM matrix
      GROUP BY bloom_level
    ) as dimensions_per_bloom
  FROM matrix;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_topic_dimension_matrix IS 'Returns full (Bloom × Dimension) matrix for a topic showing comprehensive mastery coverage';
COMMENT ON FUNCTION get_topic_dimension_summary IS 'Returns summary statistics for topic dimension coverage';

-- Confirmation
DO $$
BEGIN
  RAISE NOTICE 'Dimension coverage grid view and functions created';
  RAISE NOTICE 'Use get_topic_dimension_matrix() to visualize full mastery matrix';
  RAISE NOTICE 'Use get_topic_dimension_summary() for summary statistics';
END $$;
