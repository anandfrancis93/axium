-- Update CHECK constraints to allow new 6 dimensions
-- New system: definition, example, comparison, scenario, implementation, troubleshooting
-- Replaces old 12-dimension system while maintaining backward compatibility

-- Drop old constraint on questions table
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_dimension_check;

-- Add new constraint allowing both old (12) and new (6) dimensions for transition period
ALTER TABLE questions
ADD CONSTRAINT questions_dimension_check
CHECK (dimension IN (
  -- New 6 dimensions (primary system)
  'definition',
  'example',
  'comparison',
  'scenario',
  'implementation',
  'troubleshooting',

  -- Old 12 dimensions (backward compatibility)
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

-- Drop old constraint on user_dimension_coverage table
ALTER TABLE user_dimension_coverage DROP CONSTRAINT IF EXISTS user_dimension_coverage_dimension_check;

-- Add new constraint for user_dimension_coverage
ALTER TABLE user_dimension_coverage
ADD CONSTRAINT user_dimension_coverage_dimension_check
CHECK (dimension IN (
  -- New 6 dimensions (primary system)
  'definition',
  'example',
  'comparison',
  'scenario',
  'implementation',
  'troubleshooting',

  -- Old 12 dimensions (backward compatibility)
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

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Updated dimension CHECK constraints!';
  RAISE NOTICE 'Now accepting 6 new dimensions: definition, example, comparison, scenario, implementation, troubleshooting';
  RAISE NOTICE 'Maintaining backward compatibility with 12 old dimensions';
END $$;
