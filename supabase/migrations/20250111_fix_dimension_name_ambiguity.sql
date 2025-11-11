-- Fix ambiguous column reference in get_topic_dimension_matrix
-- Uses subquery instead of CTE to avoid ambiguous column name

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
  mastery_level TEXT,
  last_tested_at TIMESTAMP WITH TIME ZONE,
  topic_id UUID
) AS $$
DECLARE
  v_subject_id UUID;
  v_all_dimensions TEXT[];
  v_topic_id UUID;
BEGIN
  -- Get topic_id
  SELECT id INTO v_topic_id
  FROM topics
  WHERE chapter_id = p_chapter_id
    AND name = p_topic
  LIMIT 1;

  -- Get subject_id
  SELECT subject_id INTO v_subject_id
  FROM chapters
  WHERE id = p_chapter_id;

  -- Get all dimensions for this subject
  SELECT ARRAY_AGG(dimension_key ORDER BY display_order)
  INTO v_all_dimensions
  FROM subject_dimension_config
  WHERE subject_id = v_subject_id
    AND is_active = true;

  -- Fallback to NEW 7 dimensions if no dimensions configured
  IF v_all_dimensions IS NULL OR ARRAY_LENGTH(v_all_dimensions, 1) IS NULL THEN
    v_all_dimensions := ARRAY[
      'definition',
      'example',
      'comparison',
      'implementation',
      'scenario',
      'troubleshooting',
      'pitfalls'
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
    matrix.bl::INT,
    matrix.dim::TEXT,
    COALESCE(
      (SELECT sdc.dimension_name FROM subject_dimension_config sdc WHERE sdc.dimension_key = matrix.dim AND sdc.subject_id = v_subject_id LIMIT 1),
      CASE matrix.dim
        WHEN 'definition' THEN 'Definition'
        WHEN 'example' THEN 'Example'
        WHEN 'comparison' THEN 'Comparison'
        WHEN 'scenario' THEN 'Scenario'
        WHEN 'implementation' THEN 'Implementation'
        WHEN 'troubleshooting' THEN 'Troubleshooting'
        WHEN 'pitfalls' THEN 'Common Pitfalls'
        ELSE matrix.dim
      END
    )::TEXT,
    COALESCE(udc.times_tested, 0)::INT,
    COALESCE(ARRAY_LENGTH(udc.unique_questions_answered, 1), 0)::INT,
    COALESCE(udc.total_attempts, 0)::INT,
    COALESCE(udc.average_score, 0)::DECIMAL,
    CASE
      WHEN udc.times_tested IS NULL OR udc.times_tested = 0 THEN 'not_tested'
      WHEN udc.average_score >= 80 THEN 'mastered'
      WHEN udc.average_score >= 60 THEN 'proficient'
      WHEN udc.average_score >= 40 THEN 'developing'
      ELSE 'struggling'
    END::TEXT,
    CASE
      WHEN COALESCE(ARRAY_LENGTH(udc.unique_questions_answered, 1), 0) >= 5 AND udc.average_score >= 80 THEN 'deep'
      ELSE 'none'
    END::TEXT,
    udc.last_tested_at,
    v_topic_id
  FROM matrix
  LEFT JOIN user_dimension_coverage udc
    ON udc.user_id = p_user_id
    AND udc.chapter_id = p_chapter_id
    AND udc.topic_id = v_topic_id
    AND udc.bloom_level = matrix.bl
    AND udc.dimension = matrix.dim
  ORDER BY matrix.bl, matrix.dim;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_topic_dimension_matrix IS 'Returns full (Bloom × Dimension) matrix for a topic with all 7 dimensions including pitfalls';
