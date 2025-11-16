/**
 * Cleanup Duplicate Relationships
 *
 * Removes relationships between nodes that have the same name
 * (contextual duplicates like "Internal" in different domains)
 *
 * These are artifacts from matching by name instead of ID.
 */

import neo4j from 'neo4j-driver'

const driver = neo4j.driver(
  process.env.NEO4J_URI || 'bolt://localhost:7687',
  neo4j.auth.basic(
    process.env.NEO4J_USERNAME || 'neo4j',
    process.env.NEO4J_PASSWORD || 'password'
  )
)

async function cleanupDuplicates() {
  const session = driver.session()

  try {
    console.log('='.repeat(70))
    console.log('CLEANUP DUPLICATE RELATIONSHIPS')
    console.log('='.repeat(70))

    // Find all relationships where source and target have same name
    // (but are different nodes - contextual duplicates)
    const result = await session.run(`
      MATCH (n1)-[r]-(n2)
      WHERE n1.name = n2.name
      AND id(n1) <> id(n2)
      AND type(r) <> 'CHILD_OF'
      AND type(r) <> 'PARENT_OF'
      AND type(r) <> 'PREREQUISITE'
      RETURN type(r) AS relType,
             count(r) AS count
      ORDER BY count DESC
    `)

    console.log('\n⚠️  Relationships between duplicate nodes:\n')
    let totalToDelete = 0

    result.records.forEach(record => {
      const relType = record.get('relType')
      const count = record.get('count').toNumber()
      console.log(`   ${relType.padEnd(30)} : ${count}`)
      totalToDelete += count
    })

    if (totalToDelete === 0) {
      console.log('\n✅ No duplicate relationships to clean up!\n')
      return
    }

    console.log(`\n   Total to delete: ${totalToDelete}\n`)
    console.log('='.repeat(70))

    // Show some examples before deleting
    const examples = await session.run(`
      MATCH (n1)-[r]-(n2)
      WHERE n1.name = n2.name
      AND id(n1) <> id(n2)
      AND type(r) <> 'CHILD_OF'
      AND type(r) <> 'PARENT_OF'
      AND type(r) <> 'PREREQUISITE'
      RETURN n1.name AS name,
             n1.fullPath AS path1,
             type(r) AS relType,
             n2.fullPath AS path2
      LIMIT 10
    `)

    console.log('\nExamples of relationships to delete:\n')
    examples.records.forEach((record, i) => {
      const name = record.get('name')
      const path1 = record.get('path1')
      const relType = record.get('relType')
      const path2 = record.get('path2')
      console.log(`${i + 1}. "${name}" --[${relType}]-->`)
      console.log(`   From: ${path1}`)
      console.log(`   To:   ${path2}\n`)
    })

    console.log('='.repeat(70))
    console.log('Deleting duplicate relationships...\n')

    // Delete relationships between nodes with same name
    const deleteResult = await session.run(`
      MATCH (n1)-[r]-(n2)
      WHERE n1.name = n2.name
      AND id(n1) <> id(n2)
      AND type(r) <> 'CHILD_OF'
      AND type(r) <> 'PARENT_OF'
      AND type(r) <> 'PREREQUISITE'
      DELETE r
    `)

    console.log(`✅ Deleted ${totalToDelete} duplicate relationships\n`)

    // Verify
    const verifyResult = await session.run(`
      MATCH (n1)-[r]-(n2)
      WHERE n1.name = n2.name
      AND id(n1) <> id(n2)
      AND type(r) <> 'CHILD_OF'
      AND type(r) <> 'PARENT_OF'
      AND type(r) <> 'PREREQUISITE'
      RETURN count(r) AS remaining
    `)

    const remaining = verifyResult.records[0]?.get('remaining').toNumber() || 0

    console.log('='.repeat(70))
    console.log('SUMMARY')
    console.log('='.repeat(70))
    console.log(`Deleted: ${totalToDelete} relationships`)
    console.log(`Remaining duplicates: ${remaining}`)
    console.log('='.repeat(70))

  } finally {
    await session.close()
    await driver.close()
  }
}

cleanupDuplicates().catch(console.error)
