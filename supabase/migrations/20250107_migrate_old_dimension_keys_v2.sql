-- Migrate old dimension keys to new keys in existing data (with constraint handling)

-- First, update the get_dimension_name function to handle BOTH old and new keys
CREATE OR REPLACE FUNCTION get_dimension_name(dim_key TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE dim_key
    -- New keys (primary)
    WHEN 'core_understanding' THEN 'Core Concepts'
    WHEN 'technical_methods' THEN 'Methods & Techniques'
    WHEN 'risk_management' THEN 'Risk & Threats'
    WHEN 'security_controls' THEN 'Security & Controls'
    WHEN 'tools_technologies' THEN 'Tools & Technologies'
    WHEN 'architecture' THEN 'Architecture & Design'
    WHEN 'legal_compliance' THEN 'Legal & Compliance'
    WHEN 'incident_response' THEN 'Incident Management'
    WHEN 'advanced_concepts' THEN 'Integration & Interoperability'
    WHEN 'misconceptions' THEN 'Common Pitfalls'
    WHEN 'practical_scenarios' THEN 'Real-World Scenarios'
    WHEN 'strategic_policy' THEN 'Strategic Planning'

    -- Old keys (backward compatibility) - map to same display names
    WHEN 'measuring_evaluating' THEN 'Methods & Techniques'
    WHEN 'controls' THEN 'Security & Controls'
    WHEN 'architecture_design' THEN 'Architecture & Design'
    WHEN 'threats_failures' THEN 'Risk & Threats'
    WHEN 'validation_assurance' THEN 'Tools & Technologies'

    ELSE dim_key
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION get_dimension_name IS 'Returns human-readable dimension names. Supports both old and new dimension keys for backward compatibility.';

-- Drop the old check constraint
ALTER TABLE user_dimension_coverage
DROP CONSTRAINT IF EXISTS user_dimension_coverage_dimension_check;

-- Migrate old dimension keys to new keys in user_dimension_coverage table
UPDATE user_dimension_coverage
SET dimension = CASE dimension
  WHEN 'measuring_evaluating' THEN 'technical_methods'
  WHEN 'controls' THEN 'security_controls'
  WHEN 'architecture_design' THEN 'architecture'
  WHEN 'threats_failures' THEN 'risk_management'
  WHEN 'validation_assurance' THEN 'tools_technologies'
  ELSE dimension
END
WHERE dimension IN ('measuring_evaluating', 'controls', 'architecture_design', 'threats_failures', 'validation_assurance');

-- Add new check constraint with updated dimension keys
ALTER TABLE user_dimension_coverage
ADD CONSTRAINT user_dimension_coverage_dimension_check
CHECK (dimension IN (
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
));

-- Migrate keys in questions table if it exists and has a dimension column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'questions' AND column_name = 'dimension'
  ) THEN
    -- Drop constraint if exists
    ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_dimension_check;

    -- Update data
    UPDATE questions
    SET dimension = CASE dimension
      WHEN 'measuring_evaluating' THEN 'technical_methods'
      WHEN 'controls' THEN 'security_controls'
      WHEN 'architecture_design' THEN 'architecture'
      WHEN 'threats_failures' THEN 'risk_management'
      WHEN 'validation_assurance' THEN 'tools_technologies'
      ELSE dimension
    END
    WHERE dimension IN ('measuring_evaluating', 'controls', 'architecture_design', 'threats_failures', 'validation_assurance');

    -- Add new constraint
    ALTER TABLE questions
    ADD CONSTRAINT questions_dimension_check
    CHECK (dimension IN (
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
    ));
  END IF;
END $$;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Old dimension keys migrated to new keys!';
  RAISE NOTICE 'Updated user_dimension_coverage table';
  RAISE NOTICE 'Updated check constraints to allow new dimension keys';
  RAISE NOTICE 'get_dimension_name() now supports both old and new keys for compatibility';
END $$;
