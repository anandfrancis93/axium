-- Make knowledge dimensions configurable per subject/domain
-- This allows different subjects to have custom dimension sets

-- Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS get_subject_dimensions(UUID);
DROP FUNCTION IF EXISTS get_least_tested_dimension(UUID, UUID, TEXT, INT);

CREATE TABLE IF NOT EXISTS subject_dimension_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,

  -- Dimension configuration
  dimension_key TEXT NOT NULL,
  dimension_name TEXT NOT NULL,
  dimension_description TEXT NOT NULL,

  -- Ordering and grouping
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(subject_id, dimension_key)
);

CREATE INDEX IF NOT EXISTS idx_subject_dimension_config_subject
  ON subject_dimension_config(subject_id, display_order);

-- Helper function to get active dimensions for a subject
CREATE OR REPLACE FUNCTION get_subject_dimensions(p_subject_id UUID)
RETURNS TABLE (
  dimension_key TEXT,
  dimension_name TEXT,
  dimension_description TEXT
) AS $$
BEGIN
  -- Check if subject has custom dimensions
  IF EXISTS (SELECT 1 FROM subject_dimension_config WHERE subject_id = p_subject_id AND is_active = true) THEN
    -- Return custom dimensions
    RETURN QUERY
    SELECT sdc.dimension_key, sdc.dimension_name, sdc.dimension_description
    FROM subject_dimension_config sdc
    WHERE sdc.subject_id = p_subject_id
      AND sdc.is_active = true
    ORDER BY sdc.display_order;
  ELSE
    -- Return default security dimensions
    RETURN QUERY
    SELECT * FROM (VALUES
      ('core_understanding', 'Core Understanding', 'Core definitions, terminology, fundamental concepts, and basic relationships'),
      ('measuring_evaluating', 'Measuring & Evaluating', 'Metrics, quantification methods, assessment techniques, and measurement approaches'),
      ('controls', 'Controls', 'Administrative controls, physical controls, technical controls, and security mechanisms'),
      ('architecture_design', 'Architecture & Design', 'System architecture, design patterns, implementation approaches, and structural decisions'),
      ('threats_failures', 'Threats & Failures', 'Attack vectors, threat actors, failure modes, vulnerabilities, and security risks'),
      ('validation_assurance', 'Validation & Assurance', 'Testing methods, audit techniques, verification approaches, and quality assurance'),
      ('legal_compliance', 'Legal & Compliance', 'Standards (ISO, NIST, PCI DSS, etc.), regulations (GDPR, HIPAA), and compliance frameworks'),
      ('incident_response', 'Incident Response', 'Response procedures, remediation steps, investigation techniques, and recovery processes'),
      ('advanced_concepts', 'Advanced Concepts', 'Cutting-edge topics, emerging technologies, research areas, and sophisticated techniques'),
      ('misconceptions', 'Misconceptions', 'Common misunderstandings, incorrect assumptions, and typical pitfalls to avoid'),
      ('practical_scenarios', 'Practical Scenarios', 'Real-world application, hands-on problems, situational challenges, and case studies'),
      ('strategic_policy', 'Strategic & Policy', 'Business decisions, governance structures, organizational policies, and strategic planning')
    ) AS defaults(dimension_key, dimension_name, dimension_description);
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- Initialize default dimensions for existing Security+ subject
-- First, get the subject_id for "CompTIA Security+ SY0-701"
DO $$
DECLARE
  v_subject_id UUID;
BEGIN
  -- Try to find the Security+ subject
  SELECT id INTO v_subject_id
  FROM subjects
  WHERE name ILIKE '%Security+%' OR name ILIKE '%SY0-701%'
  LIMIT 1;

  -- If found, insert default dimensions
  IF v_subject_id IS NOT NULL THEN
    INSERT INTO subject_dimension_config (subject_id, dimension_key, dimension_name, dimension_description, display_order)
    VALUES
      (v_subject_id, 'core_understanding', 'Core Understanding', 'Core definitions, terminology, fundamental concepts, and basic relationships', 1),
      (v_subject_id, 'measuring_evaluating', 'Measuring & Evaluating', 'Metrics, quantification methods, assessment techniques, and measurement approaches', 2),
      (v_subject_id, 'controls', 'Controls', 'Administrative controls, physical controls, technical controls, and security mechanisms', 3),
      (v_subject_id, 'architecture_design', 'Architecture & Design', 'System architecture, design patterns, implementation approaches, and structural decisions', 4),
      (v_subject_id, 'threats_failures', 'Threats & Failures', 'Attack vectors, threat actors, failure modes, vulnerabilities, and security risks', 5),
      (v_subject_id, 'validation_assurance', 'Validation & Assurance', 'Testing methods, audit techniques, verification approaches, and quality assurance', 6),
      (v_subject_id, 'legal_compliance', 'Legal & Compliance', 'Standards (ISO, NIST, PCI DSS, etc.), regulations (GDPR, HIPAA), and compliance frameworks', 7),
      (v_subject_id, 'incident_response', 'Incident Response', 'Response procedures, remediation steps, investigation techniques, and recovery processes', 8),
      (v_subject_id, 'advanced_concepts', 'Advanced Concepts', 'Cutting-edge topics, emerging technologies, research areas, and sophisticated techniques', 9),
      (v_subject_id, 'misconceptions', 'Misconceptions', 'Common misunderstandings, incorrect assumptions, and typical pitfalls to avoid', 10),
      (v_subject_id, 'practical_scenarios', 'Practical Scenarios', 'Real-world application, hands-on problems, situational challenges, and case studies', 11),
      (v_subject_id, 'strategic_policy', 'Strategic & Policy', 'Business decisions, governance structures, organizational policies, and strategic planning', 12)
    ON CONFLICT (subject_id, dimension_key) DO NOTHING;

    -- Initialized 12 default dimensions for Security+ subject
    NULL;
  ELSE
    -- Security+ subject not found. Dimensions can be configured later per subject.
    NULL;
  END IF;
END $$;

-- Update get_least_tested_dimension to use subject dimensions
CREATE OR REPLACE FUNCTION get_least_tested_dimension(
  p_user_id UUID,
  p_chapter_id UUID,
  p_topic TEXT,
  p_bloom_level INT
)
RETURNS TEXT AS $$
DECLARE
  v_dimension TEXT;
  v_subject_id UUID;
  v_all_dimensions TEXT[];
  v_existing_dimensions TEXT[];
  v_untested_dimension TEXT;
BEGIN
  -- Get subject_id from chapter
  SELECT subject_id INTO v_subject_id
  FROM chapters
  WHERE id = p_chapter_id;

  -- Get all active dimensions for this subject
  SELECT ARRAY_AGG(dimension_key ORDER BY dimension_key)
  INTO v_all_dimensions
  FROM get_subject_dimensions(v_subject_id);

  -- Fallback to default if no dimensions configured
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
    RETURN v_all_dimensions[1 + floor(random() * ARRAY_LENGTH(v_all_dimensions, 1))::int];
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

-- RLS Policies
ALTER TABLE subject_dimension_config ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Anyone can view subject dimensions" ON subject_dimension_config;

CREATE POLICY "Anyone can view subject dimensions"
  ON subject_dimension_config FOR SELECT
  USING (true);

-- Note: INSERT/UPDATE/DELETE are restricted to service role by default
-- No additional policy needed - only backend API with service role can modify dimensions

COMMENT ON TABLE subject_dimension_config IS 'Configurable knowledge dimensions per subject for comprehensive mastery tracking';

-- Migration complete:
-- Subject-specific dimension configuration system created
-- Each subject can now have custom knowledge dimensions
-- Default: 12 security dimensions for CompTIA Security+
