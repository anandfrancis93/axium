/**
 * Cleanup Prerequisites
 *
 * Remove all existing PREREQUISITE relationships before rebuilding
 */

import neo4j from 'neo4j-driver'

const NEO4J_URI = process.env.NEO4J_URI || 'neo4j+s://db8f88e0.databases.neo4j.io'
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j'
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || ''

async function main() {
  console.log('Connecting to Neo4j...')
  const driver = neo4j.driver(
    NEO4J_URI,
    neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD)
  )

  const session = driver.session()

  try {
    console.log('Deleting all PREREQUISITE relationships...')
    const result = await session.run(`
      MATCH ()-[r:PREREQUISITE]->()
      DELETE r
      RETURN count(r) as deleted
    `)

    const deleted = result.records[0]?.get('deleted').toNumber() || 0
    console.log(`✓ Deleted ${deleted} PREREQUISITE relationships`)
  } finally {
    await session.close()
    await driver.close()
  }
}

main().catch(console.error)
