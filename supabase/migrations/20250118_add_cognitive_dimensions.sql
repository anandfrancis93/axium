-- =====================================================================
-- 5W1H Cognitive Dimensions Framework
-- =====================================================================
-- Adds support for tracking question diversity across 6 cognitive
-- dimensions to ensure comprehensive topic mastery before level unlock.
--
-- The 6 dimensions (5W1H):
-- 1. WHAT - Definition, identification, components
-- 2. WHY - Purpose, rationale, motivation
-- 3. WHEN - Context, timing, lifecycle
-- 4. WHERE - Location, scope, boundaries
-- 5. HOW - Mechanism, process, methodology
-- 6. CHARACTERISTICS - Properties, attributes, relationships
-- =====================================================================

-- Create ENUM for cognitive dimensions
CREATE TYPE cognitive_dimension AS ENUM (
  'WHAT',
  'WHY',
  'WHEN',
  'WHERE',
  'HOW',
  'CHARACTERISTICS'
);

-- Add cognitive_dimension to questions table
ALTER TABLE questions
ADD COLUMN cognitive_dimension cognitive_dimension,
ADD COLUMN dimension_metadata JSONB DEFAULT '{}'::jsonb;

-- Add index for dimension queries
CREATE INDEX idx_questions_cognitive_dimension ON questions(cognitive_dimension);
CREATE INDEX idx_questions_topic_bloom_dimension ON questions(topic_id, bloom_level, cognitive_dimension);

-- Update user_progress to track dimension coverage
-- Structure: { "1": ["WHAT", "WHY", "HOW"], "2": ["WHAT", "CHARACTERISTICS"] }
-- Keys are Bloom levels (1-6), values are arrays of covered dimensions
ALTER TABLE user_progress
ADD COLUMN dimension_coverage JSONB DEFAULT '{}'::jsonb;

-- Function to calculate dimension coverage for a topic/bloom level
CREATE OR REPLACE FUNCTION calculate_dimension_coverage(
  p_user_id UUID,
  p_topic_id UUID,
  p_bloom_level INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_coverage TEXT[];
BEGIN
  -- Get unique dimensions from correct answers at this Bloom level
  SELECT ARRAY_AGG(DISTINCT q.cognitive_dimension::TEXT)
  INTO v_coverage
  FROM user_responses ur
  JOIN questions q ON ur.question_id = q.id
  WHERE ur.user_id = p_user_id
    AND ur.topic_id = p_topic_id
    AND q.bloom_level = p_bloom_level
    AND ur.is_correct = true
    AND q.cognitive_dimension IS NOT NULL;

  RETURN jsonb_build_object(
    'covered_dimensions', COALESCE(v_coverage, ARRAY[]::TEXT[]),
    'coverage_count', COALESCE(array_length(v_coverage, 1), 0),
    'total_dimensions', 6,
    'coverage_percentage', ROUND((COALESCE(array_length(v_coverage, 1), 0)::NUMERIC / 6) * 100, 2)
  );
END;
$$;

-- Function to check if dimension coverage requirement is met
CREATE OR REPLACE FUNCTION check_dimension_coverage_requirement(
  p_user_id UUID,
  p_topic_id UUID,
  p_bloom_level INTEGER,
  p_required_dimensions INTEGER DEFAULT 4
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_coverage JSONB;
  v_coverage_count INTEGER;
BEGIN
  v_coverage := calculate_dimension_coverage(p_user_id, p_topic_id, p_bloom_level);
  v_coverage_count := (v_coverage->>'coverage_count')::INTEGER;

  RETURN v_coverage_count >= p_required_dimensions;
END;
$$;

-- Function to update user_progress dimension_coverage field
CREATE OR REPLACE FUNCTION update_dimension_coverage_cache(
  p_user_id UUID,
  p_topic_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_level INTEGER;
  v_coverage JSONB := '{}'::jsonb;
  v_level_coverage JSONB;
BEGIN
  -- Calculate coverage for each Bloom level (1-6)
  FOR v_level IN 1..6 LOOP
    v_level_coverage := calculate_dimension_coverage(p_user_id, p_topic_id, v_level);
    v_coverage := jsonb_set(
      v_coverage,
      ARRAY[v_level::TEXT],
      v_level_coverage->'covered_dimensions'
    );
  END LOOP;

  -- Update user_progress
  UPDATE user_progress
  SET dimension_coverage = v_coverage,
      updated_at = NOW()
  WHERE user_id = p_user_id AND topic_id = p_topic_id;
END;
$$;

-- Function to get uncovered dimensions for a Bloom level
CREATE OR REPLACE FUNCTION get_uncovered_dimensions(
  p_user_id UUID,
  p_topic_id UUID,
  p_bloom_level INTEGER
)
RETURNS TEXT[]
LANGUAGE plpgsql
AS $$
DECLARE
  v_all_dimensions TEXT[] := ARRAY['WHAT', 'WHY', 'WHEN', 'WHERE', 'HOW', 'CHARACTERISTICS'];
  v_covered JSONB;
  v_covered_array TEXT[];
  v_uncovered TEXT[];
BEGIN
  v_covered := calculate_dimension_coverage(p_user_id, p_topic_id, p_bloom_level);
  v_covered_array := ARRAY(SELECT jsonb_array_elements_text(v_covered->'covered_dimensions'));

  -- Return dimensions not in covered list
  SELECT ARRAY_AGG(dim)
  INTO v_uncovered
  FROM unnest(v_all_dimensions) AS dim
  WHERE dim != ALL(COALESCE(v_covered_array, ARRAY[]::TEXT[]));

  RETURN COALESCE(v_uncovered, v_all_dimensions);
END;
$$;

-- Trigger to update dimension coverage after answer submission
CREATE OR REPLACE FUNCTION trigger_update_dimension_coverage()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update dimension coverage cache asynchronously
  PERFORM update_dimension_coverage_cache(NEW.user_id, NEW.topic_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER after_user_response_insert
AFTER INSERT ON user_responses
FOR EACH ROW
EXECUTE FUNCTION trigger_update_dimension_coverage();

-- Enhanced progression check with dimension coverage
CREATE OR REPLACE FUNCTION check_bloom_level_unlock(
  p_user_id UUID,
  p_topic_id UUID,
  p_current_bloom_level INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_mastery_score INTEGER;
  v_attempts INTEGER;
  v_dimension_met BOOLEAN;
  v_min_attempts INTEGER := 5;
  v_required_dimensions INTEGER := 4;
BEGIN
  -- Get current level stats
  SELECT
    COALESCE((mastery_scores->>p_current_bloom_level::TEXT)::INTEGER, 0),
    total_attempts
  INTO v_mastery_score, v_attempts
  FROM user_progress
  WHERE user_id = p_user_id AND topic_id = p_topic_id;

  -- Check dimension coverage requirement
  v_dimension_met := check_dimension_coverage_requirement(
    p_user_id,
    p_topic_id,
    p_current_bloom_level,
    v_required_dimensions
  );

  -- Unlock if: 100% mastery + min attempts + dimension coverage
  RETURN (
    v_mastery_score >= 100 AND
    v_attempts >= v_min_attempts AND
    v_dimension_met
  );
END;
$$;

-- Add comments
COMMENT ON TYPE cognitive_dimension IS 'The 6 cognitive dimensions (5W1H) for comprehensive topic coverage';
COMMENT ON COLUMN questions.cognitive_dimension IS 'Which cognitive dimension this question tests (WHAT, WHY, WHEN, WHERE, HOW, CHARACTERISTICS)';
COMMENT ON COLUMN questions.dimension_metadata IS 'Additional metadata about how the question tests this dimension';
COMMENT ON COLUMN user_progress.dimension_coverage IS 'Cached dimension coverage by Bloom level: {"1": ["WHAT", "WHY"], "2": ["HOW"]}';

COMMENT ON FUNCTION calculate_dimension_coverage IS 'Calculates which cognitive dimensions have been covered for a topic at a specific Bloom level';
COMMENT ON FUNCTION check_dimension_coverage_requirement IS 'Checks if the minimum dimension coverage requirement is met (default: 4 of 6)';
COMMENT ON FUNCTION update_dimension_coverage_cache IS 'Updates the cached dimension_coverage field in user_progress for all Bloom levels';
COMMENT ON FUNCTION get_uncovered_dimensions IS 'Returns array of dimensions not yet covered at a Bloom level';
COMMENT ON FUNCTION check_bloom_level_unlock IS 'Enhanced unlock check: mastery + attempts + dimension coverage';
