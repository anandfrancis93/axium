/**
 * Graph Storage Module
 *
 * Stores entities and relationships in both Neo4j (graph traversal)
 * and Supabase (caching and metadata).
 */

import { createSession } from '@/lib/neo4j/client'
import { createClient } from '@/lib/supabase/server'
import { ExtractedEntity, ExtractedRelationship } from './entity-extraction'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface StoredEntity {
  id: string // Supabase UUID
  neo4jId: string // Neo4j node ID
  name: string
  type: string
  description: string
  embedding: number[]
}

interface StoredRelationship {
  id: string // Supabase UUID
  neo4jId: string // Neo4j relationship ID
  sourceEntityId: string
  targetEntityId: string
  type: string
  strength: number
}

/**
 * Store entities and relationships for a chapter
 */
export async function storeGraphData(
  chapterId: string,
  entities: ExtractedEntity[],
  relationships: ExtractedRelationship[],
  sourceChunkIds: string[]
): Promise<{
  entities: StoredEntity[]
  relationships: StoredRelationship[]
}> {
  console.log(
    `Storing ${entities.length} entities and ${relationships.length} relationships for chapter ${chapterId}`
  )

  // Step 1: Generate embeddings for entities
  const entitiesWithEmbeddings = await generateEntityEmbeddings(entities)

  // Step 2: Store in Neo4j
  const neo4jEntities = await storeEntitiesInNeo4j(
    chapterId,
    entitiesWithEmbeddings
  )

  const neo4jRelationships = await storeRelationshipsInNeo4j(
    chapterId,
    relationships,
    neo4jEntities
  )

  // Step 3: Cache in Supabase
  const supabaseEntities = await cacheEntitiesInSupabase(
    chapterId,
    neo4jEntities,
    sourceChunkIds
  )

  const supabaseRelationships = await cacheRelationshipsInSupabase(
    chapterId,
    neo4jRelationships,
    sourceChunkIds,
    supabaseEntities
  )

  return {
    entities: supabaseEntities,
    relationships: supabaseRelationships
  }
}

/**
 * Generate embeddings for entities
 */
async function generateEntityEmbeddings(
  entities: ExtractedEntity[]
): Promise<Array<ExtractedEntity & { embedding: number[] }>> {
  const embeddings: number[][] = []

  // Batch process (OpenAI allows up to 2048 inputs)
  const batchSize = 100
  for (let i = 0; i < entities.length; i += batchSize) {
    const batch = entities.slice(i, i + batchSize)

    // Create embedding text: "name | type | description"
    const texts = batch.map(
      e => `${e.name} | ${e.type} | ${e.description}`
    )

    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts,
    })

    embeddings.push(...response.data.map(d => d.embedding))

    // Rate limiting
    if (i + batchSize < entities.length) {
      await sleep(1000)
    }
  }

  return entities.map((entity, i) => ({
    ...entity,
    embedding: embeddings[i]
  }))
}

/**
 * Store entities in Neo4j
 */
async function storeEntitiesInNeo4j(
  chapterId: string,
  entities: Array<ExtractedEntity & { embedding: number[] }>
): Promise<Array<{ entity: ExtractedEntity; neo4jId: string }>> {
  const session = createSession()
  const results: Array<{ entity: ExtractedEntity; neo4jId: string }> = []

  try {
    for (const entity of entities) {
      const result = await session.run(
        `
        MERGE (e:Entity {name: $name, chapterId: $chapterId})
        ON CREATE SET
          e.type = $type,
          e.description = $description,
          e.aliases = $aliases,
          e.createdAt = datetime()
        ON MATCH SET
          e.description = $description,
          e.aliases = $aliases,
          e.updatedAt = datetime()
        RETURN elementId(e) as neo4jId
        `,
        {
          name: entity.name,
          chapterId,
          type: entity.type,
          description: entity.description,
          aliases: entity.aliases || []
        }
      )

      const neo4jId = result.records[0].get('neo4jId')
      results.push({ entity, neo4jId })
    }

    console.log(`Stored ${results.length} entities in Neo4j`)
    return results
  } catch (error) {
    console.error('Error storing entities in Neo4j:', error)
    throw error
  } finally {
    await session.close()
  }
}

/**
 * Store relationships in Neo4j
 */
async function storeRelationshipsInNeo4j(
  chapterId: string,
  relationships: ExtractedRelationship[],
  entities: Array<{ entity: ExtractedEntity; neo4jId: string }>
): Promise<
  Array<{
    relationship: ExtractedRelationship
    neo4jId: string
    sourceNeo4jId: string
    targetNeo4jId: string
  }>
> {
  const session = createSession()
  const results: Array<{
    relationship: ExtractedRelationship
    neo4jId: string
    sourceNeo4jId: string
    targetNeo4jId: string
  }> = []

  // Create entity name -> neo4jId map
  const entityMap = new Map(
    entities.map(e => [e.entity.name.toLowerCase(), e.neo4jId])
  )

  try {
    for (const rel of relationships) {
      const sourceNeo4jId = entityMap.get(rel.source.toLowerCase())
      const targetNeo4jId = entityMap.get(rel.target.toLowerCase())

      if (!sourceNeo4jId || !targetNeo4jId) {
        console.warn(
          `Skipping relationship ${rel.source} -> ${rel.target}: entity not found`
        )
        continue
      }

      // Use dynamic relationship type (Neo4j limitation: can't parameterize type)
      // So we'll use a generic RELATED_TO and store type as property
      const result = await session.run(
        `
        MATCH (source:Entity {chapterId: $chapterId})
        WHERE elementId(source) = $sourceNeo4jId
        MATCH (target:Entity {chapterId: $chapterId})
        WHERE elementId(target) = $targetNeo4jId
        MERGE (source)-[r:RELATED_TO {type: $type}]->(target)
        ON CREATE SET
          r.strength = $strength,
          r.description = $description,
          r.createdAt = datetime()
        ON MATCH SET
          r.strength = $strength,
          r.description = $description,
          r.updatedAt = datetime()
        RETURN elementId(r) as neo4jId
        `,
        {
          chapterId,
          sourceNeo4jId,
          targetNeo4jId,
          type: rel.type,
          strength: rel.strength || 1.0,
          description: rel.description || ''
        }
      )

      const neo4jId = result.records[0].get('neo4jId')
      results.push({
        relationship: rel,
        neo4jId,
        sourceNeo4jId,
        targetNeo4jId
      })
    }

    console.log(`Stored ${results.length} relationships in Neo4j`)
    return results
  } catch (error) {
    console.error('Error storing relationships in Neo4j:', error)
    throw error
  } finally {
    await session.close()
  }
}

/**
 * Cache entities in Supabase
 */
async function cacheEntitiesInSupabase(
  chapterId: string,
  entities: Array<{ entity: ExtractedEntity & { embedding: number[] }; neo4jId: string }>,
  sourceChunkIds: string[]
): Promise<StoredEntity[]> {
  const supabase = await createClient()

  const rows = entities.map(e => ({
    chapter_id: chapterId,
    neo4j_id: e.neo4jId,
    name: e.entity.name,
    type: e.entity.type,
    description: e.entity.description,
    embedding: `[${e.entity.embedding.join(',')}]`, // pgvector format
    source_chunks: sourceChunkIds,
    confidence: 1.0
  }))

  const { data, error } = await supabase
    .from('graphrag_entities')
    .upsert(rows, {
      onConflict: 'neo4j_id',
      ignoreDuplicates: false
    })
    .select()

  if (error) {
    console.error('Error caching entities in Supabase:', error)
    throw error
  }

  console.log(`Cached ${data.length} entities in Supabase`)

  return data.map((row: any) => ({
    id: row.id,
    neo4jId: row.neo4j_id,
    name: row.name,
    type: row.type,
    description: row.description,
    embedding: JSON.parse(row.embedding)
  }))
}

/**
 * Cache relationships in Supabase
 */
async function cacheRelationshipsInSupabase(
  chapterId: string,
  relationships: Array<{
    relationship: ExtractedRelationship
    neo4jId: string
    sourceNeo4jId: string
    targetNeo4jId: string
  }>,
  sourceChunkIds: string[],
  supabaseEntities: StoredEntity[]
): Promise<StoredRelationship[]> {
  const supabase = await createClient()

  // Create neo4jId -> supabaseId map
  const entityMap = new Map(
    supabaseEntities.map(e => [e.neo4jId, e.id])
  )

  const rows = relationships.map(r => {
    const sourceEntityId = entityMap.get(r.sourceNeo4jId)
    const targetEntityId = entityMap.get(r.targetNeo4jId)

    if (!sourceEntityId || !targetEntityId) {
      throw new Error(`Entity mapping not found for relationship`)
    }

    return {
      chapter_id: chapterId,
      neo4j_id: r.neo4jId,
      source_entity_id: sourceEntityId,
      target_entity_id: targetEntityId,
      relationship_type: r.relationship.type,
      strength: r.relationship.strength || 1.0,
      description: r.relationship.description || '',
      evidence_chunks: sourceChunkIds
    }
  })

  const { data, error } = await supabase
    .from('graphrag_relationships')
    .upsert(rows, {
      onConflict: 'neo4j_id',
      ignoreDuplicates: false
    })
    .select()

  if (error) {
    console.error('Error caching relationships in Supabase:', error)
    throw error
  }

  console.log(`Cached ${data.length} relationships in Supabase`)

  return data.map((row: any) => ({
    id: row.id,
    neo4jId: row.neo4j_id,
    sourceEntityId: row.source_entity_id,
    targetEntityId: row.target_entity_id,
    type: row.relationship_type,
    strength: row.strength
  }))
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
