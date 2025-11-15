# Semantic Relationship Schema

**Last Updated:** 2025-11-14
**Phase:** Phase 2 - Semantic Relationships (70% Complete)

This document describes the semantic graph structure in Axium's Neo4j knowledge graph, including relationship types, properties, and query patterns for intelligent learning path generation.

---

## Table of Contents

1. [Overview](#overview)
2. [Graph Structure](#graph-structure)
3. [Relationship Types](#relationship-types)
4. [Entity Properties](#entity-properties)
5. [Query Patterns](#query-patterns)
6. [GraphRAG Integration](#graphrag-integration)
7. [Learning Path Construction](#learning-path-construction)
8. [Difficulty Scoring](#difficulty-scoring)

---

## Overview

The semantic graph extends the hierarchical curriculum structure (Domain → Objective → Topic → Subtopic) with semantic relationships that enable:

- **Prerequisite Learning Paths**: What must be learned before this concept
- **Conceptual Classification**: IS_A relationships (type/instance)
- **Compositional Structure**: PART_OF relationships (whole/part)
- **Cross-Domain Connections**: Related concepts across different domains
- **Difficulty-Aware Progression**: Adaptive learning based on difficulty scores

**Current Status:**
- ✅ 844 entities (5 domains, 35 objectives, 347 topics, 457 subtopics)
- ✅ 450 semantic relationships (399 IS_A, 51 PART_OF)
- ✅ 338 prerequisite relationships (valid DAG, 0 cycles)
- ✅ Difficulty scores for all entities (1-10 scale)
- ⏸️ LLM-based relationships (PREVENTS, USES, DEPENDS_ON) - pending API credits

---

## Graph Structure

### Node Label

All curriculum entities use a single node label:

```cypher
(:CurriculumEntity)
```

### Hierarchical Levels

Entities are organized into 4 hierarchical levels (stored in `level` property):

1. **Domain** (depth 0) - Top-level security areas
   - Example: "Threats, Vulnerabilities, and Mitigations"
2. **Objective** (depth 1) - Learning objectives within a domain
   - Example: "Compare and contrast common threat actors and motivations"
3. **Topic** (depth 2) - Specific topics within an objective
   - Example: "Threat actors"
4. **Subtopic** (depth 3) - Detailed concepts within a topic
   - Example: "Organized crime"

---

## Relationship Types

### 1. Hierarchical Relationships (Phase 1 - Complete)

#### CONTAINS / BELONGS_TO
**Direction:** Parent → Child (CONTAINS), Child → Parent (BELONGS_TO)

```cypher
(parent:CurriculumEntity)-[:CONTAINS]->(child:CurriculumEntity)
(child:CurriculumEntity)-[:BELONGS_TO]->(parent:CurriculumEntity)
```

**Purpose:** Define the curriculum hierarchy

**Example:**
```cypher
(domain:Domain)-[:CONTAINS]->(objective:Objective)
(objective:Objective)-[:BELONGS_TO]->(domain:Domain)
```

#### CHILD_OF / PARENT_OF
**Direction:** Child → Parent (CHILD_OF), Parent → Child (PARENT_OF)

```cypher
(child:CurriculumEntity)-[:CHILD_OF]->(parent:CurriculumEntity)
(parent:CurriculumEntity)-[:PARENT_OF]->(child:CurriculumEntity)
```

**Purpose:** Reverse navigation of hierarchy

**Query Example:**
```cypher
// Get all children of a topic
MATCH (topic:CurriculumEntity {name: "Encryption"})-[:PARENT_OF]->(child)
RETURN child.name
```

---

### 2. Semantic Relationships (Phase 2 - In Progress)

#### IS_A (Classification/Inheritance)
**Direction:** Specific → General

```cypher
(specific:CurriculumEntity)-[:IS_A]->(general:CurriculumEntity)
```

**Purpose:** "X is a type/instance of Y" - establishes conceptual hierarchy

**Properties:**
- `confidence` (float): 0.0-1.0, extraction confidence
- `reasoning` (string): Why this relationship exists
- `extractedFrom` (string): 'hierarchy' | 'llm' | 'pattern'
- `createdAt` (datetime): When created

**Examples:**
```cypher
// "Organized crime" is a type of "Threat actors"
(organizedCrime)-[:IS_A {
  confidence: 0.9,
  reasoning: "Organized crime is a specific type of threat actor",
  extractedFrom: "hierarchy"
}]->(threatActors)

// "RSA" is a type of "Encryption algorithm"
(rsa)-[:IS_A {
  confidence: 0.95,
  reasoning: "RSA is a specific asymmetric encryption algorithm",
  extractedFrom: "pattern"
}]->(encryptionAlgorithm)
```

**Extraction Strategy:**
1. Pattern-based: Plural parent names suggest children are types
   - "Types of attacks" → children are IS_A attacks
2. Keyword-based: Parents with keywords like "categories", "methods", "techniques"
3. LLM-based: (pending) Claude identifies conceptual hierarchies

**Query Pattern:**
```cypher
// Find all types of a concept
MATCH (specific)-[:IS_A]->(general:CurriculumEntity {name: "Encryption"})
RETURN specific.name, specific.contextSummary
```

---

#### PART_OF (Composition/Aggregation)
**Direction:** Part → Whole

```cypher
(part:CurriculumEntity)-[:PART_OF]->(whole:CurriculumEntity)
```

**Purpose:** "X is part of Y" - establishes compositional structure

**Properties:**
- `confidence` (float): 0.0-1.0, extraction confidence
- `reasoning` (string): Why this relationship exists
- `extractedFrom` (string): 'hierarchy' | 'llm' | 'pattern'
- `createdAt` (datetime): When created

**Examples:**
```cypher
// "Authentication" is part of "Access control"
(authentication)-[:PART_OF {
  confidence: 0.85,
  reasoning: "Authentication is a component of access control systems",
  extractedFrom: "hierarchy"
}]->(accessControl)

// "Public key" is part of "PKI"
(publicKey)-[:PART_OF {
  confidence: 0.9,
  reasoning: "Public keys are core components of PKI infrastructure",
  extractedFrom: "pattern"
}]->(pki)
```

**Extraction Strategy:**
1. Hierarchical analysis: Subtopics that are components/features of parent topic
2. Keyword-based: Parents with "components", "elements", "parts"
3. LLM-based: (pending) Claude identifies compositional relationships

**Query Pattern:**
```cypher
// Find all components of a system
MATCH (part)-[:PART_OF]->(whole:CurriculumEntity {name: "PKI"})
RETURN part.name, part.contextSummary
```

---

#### PREREQUISITE (Learning Dependency)
**Direction:** Prerequisite → Dependent (what must be learned BEFORE)

```cypher
(prerequisite:CurriculumEntity)-[:PREREQUISITE]->(dependent:CurriculumEntity)
```

**Purpose:** Define learning order - "must learn X before Y"

**Properties:**
- `strategy` (string): How prerequisite was identified
  - `'hierarchy'`: Parent must be understood before child
  - `'semantic_is_a'`: General concept before specific instance
  - `'part_of'`: Components before whole system
  - `'cross_domain'`: Related concepts across domains
- `confidence` (float): 0.0-1.0, strength of prerequisite relationship
- `reasoning` (string): Educational rationale for prerequisite
- `createdAt` (datetime): When created

**Examples:**
```cypher
// Must understand "Encryption" before "PKI"
(encryption)-[:PREREQUISITE {
  strategy: "part_of",
  confidence: 0.95,
  reasoning: "Encryption is a foundational component of PKI",
  createdAt: datetime()
}]->(pki)

// Must understand "Threat actors" before "Organized crime"
(threatActors)-[:PREREQUISITE {
  strategy: "semantic_is_a",
  confidence: 0.85,
  reasoning: "General concept must be understood before specific instance",
  createdAt: datetime()
}]->(organizedCrime)
```

**DAG Properties:**
- **Acyclic**: 0 cycles (validated)
- **Max Depth**: 2 levels
- **Root Nodes**: 519 entities with no prerequisites (starting points)
- **Total Edges**: 338 prerequisite relationships

**Extraction Strategies:**

1. **Hierarchy Strategy** (depth-based):
   ```cypher
   // Parent concepts are prerequisites for children
   MATCH (parent)-[:PARENT_OF]->(child)
   WHERE parent.level IN ['domain', 'objective', 'topic']
   AND child.level IN ['objective', 'topic', 'subtopic']
   MERGE (parent)-[:PREREQUISITE {strategy: 'hierarchy'}]->(child)
   ```

2. **Semantic IS_A Strategy**:
   ```cypher
   // General concepts are prerequisites for specific instances
   MATCH (specific)-[:IS_A]->(general)
   WHERE NOT EXISTS { (specific)-[:PART_OF]->(general) } // Avoid conflicts
   MERGE (general)-[:PREREQUISITE {strategy: 'semantic_is_a'}]->(specific)
   ```

3. **PART_OF Strategy**:
   ```cypher
   // Parts are prerequisites for understanding the whole
   MATCH (part)-[:PART_OF]->(whole)
   MERGE (part)-[:PREREQUISITE {strategy: 'part_of'}]->(whole)
   ```

4. **Cross-Domain Strategy**:
   ```cypher
   // Related concepts from other domains
   MATCH (a)-[:RELATED_CONCEPT]-(b)
   WHERE a.domainName <> b.domainName
   AND a.difficultyScore < b.difficultyScore
   MERGE (a)-[:PREREQUISITE {strategy: 'cross_domain'}]->(b)
   ```

**Cycle Prevention:**
- IS_A and PART_OF conflicts are resolved (PART_OF takes precedence)
- Transitive checks prevent A → B → C → A cycles
- Validation run after each batch

**Query Patterns:**

Find all prerequisites for a concept:
```cypher
MATCH (prereq)-[:PREREQUISITE]->(concept:CurriculumEntity {name: "PKI"})
RETURN prereq.name, prereq.difficultyScore
ORDER BY prereq.learningDepth ASC
```

Find full learning path to a concept:
```cypher
MATCH path = shortestPath((root)-[:PREREQUISITE*0..]->(target {name: "PKI"}))
WHERE NOT EXISTS { MATCH (other)-[:PREREQUISITE]->(root) }
RETURN [node in nodes(path) | node.name] AS learningPath
```

Find what a concept enables:
```cypher
MATCH (concept:CurriculumEntity {name: "Encryption"})-[:PREREQUISITE]->(dependent)
RETURN dependent.name, dependent.difficultyScore
ORDER BY dependent.learningDepth ASC
```

---

#### RELATED_CONCEPT (Cross-Reference)
**Direction:** Bidirectional (either direction)

```cypher
(a:CurriculumEntity)-[:RELATED_CONCEPT]-(b:CurriculumEntity)
```

**Purpose:** Connect related concepts across different parts of the curriculum

**Properties:**
- `sharedConcept` (string): What concept they share
- `strength` (string): 'high' | 'medium' | 'low'
- `crossDomain` (boolean): Whether concepts are in different domains

**Examples:**
```cypher
// "Encryption" in different domains share cryptographic concepts
(encryptionA)-[:RELATED_CONCEPT {
  sharedConcept: "cryptographic algorithms",
  strength: "high",
  crossDomain: true
}]-(encryptionB)
```

**Query Pattern:**
```cypher
// Find cross-domain related concepts
MATCH (a:CurriculumEntity {name: "Encryption"})-[r:RELATED_CONCEPT]-(b)
WHERE r.crossDomain = true
RETURN b.name, b.domainName, r.sharedConcept
```

---

### 3. Future Relationships (Pending LLM Extraction)

#### PREVENTS (Security Mitigation)
**Direction:** Mitigation → Threat

```cypher
(mitigation:CurriculumEntity)-[:PREVENTS]->(threat:CurriculumEntity)
```

**Purpose:** "X prevents/mitigates Y" - defensive relationships

**Example:**
```cypher
(encryption)-[:PREVENTS {
  effectiveness: "high",
  reasoning: "Encryption prevents unauthorized data access"
}]->(dataTheft)
```

**Status:** ⏸️ Pending (~$5 API credits for LLM extraction)

---

#### USES (Tool/Technique Usage)
**Direction:** Process → Tool

```cypher
(process:CurriculumEntity)-[:USES]->(tool:CurriculumEntity)
```

**Purpose:** "X uses Y" - process dependencies

**Example:**
```cypher
(pki)-[:USES {
  necessity: "required",
  reasoning: "PKI requires certificate authorities to function"
}]->(certificateAuthority)
```

**Status:** ⏸️ Pending (~$5 API credits for LLM extraction)

---

#### DEPENDS_ON (Implementation Dependency)
**Direction:** Dependent → Dependency

```cypher
(dependent:CurriculumEntity)-[:DEPENDS_ON]->(dependency:CurriculumEntity)
```

**Purpose:** "X depends on Y" - technical dependencies

**Example:**
```cypher
(https)-[:DEPENDS_ON {
  reasoning: "HTTPS depends on TLS for secure transport"
}]->(tls)
```

**Status:** ⏸️ Pending (~$5 API credits for LLM extraction)

---

## Entity Properties

### Core Properties (Phase 1)

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `id` | UUID | Unique identifier | `"abc123..."` |
| `name` | String | Entity name | `"Encryption"` |
| `level` | String | Hierarchy level | `"topic"` |
| `depth` | Integer | Hierarchy depth | `2` |
| `fullPath` | String | Complete path | `"Domain > Objective > Topic"` |
| `domainName` | String | Parent domain | `"Security Architecture"` |
| `objectiveName` | String | Parent objective | `"Cryptographic solutions"` |
| `contextSummary` | Text | Educational summary | `"Encryption transforms..."` |
| `scopeTags` | Array<String> | Technical tags | `["cryptography", "security"]` |

### Semantic Properties (Phase 2)

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `difficultyScore` | Integer | 1-10 difficulty | `7` |
| `learningDepth` | Integer | DAG depth | `2` |
| `estimatedStudyTime` | Integer | Minutes | `35` |

### Computed at Query Time

```cypher
MATCH (entity:CurriculumEntity {id: $id})
OPTIONAL MATCH (prereq)-[:PREREQUISITE]->(entity)
RETURN entity.*, count(prereq) as prerequisiteCount
```

---

## Query Patterns

### 1. Get Full Context for Entity

**Purpose:** Retrieve entity with all semantic relationships for GraphRAG

```cypher
MATCH (entity:CurriculumEntity {id: $entityId})
OPTIONAL MATCH (entity)-[:CHILD_OF]->(parent)
OPTIONAL MATCH (entity)-[:CHILD_OF]->(parent)-[:CHILD_OF]->(grandparent)
OPTIONAL MATCH (entity)-[:PARENT_OF]->(child)

// Semantic relationships
OPTIONAL MATCH (entity)-[isa:IS_A]->(isATarget)
OPTIONAL MATCH (entity)-[partof:PART_OF]->(partOfTarget)
OPTIONAL MATCH (prereq)-[preqRel:PREREQUISITE]->(entity)
OPTIONAL MATCH (entity)-[enables:PREREQUISITE]->(dependent)

RETURN
  entity.*,
  parent.name AS parentName,
  grandparent.name AS grandparentName,
  collect(DISTINCT {
    id: isATarget.id,
    name: isATarget.name,
    confidence: isa.confidence
  }) AS isARelationships,
  collect(DISTINCT {
    id: partOfTarget.id,
    name: partOfTarget.name,
    confidence: partof.confidence
  }) AS partOfRelationships,
  collect(DISTINCT {
    id: prereq.id,
    name: prereq.name,
    strategy: preqRel.strategy,
    difficultyScore: prereq.difficultyScore
  }) AS prerequisites,
  collect(DISTINCT {
    id: dependent.id,
    name: dependent.name
  }) AS enablesConcepts
```

**TypeScript Integration:**
```typescript
import { getContextById } from '@/lib/graphrag/context'

const context = await getContextById(entityId)
// Returns GraphRAGContext with semantic relationships
```

---

### 2. Find Learning Path to Target

**Purpose:** Find shortest prerequisite path to reach a target concept

```cypher
MATCH (target:CurriculumEntity {id: $targetId})
MATCH path = shortestPath((root)-[:PREREQUISITE*0..]->(target))
WHERE NOT EXISTS {
  MATCH (other)-[:PREREQUISITE]->(root)
}
WITH path, nodes(path) as pathNodes
ORDER BY length(path) ASC
LIMIT 1
UNWIND pathNodes as node
RETURN
  node.id as id,
  node.name as name,
  node.difficultyScore as difficultyScore,
  node.learningDepth as learningDepth,
  node.estimatedStudyTime as estimatedStudyTime
ORDER BY node.learningDepth ASC
```

**API Endpoint:**
```
GET /api/semantic/learning-path?targetEntity=<entityId>
```

**Response:**
```json
{
  "path": [
    {
      "id": "abc...",
      "name": "Cryptography basics",
      "difficultyScore": 3,
      "learningDepth": 0,
      "estimatedStudyTime": 20
    },
    {
      "id": "def...",
      "name": "Public key cryptography",
      "difficultyScore": 5,
      "learningDepth": 1,
      "estimatedStudyTime": 30
    },
    {
      "id": "ghi...",
      "name": "PKI",
      "difficultyScore": 7,
      "learningDepth": 2,
      "estimatedStudyTime": 45
    }
  ],
  "totalNodes": 3,
  "totalDifficulty": 15,
  "estimatedTotalTime": 95
}
```

---

### 3. Get Recommended Path for Domain

**Purpose:** Get optimal learning order for all topics in a domain

```cypher
MATCH (entity:CurriculumEntity)
WHERE entity.domainName = $domain
  AND entity.level IN ['topic', 'subtopic']
RETURN
  entity.id as id,
  entity.name as name,
  entity.difficultyScore as difficultyScore,
  entity.learningDepth as learningDepth,
  entity.estimatedStudyTime as estimatedStudyTime
ORDER BY entity.learningDepth ASC, entity.difficultyScore ASC
LIMIT 50
```

**API Endpoint:**
```
GET /api/semantic/learning-path?domain=Threats,%20Vulnerabilities,%20and%20Mitigations
```

---

### 4. Find All Prerequisites for Entity

**Purpose:** Get complete list of what must be learned first

```cypher
MATCH (prereq)-[r:PREREQUISITE]->(entity:CurriculumEntity {id: $entityId})
RETURN
  prereq.id as id,
  prereq.name as name,
  r.strategy as strategy,
  r.confidence as confidence,
  r.reasoning as reasoning,
  prereq.difficultyScore as difficultyScore,
  prereq.learningDepth as learningDepth
ORDER BY prereq.learningDepth ASC, prereq.difficultyScore ASC
```

**API Endpoint:**
```
GET /api/semantic/prerequisites/<entityId>
```

**Response:**
```json
{
  "entityId": "abc...",
  "entityName": "PKI",
  "prerequisites": [
    {
      "id": "def...",
      "name": "Encryption",
      "strategy": "part_of",
      "confidence": 0.95,
      "reasoning": "Encryption is a foundational component of PKI",
      "difficultyScore": 5,
      "learningDepth": 0
    },
    {
      "id": "ghi...",
      "name": "Digital certificates",
      "strategy": "part_of",
      "confidence": 0.9,
      "reasoning": "Digital certificates are core to PKI operations",
      "difficultyScore": 6,
      "learningDepth": 1
    }
  ],
  "learningPath": ["Cryptography", "Encryption", "Digital certificates", "PKI"],
  "totalDepth": 2
}
```

---

### 5. Find What a Concept Enables

**Purpose:** Discover what you can learn after mastering this concept

```cypher
MATCH (concept:CurriculumEntity {id: $conceptId})-[:PREREQUISITE]->(dependent)
RETURN
  dependent.id as id,
  dependent.name as name,
  dependent.difficultyScore as difficultyScore,
  dependent.learningDepth as learningDepth
ORDER BY dependent.learningDepth ASC
```

**Usage in UI:**
```typescript
// Show "What you'll unlock" section
const unlocks = context.semanticRelationships.enablesConcepts
```

---

### 6. Validate DAG (No Cycles)

**Purpose:** Ensure prerequisite graph is a valid DAG

```cypher
MATCH path = (a:CurriculumEntity)-[:PREREQUISITE*1..10]->(a)
RETURN count(DISTINCT a) as cycleNodes, count(path) as cyclePaths
```

**Expected Result:** `cycleNodes: 0, cyclePaths: 0`

---

## GraphRAG Integration

The semantic schema powers context-aware question generation through the `GraphRAGContext` interface.

### Context Structure

```typescript
interface GraphRAGContext {
  // Basic entity info
  id: string
  name: string
  entityType: string
  depth: number
  summary: string | null
  fullPath: string

  // Domain context
  domain: string
  objective: string | null
  scopeTags: string[]

  // Hierarchy
  parentName: string | null
  grandparentName: string | null
  children: Array<{ id, name, entityType, summary }>

  // Semantic relationships (Phase 2)
  semanticRelationships: {
    isA: Array<{ id, name, confidence, reasoning }>
    partOf: Array<{ id, name, confidence, reasoning }>
    prerequisites: Array<{
      id, name, strategy, confidence, reasoning,
      difficultyScore?, learningDepth?
    }>
    enablesConcepts: Array<{ id, name, relationshipType }>
  }

  // Learning metadata (Phase 2)
  learningMetadata: {
    difficultyScore: number        // 1-10
    learningDepth: number           // DAG depth
    estimatedStudyTime: number      // minutes
    hasPrerequisites: boolean
    prerequisiteCount: number
  }
}
```

### Formatted Prompt Example

When generating questions, the context is formatted for Claude:

```
Domain: Threats, Vulnerabilities, and Mitigations
Learning Objective: Compare and contrast common threat actors and motivations
Topic: Organized crime
Topic Summary: Organized crime groups are profit-driven threat actors...

Difficulty Level: 6/10
Learning Depth: 1 (DAG depth)
Estimated Study Time: 35 minutes

Prerequisite Knowledge Required:
- Threat actors (difficulty: 2/10)
  Strategy: semantic_is_a
  Why: General concept must be understood before specific instance

This topic is a type/instance of:
- Threat actors

Mastering this topic enables learning:
- Advanced persistent threats (APTs)

Parent Concept: Threat actors
Subtopics:
- Ransomware operations: Detailed breakdown of ransomware business models...
- Dark web marketplaces: Underground economy for stolen data...

Technical Scope: threat-analysis, cybercrime
```

### Benefits for Question Generation

1. **Prerequisite Awareness**: Questions can reference what students should already know
   - "Given your understanding of **Threat actors**, explain how **Organized crime** differs..."

2. **Difficulty Calibration**: Generate questions appropriate to difficulty level
   - Difficulty 6/10 → Bloom Apply/Analyze (not Remember/Understand)

3. **Learning Depth Context**: Scaffold questions based on position in learning path
   - Depth 0 → Foundational questions
   - Depth 2 → Integration questions

4. **Conceptual Relationships**: Reference IS_A and PART_OF in questions
   - "Organized crime is a type of threat actor. What characteristics distinguish it from..."

5. **Future Learning Motivation**: Preview what mastery enables
   - "Understanding organized crime prepares you for studying APTs..."

---

## Learning Path Construction

### Strategy: Multi-Factor Optimal Path

Learning paths are constructed considering:

1. **Prerequisite Dependencies** (primary)
   - Must satisfy all prerequisite relationships
   - Respect DAG ordering

2. **Difficulty Progression** (secondary)
   - Start with lower difficulty concepts
   - Gradually increase difficulty

3. **Learning Depth** (tertiary)
   - Breadth-first: Learn all depth-0 before depth-1
   - Or depth-first: Follow single path to target

4. **Estimated Study Time** (optimization)
   - Balance session length
   - Group related concepts

### Example Learning Path Algorithm

```cypher
// Breadth-first optimal path for domain
MATCH (entity:CurriculumEntity)
WHERE entity.domainName = "Security Architecture"
  AND entity.level IN ['topic', 'subtopic']
WITH entity
ORDER BY
  entity.learningDepth ASC,      // Depth-first
  entity.difficultyScore ASC,    // Easier first
  entity.estimatedStudyTime ASC  // Shorter first
RETURN entity
LIMIT 50
```

### Path Validation

Before presenting a learning path:

1. **Prerequisite Check**: All prerequisites satisfied before dependent
2. **Cycle Check**: No circular dependencies
3. **Difficulty Curve**: No sudden difficulty spikes (max +2 per step)
4. **Time Budget**: Total time fits user session length

---

## Difficulty Scoring

### Scoring Formula

```
difficultyScore = (
  depthScore * 0.4 +
  prereqScore * 0.3 +
  levelScore * 0.2 +
  complexityScore * 0.1
)

Normalized to 1-10 scale
```

### Component Scores

1. **Depth Score** (40% weight):
   ```
   depthScore = min(learningDepth * 2, 4)  // Max 4 points
   ```
   - Deeper in DAG = more complex

2. **Prerequisite Score** (30% weight):
   ```
   prereqScore = min(prerequisiteCount * 0.5, 3)  // Max 3 points
   ```
   - More prerequisites = more complex

3. **Level Score** (20% weight):
   ```
   levelScore = {
     'domain': 0,
     'objective': 0.5,
     'topic': 1,
     'subtopic': 2
   }
   ```
   - Subtopics are more specific/complex

4. **Complexity Score** (10% weight):
   ```
   complexityScore = summaryLength + keywordCount
   // Advanced keywords: "advanced", "complex", "cryptographic", etc.
   ```

### Distribution

Current scores across 844 entities:

| Range | Count | Percentage | Label |
|-------|-------|------------|-------|
| 1-2 | 115 | 13.6% | Very Easy |
| 3-4 | 598 | 70.9% | Easy/Medium |
| 5-6 | 105 | 12.4% | Medium/Hard |
| 7-8 | 26 | 3.1% | Hard |
| 9-10 | 0 | 0% | Very Hard |

**Average:** 3.44/10

**Interpretation:** Most concepts are foundational (appropriate for certification training), with a long tail of complex topics.

### Use in Adaptive Learning

```typescript
// Select question difficulty based on entity difficulty
const questionBloomLevel = Math.ceil(entity.difficultyScore / 2)
// Difficulty 1-2 → Bloom 1 (Remember)
// Difficulty 3-4 → Bloom 2 (Understand)
// Difficulty 5-6 → Bloom 3 (Apply)
// Difficulty 7-8 → Bloom 4 (Analyze)
// Difficulty 9-10 → Bloom 5-6 (Evaluate/Create)
```

---

## Implementation Status

### Completed (Phase 2 - 70%)

- ✅ IS_A relationships (399 extracted)
- ✅ PART_OF relationships (51 extracted)
- ✅ PREREQUISITE DAG (338 relationships, 0 cycles)
- ✅ Difficulty scoring (all 844 entities)
- ✅ Learning depth calculation
- ✅ GraphRAG context enhancement
- ✅ API endpoints for semantic queries
- ✅ Query pattern validation (100% pass rate)

### Pending (Phase 2 - 30%)

- ⏸️ PREVENTS relationships (requires ~$5 LLM calls)
- ⏸️ USES relationships (requires ~$5 LLM calls)
- ⏸️ DEPENDS_ON relationships (requires ~$5 LLM calls)
- ⏸️ Bloom taxonomy assignment (requires LLM)

### Phase 3 (Supabase Integration)

- ⏸️ Cache semantic data in PostgreSQL
- ⏸️ Real-time sync Neo4j → Supabase
- ⏸️ GraphQL API for client queries

---

## Query Performance

### Benchmarks (Neo4j AuraDB Free Tier)

| Query Type | Avg Time | Notes |
|------------|----------|-------|
| Single entity context | <50ms | With all semantic relationships |
| Prerequisite path (depth 2) | <100ms | Shortest path algorithm |
| Domain learning path (50 entities) | <200ms | Sorted by depth + difficulty |
| DAG validation (full graph) | <500ms | Cycle detection across 844 nodes |

### Optimization Strategies

1. **Indexes** (already created):
   ```cypher
   CREATE INDEX entity_id FOR (e:CurriculumEntity) ON (e.id)
   CREATE INDEX entity_name FOR (e:CurriculumEntity) ON (e.name)
   CREATE INDEX entity_path FOR (e:CurriculumEntity) ON (e.fullPath)
   CREATE INDEX entity_domain FOR (e:CurriculumEntity) ON (e.domainName)
   CREATE INDEX entity_level FOR (e:CurriculumEntity) ON (e.level)
   ```

2. **Query Hints**:
   ```cypher
   USING INDEX entity:CurriculumEntity(id)
   MATCH (entity:CurriculumEntity {id: $id})
   ```

3. **Limit Early**:
   ```cypher
   // Good: Limit before collecting
   MATCH (entity:CurriculumEntity)
   WHERE entity.domainName = $domain
   WITH entity LIMIT 50
   OPTIONAL MATCH (entity)-[:PREREQUISITE]->(...)

   // Bad: Limit after collecting (processes all relationships)
   MATCH (entity:CurriculumEntity)
   WHERE entity.domainName = $domain
   OPTIONAL MATCH (entity)-[:PREREQUISITE]->(...)
   RETURN ... LIMIT 50
   ```

---

## References

- **Phase 1 Documentation**: `PHASE_1_COMPLETE.md`
- **Phase 2 Progress**: `PHASE_2_PROGRESS.md`
- **API Documentation**: `docs/API_QUESTION_GENERATION.md`
- **Neo4j Schema Setup**: `scripts/setup-neo4j-schema.cypher`
- **GraphRAG Context**: `lib/graphrag/context.ts`
- **Test Suite**: `scripts/test-graphrag-context.ts`

---

**Next Steps:**
1. Complete LLM-based relationship extraction (~$10-15 API credits)
2. Implement Supabase caching layer (Phase 3)
3. Build frontend learning interface to utilize semantic paths

**Last Updated:** 2025-11-14
**Maintained By:** Axium Development Team
