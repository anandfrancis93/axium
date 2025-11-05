-- Add adaptive mastery tracking with unique question IDs

-- Add column to track unique question IDs answered
ALTER TABLE user_dimension_coverage
ADD COLUMN IF NOT EXISTS unique_questions_answered TEXT[] DEFAULT '{}';

-- Add column to track total attempts (including repeats)
ALTER TABLE user_dimension_coverage
ADD COLUMN IF NOT EXISTS total_attempts INT DEFAULT 0;

COMMENT ON COLUMN user_dimension_coverage.unique_questions_answered IS 'Array of unique question IDs answered for this dimension (excludes spaced repetition repeats)';
COMMENT ON COLUMN user_dimension_coverage.total_attempts IS 'Total number of attempts including spaced repetition repeats';

-- Update the get_topic_dimension_matrix function to use adaptive mastery
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

  -- Fallback to defaults if no dimensions configured
  IF v_all_dimensions IS NULL OR ARRAY_LENGTH(v_all_dimensions, 1) IS NULL THEN
    v_all_dimensions := ARRAY[
      'core_understanding',
      'measuring_evaluating',
      'controls',
      'architecture_design',
      'threats_failures',
      'validation_assurance',
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
    CASE matrix.dim
      WHEN 'core_understanding' THEN 'Core Understanding'
      WHEN 'measuring_evaluating' THEN 'Measuring & Evaluating'
      WHEN 'controls' THEN 'Controls'
      WHEN 'architecture_design' THEN 'Architecture & Design'
      WHEN 'threats_failures' THEN 'Threats & Failures'
      WHEN 'validation_assurance' THEN 'Validation & Assurance'
      WHEN 'legal_compliance' THEN 'Legal & Compliance'
      WHEN 'incident_response' THEN 'Incident Response'
      WHEN 'advanced_concepts' THEN 'Advanced Concepts'
      WHEN 'misconceptions' THEN 'Misconceptions'
      WHEN 'practical_scenarios' THEN 'Practical Scenarios'
      WHEN 'strategic_policy' THEN 'Strategic & Policy'
      ELSE matrix.dim
    END as dimension_name,
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

-- Update summary function to use adaptive mastery
DROP FUNCTION IF EXISTS get_topic_dimension_summary(UUID, UUID, TEXT);

CREATE OR REPLACE FUNCTION get_topic_dimension_summary(
  p_user_id UUID,
  p_chapter_id UUID,
  p_topic TEXT
)
RETURNS TABLE (
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
    COUNT(*)::INT as total_cells,
    COUNT(*) FILTER (WHERE unique_questions_count > 0)::INT as tested_cells,
    COUNT(*) FILTER (WHERE unique_questions_count >= 3)::INT as cells_with_min_questions,
    COUNT(*) FILTER (WHERE mastery_status = 'mastered')::INT as mastered_cells,
    COUNT(*) FILTER (WHERE mastery_level = 'deep')::INT as deep_mastery_cells,
    ROUND((COUNT(*) FILTER (WHERE unique_questions_count > 0)::DECIMAL / COUNT(*) * 100), 1) as coverage_percentage,
    ROUND((COUNT(*) FILTER (WHERE mastery_status = 'mastered')::DECIMAL / COUNT(*) * 100), 1) as mastery_percentage,
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

COMMENT ON FUNCTION get_topic_dimension_matrix IS 'Returns full (Bloom × Dimension) matrix with adaptive mastery calculation based on unique questions answered';
COMMENT ON FUNCTION get_topic_dimension_summary IS 'Returns summary statistics with adaptive mastery tracking';

-- Confirmation
DO $$
BEGIN
  RAISE NOTICE 'Adaptive mastery tracking implemented';
  RAISE NOTICE 'Mastery now requires 3+ unique questions at 80%+ average';
  RAISE NOTICE 'Deep mastery awarded for 5+ unique questions at 80%+';
  RAISE NOTICE 'Spaced repetition repeats do not inflate unique question count';
END $$;
