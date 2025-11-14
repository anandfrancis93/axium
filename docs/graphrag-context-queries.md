# GraphRAG Context Retrieval Queries

This document defines the Neo4j query patterns for retrieving rich context used in question generation.

## Query Design Principles

1. **Rich Context** - Include entity + ancestors + descendants + related concepts
2. **Flexible Lookup** - Support lookup by ID, name, or fullPath
3. **Performance** - Use OPTIONAL MATCH to handle missing relationships gracefully
4. **Structured Output** - Return consistent JSON-like structure for LLM consumption

## Core Query Patterns

### 1. Get Full Context by Entity ID

**Use Case:** API route receives entity UUID, needs complete context for question generation.

```cypher
MATCH (entity:CurriculumEntity {id: $entityId})
OPTIONAL MATCH (entity)-[:CHILD_OF]->(parent)
OPTIONAL MATCH (entity)-[:CHILD_OF]->(parent)-[:CHILD_OF]->(grandparent)
OPTIONAL MATCH (entity)-[:PARENT_OF]->(child)
OPTIONAL MATCH (entity)-[:PARENT_OF]->(child)-[:PARENT_OF]->(grandchild)
OPTIONAL MATCH (entity)-[r:RELATED_CONCEPT]-(related)
RETURN
  entity.id AS id,
  entity.name AS name,
  entity.entityType AS entityType,
  entity.depth AS depth,
  entity.contextSummary AS summary,
  entity.fullPath AS fullPath,
  entity.domainName AS domain,
  entity.objectiveName AS objective,
  entity.scopeTags AS scopeTags,

  -- Ancestry
  parent.name AS parentName,
  parent.id AS parentId,
  grandparent.name AS grandparentName,
  grandparent.id AS grandparentId,

  -- Children
  collect(DISTINCT {
    id: child.id,
    name: child.name,
    entityType: child.entityType,
    summary: child.contextSummary
  }) AS children,

  -- Grandchildren (for topics/objectives)
  collect(DISTINCT {
    id: grandchild.id,
    name: grandchild.name,
    entityType: grandchild.entityType
  }) AS grandchildren,

  -- Related concepts (cross-references)
  collect(DISTINCT {
    id: related.id,
    name: related.name,
    domain: related.domainName,
    sharedConcept: r.sharedConcept,
    strength: r.strength,
    crossDomain: r.crossDomain
  }) AS relatedConcepts
```

**Parameters:**
- `entityId` (UUID string)

**Returns:** Single record with complete entity context

---

### 2. Get Context by Name

**Use Case:** User searches for topic by name (e.g., "Encryption")

```cypher
MATCH (entity:CurriculumEntity)
WHERE entity.name = $name
OPTIONAL MATCH (entity)-[:CHILD_OF]->(parent)
OPTIONAL MATCH (entity)-[:CHILD_OF]->(parent)-[:CHILD_OF]->(grandparent)
OPTIONAL MATCH (entity)-[:PARENT_OF]->(child)
OPTIONAL MATCH (entity)-[r:RELATED_CONCEPT]-(related)
WITH entity, parent, grandparent,
     collect(DISTINCT {id: child.id, name: child.name, summary: child.contextSummary}) AS children,
     collect(DISTINCT {id: related.id, name: related.name, domain: related.domainName, sharedConcept: r.sharedConcept}) AS relatedConcepts
RETURN
  entity.id AS id,
  entity.name AS name,
  entity.entityType AS entityType,
  entity.contextSummary AS summary,
  entity.fullPath AS fullPath,
  entity.domainName AS domain,
  entity.scopeTags AS scopeTags,
  parent.name AS parentName,
  grandparent.name AS grandparentName,
  children,
  relatedConcepts
ORDER BY entity.fullPath
```

**Parameters:**
- `name` (string)

**Returns:** Multiple records if name appears in different domains (e.g., "Encryption" in multiple contexts)

**Note:** For disambiguation, client should present all matches with fullPath for user selection.

---

### 3. Get Context by Full Path (Unique Lookup)

**Use Case:** Guarantee unique entity retrieval when fullPath is known.

```cypher
MATCH (entity:CurriculumEntity {fullPath: $fullPath})
OPTIONAL MATCH (entity)-[:CHILD_OF]->(parent)
OPTIONAL MATCH (entity)-[:CHILD_OF]->(parent)-[:CHILD_OF]->(grandparent)
OPTIONAL MATCH (entity)-[:PARENT_OF]->(child)
OPTIONAL MATCH (entity)-[r:RELATED_CONCEPT]-(related)
RETURN
  entity.id AS id,
  entity.name AS name,
  entity.entityType AS entityType,
  entity.contextSummary AS summary,
  entity.fullPath AS fullPath,
  entity.domainName AS domain,
  entity.objectiveName AS objective,
  entity.scopeTags AS scopeTags,
  parent.name AS parentName,
  parent.id AS parentId,
  grandparent.name AS grandparentName,
  collect(DISTINCT {id: child.id, name: child.name, summary: child.contextSummary}) AS children,
  collect(DISTINCT {id: related.id, name: related.name, domain: related.domainName, sharedConcept: r.sharedConcept, strength: r.strength}) AS relatedConcepts
```

**Parameters:**
- `fullPath` (string, e.g., "General Security Concepts > Compare and contrast security implications of different architecture models > Architecture and infrastructure concepts > Encryption")

**Returns:** Single record (fullPath is unique)

---

### 4. Get Sibling Topics (Same Parent)

**Use Case:** Show related topics at same level for context expansion.

```cypher
MATCH (entity:CurriculumEntity {id: $entityId})
MATCH (entity)-[:CHILD_OF]->(parent)
MATCH (parent)<-[:CHILD_OF]-(sibling)
WHERE sibling.id <> entity.id
RETURN
  sibling.id AS id,
  sibling.name AS name,
  sibling.contextSummary AS summary,
  sibling.scopeTags AS scopeTags
ORDER BY sibling.name
LIMIT 10
```

**Parameters:**
- `entityId` (UUID)

**Returns:** List of sibling entities

---

### 5. Get All Topics for Domain

**Use Case:** Generate questions across entire domain.

```cypher
MATCH (entity:CurriculumEntity)
WHERE entity.domainName = $domainName
  AND entity.depth >= 2  -- Topics and below, exclude domain/objective
RETURN
  entity.id AS id,
  entity.name AS name,
  entity.entityType AS entityType,
  entity.fullPath AS fullPath,
  entity.contextSummary AS summary,
  entity.scopeTags AS scopeTags
ORDER BY entity.fullPath
```

**Parameters:**
- `domainName` (string)

**Returns:** List of all topics/subtopics in domain

---

### 6. Search by Scope Tag

**Use Case:** Generate questions filtered by technical area (e.g., "cryptography", "network-security").

```cypher
MATCH (entity:CurriculumEntity)
WHERE $scopeTag IN entity.scopeTags
  AND entity.depth >= 2
RETURN
  entity.id AS id,
  entity.name AS name,
  entity.entityType AS entityType,
  entity.fullPath AS fullPath,
  entity.domainName AS domain,
  entity.contextSummary AS summary,
  entity.scopeTags AS scopeTags
ORDER BY entity.fullPath
LIMIT 50
```

**Parameters:**
- `scopeTag` (string, e.g., "cryptography")

**Returns:** Up to 50 entities matching scope tag

---

## Context Structure for Question Generation

The queries return data that should be formatted into this structure for the LLM:

```typescript
interface GraphRAGContext {
  // Entity details
  id: string
  name: string
  entityType: string
  depth: number
  summary: string
  fullPath: string

  // Domain context
  domain: string
  objective: string | null
  scopeTags: string[]

  // Hierarchy
  parentName: string | null
  parentId: string | null
  grandparentName: string | null

  // Descendants
  children: Array<{
    id: string
    name: string
    entityType: string
    summary: string | null
  }>

  // Related concepts
  relatedConcepts: Array<{
    id: string
    name: string
    domain: string
    sharedConcept: string
    strength: 'high' | 'medium' | 'low'
    crossDomain: boolean
  }>

  // Siblings (optional)
  siblings?: Array<{
    id: string
    name: string
    summary: string | null
  }>
}
```

## LLM Prompt Context Template

When passing context to Claude for question generation:

```
Domain: {domain}
Learning Objective: {objective}
Topic: {name}
Topic Summary: {summary}

Parent Concept: {parentName}
Grandparent Concept: {grandparentName}

Subtopics:
{children.map(c => `- ${c.name}: ${c.summary}`).join('\n')}

Related Concepts (Cross-Domain):
{relatedConcepts.filter(r => r.crossDomain).map(r => `- ${r.name} (${r.domain}): shared concept "${r.sharedConcept}"`).join('\n')}

Technical Scope: {scopeTags.join(', ')}
```

## Performance Considerations

1. **Indexes Required:**
   - `CREATE INDEX idx_entity_id ON CurriculumEntity(id)` ✅ (via constraint)
   - `CREATE INDEX idx_entity_name ON CurriculumEntity(name)` ✅ (exists)
   - `CREATE INDEX idx_entity_fullPath ON CurriculumEntity(fullPath)` ✅ (exists)
   - `CREATE INDEX idx_entity_domain ON CurriculumEntity(domainName)` ✅ (exists)

2. **Query Performance:**
   - All queries use indexed properties for MATCH
   - OPTIONAL MATCH for relationships (graceful degradation)
   - LIMIT clauses prevent unbounded result sets
   - Expected response time: <50ms for single entity, <200ms for lists

3. **Caching Strategy:**
   - Cache full context by entityId in `graphrag_query_cache` table
   - 7-day expiration
   - Track hit count for popular topics
   - Pre-cache top 100 most accessed topics

## Next Steps

1. ✅ Design query patterns (this document)
2. ⏳ Create TypeScript utility functions to execute queries
3. ⏳ Build API route `/api/graphrag/context/[entityId]`
4. ⏳ Test on 10 sample topics
5. ⏳ Integrate with Claude question generation
