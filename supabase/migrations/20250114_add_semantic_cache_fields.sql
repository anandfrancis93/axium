-- Migration: Add Phase 2 Semantic Cache Fields
-- Date: 2025-01-14
-- Purpose: Extend GraphRAG cache with semantic relationship data from Neo4j

-- ============================================================================
-- 1. Extend graphrag_entities with semantic metadata
-- ============================================================================

-- Add Phase 2 semantic fields to entities
ALTER TABLE graphrag_entities
ADD COLUMN IF NOT EXISTS difficulty_score INTEGER CHECK (difficulty_score >= 1 AND difficulty_score <= 10),
ADD COLUMN IF NOT EXISTS learning_depth INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS estimated_study_time INTEGER, -- minutes
ADD COLUMN IF NOT EXISTS prerequisite_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_a_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS part_of_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS enables_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS semantic_data_synced_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS neo4j_synced_at TIMESTAMPTZ;

-- Create indexes for filtering by semantic metadata
CREATE INDEX IF NOT EXISTS idx_graphrag_entities_difficulty ON graphrag_entities(difficulty_score);
CREATE INDEX IF NOT EXISTS idx_graphrag_entities_learning_depth ON graphrag_entities(learning_depth);
CREATE INDEX IF NOT EXISTS idx_graphrag_entities_domain_difficulty
  ON graphrag_entities(domain_name, difficulty_score, learning_depth);

COMMENT ON COLUMN graphrag_entities.difficulty_score IS 'Difficulty score from Phase 2 (1-10 scale)';
COMMENT ON COLUMN graphrag_entities.learning_depth IS 'DAG depth in prerequisite graph (0 = root)';
COMMENT ON COLUMN graphrag_entities.estimated_study_time IS 'Estimated study time in minutes';
COMMENT ON COLUMN graphrag_entities.prerequisite_count IS 'Number of prerequisite relationships';
COMMENT ON COLUMN graphrag_entities.is_a_count IS 'Number of IS_A relationships';
COMMENT ON COLUMN graphrag_entities.part_of_count IS 'Number of PART_OF relationships';
COMMENT ON COLUMN graphrag_entities.enables_count IS 'Number of concepts this enables';
COMMENT ON COLUMN graphrag_entities.semantic_data_synced_at IS 'Last sync timestamp from Neo4j semantic data';

-- ============================================================================
-- 2. Extend graphrag_relationships with semantic relationship properties
-- ============================================================================

-- Add fields specific to semantic relationships
ALTER TABLE graphrag_relationships
ADD COLUMN IF NOT EXISTS strategy TEXT, -- How prerequisite was identified
ADD COLUMN IF NOT EXISTS confidence FLOAT DEFAULT 1.0, -- Moved from strength
ADD COLUMN IF NOT EXISTS reasoning TEXT; -- Educational rationale

-- Drop old strength column if it exists (replaced by confidence)
ALTER TABLE graphrag_relationships DROP COLUMN IF EXISTS strength;

-- Create indexes for common relationship queries
CREATE INDEX IF NOT EXISTS idx_graphrag_relationships_type_confidence
  ON graphrag_relationships(relationship_type, confidence);

COMMENT ON COLUMN graphrag_relationships.strategy IS 'For PREREQUISITE: hierarchy, semantic_is_a, part_of, cross_domain';
COMMENT ON COLUMN graphrag_relationships.confidence IS 'Relationship confidence (0.0-1.0)';
COMMENT ON COLUMN graphrag_relationships.reasoning IS 'Why this relationship exists (educational rationale)';

-- ============================================================================
-- 3. Create cached prerequisite paths table
-- ============================================================================

CREATE TABLE IF NOT EXISTS graphrag_prerequisite_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Path identification
  target_entity_id UUID NOT NULL REFERENCES graphrag_entities(id) ON DELETE CASCADE,
  path_depth INTEGER NOT NULL, -- Length of path

  -- Path data (ordered array of entity IDs from root to target)
  path_entity_ids UUID[] NOT NULL,
  path_names TEXT[] NOT NULL, -- For quick display

  -- Path metadata
  total_difficulty INTEGER, -- Sum of difficulty scores
  estimated_total_time INTEGER, -- Total minutes

  -- Cache management
  created_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_graphrag_prerequisite_paths_target ON graphrag_prerequisite_paths(target_entity_id);
CREATE INDEX IF NOT EXISTS idx_graphrag_prerequisite_paths_depth ON graphrag_prerequisite_paths(path_depth);

COMMENT ON TABLE graphrag_prerequisite_paths IS 'Cached learning paths from Neo4j prerequisite DAG';
COMMENT ON COLUMN graphrag_prerequisite_paths.path_entity_ids IS 'Ordered array: [root, ..., target]';
COMMENT ON COLUMN graphrag_prerequisite_paths.total_difficulty IS 'Sum of all node difficulties in path';

-- ============================================================================
-- 4. Create domain learning path cache
-- ============================================================================

CREATE TABLE IF NOT EXISTS graphrag_domain_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Domain identification
  domain_name TEXT NOT NULL,

  -- Path data (ordered by learning_depth, difficulty)
  path_entity_ids UUID[] NOT NULL,
  path_nodes JSONB NOT NULL, -- Array of {id, name, difficulty, depth, studyTime}

  -- Path metadata
  total_nodes INTEGER NOT NULL,
  total_difficulty INTEGER,
  estimated_total_time INTEGER,
  starting_point_ids UUID[], -- Entities with no prerequisites

  -- Cache management
  created_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_graphrag_domain_paths_domain ON graphrag_domain_paths(domain_name);
CREATE INDEX IF NOT EXISTS idx_graphrag_domain_paths_expires ON graphrag_domain_paths(expires_at);

COMMENT ON TABLE graphrag_domain_paths IS 'Cached optimal learning paths for each domain';
COMMENT ON COLUMN graphrag_domain_paths.path_nodes IS 'Complete path data as JSONB array';
COMMENT ON COLUMN graphrag_domain_paths.starting_point_ids IS 'Recommended starting concepts (no prerequisites)';

-- ============================================================================
-- 5. Create cache sync status tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS graphrag_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Sync metadata
  sync_type TEXT NOT NULL CHECK (sync_type IN ('full', 'incremental', 'relationships', 'metadata')),
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed')),

  -- What was synced
  entities_synced INTEGER DEFAULT 0,
  relationships_synced INTEGER DEFAULT 0,
  paths_generated INTEGER DEFAULT 0,

  -- Performance
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,

  -- Error tracking
  error_message TEXT,
  error_details JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_graphrag_sync_log_type_status ON graphrag_sync_log(sync_type, status);
CREATE INDEX IF NOT EXISTS idx_graphrag_sync_log_created ON graphrag_sync_log(created_at DESC);

COMMENT ON TABLE graphrag_sync_log IS 'Tracks Neo4j → Supabase cache sync operations';

-- ============================================================================
-- 6. Helper Functions for Cache Management
-- ============================================================================

-- Function to mark entity as synced
CREATE OR REPLACE FUNCTION mark_entity_synced(entity_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE graphrag_entities
  SET semantic_data_synced_at = NOW(),
      neo4j_synced_at = NOW(),
      updated_at = NOW()
  WHERE id = entity_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check if cache is stale
CREATE OR REPLACE FUNCTION is_cache_stale(entity_id UUID, max_age_hours INTEGER DEFAULT 24)
RETURNS BOOLEAN AS $$
DECLARE
  last_sync TIMESTAMPTZ;
BEGIN
  SELECT semantic_data_synced_at INTO last_sync
  FROM graphrag_entities
  WHERE id = entity_id;

  IF last_sync IS NULL THEN
    RETURN TRUE;
  END IF;

  RETURN (NOW() - last_sync) > (max_age_hours * INTERVAL '1 hour');
END;
$$ LANGUAGE plpgsql;

-- Function to get cache statistics
CREATE OR REPLACE FUNCTION get_semantic_cache_stats()
RETURNS TABLE(
  total_entities BIGINT,
  entities_with_semantic_data BIGINT,
  total_relationships BIGINT,
  prerequisite_relationships BIGINT,
  is_a_relationships BIGINT,
  part_of_relationships BIGINT,
  avg_difficulty NUMERIC,
  max_learning_depth INTEGER,
  cached_paths BIGINT,
  cache_coverage_pct NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_entities,
    COUNT(*) FILTER (WHERE difficulty_score IS NOT NULL)::BIGINT as entities_with_semantic_data,
    (SELECT COUNT(*) FROM graphrag_relationships)::BIGINT as total_relationships,
    (SELECT COUNT(*) FROM graphrag_relationships WHERE relationship_type = 'PREREQUISITE')::BIGINT as prerequisite_relationships,
    (SELECT COUNT(*) FROM graphrag_relationships WHERE relationship_type = 'IS_A')::BIGINT as is_a_relationships,
    (SELECT COUNT(*) FROM graphrag_relationships WHERE relationship_type = 'PART_OF')::BIGINT as part_of_relationships,
    AVG(difficulty_score) FILTER (WHERE difficulty_score IS NOT NULL) as avg_difficulty,
    MAX(learning_depth) as max_learning_depth,
    (SELECT COUNT(*) FROM graphrag_prerequisite_paths)::BIGINT as cached_paths,
    CASE
      WHEN COUNT(*) > 0 THEN
        (COUNT(*) FILTER (WHERE difficulty_score IS NOT NULL)::NUMERIC / COUNT(*) * 100)
      ELSE 0
    END as cache_coverage_pct
  FROM graphrag_entities;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up stale cache entries
CREATE OR REPLACE FUNCTION cleanup_stale_cache(max_age_hours INTEGER DEFAULT 48)
RETURNS TABLE(
  expired_paths INTEGER,
  expired_domain_paths INTEGER
) AS $$
DECLARE
  deleted_paths INTEGER;
  deleted_domain_paths INTEGER;
BEGIN
  -- Clean up old prerequisite paths
  DELETE FROM graphrag_prerequisite_paths
  WHERE synced_at < (NOW() - (max_age_hours * INTERVAL '1 hour'));
  GET DIAGNOSTICS deleted_paths = ROW_COUNT;

  -- Clean up expired domain paths
  DELETE FROM graphrag_domain_paths
  WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_domain_paths = ROW_COUNT;

  RETURN QUERY SELECT deleted_paths, deleted_domain_paths;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. RLS Policies for New Tables
-- ============================================================================

-- Prerequisite paths: public read, authenticated write
ALTER TABLE graphrag_prerequisite_paths ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to prerequisite paths"
  ON graphrag_prerequisite_paths
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated write access to prerequisite paths"
  ON graphrag_prerequisite_paths
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Domain paths: public read, authenticated write
ALTER TABLE graphrag_domain_paths ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to domain paths"
  ON graphrag_domain_paths
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated write access to domain paths"
  ON graphrag_domain_paths
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Sync log: public read, authenticated write
ALTER TABLE graphrag_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to sync log"
  ON graphrag_sync_log
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated write access to sync log"
  ON graphrag_sync_log
  FOR ALL
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- 8. Materialized View for Quick Stats
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS graphrag_cache_summary AS
SELECT
  domain_name,
  COUNT(*) as entity_count,
  COUNT(*) FILTER (WHERE difficulty_score IS NOT NULL) as entities_with_difficulty,
  AVG(difficulty_score) FILTER (WHERE difficulty_score IS NOT NULL) as avg_difficulty,
  MAX(learning_depth) as max_depth,
  SUM(prerequisite_count) as total_prerequisites,
  COUNT(*) FILTER (WHERE prerequisite_count > 0) as entities_with_prerequisites
FROM graphrag_entities
WHERE domain_name IS NOT NULL
GROUP BY domain_name;

CREATE UNIQUE INDEX IF NOT EXISTS idx_graphrag_cache_summary_domain
  ON graphrag_cache_summary(domain_name);

COMMENT ON MATERIALIZED VIEW graphrag_cache_summary IS 'Aggregated cache stats by domain (refresh periodically)';

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_cache_summary()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY graphrag_cache_summary;
END;
$$ LANGUAGE plpgsql;
