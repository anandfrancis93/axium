/**
 * GraphRAG Question Context Retrieval (Simple Implementation for Testing)
 *
 * Queries Neo4j for entities and relationships to build context for question generation
 */

import { getNeo4jDriver } from '@/lib/neo4j/client'

export interface GraphContext {
  entities: Array<{
    name: string
    type: string
    description: string
  }>
  relationships: Array<{
    source: string
    target: string
    type: string
    description?: string
  }>
  contextText: string
}

/**
 * Get graph context for question generation
 * Returns entities and relationships from the knowledge graph
 */
export async function getGraphContextForQuestions(
  chapterId: string,
  limit: number = 20
): Promise<GraphContext> {
  const driver = getNeo4jDriver()
  const session = driver.session()

  try {
    // Query entities and their relationships
    const result = await session.run(
      `
      MATCH (e:Entity {chapterId: $chapterId})
      OPTIONAL MATCH (e)-[r]->(target:Entity)
      RETURN e.name as name,
             e.type as type,
             e.description as description,
             type(r) as relType,
             target.name as targetName,
             r.description as relDescription
      LIMIT $limit
      `,
      { chapterId, limit: Math.floor(limit) }
    )

    const entities = new Map<string, any>()
    const relationships: Array<any> = []

    // Process results
    for (const record of result.records) {
      const name = record.get('name')
      const type = record.get('type')
      const description = record.get('description')
      const relType = record.get('relType')
      const targetName = record.get('targetName')
      const relDescription = record.get('relDescription')

      // Collect unique entities
      if (name && !entities.has(name)) {
        entities.set(name, { name, type, description })
      }

      // Collect relationships
      if (relType && targetName) {
        relationships.push({
          source: name,
          target: targetName,
          type: relType,
          description: relDescription
        })
      }
    }

    // Build context text from graph
    let contextText = 'KNOWLEDGE GRAPH CONTEXT:\n\n'

    contextText += 'ENTITIES:\n'
    for (const entity of entities.values()) {
      contextText += `- ${entity.name} (${entity.type}): ${entity.description}\n`
    }

    contextText += '\nRELATIONSHIPS:\n'
    for (const rel of relationships) {
      const desc = rel.description ? `: ${rel.description}` : ''
      contextText += `- ${rel.source} ${rel.type} ${rel.target}${desc}\n`
    }

    return {
      entities: Array.from(entities.values()),
      relationships,
      contextText
    }
  } finally {
    await session.close()
  }
}
