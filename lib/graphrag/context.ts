import neo4j, { Driver, Session, Record as Neo4jRecord } from 'neo4j-driver'

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

  // Semantic relationships (Phase 2 + Enhanced)
  semanticRelationships: {
    // TAXONOMY RELATIONSHIPS
    // IS_A: This entity is a type/instance of...
    isA: Array<{
      id: string
      name: string
      confidence?: number
      reasoning?: string
    }>

    // PART_OF: This entity is part of...
    partOf: Array<{
      id: string
      name: string
      confidence?: number
      reasoning?: string
    }>

    // CATEGORY_OF: This entity categorizes...
    categoryOf: Array<{
      id: string
      name: string
      confidence?: number
      reasoning?: string
    }>

    // VARIANT_OF: This entity is a variant of...
    variantOf: Array<{
      id: string
      name: string
      confidence?: number
      reasoning?: string
    }>

    // EDUCATIONAL RELATIONSHIPS
    // Prerequisites: Must understand these first
    prerequisites: Array<{
      id: string
      name: string
      strategy?: string
      confidence?: number
      reasoning?: string
      difficultyScore?: number
      learningDepth?: number
    }>

    // PREREQUISITE_FOR: This topic is prerequisite for...
    prerequisiteFor: Array<{
      id: string
      name: string
      confidence?: number
      reasoning?: string
    }>

    // DEPENDS_ON: This entity depends on...
    dependsOn: Array<{
      id: string
      name: string
      confidence?: number
      reasoning?: string
    }>

    // CONTRASTS_WITH: This entity contrasts with...
    contrastsWith: Array<{
      id: string
      name: string
      confidence?: number
      reasoning?: string
    }>

    // SECURITY RELATIONSHIPS
    // PROTECTS_AGAINST: This entity protects against...
    protectsAgainst: Array<{
      id: string
      name: string
      confidence?: number
      reasoning?: string
    }>

    // ATTACKS: This entity attacks/exploits...
    attacks: Array<{
      id: string
      name: string
      confidence?: number
      reasoning?: string
    }>

    // TECHNICAL RELATIONSHIPS
    // IMPLEMENTS: This entity implements...
    implements: Array<{
      id: string
      name: string
      confidence?: number
      reasoning?: string
    }>

    // CONFIGURES: This entity configures...
    configures: Array<{
      id: string
      name: string
      confidence?: number
      reasoning?: string
    }>

    // REQUIRES: This entity requires...
    requires: Array<{
      id: string
      name: string
      confidence?: number
      reasoning?: string
    }>

    // FUNCTIONAL RELATIONSHIPS
    // LOGS: This entity logs...
    logs: Array<{
      id: string
      name: string
      confidence?: number
      reasoning?: string
    }>

    // MONITORS: This entity monitors...
    monitors: Array<{
      id: string
      name: string
      confidence?: number
      reasoning?: string
    }>

    // SCANS: This entity scans...
    scans: Array<{
      id: string
      name: string
      confidence?: number
      reasoning?: string
    }>

    // LOGICAL RELATIONSHIPS
    // LEADS_TO: This entity leads to...
    leadsTo: Array<{
      id: string
      name: string
      confidence?: number
      reasoning?: string
    }>

    // ENABLES: This entity enables...
    enables: Array<{
      id: string
      name: string
      confidence?: number
      reasoning?: string
    }>

    // Dependents: These depend on this entity (kept for backward compatibility)
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

// Helper interfaces for Neo4j query results
interface Neo4jRelationshipTarget {
  id: string | null
  name: string | null
  [key: string]: any
}

interface Neo4jChild {
  id: string
  name: string
  entityType: string
  summary: string | null
}

interface Neo4jRelatedConcept {
  id: string
  name: string
  domain: string
  sharedConcept: string
  strength: 'high' | 'medium' | 'low'
  crossDomain: boolean
}

interface Neo4jSemanticRelationship {
  id: string
  name: string
  confidence?: number
  reasoning?: string
}

interface Neo4jEnablesConcept {
  id: string
  name: string
  relationshipType: string
}

interface Neo4jPrerequisite extends Neo4jSemanticRelationship {
  strategy?: string
  difficultyScore?: number
  learningDepth?: number
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

      // Semantic relationships (Phase 2 + Enhanced)
      // Taxonomy
      OPTIONAL MATCH (entity)-[isa:IS_A]->(isATarget)
      OPTIONAL MATCH (entity)-[partof:PART_OF]->(partOfTarget)
      OPTIONAL MATCH (entity)-[categoryof:CATEGORY_OF]->(categoryTarget)
      OPTIONAL MATCH (entity)-[variantof:VARIANT_OF]->(variantTarget)

      // Educational
      OPTIONAL MATCH (prereq)-[preqRel:PREREQUISITE]->(entity)
      OPTIONAL MATCH (entity)-[prereqfor:PREREQUISITE_FOR]->(prereqForTarget)
      OPTIONAL MATCH (entity)-[dependson:DEPENDS_ON]->(dependsTarget)
      OPTIONAL MATCH (entity)-[contrasts:CONTRASTS_WITH]-(contrastTarget)

      // Security
      OPTIONAL MATCH (entity)-[protects:PROTECTS_AGAINST]->(protectTarget)
      OPTIONAL MATCH (entity)-[attacks:ATTACKS]->(attackTarget)

      // Technical
      OPTIONAL MATCH (entity)-[implements:IMPLEMENTS]->(implementsTarget)
      OPTIONAL MATCH (entity)-[configures:CONFIGURES]->(configureTarget)
      OPTIONAL MATCH (entity)-[requires:REQUIRES]->(requiresTarget)

      // Functional
      OPTIONAL MATCH (entity)-[logs:LOGS]->(logsTarget)
      OPTIONAL MATCH (entity)-[monitors:MONITORS]->(monitorsTarget)
      OPTIONAL MATCH (entity)-[scans:SCANS]->(scansTarget)

      // Logical
      OPTIONAL MATCH (entity)-[leadsto:LEADS_TO]->(leadsTarget)
      OPTIONAL MATCH (entity)-[enables:ENABLES]->(enablesTarget)
      OPTIONAL MATCH (entity)-[enablesPrereq:PREREQUISITE]->(dependent)

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
          id: categoryTarget.id,
          name: categoryTarget.name,
          confidence: categoryof.confidence,
          reasoning: categoryof.reasoning
        }) AS categoryOfRelationships,
        collect(DISTINCT {
          id: variantTarget.id,
          name: variantTarget.name,
          confidence: variantof.confidence,
          reasoning: variantof.reasoning
        }) AS variantOfRelationships,
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
          id: prereqForTarget.id,
          name: prereqForTarget.name,
          confidence: prereqfor.confidence,
          reasoning: prereqfor.reasoning
        }) AS prerequisiteForRelationships,
        collect(DISTINCT {
          id: dependsTarget.id,
          name: dependsTarget.name,
          confidence: dependson.confidence,
          reasoning: dependson.reasoning
        }) AS dependsOnRelationships,
        collect(DISTINCT {
          id: contrastTarget.id,
          name: contrastTarget.name,
          confidence: contrasts.confidence,
          reasoning: contrasts.reasoning
        }) AS contrastsWithRelationships,
        collect(DISTINCT {
          id: protectTarget.id,
          name: protectTarget.name,
          confidence: protects.confidence,
          reasoning: protects.reasoning
        }) AS protectsAgainstRelationships,
        collect(DISTINCT {
          id: attackTarget.id,
          name: attackTarget.name,
          confidence: attacks.confidence,
          reasoning: attacks.reasoning
        }) AS attacksRelationships,
        collect(DISTINCT {
          id: implementsTarget.id,
          name: implementsTarget.name,
          confidence: implements.confidence,
          reasoning: implements.reasoning
        }) AS implementsRelationships,
        collect(DISTINCT {
          id: configureTarget.id,
          name: configureTarget.name,
          confidence: configures.confidence,
          reasoning: configures.reasoning
        }) AS configuresRelationships,
        collect(DISTINCT {
          id: requiresTarget.id,
          name: requiresTarget.name,
          confidence: requires.confidence,
          reasoning: requires.reasoning
        }) AS requiresRelationships,
        collect(DISTINCT {
          id: logsTarget.id,
          name: logsTarget.name,
          confidence: logs.confidence,
          reasoning: logs.reasoning
        }) AS logsRelationships,
        collect(DISTINCT {
          id: monitorsTarget.id,
          name: monitorsTarget.name,
          confidence: monitors.confidence,
          reasoning: monitors.reasoning
        }) AS monitorsRelationships,
        collect(DISTINCT {
          id: scansTarget.id,
          name: scansTarget.name,
          confidence: scans.confidence,
          reasoning: scans.reasoning
        }) AS scansRelationships,
        collect(DISTINCT {
          id: leadsTarget.id,
          name: leadsTarget.name,
          confidence: leadsto.confidence,
          reasoning: leadsto.reasoning
        }) AS leadsToRelationships,
        collect(DISTINCT {
          id: enablesTarget.id,
          name: enablesTarget.name,
          confidence: enables.confidence,
          reasoning: enables.reasoning
        }) AS enablesRelationships,
        collect(DISTINCT {
          id: dependent.id,
          name: dependent.name,
          relationshipType: type(enablesPrereq)
        }) AS enablesConcepts
    `, { entityId })

    if (result.records.length === 0) {
      return null
    }

    const record = result.records[0]

    const prerequisites = (record.get('prerequisites') as Neo4jPrerequisite[]).filter(p => p.id !== null)

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
      children: (record.get('children') as Neo4jChild[]).filter(c => c.id !== null),
      grandchildren: (record.get('grandchildren') as Neo4jChild[]).filter(gc => gc.id !== null),
      relatedConcepts: (record.get('relatedConcepts') as Neo4jRelatedConcept[]).filter(r => r.id !== null),
      semanticRelationships: {
        // Taxonomy
        isA: (record.get('isARelationships') as Neo4jSemanticRelationship[]).filter(r => r.id !== null),
        partOf: (record.get('partOfRelationships') as Neo4jSemanticRelationship[]).filter(r => r.id !== null),
        categoryOf: (record.get('categoryOfRelationships') as Neo4jSemanticRelationship[]).filter(r => r.id !== null),
        variantOf: (record.get('variantOfRelationships') as Neo4jSemanticRelationship[]).filter(r => r.id !== null),
        // Educational
        prerequisites,
        prerequisiteFor: (record.get('prerequisiteForRelationships') as Neo4jSemanticRelationship[]).filter(r => r.id !== null),
        dependsOn: (record.get('dependsOnRelationships') as Neo4jSemanticRelationship[]).filter(r => r.id !== null),
        contrastsWith: (record.get('contrastsWithRelationships') as Neo4jSemanticRelationship[]).filter(r => r.id !== null),
        // Security
        protectsAgainst: (record.get('protectsAgainstRelationships') as Neo4jSemanticRelationship[]).filter(r => r.id !== null),
        attacks: (record.get('attacksRelationships') as Neo4jSemanticRelationship[]).filter(r => r.id !== null),
        // Technical
        implements: (record.get('implementsRelationships') as Neo4jSemanticRelationship[]).filter(r => r.id !== null),
        configures: (record.get('configuresRelationships') as Neo4jSemanticRelationship[]).filter(r => r.id !== null),
        requires: (record.get('requiresRelationships') as Neo4jSemanticRelationship[]).filter(r => r.id !== null),
        // Functional
        logs: (record.get('logsRelationships') as Neo4jSemanticRelationship[]).filter(r => r.id !== null),
        monitors: (record.get('monitorsRelationships') as Neo4jSemanticRelationship[]).filter(r => r.id !== null),
        scans: (record.get('scansRelationships') as Neo4jSemanticRelationship[]).filter(r => r.id !== null),
        // Logical
        leadsTo: (record.get('leadsToRelationships') as Neo4jSemanticRelationship[]).filter(r => r.id !== null),
        enables: (record.get('enablesRelationships') as Neo4jSemanticRelationship[]).filter(r => r.id !== null),
        // Backward compatibility
        enablesConcepts: (record.get('enablesConcepts') as Neo4jEnablesConcept[]).filter(e => e.id !== null)
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

      // Semantic relationships (Phase 2 + Enhanced)
      // Taxonomy
      OPTIONAL MATCH (entity)-[isa:IS_A]->(isATarget)
      OPTIONAL MATCH (entity)-[partof:PART_OF]->(partOfTarget)
      OPTIONAL MATCH (entity)-[categoryof:CATEGORY_OF]->(categoryTarget)
      OPTIONAL MATCH (entity)-[variantof:VARIANT_OF]->(variantTarget)

      // Educational
      OPTIONAL MATCH (prereq)-[preqRel:PREREQUISITE]->(entity)
      OPTIONAL MATCH (entity)-[prereqfor:PREREQUISITE_FOR]->(prereqForTarget)
      OPTIONAL MATCH (entity)-[dependson:DEPENDS_ON]->(dependsTarget)
      OPTIONAL MATCH (entity)-[contrasts:CONTRASTS_WITH]-(contrastTarget)

      // Security
      OPTIONAL MATCH (entity)-[protects:PROTECTS_AGAINST]->(protectTarget)
      OPTIONAL MATCH (entity)-[attacks:ATTACKS]->(attackTarget)

      // Technical
      OPTIONAL MATCH (entity)-[implements:IMPLEMENTS]->(implementsTarget)
      OPTIONAL MATCH (entity)-[configures:CONFIGURES]->(configureTarget)
      OPTIONAL MATCH (entity)-[requires:REQUIRES]->(requiresTarget)

      // Functional
      OPTIONAL MATCH (entity)-[logs:LOGS]->(logsTarget)
      OPTIONAL MATCH (entity)-[monitors:MONITORS]->(monitorsTarget)
      OPTIONAL MATCH (entity)-[scans:SCANS]->(scansTarget)

      // Logical
      OPTIONAL MATCH (entity)-[leadsto:LEADS_TO]->(leadsTarget)
      OPTIONAL MATCH (entity)-[enables:ENABLES]->(enablesTarget)
      OPTIONAL MATCH (entity)-[enablesPrereq:PREREQUISITE]->(dependent)

      WITH entity, parent, grandparent,
           collect(DISTINCT {id: child.id, name: child.name, entityType: child.entityType, summary: child.contextSummary}) AS children,
           collect(DISTINCT {id: related.id, name: related.name, domain: related.domainName, sharedConcept: r.sharedConcept, strength: r.strength, crossDomain: r.crossDomain}) AS relatedConcepts,

           // Taxonomy relationships
           collect(DISTINCT {id: isATarget.id, name: isATarget.name, confidence: isa.confidence, reasoning: isa.reasoning}) AS isARelationships,
           collect(DISTINCT {id: partOfTarget.id, name: partOfTarget.name, confidence: partof.confidence, reasoning: partof.reasoning}) AS partOfRelationships,
           collect(DISTINCT {id: categoryTarget.id, name: categoryTarget.name, confidence: categoryof.confidence, reasoning: categoryof.reasoning}) AS categoryOfRelationships,
           collect(DISTINCT {id: variantTarget.id, name: variantTarget.name, confidence: variantof.confidence, reasoning: variantof.reasoning}) AS variantOfRelationships,

           // Educational relationships
           collect(DISTINCT {id: prereq.id, name: prereq.name, strategy: preqRel.strategy, confidence: preqRel.confidence, reasoning: preqRel.reasoning, difficultyScore: prereq.difficultyScore, learningDepth: prereq.learningDepth}) AS prerequisites,
           collect(DISTINCT {id: prereqForTarget.id, name: prereqForTarget.name, confidence: prereqfor.confidence, reasoning: prereqfor.reasoning}) AS prerequisiteForRelationships,
           collect(DISTINCT {id: dependsTarget.id, name: dependsTarget.name, confidence: dependson.confidence, reasoning: dependson.reasoning}) AS dependsOnRelationships,
           collect(DISTINCT {id: contrastTarget.id, name: contrastTarget.name, confidence: contrasts.confidence, reasoning: contrasts.reasoning}) AS contrastsWithRelationships,

           // Security relationships
           collect(DISTINCT {id: protectTarget.id, name: protectTarget.name, confidence: protects.confidence, reasoning: protects.reasoning}) AS protectsAgainstRelationships,
           collect(DISTINCT {id: attackTarget.id, name: attackTarget.name, confidence: attacks.confidence, reasoning: attacks.reasoning}) AS attacksRelationships,

           // Technical relationships
           collect(DISTINCT {id: implementsTarget.id, name: implementsTarget.name, confidence: implements.confidence, reasoning: implements.reasoning}) AS implementsRelationships,
           collect(DISTINCT {id: configureTarget.id, name: configureTarget.name, confidence: configures.confidence, reasoning: configures.reasoning}) AS configuresRelationships,
           collect(DISTINCT {id: requiresTarget.id, name: requiresTarget.name, confidence: requires.confidence, reasoning: requires.reasoning}) AS requiresRelationships,

           // Functional relationships
           collect(DISTINCT {id: logsTarget.id, name: logsTarget.name, confidence: logs.confidence, reasoning: logs.reasoning}) AS logsRelationships,
           collect(DISTINCT {id: monitorsTarget.id, name: monitorsTarget.name, confidence: monitors.confidence, reasoning: monitors.reasoning}) AS monitorsRelationships,
           collect(DISTINCT {id: scansTarget.id, name: scansTarget.name, confidence: scans.confidence, reasoning: scans.reasoning}) AS scansRelationships,

           // Logical relationships
           collect(DISTINCT {id: leadsTarget.id, name: leadsTarget.name, confidence: leadsto.confidence, reasoning: leadsto.reasoning}) AS leadsToRelationships,
           collect(DISTINCT {id: enablesTarget.id, name: enablesTarget.name, confidence: enables.confidence, reasoning: enables.reasoning}) AS enablesRelationships,

           // Backward compatibility
           collect(DISTINCT {id: dependent.id, name: dependent.name, relationshipType: type(enablesPrereq)}) AS enablesConcepts
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

        // Taxonomy
        isARelationships,
        partOfRelationships,
        categoryOfRelationships,
        variantOfRelationships,

        // Educational
        prerequisites,
        prerequisiteForRelationships,
        dependsOnRelationships,
        contrastsWithRelationships,

        // Security
        protectsAgainstRelationships,
        attacksRelationships,

        // Technical
        implementsRelationships,
        configuresRelationships,
        requiresRelationships,

        // Functional
        logsRelationships,
        monitorsRelationships,
        scansRelationships,

        // Logical
        leadsToRelationships,
        enablesRelationships,

        // Backward compatibility
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
        children: (record.get('children') as Neo4jChild[]).filter(c => c.id !== null),
        grandchildren: [],
        relatedConcepts: (record.get('relatedConcepts') as Neo4jRelatedConcept[]).filter(r => r.id !== null),
        semanticRelationships: {
          // Taxonomy
          isA: (record.get('isARelationships') as Neo4jSemanticRelationship[]).filter(r => r.id !== null),
          partOf: (record.get('partOfRelationships') as Neo4jSemanticRelationship[]).filter(r => r.id !== null),
          categoryOf: (record.get('categoryOfRelationships') as Neo4jSemanticRelationship[]).filter(r => r.id !== null),
          variantOf: (record.get('variantOfRelationships') as Neo4jSemanticRelationship[]).filter(r => r.id !== null),

          // Educational
          prerequisites,
          prerequisiteFor: (record.get('prerequisiteForRelationships') as Neo4jSemanticRelationship[]).filter(r => r.id !== null),
          dependsOn: (record.get('dependsOnRelationships') as Neo4jSemanticRelationship[]).filter(r => r.id !== null),
          contrastsWith: (record.get('contrastsWithRelationships') as Neo4jSemanticRelationship[]).filter(r => r.id !== null),

          // Security
          protectsAgainst: (record.get('protectsAgainstRelationships') as Neo4jSemanticRelationship[]).filter(r => r.id !== null),
          attacks: (record.get('attacksRelationships') as Neo4jSemanticRelationship[]).filter(r => r.id !== null),

          // Technical
          implements: (record.get('implementsRelationships') as Neo4jSemanticRelationship[]).filter(r => r.id !== null),
          configures: (record.get('configuresRelationships') as Neo4jSemanticRelationship[]).filter(r => r.id !== null),
          requires: (record.get('requiresRelationships') as Neo4jSemanticRelationship[]).filter(r => r.id !== null),

          // Functional
          logs: (record.get('logsRelationships') as Neo4jSemanticRelationship[]).filter(r => r.id !== null),
          monitors: (record.get('monitorsRelationships') as Neo4jSemanticRelationship[]).filter(r => r.id !== null),
          scans: (record.get('scansRelationships') as Neo4jSemanticRelationship[]).filter(r => r.id !== null),

          // Logical
          leadsTo: (record.get('leadsToRelationships') as Neo4jSemanticRelationship[]).filter(r => r.id !== null),
          enables: (record.get('enablesRelationships') as Neo4jSemanticRelationship[]).filter(r => r.id !== null),

          // Backward compatibility
          enablesConcepts: (record.get('enablesConcepts') as Neo4jEnablesConcept[]).filter(e => e.id !== null)
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

      // Semantic relationships (Phase 2 + Enhanced)
      // Taxonomy
      OPTIONAL MATCH (entity)-[isa:IS_A]->(isATarget)
      OPTIONAL MATCH (entity)-[partof:PART_OF]->(partOfTarget)
      OPTIONAL MATCH (entity)-[categoryof:CATEGORY_OF]->(categoryTarget)
      OPTIONAL MATCH (entity)-[variantof:VARIANT_OF]->(variantTarget)

      // Educational
      OPTIONAL MATCH (prereq)-[preqRel:PREREQUISITE]->(entity)
      OPTIONAL MATCH (entity)-[prereqfor:PREREQUISITE_FOR]->(prereqForTarget)
      OPTIONAL MATCH (entity)-[dependson:DEPENDS_ON]->(dependsTarget)
      OPTIONAL MATCH (entity)-[contrasts:CONTRASTS_WITH]-(contrastTarget)

      // Security
      OPTIONAL MATCH (entity)-[protects:PROTECTS_AGAINST]->(protectTarget)
      OPTIONAL MATCH (entity)-[attacks:ATTACKS]->(attackTarget)

      // Technical
      OPTIONAL MATCH (entity)-[implements:IMPLEMENTS]->(implementsTarget)
      OPTIONAL MATCH (entity)-[configures:CONFIGURES]->(configureTarget)
      OPTIONAL MATCH (entity)-[requires:REQUIRES]->(requiresTarget)

      // Functional
      OPTIONAL MATCH (entity)-[logs:LOGS]->(logsTarget)
      OPTIONAL MATCH (entity)-[monitors:MONITORS]->(monitorsTarget)
      OPTIONAL MATCH (entity)-[scans:SCANS]->(scansTarget)

      // Logical
      OPTIONAL MATCH (entity)-[leadsto:LEADS_TO]->(leadsTarget)
      OPTIONAL MATCH (entity)-[enables:ENABLES]->(enablesTarget)
      OPTIONAL MATCH (entity)-[enablesPrereq:PREREQUISITE]->(dependent)

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

        // Taxonomy relationships
        collect(DISTINCT {id: isATarget.id, name: isATarget.name, confidence: isa.confidence, reasoning: isa.reasoning}) AS isARelationships,
        collect(DISTINCT {id: partOfTarget.id, name: partOfTarget.name, confidence: partof.confidence, reasoning: partof.reasoning}) AS partOfRelationships,
        collect(DISTINCT {id: categoryTarget.id, name: categoryTarget.name, confidence: categoryof.confidence, reasoning: categoryof.reasoning}) AS categoryOfRelationships,
        collect(DISTINCT {id: variantTarget.id, name: variantTarget.name, confidence: variantof.confidence, reasoning: variantof.reasoning}) AS variantOfRelationships,

        // Educational relationships
        collect(DISTINCT {id: prereq.id, name: prereq.name, strategy: preqRel.strategy, confidence: preqRel.confidence, reasoning: preqRel.reasoning, difficultyScore: prereq.difficultyScore, learningDepth: prereq.learningDepth}) AS prerequisites,
        collect(DISTINCT {id: prereqForTarget.id, name: prereqForTarget.name, confidence: prereqfor.confidence, reasoning: prereqfor.reasoning}) AS prerequisiteForRelationships,
        collect(DISTINCT {id: dependsTarget.id, name: dependsTarget.name, confidence: dependson.confidence, reasoning: dependson.reasoning}) AS dependsOnRelationships,
        collect(DISTINCT {id: contrastTarget.id, name: contrastTarget.name, confidence: contrasts.confidence, reasoning: contrasts.reasoning}) AS contrastsWithRelationships,

        // Security relationships
        collect(DISTINCT {id: protectTarget.id, name: protectTarget.name, confidence: protects.confidence, reasoning: protects.reasoning}) AS protectsAgainstRelationships,
        collect(DISTINCT {id: attackTarget.id, name: attackTarget.name, confidence: attacks.confidence, reasoning: attacks.reasoning}) AS attacksRelationships,

        // Technical relationships
        collect(DISTINCT {id: implementsTarget.id, name: implementsTarget.name, confidence: implements.confidence, reasoning: implements.reasoning}) AS implementsRelationships,
        collect(DISTINCT {id: configureTarget.id, name: configureTarget.name, confidence: configures.confidence, reasoning: configures.reasoning}) AS configuresRelationships,
        collect(DISTINCT {id: requiresTarget.id, name: requiresTarget.name, confidence: requires.confidence, reasoning: requires.reasoning}) AS requiresRelationships,

        // Functional relationships
        collect(DISTINCT {id: logsTarget.id, name: logsTarget.name, confidence: logs.confidence, reasoning: logs.reasoning}) AS logsRelationships,
        collect(DISTINCT {id: monitorsTarget.id, name: monitorsTarget.name, confidence: monitors.confidence, reasoning: monitors.reasoning}) AS monitorsRelationships,
        collect(DISTINCT {id: scansTarget.id, name: scansTarget.name, confidence: scans.confidence, reasoning: scans.reasoning}) AS scansRelationships,

        // Logical relationships
        collect(DISTINCT {id: leadsTarget.id, name: leadsTarget.name, confidence: leadsto.confidence, reasoning: leadsto.reasoning}) AS leadsToRelationships,
        collect(DISTINCT {id: enablesTarget.id, name: enablesTarget.name, confidence: enables.confidence, reasoning: enables.reasoning}) AS enablesRelationships,

        // Backward compatibility
        collect(DISTINCT {id: dependent.id, name: dependent.name, relationshipType: type(enablesPrereq)}) AS enablesConcepts
    `, { fullPath })

    if (result.records.length === 0) {
      return null
    }

    const record = result.records[0]
    const prerequisites = (record.get('prerequisites') as Neo4jPrerequisite[]).filter(p => p.id !== null)

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
      children: (record.get('children') as Neo4jChild[]).filter(c => c.id !== null),
      grandchildren: [],
      relatedConcepts: (record.get('relatedConcepts') as Neo4jRelatedConcept[]).filter(r => r.id !== null),
      semanticRelationships: {
        // Taxonomy
        isA: (record.get('isARelationships') as Neo4jSemanticRelationship[]).filter(r => r.id !== null),
        partOf: (record.get('partOfRelationships') as Neo4jSemanticRelationship[]).filter(r => r.id !== null),
        categoryOf: (record.get('categoryOfRelationships') as Neo4jSemanticRelationship[]).filter(r => r.id !== null),
        variantOf: (record.get('variantOfRelationships') as Neo4jSemanticRelationship[]).filter(r => r.id !== null),
        // Educational
        prerequisites,
        prerequisiteFor: (record.get('prerequisiteForRelationships') as Neo4jSemanticRelationship[]).filter(r => r.id !== null),
        dependsOn: (record.get('dependsOnRelationships') as Neo4jSemanticRelationship[]).filter(r => r.id !== null),
        contrastsWith: (record.get('contrastsWithRelationships') as Neo4jSemanticRelationship[]).filter(r => r.id !== null),
        // Security
        protectsAgainst: (record.get('protectsAgainstRelationships') as Neo4jSemanticRelationship[]).filter(r => r.id !== null),
        attacks: (record.get('attacksRelationships') as Neo4jSemanticRelationship[]).filter(r => r.id !== null),
        // Technical
        implements: (record.get('implementsRelationships') as Neo4jSemanticRelationship[]).filter(r => r.id !== null),
        configures: (record.get('configuresRelationships') as Neo4jSemanticRelationship[]).filter(r => r.id !== null),
        requires: (record.get('requiresRelationships') as Neo4jSemanticRelationship[]).filter(r => r.id !== null),
        // Functional
        logs: (record.get('logsRelationships') as Neo4jSemanticRelationship[]).filter(r => r.id !== null),
        monitors: (record.get('monitorsRelationships') as Neo4jSemanticRelationship[]).filter(r => r.id !== null),
        scans: (record.get('scansRelationships') as Neo4jSemanticRelationship[]).filter(r => r.id !== null),
        // Logical
        leadsTo: (record.get('leadsToRelationships') as Neo4jSemanticRelationship[]).filter(r => r.id !== null),
        enables: (record.get('enablesRelationships') as Neo4jSemanticRelationship[]).filter(r => r.id !== null),
        // Backward compatibility
        enablesConcepts: (record.get('enablesConcepts') as Neo4jEnablesConcept[]).filter(e => e.id !== null)
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

  if (context.semanticRelationships.categoryOf.length > 0) {
    parts.push(`\nThis topic is a category of:`)
    context.semanticRelationships.categoryOf.forEach(rel => {
      parts.push(`- ${rel.name}`)
      if (rel.reasoning) parts.push(`  Reasoning: ${rel.reasoning}`)
    })
  }

  if (context.semanticRelationships.variantOf.length > 0) {
    parts.push(`\nThis topic is a variant of:`)
    context.semanticRelationships.variantOf.forEach(rel => {
      parts.push(`- ${rel.name}`)
      if (rel.reasoning) parts.push(`  Reasoning: ${rel.reasoning}`)
    })
  }

  // Educational relationships
  if (context.semanticRelationships.prerequisiteFor.length > 0) {
    parts.push(`\nThis topic is a prerequisite for:`)
    context.semanticRelationships.prerequisiteFor.forEach(rel => {
      parts.push(`- ${rel.name}`)
      if (rel.reasoning) parts.push(`  Why: ${rel.reasoning}`)
    })
  }

  if (context.semanticRelationships.dependsOn.length > 0) {
    parts.push(`\nThis topic depends on:`)
    context.semanticRelationships.dependsOn.forEach(rel => {
      parts.push(`- ${rel.name}`)
      if (rel.reasoning) parts.push(`  Why: ${rel.reasoning}`)
    })
  }

  if (context.semanticRelationships.contrastsWith.length > 0) {
    parts.push(`\nThis topic contrasts with:`)
    context.semanticRelationships.contrastsWith.forEach(rel => {
      parts.push(`- ${rel.name}`)
      if (rel.reasoning) parts.push(`  Key differences: ${rel.reasoning}`)
    })
  }

  // Security relationships
  if (context.semanticRelationships.protectsAgainst.length > 0) {
    parts.push(`\nThis topic protects against:`)
    context.semanticRelationships.protectsAgainst.forEach(rel => {
      parts.push(`- ${rel.name}`)
      if (rel.reasoning) parts.push(`  How: ${rel.reasoning}`)
    })
  }

  if (context.semanticRelationships.attacks.length > 0) {
    parts.push(`\nThis topic attacks/exploits:`)
    context.semanticRelationships.attacks.forEach(rel => {
      parts.push(`- ${rel.name}`)
      if (rel.reasoning) parts.push(`  Method: ${rel.reasoning}`)
    })
  }

  // Technical relationships
  if (context.semanticRelationships.implements.length > 0) {
    parts.push(`\nThis topic implements:`)
    context.semanticRelationships.implements.forEach(rel => {
      parts.push(`- ${rel.name}`)
      if (rel.reasoning) parts.push(`  Implementation: ${rel.reasoning}`)
    })
  }

  if (context.semanticRelationships.configures.length > 0) {
    parts.push(`\nThis topic configures:`)
    context.semanticRelationships.configures.forEach(rel => {
      parts.push(`- ${rel.name}`)
      if (rel.reasoning) parts.push(`  Configuration: ${rel.reasoning}`)
    })
  }

  if (context.semanticRelationships.requires.length > 0) {
    parts.push(`\nThis topic requires:`)
    context.semanticRelationships.requires.forEach(rel => {
      parts.push(`- ${rel.name}`)
      if (rel.reasoning) parts.push(`  Required for: ${rel.reasoning}`)
    })
  }

  // Functional relationships
  if (context.semanticRelationships.logs.length > 0) {
    parts.push(`\nThis topic logs:`)
    context.semanticRelationships.logs.forEach(rel => {
      parts.push(`- ${rel.name}`)
      if (rel.reasoning) parts.push(`  What it logs: ${rel.reasoning}`)
    })
  }

  if (context.semanticRelationships.monitors.length > 0) {
    parts.push(`\nThis topic monitors:`)
    context.semanticRelationships.monitors.forEach(rel => {
      parts.push(`- ${rel.name}`)
      if (rel.reasoning) parts.push(`  What it monitors: ${rel.reasoning}`)
    })
  }

  if (context.semanticRelationships.scans.length > 0) {
    parts.push(`\nThis topic scans:`)
    context.semanticRelationships.scans.forEach(rel => {
      parts.push(`- ${rel.name}`)
      if (rel.reasoning) parts.push(`  What it scans: ${rel.reasoning}`)
    })
  }

  // Logical relationships
  if (context.semanticRelationships.leadsTo.length > 0) {
    parts.push(`\nThis topic leads to:`)
    context.semanticRelationships.leadsTo.forEach(rel => {
      parts.push(`- ${rel.name}`)
      if (rel.reasoning) parts.push(`  How: ${rel.reasoning}`)
    })
  }

  if (context.semanticRelationships.enables.length > 0) {
    parts.push(`\nThis topic enables:`)
    context.semanticRelationships.enables.forEach(rel => {
      parts.push(`- ${rel.name}`)
      if (rel.reasoning) parts.push(`  How: ${rel.reasoning}`)
    })
  }

  // What this enables (backward compatibility)
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
