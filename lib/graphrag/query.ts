/**
 * GraphRAG Query Module
 *
 * Retrieves context from the knowledge graph for question generation.
 * Supports local search (entity-focused) and global search (community-focused).
 */

import { createSession } from '@/lib/neo4j/client'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import crypto from 'crypto'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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
  communities?: Array<{
    name: string
    summary: string
  }>
  formattedContext: string
}

/**
 * Local Search: Retrieve entities and relationships related to a topic
 */
export async function localGraphSearch(
  chapterId: string,
  topicName: string,
  bloomLevel: number,
  dimension?: string,
  maxDepth: number = 2,
  maxEntities: number = 10
): Promise<GraphContext> {
  // Check cache first
  const cached = await checkQueryCache(chapterId, topicName, bloomLevel, dimension)
  if (cached) {
    // Log removed
    return cached
  }



  // Step 1: Find seed entities related to topic
  const seedEntities = await findSeedEntities(chapterId, topicName, maxEntities)

  if (seedEntities.length === 0) {

    return {
      entities: [],
      relationships: [],
      formattedContext: 'No graph context available for this topic.'
    }
  }

  // Step 2: Traverse graph from seed entities
  const { entities, relationships } = await traverseGraph(
    chapterId,
    seedEntities,
    maxDepth
  )

  // Step 3: Filter by dimension if provided
  const filteredRelationships = dimension
    ? filterByDimension(relationships, dimension)
    : relationships

  // Step 4: Format context
  const formattedContext = formatGraphContext(entities, filteredRelationships)

  const result: GraphContext = {
    entities,
    relationships: filteredRelationships,
    formattedContext
  }

  // Cache the result
  await cacheQueryResult(chapterId, topicName, bloomLevel, dimension, result)

  return result
}

/**
 * Find seed entities using semantic search
 */
async function findSeedEntities(
  chapterId: string,
  topicName: string,
  maxEntities: number
): Promise<string[]> {
  const supabase = await createClient()

  // Generate embedding for topic
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: topicName
  })

  const embedding = response.data[0].embedding
  const embeddingString = `[${embedding.join(',')}]`

  // Vector similarity search on entities
  const { data, error } = await supabase.rpc('match_graphrag_entities', {
    query_embedding: embeddingString,
    match_threshold: 0.3, // More strict than vector RAG
    match_count: maxEntities,
    filter_chapter_id: chapterId
  })

  if (error) {
    console.error('Error finding seed entities:', error)
    return []
  }

  return data.map((row: any) => row.name)
}

/**
 * Traverse graph from seed entities
 */
async function traverseGraph(
  chapterId: string,
  seedEntityNames: string[],
  maxDepth: number
): Promise<{
  entities: Array<{ name: string; type: string; description: string }>
  relationships: Array<{
    source: string
    target: string
    type: string
    description?: string
  }>
}> {
  const session = createSession()

  try {
    // Cypher query: breadth-first traversal up to maxDepth
    const result = await session.run(
      `
      MATCH (seed:Entity {chapterId: $chapterId})
      WHERE seed.name IN $seedNames
      CALL apoc.path.subgraphAll(seed, {
        maxLevel: $maxDepth,
        relationshipFilter: "RELATED_TO"
      })
      YIELD nodes, relationships
      UNWIND nodes as node
      UNWIND relationships as rel
      RETURN
        collect(DISTINCT {
          name: node.name,
          type: node.type,
          description: node.description
        }) as entities,
        collect(DISTINCT {
          source: startNode(rel).name,
          target: endNode(rel).name,
          type: rel.type,
          description: rel.description
        }) as relationships
      `,
      {
        chapterId,
        seedNames: seedEntityNames,
        maxDepth
      }
    )

    if (result.records.length === 0) {
      return { entities: [], relationships: [] }
    }

    const record = result.records[0]
    return {
      entities: record.get('entities'),
      relationships: record.get('relationships')
    }
  } catch (error) {
    // Fallback if APOC not available: simple 1-hop query
    console.warn('APOC not available, using simple traversal')
    return await simpleTraversal(session, chapterId, seedEntityNames)
  } finally {
    await session.close()
  }
}

/**
 * Simple fallback traversal (without APOC)
 */
async function simpleTraversal(
  session: any,
  chapterId: string,
  seedEntityNames: string[]
) {
  const result = await session.run(
    `
    MATCH (seed:Entity {chapterId: $chapterId})
    WHERE seed.name IN $seedNames
    MATCH (seed)-[r:RELATED_TO*1..2]-(connected:Entity)
    RETURN
      collect(DISTINCT {
        name: seed.name,
        type: seed.type,
        description: seed.description
      }) + collect(DISTINCT {
        name: connected.name,
        type: connected.type,
        description: connected.description
      }) as entities,
      collect(DISTINCT {
        source: startNode(r).name,
        target: endNode(r).name,
        type: r.type,
        description: r.description
      }) as relationships
    `,
    { chapterId, seedNames: seedEntityNames }
  )

  if (result.records.length === 0) {
    return { entities: [], relationships: [] }
  }

  const record = result.records[0]
  return {
    entities: record.get('entities'),
    relationships: record.get('relationships')
  }
}

/**
 * Filter relationships by knowledge dimension
 */
function filterByDimension(
  relationships: Array<{
    source: string
    target: string
    type: string
    description?: string
  }>,
  dimension: string
): Array<{
  source: string
  target: string
  type: string
  description?: string
}> {
  const dimensionMap: Record<string, string[]> = {
    definition: ['IS_A', 'DEFINES', 'MEANS'],
    example: ['EXAMPLE_OF', 'INSTANCE_OF', 'DEMONSTRATES', 'USED_FOR'],
    comparison: ['SIMILAR_TO', 'CONTRASTS_WITH', 'DIFFERS_FROM'],
    scenario: ['APPLIED_IN', 'SOLVES', 'USED_FOR'],
    implementation: ['IMPLEMENTS', 'USES', 'DEPENDS_ON', 'PART_OF'],
    troubleshooting: ['CAUSES', 'FIXES', 'PREVENTS'],
    pitfalls: ['COMMON_MISTAKE', 'ANTI_PATTERN', 'CAUSES']
  }

  const allowedTypes = dimensionMap[dimension.toLowerCase()] || []
  if (allowedTypes.length === 0) return relationships

  return relationships.filter(rel => allowedTypes.includes(rel.type))
}

/**
 * Format graph context for LLM consumption
 */
function formatGraphContext(
  entities: Array<{ name: string; type: string; description: string }>,
  relationships: Array<{
    source: string
    target: string
    type: string
    description?: string
  }>
): string {
  let context = '=== KNOWLEDGE GRAPH CONTEXT ===\n\n'

  // Entities section
  context += '## ENTITIES\n\n'
  entities.forEach(e => {
    context += `- **${e.name}** (${e.type}): ${e.description}\n`
  })

  context += '\n## RELATIONSHIPS\n\n'
  relationships.forEach(r => {
    context += `- ${r.source} --[${r.type}]--> ${r.target}`
    if (r.description) {
      context += `: ${r.description}`
    }
    context += '\n'
  })

  return context
}

/**
 * Check query cache
 */
async function checkQueryCache(
  chapterId: string,
  topicName: string,
  bloomLevel: number,
  dimension?: string
): Promise<GraphContext | null> {
  const supabase = await createClient()

  const queryHash = generateQueryHash(chapterId, topicName, bloomLevel, dimension)

  const { data, error } = await supabase
    .from('graphrag_query_cache')
    .select('*')
    .eq('query_hash', queryHash)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (error || !data) return null

  // Update hit count
  await supabase
    .from('graphrag_query_cache')
    .update({
      hit_count: data.hit_count + 1,
      last_accessed_at: new Date().toISOString()
    })
    .eq('id', data.id)

  return {
    entities: [],
    relationships: [],
    formattedContext: data.retrieved_context
  }
}

/**
 * Cache query result
 */
async function cacheQueryResult(
  chapterId: string,
  topicName: string,
  bloomLevel: number,
  dimension: string | undefined,
  result: GraphContext
) {
  const supabase = await createClient()

  const queryHash = generateQueryHash(chapterId, topicName, bloomLevel, dimension)

  await supabase.from('graphrag_query_cache').upsert(
    {
      query_hash: queryHash,
      chapter_id: chapterId,
      bloom_level: bloomLevel,
      dimension: dimension || null,
      retrieved_context: result.formattedContext,
      entity_ids: [],
      relationship_ids: [],
      community_ids: []
    },
    { onConflict: 'query_hash' }
  )
}

/**
 * Generate query hash for caching
 */
function generateQueryHash(
  chapterId: string,
  topicName: string,
  bloomLevel: number,
  dimension?: string
): string {
  const key = `${chapterId}|${topicName}|${bloomLevel}|${dimension || ''}`
  return crypto.createHash('sha256').update(key).digest('hex')
}
