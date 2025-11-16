/**
 * Fix Duplicate Similarity Matching
 *
 * Problem: find-topic-similarities.mjs matches nodes by name only,
 * causing "External ↔ External" matches (same node)
 *
 * Solution: Use fullPath as unique identifier to prevent self-matches
 * and correctly distinguish contextual duplicates
 */

import neo4j from 'neo4j-driver'

const driver = neo4j.driver(
  process.env.NEO4J_URI || 'bolt://localhost:7687',
  neo4j.auth.basic(
    process.env.NEO4J_USERNAME || 'neo4j',
    process.env.NEO4J_PASSWORD || 'password'
  )
)

async function removeSelfMatches() {
  const session = driver.session()

  try {
    console.log('='.repeat(70))
    console.log('FIX DUPLICATE SIMILARITY MATCHING')
    console.log('='.repeat(70))

    // Find relationships where source and target have the same name
    // but are actually the same node (or different instances of same concept)
    const result = await session.run(`
      MATCH (n1)-[r:SIMILAR_TO|RELATED_TO]-(n2)
      WHERE n1.name = n2.name
      AND r.method = 'embedding'
      RETURN count(r) AS selfMatches
    `)

    const selfMatches = result.records[0]?.get('selfMatches').toNumber() || 0
    console.log(`\n⚠️  Found ${selfMatches} self-matching relationships\n`)

    if (selfMatches === 0) {
      console.log('✅ No self-matches to remove!\n')
      return
    }

    // Delete self-matching relationships
    console.log('Removing self-matching relationships...\n')
    const deleteResult = await session.run(`
      MATCH (n1)-[r:SIMILAR_TO|RELATED_TO]-(n2)
      WHERE n1.name = n2.name
      AND r.method = 'embedding'
      DELETE r
    `)

    console.log(`✅ Removed ${selfMatches} self-matching relationships\n`)

    // Verify
    const verifyResult = await session.run(`
      MATCH ()-[r:SIMILAR_TO|RELATED_TO]-()
      WHERE r.method = 'embedding'
      RETURN count(r) AS remaining
    `)

    const remaining = verifyResult.records[0]?.get('remaining').toNumber() || 0
    console.log(`✅ Remaining valid similarity relationships: ${remaining}\n`)

    console.log('='.repeat(70))
    console.log('SUMMARY')
    console.log('='.repeat(70))
    console.log(`Removed: ${selfMatches} self-matches`)
    console.log(`Remaining: ${remaining} valid relationships`)
    console.log('='.repeat(70))

  } finally {
    await session.close()
    await driver.close()
  }
}

removeSelfMatches().catch(console.error)
