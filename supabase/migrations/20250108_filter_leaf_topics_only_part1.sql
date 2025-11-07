-- Part 1: Drop the existing function
-- This must be run FIRST before part 2

DROP FUNCTION IF EXISTS get_available_arms(UUID, UUID) CASCADE;

-- Verify it's dropped
DO $$
BEGIN
  RAISE NOTICE 'Function get_available_arms has been dropped successfully';
END $$;
