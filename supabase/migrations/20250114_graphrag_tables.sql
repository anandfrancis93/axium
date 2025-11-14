-- GraphRAG Tables Migration
-- This creates separate tables for GraphRAG experimentation
-- Prefixed with graphrag_ to avoid conflicts with existing tables

-- ============================================================================
-- 1. GraphRAG Indexing Jobs (track indexing progress)
-- ============================================================================
CREATE TABLE graphrag_indexing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  mode TEXT NOT NULL CHECK (mode IN ('full', 'incremental')),

  -- Progress tracking
  total_chunks INTEGER,
  processed_chunks INTEGER DEFAULT 0,
  entities_extracted INTEGER DEFAULT 0,
  relationships_extracted INTEGER DEFAULT 0,
  communities_detected INTEGER DEFAULT 0,

  -- Metadata
  error_message TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_graphrag_indexing_jobs_chapter ON graphrag_indexing_jobs(chapter_id);
CREATE INDEX idx_graphrag_indexing_jobs_status ON graphrag_indexing_jobs(status);

-- ============================================================================
-- 2. GraphRAG Entity Cache (for quick lookups, actual graph in Neo4j)
-- ============================================================================
CREATE TABLE graphrag_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  neo4j_id TEXT NOT NULL,  -- Neo4j node ID

  -- Entity data
  name TEXT NOT NULL,
  type TEXT NOT NULL,  -- concept, definition, person, event, process, etc.
  description TEXT,

  -- Vector for similarity search
  embedding vector(1536),

  -- Metadata
  source_chunks TEXT[],  -- Which knowledge_chunks this came from
  confidence FLOAT,  -- 0-1 confidence score from extraction

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_graphrag_entities_chapter ON graphrag_entities(chapter_id);
CREATE INDEX idx_graphrag_entities_type ON graphrag_entities(type);
CREATE INDEX idx_graphrag_entities_name ON graphrag_entities(name);
CREATE INDEX idx_graphrag_entities_neo4j ON graphrag_entities(neo4j_id);

-- HNSW index for vector similarity search on entities
CREATE INDEX idx_graphrag_entities_embedding ON graphrag_entities
  USING hnsw (embedding vector_cosine_ops);

-- ============================================================================
-- 3. GraphRAG Relationship Cache (actual relationships in Neo4j)
-- ============================================================================
CREATE TABLE graphrag_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  neo4j_id TEXT NOT NULL,  -- Neo4j relationship ID

  -- Relationship data
  source_entity_id UUID NOT NULL REFERENCES graphrag_entities(id) ON DELETE CASCADE,
  target_entity_id UUID NOT NULL REFERENCES graphrag_entities(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,  -- IS_A, DEPENDS_ON, CAUSES, SIMILAR_TO, etc.

  -- Metadata
  strength FLOAT,  -- 0-1 confidence/weight
  evidence_chunks TEXT[],  -- Supporting evidence
  description TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_graphrag_relationships_chapter ON graphrag_relationships(chapter_id);
CREATE INDEX idx_graphrag_relationships_source ON graphrag_relationships(source_entity_id);
CREATE INDEX idx_graphrag_relationships_target ON graphrag_relationships(target_entity_id);
CREATE INDEX idx_graphrag_relationships_type ON graphrag_relationships(relationship_type);
CREATE INDEX idx_graphrag_relationships_neo4j ON graphrag_relationships(neo4j_id);

-- ============================================================================
-- 4. GraphRAG Communities (Leiden clustering results)
-- ============================================================================
CREATE TABLE graphrag_communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  neo4j_id TEXT,  -- Optional: Neo4j community ID if stored there

  -- Community data
  name TEXT NOT NULL,
  level INTEGER NOT NULL,  -- 0 = leaf, 1 = mid, 2 = top (hierarchical)
  parent_community_id UUID REFERENCES graphrag_communities(id) ON DELETE CASCADE,

  -- Summary
  summary TEXT NOT NULL,  -- LLM-generated community summary
  entities UUID[],  -- Member entity IDs

  -- Metadata
  size INTEGER,  -- Number of entities
  density FLOAT,  -- 0-1 how interconnected

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_graphrag_communities_chapter ON graphrag_communities(chapter_id);
CREATE INDEX idx_graphrag_communities_level ON graphrag_communities(level);
CREATE INDEX idx_graphrag_communities_parent ON graphrag_communities(parent_community_id);

-- ============================================================================
-- 5. GraphRAG Query Cache (cache expensive graph queries)
-- ============================================================================
CREATE TABLE graphrag_query_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Query signature (hash)
  query_hash TEXT NOT NULL UNIQUE,
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  bloom_level INTEGER,
  dimension TEXT,

  -- Cached result
  retrieved_context TEXT NOT NULL,
  entity_ids UUID[],
  relationship_ids UUID[],
  community_ids UUID[],

  -- Cache management
  hit_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days')  -- TTL
);

CREATE INDEX idx_graphrag_query_cache_hash ON graphrag_query_cache(query_hash);
CREATE INDEX idx_graphrag_query_cache_chapter ON graphrag_query_cache(chapter_id);
CREATE INDEX idx_graphrag_query_cache_expires ON graphrag_query_cache(expires_at);

-- ============================================================================
-- 6. GraphRAG Performance Metrics (A/B testing)
-- ============================================================================
CREATE TABLE graphrag_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Question metadata
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  rag_mode TEXT NOT NULL CHECK (rag_mode IN ('vector', 'graph', 'hybrid')),

  -- Performance
  retrieval_time_ms INTEGER,
  generation_time_ms INTEGER,
  total_time_ms INTEGER,

  -- Quality (measured from user responses)
  user_response_id UUID REFERENCES user_responses(id) ON DELETE SET NULL,
  was_correct BOOLEAN,
  user_confidence INTEGER,

  -- Metadata
  bloom_level INTEGER,
  dimension TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_graphrag_metrics_question ON graphrag_metrics(question_id);
CREATE INDEX idx_graphrag_metrics_mode ON graphrag_metrics(rag_mode);
CREATE INDEX idx_graphrag_metrics_bloom ON graphrag_metrics(bloom_level);

-- ============================================================================
-- RLS Policies (Security)
-- ============================================================================

-- Admin-only access for indexing jobs
ALTER TABLE graphrag_indexing_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access to indexing jobs"
  ON graphrag_indexing_jobs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Public read access to entities/relationships/communities
-- (needed for question generation)
ALTER TABLE graphrag_entities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access to entities"
  ON graphrag_entities
  FOR SELECT
  USING (true);

ALTER TABLE graphrag_relationships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access to relationships"
  ON graphrag_relationships
  FOR SELECT
  USING (true);

ALTER TABLE graphrag_communities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access to communities"
  ON graphrag_communities
  FOR SELECT
  USING (true);

-- Admin-only write access
CREATE POLICY "Admin write access to entities"
  ON graphrag_entities
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin write access to relationships"
  ON graphrag_relationships
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin write access to communities"
  ON graphrag_communities
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Query cache: public read, admin write
ALTER TABLE graphrag_query_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access to query cache"
  ON graphrag_query_cache
  FOR SELECT
  USING (true);

CREATE POLICY "Admin write access to query cache"
  ON graphrag_query_cache
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Metrics: public read, system write
ALTER TABLE graphrag_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access to metrics"
  ON graphrag_metrics
  FOR SELECT
  USING (true);

CREATE POLICY "System write access to metrics"
  ON graphrag_metrics
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_graphrag_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM graphrag_query_cache
  WHERE expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get cache statistics
CREATE OR REPLACE FUNCTION get_graphrag_cache_stats()
RETURNS TABLE(
  total_entries BIGINT,
  total_hits BIGINT,
  avg_hits_per_entry NUMERIC,
  hit_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_entries,
    SUM(hit_count)::BIGINT as total_hits,
    AVG(hit_count) as avg_hits_per_entry,
    CASE
      WHEN COUNT(*) > 0 THEN (SUM(hit_count)::NUMERIC / COUNT(*))
      ELSE 0
    END as hit_rate
  FROM graphrag_query_cache;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE graphrag_indexing_jobs IS 'Tracks GraphRAG indexing jobs for each chapter';
COMMENT ON TABLE graphrag_entities IS 'Cache of entities extracted from knowledge graph (actual graph in Neo4j)';
COMMENT ON TABLE graphrag_relationships IS 'Cache of relationships (actual graph in Neo4j)';
COMMENT ON TABLE graphrag_communities IS 'Hierarchical communities detected via Leiden clustering';
COMMENT ON TABLE graphrag_query_cache IS 'Cache for expensive graph queries to improve performance';
COMMENT ON TABLE graphrag_metrics IS 'Performance metrics for A/B testing GraphRAG vs Vector RAG';
