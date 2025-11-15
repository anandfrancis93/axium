-- Migration: Update graphrag_entities table for hierarchical curriculum structure
-- Date: 2024-11-14
-- Purpose: Add fields to match Neo4j schema for GraphRAG knowledge graph

-- Add new columns to graphrag_entities table
ALTER TABLE graphrag_entities
ADD COLUMN IF NOT EXISTS level TEXT,
ADD COLUMN IF NOT EXISTS full_path TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS context_summary TEXT,
ADD COLUMN IF NOT EXISTS domain_id UUID,
ADD COLUMN IF NOT EXISTS domain_name TEXT,
ADD COLUMN IF NOT EXISTS objective_id UUID,
ADD COLUMN IF NOT EXISTS objective_name TEXT,
ADD COLUMN IF NOT EXISTS parent_id UUID,
ADD COLUMN IF NOT EXISTS scopes TEXT[],
ADD COLUMN IF NOT EXISTS curriculum_version TEXT DEFAULT '2024.1',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS relationships_extracted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS extraction_level INTEGER,
ADD COLUMN IF NOT EXISTS last_extracted TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS extraction_version TEXT,
ADD COLUMN IF NOT EXISTS relationship_counts JSONB DEFAULT '{}'::jsonb;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_graphrag_entities_level ON graphrag_entities(level);
CREATE INDEX IF NOT EXISTS idx_graphrag_entities_full_path ON graphrag_entities(full_path);
CREATE INDEX IF NOT EXISTS idx_graphrag_entities_status ON graphrag_entities(status);
CREATE INDEX IF NOT EXISTS idx_graphrag_entities_domain_id ON graphrag_entities(domain_id);
CREATE INDEX IF NOT EXISTS idx_graphrag_entities_parent_id ON graphrag_entities(parent_id);
CREATE INDEX IF NOT EXISTS idx_graphrag_entities_chapter_status ON graphrag_entities(chapter_id, status);

-- Add check constraints
ALTER TABLE graphrag_entities
ADD CONSTRAINT check_level_valid
CHECK (level IN ('domain', 'objective', 'topic', 'subtopic', 'subsubtopic'));

ALTER TABLE graphrag_entities
ADD CONSTRAINT check_status_valid
CHECK (status IN ('active', 'deprecated', 'draft'));

-- Add comment to table
COMMENT ON TABLE graphrag_entities IS 'Stores curriculum entities in hierarchical structure with caching from Neo4j';
COMMENT ON COLUMN graphrag_entities.level IS 'Hierarchy level: domain, objective, topic, subtopic, subsubtopic';
COMMENT ON COLUMN graphrag_entities.full_path IS 'Complete hierarchical path: Domain > Objective > Topic';
COMMENT ON COLUMN graphrag_entities.context_summary IS 'LLM-generated 2-3 sentence description';
COMMENT ON COLUMN graphrag_entities.domain_id IS 'Parent domain UUID';
COMMENT ON COLUMN graphrag_entities.parent_id IS 'Direct parent UUID';
COMMENT ON COLUMN graphrag_entities.scopes IS 'Topic tags: ["cryptography", "network-security"]';
COMMENT ON COLUMN graphrag_entities.status IS 'Lifecycle status: active, deprecated, draft';
COMMENT ON COLUMN graphrag_entities.relationships_extracted IS 'Have semantic relationships been extracted?';
COMMENT ON COLUMN graphrag_entities.extraction_level IS 'Extraction thoroughness: 1 (basic), 2 (hierarchical), 3 (cross-reference)';
COMMENT ON COLUMN graphrag_entities.relationship_counts IS 'Count by type: {"IS_A": 2, "PREVENTS": 3}';
