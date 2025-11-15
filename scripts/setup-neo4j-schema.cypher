// Neo4j Schema Setup Script
// Run this in Neo4j Browser or via Neo4j driver
// Database: neo4j (or your configured database name)

// =============================================================================
// CONSTRAINTS
// =============================================================================

// Unique constraint on Entity ID
CREATE CONSTRAINT entity_id_unique IF NOT EXISTS
FOR (e:Entity) REQUIRE e.id IS UNIQUE;

// Unique constraint on Entity fullPath
CREATE CONSTRAINT entity_fullpath_unique IF NOT EXISTS
FOR (e:Entity) REQUIRE e.fullPath IS UNIQUE;

// Existence constraints (require properties to exist)
CREATE CONSTRAINT entity_must_have_name IF NOT EXISTS
FOR (e:Entity) REQUIRE e.name IS NOT NULL;

CREATE CONSTRAINT entity_must_have_level IF NOT EXISTS
FOR (e:Entity) REQUIRE e.level IS NOT NULL;

CREATE CONSTRAINT entity_must_have_fullpath IF NOT EXISTS
FOR (e:Entity) REQUIRE e.fullPath IS NOT NULL;

CREATE CONSTRAINT entity_must_have_status IF NOT EXISTS
FOR (e:Entity) REQUIRE e.status IS NOT NULL;

// =============================================================================
// INDEXES (Performance Optimization)
// =============================================================================

// Index on ID (most common lookup)
CREATE INDEX entity_id_index IF NOT EXISTS
FOR (e:Entity) ON (e.id);

// Index on name (for search)
CREATE INDEX entity_name_index IF NOT EXISTS
FOR (e:Entity) ON (e.name);

// Index on fullPath (for direct access)
CREATE INDEX entity_fullpath_index IF NOT EXISTS
FOR (e:Entity) ON (e.fullPath);

// Index on level (for filtering by hierarchy level)
CREATE INDEX entity_level_index IF NOT EXISTS
FOR (e:Entity) ON (e.level);

// Index on status (for filtering active vs deprecated)
CREATE INDEX entity_status_index IF NOT EXISTS
FOR (e:Entity) ON (e.status);

// Index on chapterId (for multi-curriculum support)
CREATE INDEX entity_chapter_index IF NOT EXISTS
FOR (e:Entity) ON (e.chapterId);

// Index on domainId (for domain-based queries)
CREATE INDEX entity_domain_index IF NOT EXISTS
FOR (e:Entity) ON (e.domainId);

// Composite index: chapterId + status (common filter combo)
CREATE INDEX entity_chapter_status IF NOT EXISTS
FOR (e:Entity) ON (e.chapterId, e.status);

// Composite index: level + status
CREATE INDEX entity_level_status IF NOT EXISTS
FOR (e:Entity) ON (e.level, e.status);

// =============================================================================
// VERIFICATION QUERIES
// =============================================================================

// Show all constraints
SHOW CONSTRAINTS;

// Show all indexes
SHOW INDEXES;

// Summary
CALL db.schema.visualization();
