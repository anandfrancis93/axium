-- Fix get_topic_dimension_matrix function to use new dimension names

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

  -- Fallback to defaults if no dimensions configured (UPDATED KEYS)
  IF v_all_dimensions IS NULL OR ARRAY_LENGTH(v_all_dimensions, 1) IS NULL THEN
    v_all_dimensions := ARRAY[
      'core_understanding',
      'technical_methods',
      'risk_management',
      'security_controls',
      'tools_technologies',
      'architecture',
      'legal_compliance',
      'incident_response',
      'advanced_concepts',
      'misconceptions',
      'practical_scenarios',
      'strategic_policy'
    ];
  END IF;

  -- Return complete matrix with adaptive mastery calculation
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
    -- Use get_dimension_name function for consistent naming
    get_dimension_name(matrix.dim) as dimension_name,
    COALESCE(udc.times_tested, 0) as times_tested,
    COALESCE(ARRAY_LENGTH(udc.unique_questions_answered, 1), 0) as unique_questions_count,
    COALESCE(udc.total_attempts, 0) as total_attempts,
    COALESCE(udc.average_score, 0) as average_score,
    -- Adaptive mastery status based on unique questions
    CASE
      WHEN udc.unique_questions_answered IS NULL OR ARRAY_LENGTH(udc.unique_questions_answered, 1) IS NULL THEN 'not_tested'
      WHEN ARRAY_LENGTH(udc.unique_questions_answered, 1) < 3 THEN 'insufficient_data'
      WHEN udc.average_score >= 80 THEN 'mastered'
      WHEN udc.average_score >= 60 THEN 'proficient'
      WHEN udc.average_score >= 40 THEN 'developing'
      ELSE 'struggling'
    END as mastery_status,
    -- Mastery level indicator
    CASE
      WHEN udc.unique_questions_answered IS NULL OR ARRAY_LENGTH(udc.unique_questions_answered, 1) IS NULL THEN 'none'
      WHEN ARRAY_LENGTH(udc.unique_questions_answered, 1) >= 5 AND udc.average_score >= 80 THEN 'deep'
      WHEN ARRAY_LENGTH(udc.unique_questions_answered, 1) >= 3 AND udc.average_score >= 80 THEN 'initial'
      ELSE 'partial'
    END as mastery_level,
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

COMMENT ON FUNCTION get_topic_dimension_matrix IS 'Returns full (Bloom × Dimension) matrix with adaptive mastery calculation. Uses get_dimension_name() for consistent dimension naming.';

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'get_topic_dimension_matrix function updated!';
  RAISE NOTICE 'Now uses get_dimension_name() function for dimension display names';
  RAISE NOTICE '"Advanced Concepts" will now show as "Integration & Interoperability"';
END $$;
