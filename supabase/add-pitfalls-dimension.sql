-- Add Pitfalls dimension to all existing subjects

-- Insert pitfalls dimension for each subject that doesn't already have it
INSERT INTO subject_dimension_config (
  subject_id,
  dimension_key,
  dimension_name,
  dimension_description,
  display_order,
  is_active
)
SELECT
  s.id as subject_id,
  'pitfalls' as dimension_key,
  'Common Pitfalls' as dimension_name,
  'DIMENSION: Common Pitfalls and Mistakes - Focus on errors, misconceptions, and anti-patterns at different complexity levels. Bloom 1-3: What NOT to do (basic errors, common confusions). Bloom 4-6: Why approaches fail (flawed analysis, poor design, inadequate evaluation).' as dimension_description,
  7 as display_order,
  true as is_active
FROM subjects s
WHERE NOT EXISTS (
  SELECT 1
  FROM subject_dimension_config sdc
  WHERE sdc.subject_id = s.id
    AND sdc.dimension_key = 'pitfalls'
);
