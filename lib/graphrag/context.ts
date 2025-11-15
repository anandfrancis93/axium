import neo4j, { Driver, Session } from 'neo4j-driver'

/**
 * GraphRAG Context Structure
 *
 * Represents the complete context for an entity, used for LLM question generation.
 */
export interface GraphRAGContext {
  // Entity details
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
  parentId: string | null
  grandparentName: string | null
  grandparentId: string | null

  // Descendants
  children: Array<{
    id: string
    name: string
    entityType: string
    summary: string | null
  }>

  grandchildren: Array<{
    id: string
    name: string
    entityType: string
  }>

  // Related concepts (cross-references)
  relatedConcepts: Array<{
    id: string
    name: string
    domain: string
    sharedConcept: string
    strength: 'high' | 'medium' | 'low'
    crossDomain: boolean
  }>

  // Semantic relationships (Phase 2)
  semanticRelationships: {
    // IS_A: This entity is a type/instance of...
    isA: Array<{
      id: string
      name: string
      confidence: number
      reasoning: string
    }>

    // PART_OF: This entity is part of...
    partOf: Array<{
      id: string
      name: string
      confidence: number
      reasoning: string
    }>

    // Prerequisites: Must understand these first
    prerequisites: Array<{
      id: string
      name: string
      strategy: string
      confidence: number
      reasoning: string
      difficultyScore?: number
      learningDepth?: number
    }>

    // Dependents: These depend on this entity
    enablesConcepts: Array<{
      id: string
      name: string
      relationshipType: string
    }>
  }

  // Learning metadata (Phase 2)
  learningMetadata: {
    difficultyScore: number // 1-10
    learningDepth: number // DAG depth
    estimatedStudyTime: number // minutes
    hasPrerequisites: boolean
    prerequisiteCount: number
  }
}

/**
 * Entity Summary (for lists)
 */
export interface EntitySummary {
  id: string
  name: string
  entityType: string
  fullPath: string
  domain: string
  summary: string | null
  scopeTags: string[]
}

/**
 * Create Neo4j driver instance
 */
export function createNeo4jDriver(): Driver {
  const uri = process.env.NEO4J_URI
  const username = process.env.NEO4J_USERNAME
  const password = process.env.NEO4J_PASSWORD

  if (!uri || !username || !password) {
    throw new Error('Missing Neo4j configuration in environment variables')
  }

  return neo4j.driver(uri, neo4j.auth.basic(username, password))
}

/**
 * Get full context for an entity by ID
 *
 * @param entityId - UUID of the entity
 * @returns Complete GraphRAG context including hierarchy and relationships
 */
export async function getContextById(entityId: string): Promise<GraphRAGContext | null> {
  const driver = createNeo4jDriver()
  const session = driver.session({ database: process.env.NEO4J_DATABASE || 'neo4j' })

  try {
    const result = await session.run(`
      MATCH (entity:CurriculumEntity {id: $entityId})
      OPTIONAL MATCH (entity)-[:CHILD_OF]->(parent)
      OPTIONAL MATCH (entity)-[:CHILD_OF]->(parent)-[:CHILD_OF]->(grandparent)
      OPTIONAL MATCH (entity)-[:PARENT_OF]->(child)
      OPTIONAL MATCH (entity)-[:PARENT_OF]->(child)-[:PARENT_OF]->(grandchild)
      OPTIONAL MATCH (entity)-[r:RELATED_CONCEPT]-(related)

      // Semantic relationships (Phase 2)
      OPTIONAL MATCH (entity)-[isa:IS_A]->(isATarget)
      OPTIONAL MATCH (entity)-[partof:PART_OF]->(partOfTarget)
      OPTIONAL MATCH (prereq)-[preqRel:PREREQUISITE]->(entity)
      OPTIONAL MATCH (entity)-[enables:PREREQUISITE]->(dependent)

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
        entity.difficultyScore AS difficultyScore,
        entity.learningDepth AS learningDepth,
        entity.estimatedStudyTime AS estimatedStudyTime,
        parent.name AS parentName,
        parent.id AS parentId,
        grandparent.name AS grandparentName,
        grandparent.id AS grandparentId,
        collect(DISTINCT {
          id: child.id,
          name: child.name,
          entityType: child.entityType,
          summary: child.contextSummary
        }) AS children,
        collect(DISTINCT {
          id: grandchild.id,
          name: grandchild.name,
          entityType: grandchild.entityType
        }) AS grandchildren,
        collect(DISTINCT {
          id: related.id,
          name: related.name,
          domain: related.domainName,
          sharedConcept: r.sharedConcept,
          strength: r.strength,
          crossDomain: r.crossDomain
        }) AS relatedConcepts,
        collect(DISTINCT {
          id: isATarget.id,
          name: isATarget.name,
          confidence: isa.confidence,
          reasoning: isa.reasoning
        }) AS isARelationships,
        collect(DISTINCT {
          id: partOfTarget.id,
          name: partOfTarget.name,
          confidence: partof.confidence,
          reasoning: partof.reasoning
        }) AS partOfRelationships,
        collect(DISTINCT {
          id: prereq.id,
          name: prereq.name,
          strategy: preqRel.strategy,
          confidence: preqRel.confidence,
          reasoning: preqRel.reasoning,
          difficultyScore: prereq.difficultyScore,
          learningDepth: prereq.learningDepth
        }) AS prerequisites,
        collect(DISTINCT {
          id: dependent.id,
          name: dependent.name,
          relationshipType: type(enables)
        }) AS enablesConcepts
    `, { entityId })

    if (result.records.length === 0) {
      return null
    }

    const record = result.records[0]

    const prerequisites = record.get('prerequisites').filter((p: any) => p.id !== null)

    return {
      id: record.get('id'),
      name: record.get('name'),
      entityType: record.get('entityType'),
      depth: Number(record.get('depth')),
      summary: record.get('summary'),
      fullPath: record.get('fullPath'),
      domain: record.get('domain'),
      objective: record.get('objective'),
      scopeTags: record.get('scopeTags') || [],
      parentName: record.get('parentName'),
      parentId: record.get('parentId'),
      grandparentName: record.get('grandparentName'),
      grandparentId: record.get('grandparentId'),
      children: record.get('children').filter((c: any) => c.id !== null),
      grandchildren: record.get('grandchildren').filter((gc: any) => gc.id !== null),
      relatedConcepts: record.get('relatedConcepts').filter((r: any) => r.id !== null),
      semanticRelationships: {
        isA: record.get('isARelationships').filter((r: any) => r.id !== null),
        partOf: record.get('partOfRelationships').filter((r: any) => r.id !== null),
        prerequisites,
        enablesConcepts: record.get('enablesConcepts').filter((e: any) => e.id !== null)
      },
      learningMetadata: {
        difficultyScore: record.get('difficultyScore') || 1,
        learningDepth: record.get('learningDepth') || 0,
        estimatedStudyTime: record.get('estimatedStudyTime') || 15,
        hasPrerequisites: prerequisites.length > 0,
        prerequisiteCount: prerequisites.length
      }
    }
  } finally {
    await session.close()
    await driver.close()
  }
}

/**
 * Find entities by name (may return multiple if name appears in different domains)
 *
 * @param name - Entity name to search for
 * @returns Array of matching entities with full context
 */
export async function findEntitiesByName(name: string): Promise<GraphRAGContext[]> {
  const driver = createNeo4jDriver()
  const session = driver.session({ database: process.env.NEO4J_DATABASE || 'neo4j' })

  try {
    const result = await session.run(`
      MATCH (entity:CurriculumEntity)
      WHERE entity.name = $name
      OPTIONAL MATCH (entity)-[:CHILD_OF]->(parent)
      OPTIONAL MATCH (entity)-[:CHILD_OF]->(parent)-[:CHILD_OF]->(grandparent)
      OPTIONAL MATCH (entity)-[:PARENT_OF]->(child)
      OPTIONAL MATCH (entity)-[r:RELATED_CONCEPT]-(related)

      // Semantic relationships (Phase 2)
      OPTIONAL MATCH (entity)-[isa:IS_A]->(isATarget)
      OPTIONAL MATCH (entity)-[partof:PART_OF]->(partOfTarget)
      OPTIONAL MATCH (prereq)-[preqRel:PREREQUISITE]->(entity)
      OPTIONAL MATCH (entity)-[enables:PREREQUISITE]->(dependent)

      WITH entity, parent, grandparent,
           collect(DISTINCT {id: child.id, name: child.name, entityType: child.entityType, summary: child.contextSummary}) AS children,
           collect(DISTINCT {id: related.id, name: related.name, domain: related.domainName, sharedConcept: r.sharedConcept, strength: r.strength, crossDomain: r.crossDomain}) AS relatedConcepts,
           collect(DISTINCT {id: isATarget.id, name: isATarget.name, confidence: isa.confidence, reasoning: isa.reasoning}) AS isARelationships,
           collect(DISTINCT {id: partOfTarget.id, name: partOfTarget.name, confidence: partof.confidence, reasoning: partof.reasoning}) AS partOfRelationships,
           collect(DISTINCT {id: prereq.id, name: prereq.name, strategy: preqRel.strategy, confidence: preqRel.confidence, reasoning: preqRel.reasoning, difficultyScore: prereq.difficultyScore, learningDepth: prereq.learningDepth}) AS prerequisites,
           collect(DISTINCT {id: dependent.id, name: dependent.name, relationshipType: type(enables)}) AS enablesConcepts
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
        entity.difficultyScore AS difficultyScore,
        entity.learningDepth AS learningDepth,
        entity.estimatedStudyTime AS estimatedStudyTime,
        parent.name AS parentName,
        parent.id AS parentId,
        grandparent.name AS grandparentName,
        grandparent.id AS grandparentId,
        children,
        [] AS grandchildren,
        relatedConcepts,
        isARelationships,
        partOfRelationships,
        prerequisites,
        enablesConcepts
      ORDER BY entity.fullPath
    `, { name })

    return result.records.map(record => {
      const prerequisites = record.get('prerequisites').filter((p: any) => p.id !== null)
      return {
        id: record.get('id'),
        name: record.get('name'),
        entityType: record.get('entityType'),
        depth: Number(record.get('depth')),
        summary: record.get('summary'),
        fullPath: record.get('fullPath'),
        domain: record.get('domain'),
        objective: record.get('objective'),
        scopeTags: record.get('scopeTags') || [],
        parentName: record.get('parentName'),
        parentId: record.get('parentId'),
        grandparentName: record.get('grandparentName'),
        grandparentId: record.get('grandparentId'),
        children: record.get('children').filter((c: any) => c.id !== null),
        grandchildren: [],
        relatedConcepts: record.get('relatedConcepts').filter((r: any) => r.id !== null),
        semanticRelationships: {
          isA: record.get('isARelationships').filter((r: any) => r.id !== null),
          partOf: record.get('partOfRelationships').filter((r: any) => r.id !== null),
          prerequisites,
          enablesConcepts: record.get('enablesConcepts').filter((e: any) => e.id !== null)
        },
        learningMetadata: {
          difficultyScore: record.get('difficultyScore') || 1,
          learningDepth: record.get('learningDepth') || 0,
          estimatedStudyTime: record.get('estimatedStudyTime') || 15,
          hasPrerequisites: prerequisites.length > 0,
          prerequisiteCount: prerequisites.length
        }
      }
    })
  } finally {
    await session.close()
    await driver.close()
  }
}

/**
 * Get context by full path (unique lookup)
 *
 * @param fullPath - Complete path (e.g., "Domain > Objective > Topic")
 * @returns Single entity context or null
 */
export async function getContextByPath(fullPath: string): Promise<GraphRAGContext | null> {
  const driver = createNeo4jDriver()
  const session = driver.session({ database: process.env.NEO4J_DATABASE || 'neo4j' })

  try {
    const result = await session.run(`
      MATCH (entity:CurriculumEntity {fullPath: $fullPath})
      OPTIONAL MATCH (entity)-[:CHILD_OF]->(parent)
      OPTIONAL MATCH (entity)-[:CHILD_OF]->(parent)-[:CHILD_OF]->(grandparent)
      OPTIONAL MATCH (entity)-[:PARENT_OF]->(child)
      OPTIONAL MATCH (entity)-[r:RELATED_CONCEPT]-(related)

      // Semantic relationships (Phase 2)
      OPTIONAL MATCH (entity)-[isa:IS_A]->(isATarget)
      OPTIONAL MATCH (entity)-[partof:PART_OF]->(partOfTarget)
      OPTIONAL MATCH (prereq)-[preqRel:PREREQUISITE]->(entity)
      OPTIONAL MATCH (entity)-[enables:PREREQUISITE]->(dependent)

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
        entity.difficultyScore AS difficultyScore,
        entity.learningDepth AS learningDepth,
        entity.estimatedStudyTime AS estimatedStudyTime,
        parent.name AS parentName,
        parent.id AS parentId,
        grandparent.name AS grandparentName,
        grandparent.id AS grandparentId,
        collect(DISTINCT {id: child.id, name: child.name, entityType: child.entityType, summary: child.contextSummary}) AS children,
        [] AS grandchildren,
        collect(DISTINCT {id: related.id, name: related.name, domain: related.domainName, sharedConcept: r.sharedConcept, strength: r.strength, crossDomain: r.crossDomain}) AS relatedConcepts,
        collect(DISTINCT {id: isATarget.id, name: isATarget.name, confidence: isa.confidence, reasoning: isa.reasoning}) AS isARelationships,
        collect(DISTINCT {id: partOfTarget.id, name: partOfTarget.name, confidence: partof.confidence, reasoning: partof.reasoning}) AS partOfRelationships,
        collect(DISTINCT {id: prereq.id, name: prereq.name, strategy: preqRel.strategy, confidence: preqRel.confidence, reasoning: preqRel.reasoning, difficultyScore: prereq.difficultyScore, learningDepth: prereq.learningDepth}) AS prerequisites,
        collect(DISTINCT {id: dependent.id, name: dependent.name, relationshipType: type(enables)}) AS enablesConcepts
    `, { fullPath })

    if (result.records.length === 0) {
      return null
    }

    const record = result.records[0]
    const prerequisites = record.get('prerequisites').filter((p: any) => p.id !== null)

    return {
      id: record.get('id'),
      name: record.get('name'),
      entityType: record.get('entityType'),
      depth: Number(record.get('depth')),
      summary: record.get('summary'),
      fullPath: record.get('fullPath'),
      domain: record.get('domain'),
      objective: record.get('objective'),
      scopeTags: record.get('scopeTags') || [],
      parentName: record.get('parentName'),
      parentId: record.get('parentId'),
      grandparentName: record.get('grandparentName'),
      grandparentId: record.get('grandparentId'),
      children: record.get('children').filter((c: any) => c.id !== null),
      grandchildren: [],
      relatedConcepts: record.get('relatedConcepts').filter((r: any) => r.id !== null),
      semanticRelationships: {
        isA: record.get('isARelationships').filter((r: any) => r.id !== null),
        partOf: record.get('partOfRelationships').filter((r: any) => r.id !== null),
        prerequisites,
        enablesConcepts: record.get('enablesConcepts').filter((e: any) => e.id !== null)
      },
      learningMetadata: {
        difficultyScore: record.get('difficultyScore') || 1,
        learningDepth: record.get('learningDepth') || 0,
        estimatedStudyTime: record.get('estimatedStudyTime') || 15,
        hasPrerequisites: prerequisites.length > 0,
        prerequisiteCount: prerequisites.length
      }
    }
  } finally {
    await session.close()
    await driver.close()
  }
}

/**
 * Get all entities for a domain
 *
 * @param domainName - Name of the domain
 * @param minDepth - Minimum depth (default: 2 = topics and below)
 * @returns Array of entity summaries
 */
export async function getEntitiesByDomain(domainName: string, minDepth: number = 2): Promise<EntitySummary[]> {
  const driver = createNeo4jDriver()
  const session = driver.session({ database: process.env.NEO4J_DATABASE || 'neo4j' })

  try {
    const result = await session.run(`
      MATCH (entity:CurriculumEntity)
      WHERE entity.domainName = $domainName
        AND entity.depth >= $minDepth
      RETURN
        entity.id AS id,
        entity.name AS name,
        entity.entityType AS entityType,
        entity.fullPath AS fullPath,
        entity.domainName AS domain,
        entity.contextSummary AS summary,
        entity.scopeTags AS scopeTags
      ORDER BY entity.fullPath
    `, { domainName, minDepth })

    return result.records.map(record => ({
      id: record.get('id'),
      name: record.get('name'),
      entityType: record.get('entityType'),
      fullPath: record.get('fullPath'),
      domain: record.get('domain'),
      summary: record.get('summary'),
      scopeTags: record.get('scopeTags') || []
    }))
  } finally {
    await session.close()
    await driver.close()
  }
}

/**
 * Search entities by scope tag
 *
 * @param scopeTag - Scope tag to filter by (e.g., "cryptography")
 * @param limit - Maximum results to return (default: 50)
 * @param minDepth - Minimum depth (default: 2 = topics and below)
 * @returns Array of entity summaries
 */
export async function getEntitiesByScope(
  scopeTag: string,
  limit: number = 50,
  minDepth: number = 2
): Promise<EntitySummary[]> {
  const driver = createNeo4jDriver()
  const session = driver.session({ database: process.env.NEO4J_DATABASE || 'neo4j' })

  try {
    const result = await session.run(`
      MATCH (entity:CurriculumEntity)
      WHERE $scopeTag IN entity.scopeTags
        AND entity.depth >= $minDepth
      RETURN
        entity.id AS id,
        entity.name AS name,
        entity.entityType AS entityType,
        entity.fullPath AS fullPath,
        entity.domainName AS domain,
        entity.contextSummary AS summary,
        entity.scopeTags AS scopeTags
      ORDER BY entity.fullPath
      LIMIT $limit
    `, { scopeTag, minDepth, limit: neo4j.int(limit) })

    return result.records.map(record => ({
      id: record.get('id'),
      name: record.get('name'),
      entityType: record.get('entityType'),
      fullPath: record.get('fullPath'),
      domain: record.get('domain'),
      summary: record.get('summary'),
      scopeTags: record.get('scopeTags') || []
    }))
  } finally {
    await session.close()
    await driver.close()
  }
}

/**
 * Format context for LLM prompt
 *
 * Converts GraphRAGContext to a formatted string for Claude prompts.
 *
 * @param context - GraphRAG context object
 * @returns Formatted string for LLM consumption
 */
export function formatContextForLLM(context: GraphRAGContext): string {
  const parts: string[] = []

  // Basic information
  parts.push(`Domain: ${context.domain}`)
  if (context.objective) {
    parts.push(`Learning Objective: ${context.objective}`)
  }
  parts.push(`Topic: ${context.name}`)
  parts.push(`Topic Summary: ${context.summary || 'No summary available'}`)

  // Learning metadata
  parts.push(`\nDifficulty Level: ${context.learningMetadata.difficultyScore}/10`)
  parts.push(`Learning Depth: ${context.learningMetadata.learningDepth} (DAG depth)`)
  parts.push(`Estimated Study Time: ${context.learningMetadata.estimatedStudyTime} minutes`)

  // Prerequisites (critical for scaffolding questions)
  if (context.semanticRelationships.prerequisites.length > 0) {
    parts.push(`\nPrerequisite Knowledge Required:`)
    context.semanticRelationships.prerequisites.forEach(prereq => {
      parts.push(`- ${prereq.name} (difficulty: ${prereq.difficultyScore || 'N/A'}/10)`)
      parts.push(`  Strategy: ${prereq.strategy}`)
      if (prereq.reasoning) {
        parts.push(`  Why: ${prereq.reasoning}`)
      }
    })
  }

  // Semantic relationships (IS_A, PART_OF)
  if (context.semanticRelationships.isA.length > 0) {
    parts.push(`\nThis topic is a type/instance of:`)
    context.semanticRelationships.isA.forEach(rel => {
      parts.push(`- ${rel.name}`)
    })
  }

  if (context.semanticRelationships.partOf.length > 0) {
    parts.push(`\nThis topic is part of:`)
    context.semanticRelationships.partOf.forEach(rel => {
      parts.push(`- ${rel.name}`)
    })
  }

  // What this enables
  if (context.semanticRelationships.enablesConcepts.length > 0) {
    parts.push(`\nMastering this topic enables learning:`)
    context.semanticRelationships.enablesConcepts.forEach(concept => {
      parts.push(`- ${concept.name}`)
    })
  }

  // Hierarchy
  if (context.grandparentName) {
    parts.push(`\nGrandparent Concept: ${context.grandparentName}`)
  }
  if (context.parentName) {
    parts.push(`Parent Concept: ${context.parentName}`)
  }

  // Children
  if (context.children.length > 0) {
    parts.push(`\nSubtopics:`)
    context.children.forEach(child => {
      const summary = child.summary ? `: ${child.summary}` : ''
      parts.push(`- ${child.name}${summary}`)
    })
  }

  // Related concepts (cross-domain only)
  const crossDomain = context.relatedConcepts.filter(r => r.crossDomain)
  if (crossDomain.length > 0) {
    parts.push(`\nRelated Concepts (Cross-Domain):`)
    crossDomain.forEach(rel => {
      parts.push(`- ${rel.name} (${rel.domain}): shared concept "${rel.sharedConcept}"`)
    })
  }

  // Scope tags
  if (context.scopeTags.length > 0) {
    parts.push(`\nTechnical Scope: ${context.scopeTags.join(', ')}`)
  }

  return parts.join('\n')
}
