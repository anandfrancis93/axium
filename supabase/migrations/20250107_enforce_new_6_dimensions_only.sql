-- Enforce ONLY new 6 dimensions - remove all backward compatibility
-- Clean break from old 12-dimension system

-- Drop and recreate constraint on questions table (6 dimensions only)
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_dimension_check;

ALTER TABLE questions
ADD CONSTRAINT questions_dimension_check
CHECK (dimension IN (
  'definition',
  'example',
  'comparison',
  'scenario',
  'implementation',
  'troubleshooting'
));

-- Drop and recreate constraint on user_dimension_coverage table (6 dimensions only)
ALTER TABLE user_dimension_coverage DROP CONSTRAINT IF EXISTS user_dimension_coverage_dimension_check;

ALTER TABLE user_dimension_coverage
ADD CONSTRAINT user_dimension_coverage_dimension_check
CHECK (dimension IN (
  'definition',
  'example',
  'comparison',
  'scenario',
  'implementation',
  'troubleshooting'
));

-- Update get_dimension_name function to ONLY handle new 6 dimensions
CREATE OR REPLACE FUNCTION get_dimension_name(dim_key TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE dim_key
    WHEN 'definition' THEN 'Definition'
    WHEN 'example' THEN 'Examples'
    WHEN 'comparison' THEN 'Comparison'
    WHEN 'scenario' THEN 'Scenarios'
    WHEN 'implementation' THEN 'Implementation'
    WHEN 'troubleshooting' THEN 'Troubleshooting'
    ELSE dim_key
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION get_dimension_name IS 'Returns human-readable dimension names for the 6 knowledge dimensions (definition, example, comparison, scenario, implementation, troubleshooting)';

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Enforced new 6-dimension system!';
  RAISE NOTICE 'Only accepting: definition, example, comparison, scenario, implementation, troubleshooting';
  RAISE NOTICE 'All backward compatibility removed';
END $$;
