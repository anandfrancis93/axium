-- Track which knowledge dimensions have been tested for each (topic, bloom_level)
-- This ensures comprehensive mastery across all aspects of a topic

CREATE TABLE IF NOT EXISTS user_dimension_coverage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  bloom_level INT NOT NULL CHECK (bloom_level >= 1 AND bloom_level <= 6),

  -- Knowledge dimensions to test comprehensively
  dimension TEXT NOT NULL CHECK (dimension IN (
    'core_understanding',        -- Definitions, terminology, basic concepts
    'measuring_evaluating',      -- Metrics, quantification, assessment
    'controls',                  -- Administrative, physical, technical controls
    'architecture_design',       -- Patterns, design choices, system architecture
    'threats_failures',          -- Attack vectors, failure modes, vulnerabilities
    'validation_assurance',      -- Testing, auditing, verification methods
    'legal_compliance',          -- Standards, regulations, frameworks
    'incident_response',         -- Response procedures, remediation steps
    'advanced_concepts',         -- Cutting-edge topics, research areas
    'misconceptions',            -- Common misunderstandings and pitfalls
    'practical_scenarios',       -- Real-world application, hands-on problems
    'strategic_policy'           -- Business decisions, governance, policy
  )),

  -- Tracking
  times_tested INT DEFAULT 0,
  last_tested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  average_score DECIMAL(5,2) DEFAULT 0, -- 0-100

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, chapter_id, topic, bloom_level, dimension)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_dimension_coverage_user_chapter
  ON user_dimension_coverage(user_id, chapter_id);

CREATE INDEX IF NOT EXISTS idx_dimension_coverage_topic_bloom
  ON user_dimension_coverage(topic, bloom_level);

CREATE INDEX IF NOT EXISTS idx_dimension_coverage_least_tested
  ON user_dimension_coverage(user_id, chapter_id, topic, bloom_level, times_tested);

-- RLS policies
ALTER TABLE user_dimension_coverage ENABLE ROW LEVEL SECURITY;

-- Create policies with exception handling for existing policies
DO $$
BEGIN
  -- Try to drop existing policies (ignore errors if they don't exist)
  BEGIN
    DROP POLICY "Users can view their own dimension coverage" ON user_dimension_coverage;
  EXCEPTION WHEN undefined_object THEN
    NULL;
  END;

  BEGIN
    DROP POLICY "Users can insert their own dimension coverage" ON user_dimension_coverage;
  EXCEPTION WHEN undefined_object THEN
    NULL;
  END;

  BEGIN
    DROP POLICY "Users can update their own dimension coverage" ON user_dimension_coverage;
  EXCEPTION WHEN undefined_object THEN
    NULL;
  END;

  BEGIN
    DROP POLICY "Users can delete their own dimension coverage" ON user_dimension_coverage;
  EXCEPTION WHEN undefined_object THEN
    NULL;
  END;

  -- Now create the policies
  CREATE POLICY "Users can view their own dimension coverage"
    ON user_dimension_coverage FOR SELECT
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can insert their own dimension coverage"
    ON user_dimension_coverage FOR INSERT
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can update their own dimension coverage"
    ON user_dimension_coverage FOR UPDATE
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can delete their own dimension coverage"
    ON user_dimension_coverage FOR DELETE
    USING (auth.uid() = user_id);
END $$;

-- Add dimension field to questions table
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS dimension TEXT CHECK (dimension IN (
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
));

-- Index for filtering questions by dimension
CREATE INDEX IF NOT EXISTS idx_questions_dimension
  ON questions(dimension);

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_least_tested_dimension(UUID, UUID, TEXT, INT);

-- Helper function to get least-tested dimension for a (topic, bloom_level)
CREATE OR REPLACE FUNCTION get_least_tested_dimension(
  p_user_id UUID,
  p_chapter_id UUID,
  p_topic TEXT,
  p_bloom_level INT
)
RETURNS TEXT AS $$
DECLARE
  v_dimension TEXT;
  v_all_dimensions TEXT[] := ARRAY[
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
  v_existing_dimensions TEXT[];
  v_untested_dimension TEXT;
BEGIN
  -- Get dimensions that have already been tested
  SELECT ARRAY_AGG(dimension)
  INTO v_existing_dimensions
  FROM user_dimension_coverage
  WHERE user_id = p_user_id
    AND chapter_id = p_chapter_id
    AND topic = p_topic
    AND bloom_level = p_bloom_level;

  -- If no dimensions tested yet, randomly pick one to start
  IF v_existing_dimensions IS NULL OR ARRAY_LENGTH(v_existing_dimensions, 1) IS NULL THEN
    RETURN v_all_dimensions[1 + floor(random() * 12)::int];
  END IF;

  -- Find dimensions that haven't been tested
  SELECT d INTO v_untested_dimension
  FROM UNNEST(v_all_dimensions) AS d
  WHERE d NOT IN (SELECT UNNEST(v_existing_dimensions))
  LIMIT 1;

  -- If there are untested dimensions, return one
  IF v_untested_dimension IS NOT NULL THEN
    RETURN v_untested_dimension;
  END IF;

  -- All dimensions have been tested at least once
  -- Return the least-tested dimension
  SELECT dimension INTO v_dimension
  FROM user_dimension_coverage
  WHERE user_id = p_user_id
    AND chapter_id = p_chapter_id
    AND topic = p_topic
    AND bloom_level = p_bloom_level
  ORDER BY times_tested ASC, last_tested_at ASC
  LIMIT 1;

  RETURN v_dimension;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Migration complete:
-- Question dimension tracking system created
-- 12 dimensions: core_understanding, measuring_evaluating, controls, architecture_design, threats_failures, validation_assurance, legal_compliance, incident_response, advanced_concepts, misconceptions, practical_scenarios, strategic_policy
