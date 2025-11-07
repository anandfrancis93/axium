-- Update get_topic_dimension_matrix function to use new 6 dimensions
-- Replaces old 12 dimensions with: definition, example, comparison, scenario, implementation, troubleshooting

-- Drop existing function first (return type changed)
DROP FUNCTION IF EXISTS get_topic_dimension_matrix(UUID, UUID, TEXT);

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
  unique_questions_count INT,
  total_attempts INT,
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

  -- Return complete matrix (6 Bloom levels × 6 dimensions = 36 cells)
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
    COALESCE(ARRAY_LENGTH(udc.unique_questions_answered, 1), 0) as unique_questions_count,
    COALESCE(udc.total_attempts, 0) as total_attempts,
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

COMMENT ON FUNCTION get_topic_dimension_matrix IS 'Returns full (Bloom × Dimension) matrix for a topic showing comprehensive mastery coverage. Uses 6 dimensions: definition, example, comparison, scenario, implementation, troubleshooting';

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Updated get_topic_dimension_matrix to use new 6 dimensions';
  RAISE NOTICE 'Dimensions: definition, example, comparison, scenario, implementation, troubleshooting';
END $$;
