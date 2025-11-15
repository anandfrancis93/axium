# Neo4j Schema - CompTIA Security+ GraphRAG Knowledge Graph

**Version:** 2.0 (Implemented)
**Date:** 2024-11-14
**Status:** ✅ Complete - 844 entities imported
**Purpose:** Hierarchical curriculum knowledge graph for GraphRAG-powered learning

---

## Overview

The knowledge graph contains the complete CompTIA Security+ SY0-701 curriculum structured as a hierarchical tree with cross-domain relationships and semantic tags.

**Current State:**
- 844 curriculum entities
- 110 cross-reference relationships
- 20 scope tag categories
- 100% context summary coverage

---

## Node Structure

### Label

All curriculum entities use a single label: **`CurriculumEntity`**

### Required Properties

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `id` | String (UUID) | Unique identifier | "550e8400-e29b-41d4-a716-446655440000" |
| `name` | String | Display name | "802.1X" |
| `level` | String | Hierarchy level (source) | "domain", "objective", "topic", "subtopic", "subsubtopic" |
| `entityType` | String | Formatted type | "Domain", "Objective", "Topic", "Subtopic", "Sub-subtopic" |
| `fullPath` | String | Complete hierarchy path (unique) | "Security Architecture > Infrastructure > 802.1X" |
| `depth` | Integer | Tree depth (0-4) | 0=Domain, 1=Objective, 2=Topic, 3=Subtopic, 4=Sub-subtopic |
| `parentId` | String (UUID) or null | Direct parent ID (null for domains) | "parent-uuid" |
| `domainId` | String (UUID) | Root domain ID | "domain-uuid" |
| `domainName` | String | Root domain name | "Security Architecture" |
| `status` | String | Lifecycle status | "active" |
| `curriculumVersion` | String | Curriculum version | "2024.1" |
| `createdAt` | DateTime | Neo4j import timestamp | 2024-11-14T10:30:00Z |
| `updatedAt` | DateTime | Last update timestamp | 2024-11-14T15:45:00Z |

### Optional Properties

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `contextSummary` | String | 2-3 sentence AI-generated description | "802.1X is an IEEE standard for port-based network access control..." |
| `objectiveId` | String (UUID) or null | Parent objective ID | "objective-uuid" |
| `objectiveName` | String or null | Parent objective name | "Apply security principles to secure enterprise infrastructure" |
| `scopeTags` | Array[String] | Topic categorization tags | ["network-security", "access-control", "identity-management"] |

---

## Entity Type Distribution

| Entity Type | Count | Depth | Description |
|-------------|-------|-------|-------------|
| Domain | 5 | 0 | Top-level security domains |
| Objective | 28 | 1 | Learning objectives within domains |
| Topic | 182 | 2 | Main curriculum topics |
| Subtopic | 538 | 3 | Detailed subtopics |
| Sub-subtopic | 91 | 4 | Granular sub-subtopics |
| **Total** | **844** | - | Complete curriculum |

---

## Relationship Types

### 1. PARENT_OF (Hierarchical - Downward)

**Direction:** Parent → Child
**Count:** 839 relationships
**Purpose:** Navigate from parent to children

**Properties:** None

**Example:**
```cypher
(General Security Concepts)-[:PARENT_OF]->(Compare and contrast security controls)
```

### 2. CHILD_OF (Hierarchical - Upward)

**Direction:** Child → Parent
**Count:** 839 relationships
**Purpose:** Navigate from child to parent (reverse lookup)

**Properties:** None

**Example:**
```cypher
(Compare and contrast security controls)-[:CHILD_OF]->(General Security Concepts)
```

### 3. RELATED_CONCEPT (Cross-Reference)

**Direction:** Bidirectional
**Count:** 110 relationships
**Purpose:** Link related concepts across domains

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `sharedConcept` | String | The concept name linking the entities |
| `strength` | String | "high" (cross-domain) or "medium" (same-domain) |
| `reason` | String | Human-readable explanation |
| `crossDomain` | Boolean | true if entities are in different domains |
| `createdAt` | DateTime | When relationship was created |

**Example:**
```cypher
(Encryption in General Security Concepts)
  -[:RELATED_CONCEPT {
    sharedConcept: "Encryption",
    strength: "high",
    reason: "Cross-domain concept: Encryption",
    crossDomain: true
  }]->
(Encryption in Security Architecture)
```

**Cross-Reference Statistics:**
- Total RELATED_CONCEPT relationships: 110
- Cross-domain: 100 (91%)
- Same-domain: 10 (9%)
- Most linked concept: "Encryption" (6 occurrences across 4 domains)

---

## Scope Tags

Entities are tagged with 20 scope categories for filtering and discovery:

| Scope Tag | Count | Coverage | Description |
|-----------|-------|----------|-------------|
| network-security | 606 | 72% | Networks, firewalls, protocols |
| risk-management | 473 | 56% | Risk assessment and mitigation |
| threat-intelligence | 454 | 54% | Threats, actors, malware |
| security-operations | 422 | 50% | SOC, automation, operations |
| monitoring-logging | 371 | 44% | Logging, SIEM, detection |
| data-protection | 359 | 43% | Privacy, encryption, DLP |
| compliance | 349 | 41% | Regulations, audits, standards |
| governance | 322 | 38% | Policies, procedures, oversight |
| incident-response | 319 | 38% | IR, forensics, containment |
| identity-management | 302 | 36% | IAM, authentication, SSO |
| architecture | 266 | 32% | Design, infrastructure, zero trust |
| vulnerability-management | 256 | 30% | Vulnerabilities, patches, scanning |
| cryptography | 254 | 30% | Encryption, hashing, PKI |
| access-control | 242 | 29% | Authorization, RBAC, permissions |
| application-security | 232 | 27% | AppSec, SDLC, secure coding |
| physical-security | 156 | 18% | Physical controls, facilities |
| cloud-security | 135 | 16% | Cloud, SaaS, containers |
| awareness-training | 115 | 14% | User education, phishing |
| endpoint-security | 109 | 13% | Endpoints, EDR, hardening |
| third-party-risk | 72 | 9% | Vendors, supply chain |

**Usage:**
```cypher
// Find all cryptography-related entities
MATCH (e:CurriculumEntity)
WHERE 'cryptography' IN e.scopeTags
RETURN e.name, e.fullPath
```

---

## Constraints

```cypher
// Unique ID
CREATE CONSTRAINT curriculum_entity_id IF NOT EXISTS
FOR (e:CurriculumEntity) REQUIRE e.id IS UNIQUE;

// Unique full path
CREATE CONSTRAINT curriculum_entity_path IF NOT EXISTS
FOR (e:CurriculumEntity) REQUIRE e.fullPath IS UNIQUE;
```

---

## Indexes

```cypher
// Search by name
CREATE INDEX curriculum_entity_name IF NOT EXISTS
FOR (e:CurriculumEntity) ON (e.name);

// Filter by entity type
CREATE INDEX curriculum_entity_type IF NOT EXISTS
FOR (e:CurriculumEntity) ON (e.entityType);

// Filter by depth
CREATE INDEX curriculum_entity_depth IF NOT EXISTS
FOR (e:CurriculumEntity) ON (e.depth);
```

---

## Common Query Patterns

### 1. Get All Domains

```cypher
MATCH (d:CurriculumEntity)
WHERE d.depth = 0
RETURN d.name, d.id
ORDER BY d.name
```

**Returns:** 5 domains

### 2. Get Entity by Full Path

```cypher
MATCH (e:CurriculumEntity {fullPath: "General Security Concepts > Compare and contrast various types of security controls"})
RETURN e
```

### 3. Get Entity with Children

```cypher
MATCH (parent:CurriculumEntity {id: $parentId})
OPTIONAL MATCH (parent)-[:PARENT_OF]->(child)
RETURN parent, collect(child) AS children
```

### 4. Get Full Hierarchy Path (Breadcrumbs)

```cypher
MATCH path = (root:CurriculumEntity {depth: 0})-[:PARENT_OF*]->(entity:CurriculumEntity {id: $entityId})
RETURN [node IN nodes(path) | {name: node.name, id: node.id}] AS breadcrumbs
```

### 5. Get Siblings

```cypher
MATCH (entity:CurriculumEntity {id: $entityId})-[:CHILD_OF]->(parent)
MATCH (parent)-[:PARENT_OF]->(sibling)
WHERE sibling.id <> $entityId
RETURN sibling
ORDER BY sibling.name
```

### 6. Search by Name (Full-Text)

```cypher
MATCH (e:CurriculumEntity)
WHERE toLower(e.name) CONTAINS toLower($searchTerm)
   OR toLower(e.fullPath) CONTAINS toLower($searchTerm)
   OR toLower(e.contextSummary) CONTAINS toLower($searchTerm)
RETURN e.name, e.entityType, e.fullPath, e.contextSummary
ORDER BY
  CASE
    WHEN toLower(e.name) = toLower($searchTerm) THEN 0
    WHEN toLower(e.name) STARTS WITH toLower($searchTerm) THEN 1
    WHEN toLower(e.name) CONTAINS toLower($searchTerm) THEN 2
    ELSE 3
  END,
  e.depth
LIMIT 20
```

### 7. Get Related Concepts (Cross-References)

```cypher
MATCH (entity:CurriculumEntity {id: $entityId})-[r:RELATED_CONCEPT]-(related)
WHERE r.crossDomain = true
RETURN related.name, related.domainName, related.fullPath, r.sharedConcept, r.strength
ORDER BY r.strength DESC, related.domainName
```

### 8. Filter by Scope Tags

```cypher
// Get all network security topics
MATCH (e:CurriculumEntity)
WHERE 'network-security' IN e.scopeTags
RETURN e.name, e.entityType, e.fullPath
ORDER BY e.depth, e.name
LIMIT 50

// Get entities matching multiple tags (AND)
MATCH (e:CurriculumEntity)
WHERE ALL(tag IN ['cryptography', 'network-security'] WHERE tag IN e.scopeTags)
RETURN e.name, e.scopeTags

// Get entities matching any tags (OR)
MATCH (e:CurriculumEntity)
WHERE ANY(tag IN ['cryptography', 'network-security'] WHERE tag IN e.scopeTags)
RETURN e.name, e.scopeTags
```

### 9. Get Subtree (All Descendants)

```cypher
MATCH (parent:CurriculumEntity {id: $parentId})-[:PARENT_OF*]->(descendant)
RETURN descendant.name, descendant.depth, descendant.entityType
ORDER BY descendant.depth, descendant.name
```

### 10. Find Duplicate Names (Cross-References)

```cypher
MATCH (e:CurriculumEntity)
WITH e.name AS name, collect(e) AS entities
WHERE size(entities) > 1
RETURN name,
       size(entities) AS count,
       [entity IN entities | {domain: entity.domainName, path: entity.fullPath}] AS occurrences
ORDER BY count DESC
```

---

## GraphRAG Query Patterns

### 1. Context Retrieval for Question Generation

```cypher
// Get entity with related context
MATCH (entity:CurriculumEntity {id: $entityId})
OPTIONAL MATCH (entity)-[:CHILD_OF]->(parent)
OPTIONAL MATCH (entity)-[:PARENT_OF]->(child)
OPTIONAL MATCH (entity)-[:RELATED_CONCEPT]-(related)
RETURN
  entity.name AS topic,
  entity.contextSummary AS summary,
  entity.fullPath AS path,
  parent.name AS parentTopic,
  collect(DISTINCT child.name) AS subtopics,
  collect(DISTINCT {name: related.name, domain: related.domainName}) AS relatedConcepts
```

### 2. Find Topics by Bloom Level Readiness

```cypher
// Topics suitable for a specific Bloom level
// (Requires bloom level metadata - future enhancement)
MATCH (e:CurriculumEntity)
WHERE e.depth = 2 // Topics only
  AND 'application-security' IN e.scopeTags
RETURN e.name, e.contextSummary
ORDER BY e.name
LIMIT 10
```

### 3. Get Learning Path (Prerequisite Order)

```cypher
// Get all topics in a domain ordered by depth (basic → advanced)
MATCH (domain:CurriculumEntity {depth: 0, name: $domainName})
MATCH (domain)-[:PARENT_OF*]->(topic:CurriculumEntity)
WHERE topic.depth <= 2 // Objectives and Topics only
RETURN topic.name, topic.depth, topic.entityType, topic.contextSummary
ORDER BY topic.depth, topic.name
```

### 4. Discover Related Learning Material

```cypher
// Given a topic, find related topics across domains
MATCH (start:CurriculumEntity {id: $topicId})-[:RELATED_CONCEPT*1..2]-(related)
WHERE related.depth IN [2, 3] // Topics and Subtopics
RETURN DISTINCT related.name, related.domainName, related.contextSummary
LIMIT 10
```

---

## Validation Queries

### Check Data Integrity

```cypher
// Count by entity type
MATCH (e:CurriculumEntity)
RETURN e.entityType AS type, count(*) AS count
ORDER BY
  CASE e.entityType
    WHEN 'Domain' THEN 1
    WHEN 'Objective' THEN 2
    WHEN 'Topic' THEN 3
    WHEN 'Subtopic' THEN 4
    WHEN 'Sub-subtopic' THEN 5
  END
```

**Expected:**
- Domain: 5
- Objective: 28
- Topic: 182
- Subtopic: 538
- Sub-subtopic: 91

### Check for Orphans

```cypher
// Entities without parents (should only be domains)
MATCH (e:CurriculumEntity)
WHERE e.depth > 0 AND NOT (e)-[:CHILD_OF]->()
RETURN e.name, e.depth, e.fullPath
```

**Expected:** 0 results

### Check Context Summary Coverage

```cypher
// Entities without context summaries
MATCH (e:CurriculumEntity)
WHERE e.contextSummary IS NULL OR e.contextSummary = ''
RETURN count(*) AS missingCount
```

**Expected:** 0

### Relationship Statistics

```cypher
// Count relationships by type
MATCH ()-[r]->()
RETURN type(r) AS relationshipType, count(*) AS count
ORDER BY count DESC
```

**Expected:**
- PARENT_OF: 839
- CHILD_OF: 839
- RELATED_CONCEPT: 110

---

## Performance Optimization

### Query Tips

1. **Always filter by depth or entityType** when you know the level:
   ```cypher
   WHERE e.depth = 0  // Instead of WHERE e.entityType = 'Domain'
   ```

2. **Use LIMIT** on potentially large result sets:
   ```cypher
   MATCH (e:CurriculumEntity)
   WHERE 'network-security' IN e.scopeTags
   RETURN e
   LIMIT 50
   ```

3. **Profile slow queries**:
   ```cypher
   PROFILE MATCH (e:CurriculumEntity {name: 'Encryption'})
   RETURN e
   ```

4. **Avoid unbounded variable-length relationships**:
   ```cypher
   // Bad: May traverse entire graph
   MATCH (a)-[*]-(b)

   // Good: Limit depth
   MATCH (a)-[*1..3]-(b)
   ```

---

## Next Steps

### Phase 1 Complete ✅
- [x] 844 entities imported
- [x] Hierarchical relationships created
- [x] Context summaries generated (100%)
- [x] Cross-references identified (110 relationships)
- [x] Scope tags assigned (20 categories)

### Phase 2 - Semantic Relationships (Future)
- [ ] Extract semantic relationships via LLM
  - IS_A, PART_OF, PREVENTS, USES, etc.
- [ ] Add prerequisite learning paths
- [ ] Bloom taxonomy level assignments
- [ ] Difficulty scoring

### Phase 3 - Integration (Future)
- [ ] Sync with Supabase cache
- [ ] Real-time GraphRAG queries in app
- [ ] Question generation pipeline
- [ ] Performance monitoring

---

## References

- **Curriculum Source:** CompTIA Security+ SY0-701
- **Import Scripts:** `scripts/import-to-neo4j.ts`
- **Validation:** `scripts/validate-neo4j.ts`
- **Cross-References:** `scripts/find-cross-references.ts`
- **Scope Tags:** `scripts/add-scope-tags.ts`

---

**Last Updated:** 2024-11-14
**Schema Version:** 2.0 (Production)
