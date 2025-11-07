-- Clean up old 12-dimension data from user_dimension_coverage
-- New system uses 6 dimensions: definition, example, comparison, scenario, implementation, troubleshooting

-- Delete records with old dimension names
DELETE FROM user_dimension_coverage
WHERE dimension NOT IN ('definition', 'example', 'comparison', 'scenario', 'implementation', 'troubleshooting');

-- Log what was cleaned up
DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Cleaned up % old dimension records', deleted_count;
  RAISE NOTICE 'Valid dimensions: definition, example, comparison, scenario, implementation, troubleshooting';
END $$;
