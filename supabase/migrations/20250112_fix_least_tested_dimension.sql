-- Fix get_least_tested_dimension_by_id to consider ALL dimensions, not just tested ones
-- Bug: Previous version only looked at existing rows in user_dimension_coverage
-- This meant untested dimensions were invisible and already-tested dimensions got selected again

CREATE OR REPLACE FUNCTION get_least_tested_dimension_by_id(
  p_user_id UUID,
  p_chapter_id UUID,
  p_topic_id UUID,
  p_bloom_level INTEGER
)
RETURNS TEXT AS $$
DECLARE
  v_least_tested_dimension TEXT;
  v_subject_id UUID;
BEGIN
  -- Get subject_id from chapter
  SELECT subject_id INTO v_subject_id
  FROM chapters
  WHERE id = p_chapter_id;

  -- Find least tested dimension across ALL subject dimensions
  -- LEFT JOIN ensures we see dimensions with 0 attempts (no row in user_dimension_coverage)
  SELECT sd.dimension_key
  INTO v_least_tested_dimension
  FROM subject_dimensions sd
  LEFT JOIN user_dimension_coverage udc ON
    udc.dimension = sd.dimension_key AND
    udc.user_id = p_user_id AND
    udc.topic_id = p_topic_id AND
    udc.bloom_level = p_bloom_level
  WHERE sd.subject_id = v_subject_id
  ORDER BY
    COALESCE(udc.questions_attempted, 0) ASC,  -- NULL (untested) = 0, prioritized first
    udc.last_tested_at ASC NULLS FIRST,        -- Among equal attempt counts, pick oldest
    sd.dimension_key ASC                       -- Tie-breaker for consistency
  LIMIT 1;

  -- Fallback to 'definition' if subject has no dimensions configured
  IF v_least_tested_dimension IS NULL THEN
    v_least_tested_dimension := 'definition';
  END IF;

  RETURN v_least_tested_dimension;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_least_tested_dimension_by_id IS
'Returns the knowledge dimension with the fewest attempts for a given topic × Bloom level.
Considers ALL subject dimensions, not just those already tested.
This ensures comprehensive coverage across all 7 knowledge dimensions.';
