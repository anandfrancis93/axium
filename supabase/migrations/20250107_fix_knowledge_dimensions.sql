-- Fix Knowledge Dimensions to be Orthogonal Content Categories
-- Problem: "Advanced Concepts" creates a difficulty axis that conflicts with Bloom's Taxonomy
-- Solution: Replace with proper content-based dimensions

-- Update existing dimension definitions to be content categories, not difficulty levels
UPDATE subject_dimension_config
SET
  dimension_name = CASE dimension_key
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
    ELSE dimension_name
  END,
  dimension_description = CASE dimension_key
    WHEN 'core_understanding' THEN 'Definitions, terminology, fundamental concepts, and basic relationships'
    WHEN 'technical_methods' THEN 'Procedures, algorithms, processes, and systematic approaches'
    WHEN 'risk_management' THEN 'Vulnerabilities, attack vectors, threat modeling, and risk assessment'
    WHEN 'security_controls' THEN 'Protection mechanisms, defensive strategies, and security measures'
    WHEN 'tools_technologies' THEN 'Software, platforms, implementations, and technological solutions'
    WHEN 'architecture' THEN 'System design, infrastructure, structural patterns, and architectural decisions'
    WHEN 'legal_compliance' THEN 'Standards (ISO, NIST, PCI DSS), regulations (GDPR, HIPAA), and compliance frameworks'
    WHEN 'incident_response' THEN 'Response procedures, remediation steps, investigation techniques, and recovery processes'
    WHEN 'advanced_concepts' THEN 'Cross-domain connections, system integration, interoperability, and holistic understanding'
    WHEN 'misconceptions' THEN 'Common misunderstandings, incorrect assumptions, and typical mistakes to avoid'
    WHEN 'practical_scenarios' THEN 'Real-world application, hands-on problems, situational challenges, and case studies'
    WHEN 'strategic_policy' THEN 'Business decisions, governance structures, organizational policies, and strategic planning'
    ELSE dimension_description
  END
WHERE dimension_key IN (
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
);

-- Update the dimension name mapping function for consistency
CREATE OR REPLACE FUNCTION get_dimension_name(dim_key TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE dim_key
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
    ELSE dim_key
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add comment explaining the fix
COMMENT ON FUNCTION get_dimension_name IS 'Returns human-readable dimension names. Dimensions represent orthogonal content categories, not difficulty levels (Bloom handles difficulty).';

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Knowledge Dimensions Fixed!';
  RAISE NOTICE 'Removed difficulty-based dimension "Advanced Concepts"';
  RAISE NOTICE 'Replaced with "Integration & Interoperability" (content-based)';
  RAISE NOTICE 'All dimensions now represent content categories orthogonal to Bloom levels';
END $$;
