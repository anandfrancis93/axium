-- Migration: Change confidence scale from 2/3/4 to 1/2/3
-- Date: 2025-01-12
-- Description: Updates all existing user_responses confidence values by subtracting 1

-- IMPORTANT: This migration must be run AFTER deploying the code changes
-- to ensure new responses use the correct scale

BEGIN;

-- Step 1: Verify current data distribution
DO $$
DECLARE
  count_2 INTEGER;
  count_3 INTEGER;
  count_4 INTEGER;
  count_other INTEGER;
BEGIN
  SELECT
    COUNT(*) FILTER (WHERE confidence = 2),
    COUNT(*) FILTER (WHERE confidence = 3),
    COUNT(*) FILTER (WHERE confidence = 4),
    COUNT(*) FILTER (WHERE confidence NOT IN (2, 3, 4))
  INTO count_2, count_3, count_4, count_other
  FROM user_responses;

  RAISE NOTICE 'Current confidence distribution:';
  RAISE NOTICE 'Confidence = 2 (Low): % responses', count_2;
  RAISE NOTICE 'Confidence = 3 (Medium): % responses', count_3;
  RAISE NOTICE 'Confidence = 4 (High): % responses', count_4;
  RAISE NOTICE 'Other values: % responses', count_other;

  IF count_other > 0 THEN
    RAISE WARNING 'Found % responses with unexpected confidence values!', count_other;
  END IF;
END $$;

-- Step 2: Update all confidence values (2→1, 3→2, 4→3)
UPDATE user_responses
SET confidence = confidence - 1
WHERE confidence IN (2, 3, 4);

-- Step 3: Drop old constraint
ALTER TABLE user_responses
DROP CONSTRAINT IF EXISTS user_responses_confidence_check;

-- Step 4: Add new constraint
ALTER TABLE user_responses
ADD CONSTRAINT user_responses_confidence_check
CHECK (confidence IN (1, 2, 3));

-- Step 5: Verify migration results
DO $$
DECLARE
  count_1 INTEGER;
  count_2 INTEGER;
  count_3 INTEGER;
  count_invalid INTEGER;
  total INTEGER;
BEGIN
  SELECT
    COUNT(*) FILTER (WHERE confidence = 1),
    COUNT(*) FILTER (WHERE confidence = 2),
    COUNT(*) FILTER (WHERE confidence = 3),
    COUNT(*) FILTER (WHERE confidence NOT IN (1, 2, 3)),
    COUNT(*)
  INTO count_1, count_2, count_3, count_invalid, total
  FROM user_responses;

  RAISE NOTICE 'Migration completed!';
  RAISE NOTICE 'New confidence distribution:';
  RAISE NOTICE 'Confidence = 1 (Low): % responses', count_1;
  RAISE NOTICE 'Confidence = 2 (Medium): % responses', count_2;
  RAISE NOTICE 'Confidence = 3 (High): % responses', count_3;
  RAISE NOTICE 'Total responses migrated: %', total;

  IF count_invalid > 0 THEN
    RAISE EXCEPTION 'Migration failed! Found % responses with invalid confidence values', count_invalid;
  END IF;

  RAISE NOTICE 'All % responses successfully migrated to new scale', total;
END $$;

COMMIT;
