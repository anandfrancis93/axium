# Semantic API Documentation

**Last Updated:** 2025-11-14
**Version:** 1.0
**Base URL:** `/api/semantic`

This document describes the Semantic API endpoints for accessing prerequisite relationships, learning paths, and difficulty-based progression in the Axium knowledge graph.

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Endpoints](#endpoints)
   - [Get Prerequisites](#get-prerequisites)
   - [Get Learning Path](#get-learning-path)
4. [Data Models](#data-models)
5. [Error Handling](#error-handling)
6. [Usage Examples](#usage-examples)
7. [Integration Guide](#integration-guide)

---

## Overview

The Semantic API provides access to Phase 2 semantic relationships in the Neo4j knowledge graph, enabling:

- **Prerequisite Discovery**: Find what must be learned before a concept
- **Learning Path Generation**: Build optimal learning sequences
- **Difficulty-Aware Progression**: Adapt to student readiness
- **Cross-Reference Navigation**: Explore related concepts

**Current Coverage:**
- 844 curriculum entities
- 338 prerequisite relationships
- 450 semantic relationships (IS_A, PART_OF)
- Difficulty scores for all entities (1-10 scale)

---

## Authentication

**Status:** Currently no authentication required (development)

**Future:** Will require authenticated user session for personalized paths

```typescript
// Future authentication pattern
const response = await fetch('/api/semantic/learning-path', {
  headers: {
    'Authorization': `Bearer ${session.accessToken}`
  }
})
```

---

## Endpoints

### Get Prerequisites

Get all prerequisite relationships for a specific entity, including learning paths and metadata.

#### Endpoint

```
GET /api/semantic/prerequisites/[entityId]
```

#### Parameters

| Parameter | Type | Location | Required | Description |
|-----------|------|----------|----------|-------------|
| `entityId` | UUID | Path | Yes | UUID of the curriculum entity |

#### Response Schema

```typescript
interface PrerequisiteResponse {
  entityId: string
  entityName: string
  prerequisites: Prerequisite[]
  learningPath: string[]
  totalDepth: number
  estimatedStudyOrder: number
}

interface Prerequisite {
  id: string
  name: string
  level: string                  // 'domain' | 'objective' | 'topic' | 'subtopic'
  relationshipType: string       // 'PREREQUISITE'
  strategy: string               // How prerequisite was identified
  confidence: number             // 0.0-1.0
  reasoning: string              // Educational rationale
  difficultyScore: number        // 1-10
  learningDepth: number          // Position in DAG
}
```

#### Prerequisite Strategies

| Strategy | Description | Example |
|----------|-------------|---------|
| `hierarchy` | Parent must be learned before child | Domain → Objective |
| `semantic_is_a` | General before specific | Threat actors → Organized crime |
| `part_of` | Components before whole | Encryption → PKI |
| `cross_domain` | Related concepts across domains | Encryption (Architecture) → Encryption (Concepts) |

#### Example Request

```bash
curl http://localhost:3000/api/semantic/prerequisites/abc123-def456-ghi789
```

#### Example Response

```json
{
  "entityId": "abc123-def456-ghi789",
  "entityName": "Public Key Infrastructure (PKI)",
  "prerequisites": [
    {
      "id": "def456-abc123-xyz789",
      "name": "Encryption",
      "level": "topic",
      "relationshipType": "PREREQUISITE",
      "strategy": "part_of",
      "confidence": 0.95,
      "reasoning": "Encryption is a foundational component of PKI systems",
      "difficultyScore": 5,
      "learningDepth": 0
    },
    {
      "id": "ghi789-def456-abc123",
      "name": "Digital certificates",
      "level": "subtopic",
      "relationshipType": "PREREQUISITE",
      "strategy": "part_of",
      "confidence": 0.9,
      "reasoning": "Digital certificates are core components of PKI operations",
      "difficultyScore": 6,
      "learningDepth": 1
    },
    {
      "id": "xyz789-ghi789-def456",
      "name": "Certificate authorities",
      "level": "subtopic",
      "relationshipType": "PREREQUISITE",
      "strategy": "part_of",
      "confidence": 0.9,
      "reasoning": "CAs are essential to PKI trust models",
      "difficultyScore": 6,
      "learningDepth": 1
    }
  ],
  "learningPath": [
    "Cryptographic solutions",
    "Encryption",
    "Digital certificates",
    "Certificate authorities",
    "Public Key Infrastructure (PKI)"
  ],
  "totalDepth": 2,
  "estimatedStudyOrder": 27
}
```

#### Response Fields

| Field | Description |
|-------|-------------|
| `entityId` | UUID of the requested entity |
| `entityName` | Display name of the entity |
| `prerequisites` | Array of prerequisite entities (ordered by depth, then difficulty) |
| `learningPath` | Complete path from root to this entity |
| `totalDepth` | Maximum prerequisite depth (DAG depth) |
| `estimatedStudyOrder` | Suggested order in curriculum (depth × 10 + difficulty / 2) |

#### Error Responses

**404 Not Found** - Entity does not exist
```json
{
  "error": "Entity not found"
}
```

**500 Internal Server Error** - Database connection failed
```json
{
  "error": "Failed to fetch prerequisites",
  "message": "Connection timeout"
}
```

#### Implementation

```typescript
// app/api/semantic/prerequisites/[entityId]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ entityId: string }> }
) {
  const { entityId } = await params

  const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD))
  const session = driver.session()

  try {
    // Get entity info
    const entityResult = await session.run(`
      MATCH (entity:CurriculumEntity {id: $entityId})
      RETURN entity.name as name, entity.learningDepth as learningDepth
    `, { entityId })

    if (entityResult.records.length === 0) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 })
    }

    // Get all prerequisites
    const prereqResult = await session.run(`
      MATCH (prereq)-[r:PREREQUISITE]->(entity:CurriculumEntity {id: $entityId})
      RETURN prereq.*, r.*
      ORDER BY prereq.learningDepth ASC, prereq.difficultyScore ASC
    `, { entityId })

    // Get learning path
    const pathResult = await session.run(`
      MATCH path = shortestPath((root)-[:PREREQUISITE*]->(entity {id: $entityId}))
      WHERE NOT EXISTS { MATCH (other)-[:PREREQUISITE]->(root) }
      RETURN [node in nodes(path) | node.name] AS pathNames
      LIMIT 1
    `, { entityId })

    return NextResponse.json({
      entityId,
      entityName: entityResult.records[0].get('name'),
      prerequisites: /* ... map prereqResult ... */,
      learningPath: pathResult.records[0]?.get('pathNames') || [],
      totalDepth: entityResult.records[0].get('learningDepth'),
      estimatedStudyOrder: /* ... calculate ... */
    })
  } finally {
    await session.close()
    await driver.close()
  }
}
```

---

### Get Learning Path

Generate optimal learning paths for a domain or to reach a specific entity.

#### Endpoint

```
GET /api/semantic/learning-path
```

#### Query Parameters

**Option 1: Domain-based path** (recommended for beginners)
```
?domain=<domainName>
```

**Option 2: Target-based path** (for goal-oriented learning)
```
?targetEntity=<entityId>
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domain` | String | Yes* | Name of curriculum domain |
| `targetEntity` | UUID | Yes* | UUID of target entity to reach |

*Exactly one parameter required (domain OR targetEntity)

#### Response Schema

```typescript
interface LearningPath {
  path: PathNode[]
  totalNodes: number
  totalDifficulty: number
  estimatedTotalTime: number    // minutes
  startingPoints: PathNode[]
}

interface PathNode {
  id: string
  name: string
  level: string                  // 'topic' | 'subtopic'
  difficultyScore: number        // 1-10
  learningDepth: number          // Position in DAG
  estimatedStudyTime: number     // minutes
}
```

#### Example Request (Domain-based)

```bash
curl "http://localhost:3000/api/semantic/learning-path?domain=Security%20Architecture"
```

#### Example Response (Domain-based)

```json
{
  "path": [
    {
      "id": "abc-123",
      "name": "Security controls",
      "level": "topic",
      "difficultyScore": 2,
      "learningDepth": 0,
      "estimatedStudyTime": 25
    },
    {
      "id": "def-456",
      "name": "Authentication methods",
      "level": "subtopic",
      "difficultyScore": 3,
      "learningDepth": 0,
      "estimatedStudyTime": 30
    },
    {
      "id": "ghi-789",
      "name": "Multi-factor authentication",
      "level": "subtopic",
      "difficultyScore": 4,
      "learningDepth": 1,
      "estimatedStudyTime": 35
    },
    {
      "id": "jkl-012",
      "name": "Biometric authentication",
      "level": "subtopic",
      "difficultyScore": 5,
      "learningDepth": 1,
      "estimatedStudyTime": 40
    }
  ],
  "totalNodes": 4,
  "totalDifficulty": 14,
  "estimatedTotalTime": 130,
  "startingPoints": [
    {
      "id": "abc-123",
      "name": "Security controls",
      "level": "topic",
      "difficultyScore": 2,
      "learningDepth": 0,
      "estimatedStudyTime": 25
    },
    {
      "id": "def-456",
      "name": "Authentication methods",
      "level": "subtopic",
      "difficultyScore": 3,
      "learningDepth": 0,
      "estimatedStudyTime": 30
    }
  ]
}
```

#### Example Request (Target-based)

```bash
curl "http://localhost:3000/api/semantic/learning-path?targetEntity=abc123-def456-ghi789"
```

#### Example Response (Target-based)

```json
{
  "path": [
    {
      "id": "root-001",
      "name": "Cryptographic solutions",
      "level": "objective",
      "difficultyScore": 1,
      "learningDepth": 0,
      "estimatedStudyTime": 20
    },
    {
      "id": "step-002",
      "name": "Encryption",
      "level": "topic",
      "difficultyScore": 5,
      "learningDepth": 1,
      "estimatedStudyTime": 40
    },
    {
      "id": "target-003",
      "name": "Public Key Infrastructure (PKI)",
      "level": "topic",
      "difficultyScore": 7,
      "learningDepth": 2,
      "estimatedStudyTime": 60
    }
  ],
  "totalNodes": 3,
  "totalDifficulty": 13,
  "estimatedTotalTime": 120,
  "startingPoints": [
    {
      "id": "root-001",
      "name": "Cryptographic solutions",
      "level": "objective",
      "difficultyScore": 1,
      "learningDepth": 0,
      "estimatedStudyTime": 20
    }
  ]
}
```

#### Response Fields

| Field | Description |
|-------|-------------|
| `path` | Ordered array of topics to study (by depth, then difficulty) |
| `totalNodes` | Number of concepts in the path |
| `totalDifficulty` | Sum of all difficulty scores |
| `estimatedTotalTime` | Total study time in minutes |
| `startingPoints` | Recommended starting concepts (no prerequisites) |

#### Study Time Calculation

```typescript
function estimateStudyTime(difficultyScore: number): number {
  // Base: 15 minutes
  // Add 5 minutes per difficulty point
  return 15 + (difficultyScore * 5)
}

// Examples:
// Difficulty 1 → 20 minutes
// Difficulty 5 → 40 minutes
// Difficulty 10 → 65 minutes
```

#### Error Responses

**400 Bad Request** - Missing or invalid parameters
```json
{
  "error": "Must specify either domain or targetEntity"
}
```

**500 Internal Server Error** - Neo4j connection failed
```json
{
  "error": "Failed to generate learning path",
  "message": "Neo4j connection not configured"
}
```

#### Implementation

```typescript
// app/api/semantic/learning-path/route.ts
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const domain = searchParams.get('domain')
  const targetEntityId = searchParams.get('targetEntity')

  if (!domain && !targetEntityId) {
    return NextResponse.json(
      { error: 'Must specify either domain or targetEntity' },
      { status: 400 }
    )
  }

  const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD))
  const session = driver.session()

  try {
    let learningPath: LearningPath

    if (targetEntityId) {
      learningPath = await getPathToEntity(session, targetEntityId)
    } else if (domain) {
      learningPath = await getPathForDomain(session, domain)
    }

    return NextResponse.json(learningPath)
  } finally {
    await session.close()
    await driver.close()
  }
}

async function getPathToEntity(session: any, targetEntityId: string): Promise<LearningPath> {
  // Find shortest path from any root to target
  const result = await session.run(`
    MATCH (target:CurriculumEntity {id: $targetEntityId})
    MATCH path = shortestPath((root)-[:PREREQUISITE*0..]->(target))
    WHERE NOT EXISTS { MATCH (other)-[:PREREQUISITE]->(root) }
    WITH path, nodes(path) as pathNodes
    ORDER BY length(path) ASC
    LIMIT 1
    UNWIND pathNodes as node
    RETURN node.*
    ORDER BY node.learningDepth ASC
  `, { targetEntityId })

  const path = result.records.map(/* ... */)
  return { path, totalNodes: path.length, /* ... */ }
}

async function getPathForDomain(session: any, domain: string): Promise<LearningPath> {
  // Get all entities in domain, ordered by depth and difficulty
  const result = await session.run(`
    MATCH (entity:CurriculumEntity)
    WHERE entity.domainName = $domain
      AND entity.level IN ['topic', 'subtopic']
    RETURN entity.*
    ORDER BY entity.learningDepth ASC, entity.difficultyScore ASC
    LIMIT 50
  `, { domain })

  const path = result.records.map(/* ... */)
  return { path, /* ... */ }
}
```

---

## Data Models

### PathNode

Represents a single step in a learning path.

```typescript
interface PathNode {
  id: string                    // UUID
  name: string                  // Display name
  level: 'topic' | 'subtopic'   // Hierarchy level
  difficultyScore: number       // 1-10
  learningDepth: number         // 0-N (DAG depth)
  estimatedStudyTime: number    // Minutes
}
```

### Prerequisite

Represents a prerequisite relationship with metadata.

```typescript
interface Prerequisite {
  id: string                    // UUID of prerequisite entity
  name: string                  // Display name
  level: string                 // Hierarchy level
  relationshipType: 'PREREQUISITE'
  strategy: string              // How prerequisite was identified
  confidence: number            // 0.0-1.0
  reasoning: string             // Educational rationale
  difficultyScore: number       // 1-10
  learningDepth: number         // DAG depth
}
```

### LearningPath

Complete learning path with metadata.

```typescript
interface LearningPath {
  path: PathNode[]              // Ordered learning sequence
  totalNodes: number            // Number of concepts
  totalDifficulty: number       // Sum of difficulties
  estimatedTotalTime: number    // Total minutes
  startingPoints: PathNode[]    // Recommended starting concepts
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful request |
| 400 | Bad Request | Missing or invalid parameters |
| 404 | Not Found | Entity ID does not exist |
| 500 | Internal Server Error | Database connection failed or query error |

### Error Response Format

All errors follow this format:

```typescript
interface ErrorResponse {
  error: string           // Short error description
  message?: string        // Detailed error message (optional)
}
```

### Error Handling Example

```typescript
try {
  const response = await fetch(`/api/semantic/prerequisites/${entityId}`)

  if (!response.ok) {
    const error = await response.json()

    if (response.status === 404) {
      console.error('Entity not found:', error.error)
      // Show "Topic not available" message
    } else if (response.status === 500) {
      console.error('Server error:', error.message)
      // Show "Try again later" message
    }

    return null
  }

  const data = await response.json()
  return data
} catch (error) {
  console.error('Network error:', error)
  // Show "Check your connection" message
  return null
}
```

---

## Usage Examples

### React Hook: Fetch Prerequisites

```typescript
// hooks/usePrerequisites.ts
import { useState, useEffect } from 'react'

interface UsePrerequisitesResult {
  prerequisites: Prerequisite[]
  learningPath: string[]
  loading: boolean
  error: string | null
}

export function usePrerequisites(entityId: string): UsePrerequisitesResult {
  const [data, setData] = useState<PrerequisiteResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPrerequisites() {
      try {
        setLoading(true)
        const response = await fetch(`/api/semantic/prerequisites/${entityId}`)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch prerequisites')
        }

        const result = await response.json()
        setData(result)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    if (entityId) {
      fetchPrerequisites()
    }
  }, [entityId])

  return {
    prerequisites: data?.prerequisites || [],
    learningPath: data?.learningPath || [],
    loading,
    error
  }
}

// Usage in component
function TopicPrerequisites({ topicId }: { topicId: string }) {
  const { prerequisites, learningPath, loading, error } = usePrerequisites(topicId)

  if (loading) return <div>Loading prerequisites...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      <h3>What to learn first:</h3>
      <ul>
        {prerequisites.map(prereq => (
          <li key={prereq.id}>
            {prereq.name} (Difficulty: {prereq.difficultyScore}/10)
          </li>
        ))}
      </ul>

      <h3>Learning Path:</h3>
      <ol>
        {learningPath.map((step, index) => (
          <li key={index}>{step}</li>
        ))}
      </ol>
    </div>
  )
}
```

---

### React Hook: Fetch Learning Path

```typescript
// hooks/useLearningPath.ts
import { useState, useEffect } from 'react'

interface UseLearningPathOptions {
  domain?: string
  targetEntity?: string
}

export function useLearningPath({ domain, targetEntity }: UseLearningPathOptions) {
  const [path, setPath] = useState<LearningPath | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPath() {
      if (!domain && !targetEntity) {
        setError('Must specify domain or targetEntity')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const params = new URLSearchParams()
        if (domain) params.set('domain', domain)
        if (targetEntity) params.set('targetEntity', targetEntity)

        const response = await fetch(`/api/semantic/learning-path?${params}`)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch learning path')
        }

        const result = await response.json()
        setPath(result)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchPath()
  }, [domain, targetEntity])

  return { path, loading, error }
}

// Usage in component
function DomainLearningPath({ domain }: { domain: string }) {
  const { path, loading, error } = useLearningPath({ domain })

  if (loading) return <div>Generating learning path...</div>
  if (error) return <div>Error: {error}</div>
  if (!path) return null

  return (
    <div>
      <h2>Learning Path for {domain}</h2>
      <p>Total time: {path.estimatedTotalTime} minutes</p>
      <p>Difficulty: {path.totalDifficulty}/10</p>

      <h3>Start here:</h3>
      <ul>
        {path.startingPoints.map(node => (
          <li key={node.id}>{node.name} ({node.estimatedStudyTime} min)</li>
        ))}
      </ul>

      <h3>Complete path ({path.totalNodes} topics):</h3>
      <ol>
        {path.path.map(node => (
          <li key={node.id}>
            {node.name} - Difficulty: {node.difficultyScore}/10, Time: {node.estimatedStudyTime} min
          </li>
        ))}
      </ol>
    </div>
  )
}
```

---

### Server-Side Data Fetching (Next.js)

```typescript
// app/topic/[id]/page.tsx
import { getContextById } from '@/lib/graphrag/context'

export default async function TopicPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const context = await getContextById(id)

  if (!context) {
    return <div>Topic not found</div>
  }

  return (
    <div>
      <h1>{context.name}</h1>
      <p>Difficulty: {context.learningMetadata.difficultyScore}/10</p>
      <p>Study time: {context.learningMetadata.estimatedStudyTime} minutes</p>

      {context.semanticRelationships.prerequisites.length > 0 && (
        <section>
          <h2>Prerequisites</h2>
          <ul>
            {context.semanticRelationships.prerequisites.map(prereq => (
              <li key={prereq.id}>
                <a href={`/topic/${prereq.id}`}>{prereq.name}</a>
                <p>{prereq.reasoning}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {context.semanticRelationships.enablesConcepts.length > 0 && (
        <section>
          <h2>What you'll unlock</h2>
          <ul>
            {context.semanticRelationships.enablesConcepts.map(concept => (
              <li key={concept.id}>
                <a href={`/topic/${concept.id}`}>{concept.name}</a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
```

---

## Integration Guide

### Step 1: Add Types

```typescript
// lib/types/semantic.ts
export interface PathNode {
  id: string
  name: string
  level: string
  difficultyScore: number
  learningDepth: number
  estimatedStudyTime: number
}

export interface LearningPath {
  path: PathNode[]
  totalNodes: number
  totalDifficulty: number
  estimatedTotalTime: number
  startingPoints: PathNode[]
}

export interface Prerequisite {
  id: string
  name: string
  level: string
  relationshipType: string
  strategy: string
  confidence: number
  reasoning: string
  difficultyScore: number
  learningDepth: number
}

export interface PrerequisiteResponse {
  entityId: string
  entityName: string
  prerequisites: Prerequisite[]
  learningPath: string[]
  totalDepth: number
  estimatedStudyOrder: number
}
```

### Step 2: Create API Client

```typescript
// lib/api/semantic.ts
import type { LearningPath, PrerequisiteResponse } from '@/lib/types/semantic'

export async function getPrerequisites(entityId: string): Promise<PrerequisiteResponse | null> {
  try {
    const response = await fetch(`/api/semantic/prerequisites/${entityId}`)
    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.error('Failed to fetch prerequisites:', error)
    return null
  }
}

export async function getLearningPathForDomain(domain: string): Promise<LearningPath | null> {
  try {
    const params = new URLSearchParams({ domain })
    const response = await fetch(`/api/semantic/learning-path?${params}`)
    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.error('Failed to fetch learning path:', error)
    return null
  }
}

export async function getLearningPathToTarget(targetEntityId: string): Promise<LearningPath | null> {
  try {
    const params = new URLSearchParams({ targetEntity: targetEntityId })
    const response = await fetch(`/api/semantic/learning-path?${params}`)
    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.error('Failed to fetch learning path:', error)
    return null
  }
}
```

### Step 3: Use in Components

```typescript
import { getPrerequisites, getLearningPathForDomain } from '@/lib/api/semantic'

// In React component
const prerequisites = await getPrerequisites(topicId)
const learningPath = await getLearningPathForDomain('Security Architecture')
```

---

## Performance Considerations

### Caching Strategy

**Client-side:**
```typescript
// Cache learning paths in localStorage
const cacheKey = `learning-path:${domain}`
const cached = localStorage.getItem(cacheKey)

if (cached) {
  const { path, timestamp } = JSON.parse(cached)
  if (Date.now() - timestamp < 3600000) { // 1 hour
    return path
  }
}

const path = await getLearningPathForDomain(domain)
localStorage.setItem(cacheKey, JSON.stringify({
  path,
  timestamp: Date.now()
}))
```

**Server-side (Future - Supabase cache):**
```typescript
// Cache frequently accessed paths in PostgreSQL
// Real-time sync from Neo4j to Supabase
// Serve from Supabase for fast reads
```

### Query Optimization

- **Batch Requests**: Fetch multiple prerequisites in single query
- **Limit Results**: Max 50 nodes in learning paths
- **Index Usage**: All queries use Neo4j indexes (entityId, domainName)

---

## Related Documentation

- **Semantic Schema**: `docs/semantic-schema.md` - Complete graph structure documentation
- **GraphRAG Context**: `lib/graphrag/context.ts` - Context retrieval implementation
- **Phase 2 Progress**: `PHASE_2_PROGRESS.md` - Current implementation status
- **API Tests**: `scripts/test-graphrag-context.ts` - Automated test suite

---

**Last Updated:** 2025-11-14
**Maintained By:** Axium Development Team
**Questions?** See `docs/semantic-schema.md` for technical details
