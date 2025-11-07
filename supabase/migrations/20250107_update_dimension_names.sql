-- Update get_dimension_name function to support new 6 dimensions

CREATE OR REPLACE FUNCTION get_dimension_name(dim_key TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE dim_key
    -- New 6 dimensions
    WHEN 'definition' THEN 'Definition'
    WHEN 'example' THEN 'Examples'
    WHEN 'comparison' THEN 'Comparison'
    WHEN 'scenario' THEN 'Scenarios'
    WHEN 'implementation' THEN 'Implementation'
    WHEN 'troubleshooting' THEN 'Troubleshooting'

    -- Old 12 dimensions (backward compatibility)
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

    -- Even older keys (backward compatibility)
    WHEN 'measuring_evaluating' THEN 'Methods & Techniques'
    WHEN 'controls' THEN 'Security & Controls'
    WHEN 'architecture_design' THEN 'Architecture & Design'
    WHEN 'threats_failures' THEN 'Risk & Threats'
    WHEN 'validation_assurance' THEN 'Tools & Technologies'

    ELSE dim_key
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION get_dimension_name IS 'Returns human-readable dimension names. Supports new 6 dimension system (definition, example, comparison, scenario, implementation, troubleshooting) with backward compatibility for old dimension keys.';
