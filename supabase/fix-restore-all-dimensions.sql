-- Restore all 6 original dimensions + pitfalls for each subject

-- Insert all 7 dimensions for each subject
INSERT INTO subject_dimension_config (
  subject_id,
  dimension_key,
  dimension_name,
  dimension_description,
  display_order,
  is_active
)
SELECT
  s.id,
  dim.key,
  dim.name,
  dim.description,
  dim.display_order,
  true
FROM subjects s
CROSS JOIN (
  VALUES
    ('definition', 'Definition', 'DIMENSION: Definition/Conceptual Understanding - Focus on what is it and core terminology.', 1),
    ('example', 'Example', 'DIMENSION: Examples and Applications - Focus on how is it used and practical instances.', 2),
    ('comparison', 'Comparison', 'DIMENSION: Comparison and Contrast - Focus on differences and similarities.', 3),
    ('implementation', 'Implementation', 'DIMENSION: Implementation and Procedures - Focus on how to implement/configure.', 4),
    ('scenario', 'Scenario', 'DIMENSION: Scenario-Based Problem Solving - Focus on what should you do in realistic situations.', 5),
    ('troubleshooting', 'Troubleshooting', 'DIMENSION: Troubleshooting and Analysis - Focus on diagnostic reasoning.', 6),
    ('pitfalls', 'Common Pitfalls', 'DIMENSION: Common Pitfalls and Mistakes - Focus on errors and what NOT to do.', 7)
) AS dim(key, name, description, display_order)
WHERE NOT EXISTS (
  SELECT 1
  FROM subject_dimension_config sdc
  WHERE sdc.subject_id = s.id
    AND sdc.dimension_key = dim.key
)
ON CONFLICT (subject_id, dimension_key) DO NOTHING;
