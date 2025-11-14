/**
 * Neo4j Client for Knowledge Graph Storage
 *
 * Manages connections to Neo4j for storing and querying the knowledge graph.
 * Entities, relationships, and communities are stored here for graph traversal.
 */

import neo4j, { Driver, Session } from 'neo4j-driver'

// Singleton driver instance
let driver: Driver | null = null

/**
 * Get or create Neo4j driver
 */
export function getNeo4jDriver(): Driver {
  if (driver) return driver

  const uri = process.env.NEO4J_URI
  const username = process.env.NEO4J_USERNAME
  const password = process.env.NEO4J_PASSWORD

  if (!uri || !username || !password) {
    throw new Error('Neo4j credentials not configured')
  }

  driver = neo4j.driver(uri, neo4j.auth.basic(username, password))

  return driver
}

/**
 * Create a Neo4j session
 */
export function createSession(): Session {
  const driver = getNeo4jDriver()
  const database = process.env.NEO4J_DATABASE || 'neo4j'
  return driver.session({ database })
}

/**
 * Close Neo4j driver (call on app shutdown)
 */
export async function closeNeo4jDriver() {
  if (driver) {
    await driver.close()
    driver = null
  }
}

/**
 * Test Neo4j connection
 */
export async function testNeo4jConnection(): Promise<boolean> {
  const session = createSession()
  try {
    await session.run('RETURN 1 as test')
    return true
  } catch (error) {
    console.error('Neo4j connection failed:', error)
    return false
  } finally {
    await session.close()
  }
}

/**
 * Initialize Neo4j schema (indexes and constraints)
 */
export async function initializeNeo4jSchema() {
  const session = createSession()

  try {
    // Create constraints (ensures uniqueness and auto-creates indexes)
    await session.run(`
      CREATE CONSTRAINT entity_id IF NOT EXISTS
      FOR (e:Entity) REQUIRE e.id IS UNIQUE
    `)

    await session.run(`
      CREATE CONSTRAINT community_id IF NOT EXISTS
      FOR (c:Community) REQUIRE c.id IS UNIQUE
    `)

    // Create indexes for performance
    await session.run(`
      CREATE INDEX entity_name IF NOT EXISTS
      FOR (e:Entity) ON (e.name)
    `)

    await session.run(`
      CREATE INDEX entity_type IF NOT EXISTS
      FOR (e:Entity) ON (e.type)
    `)

    await session.run(`
      CREATE INDEX entity_chapter IF NOT EXISTS
      FOR (e:Entity) ON (e.chapterId)
    `)

    await session.run(`
      CREATE INDEX community_level IF NOT EXISTS
      FOR (c:Community) ON (c.level)
    `)

    console.log('Neo4j schema initialized successfully')
  } catch (error) {
    console.error('Error initializing Neo4j schema:', error)
    throw error
  } finally {
    await session.close()
  }
}

/**
 * Clear all GraphRAG data for a specific chapter
 */
export async function clearChapterGraph(chapterId: string) {
  const session = createSession()

  try {
    await session.run(
      `
      MATCH (e:Entity {chapterId: $chapterId})
      DETACH DELETE e
      `,
      { chapterId }
    )

    await session.run(
      `
      MATCH (c:Community {chapterId: $chapterId})
      DETACH DELETE c
      `,
      { chapterId }
    )

    console.log(`Cleared graph data for chapter ${chapterId}`)
  } catch (error) {
    console.error('Error clearing chapter graph:', error)
    throw error
  } finally {
    await session.close()
  }
}

/**
 * Get graph statistics for a chapter
 */
export async function getGraphStats(chapterId: string) {
  const session = createSession()

  try {
    const result = await session.run(
      `
      MATCH (e:Entity {chapterId: $chapterId})
      OPTIONAL MATCH (e)-[r]-()
      RETURN
        count(DISTINCT e) as entityCount,
        count(DISTINCT r) as relationshipCount,
        count(DISTINCT e.type) as entityTypes
      `,
      { chapterId }
    )

    const record = result.records[0]
    return {
      entities: record.get('entityCount').toNumber(),
      relationships: record.get('relationshipCount').toNumber(),
      entityTypes: record.get('entityTypes').toNumber()
    }
  } catch (error) {
    console.error('Error getting graph stats:', error)
    throw error
  } finally {
    await session.close()
  }
}
