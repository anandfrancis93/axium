-- ============================================================================
-- Fix: Add unique constraint to graphrag_prerequisite_paths
-- ============================================================================
--
-- Issue: sync-neo4j-to-supabase.ts uses `onConflict: 'target_entity_id'`
-- but table only has regular INDEX, not UNIQUE constraint
--
-- Error: "there is no unique or exclusion constraint matching the ON CONFLICT specification"
--
-- Solution: Add UNIQUE constraint to target_entity_id
-- Rationale: Each entity should have exactly ONE cached prerequisite path (the longest)
-- ============================================================================

-- Drop existing regular index
DROP INDEX IF EXISTS idx_graphrag_prerequisite_paths_target;

-- Add UNIQUE constraint
ALTER TABLE graphrag_prerequisite_paths
  ADD CONSTRAINT unique_target_entity UNIQUE (target_entity_id);

-- Recreate as unique index (provides both constraint and fast lookup)
CREATE UNIQUE INDEX IF NOT EXISTS idx_graphrag_prerequisite_paths_target_unique
  ON graphrag_prerequisite_paths(target_entity_id);

COMMENT ON CONSTRAINT unique_target_entity ON graphrag_prerequisite_paths
  IS 'Each entity has exactly one cached prerequisite path (longest path from root)';
