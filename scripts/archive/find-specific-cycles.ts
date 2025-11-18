/**
 * Find Specific Cycles
 */

import neo4j from 'neo4j-driver'

const NEO4J_URI = process.env.NEO4J_URI || 'neo4j+s://db8f88e0.databases.neo4j.io'
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j'
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || ''

async function main() {
  const driver = neo4j.driver(
    NEO4J_URI,
    neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD)
  )

  const session = driver.session()

  try {
    // Find 2-node cycles (A → B → A)
    console.log('Finding 2-node cycles (A → B → A)...\n')
    const cycle2Result = await session.run(`
      MATCH path = (a:CurriculumEntity)-[:PREREQUISITE]->(b:CurriculumEntity)-[:PREREQUISITE]->(a)
      RETURN a.name as node1, b.name as node2
      LIMIT 10
    `)

    cycle2Result.records.forEach(record => {
      console.log(`  ${record.get('node1')} ⟷ ${record.get('node2')}`)
    })

    // Check what caused these cycles - show the original IS_A/PART_OF relationships
    console.log('\n\nChecking original relationships for first cycle...')
    if (cycle2Result.records.length > 0) {
      const node1 = cycle2Result.records[0].get('node1')
      const node2 = cycle2Result.records[0].get('node2')

      const relResult = await session.run(`
        MATCH (a:CurriculumEntity {name: $node1})
        MATCH (b:CurriculumEntity {name: $node2})
        OPTIONAL MATCH (a)-[r1:IS_A|PART_OF]->(b)
        OPTIONAL MATCH (b)-[r2:IS_A|PART_OF]->(a)
        RETURN
          type(r1) as rel1Type,
          type(r2) as rel2Type,
          a.level as node1Level,
          b.level as node2Level
      `, { node1, node2 })

      if (relResult.records.length > 0) {
        const record = relResult.records[0]
        console.log(`\n  ${node1} (${record.get('node1Level')})`)
        console.log(`    ${record.get('rel1Type') || 'none'} →  ${node2} (${record.get('node2Level')})`)
        console.log(`    ${record.get('rel2Type') || 'none'} ←`)
      }
    }

    // Find 4-node cycles
    console.log('\n\nFinding 4-node cycles (A → B → C → D → A)...\n')
    const cycle4Result = await session.run(`
      MATCH path = (a)-[:PREREQUISITE]->(b)-[:PREREQUISITE]->(c)-[:PREREQUISITE]->(d)-[:PREREQUISITE]->(a)
      WHERE a <> b AND b <> c AND c <> d
      RETURN a.name as n1, b.name as n2, c.name as n3, d.name as n4
      LIMIT 5
    `)

    cycle4Result.records.forEach(record => {
      console.log(`  ${record.get('n1')} → ${record.get('n2')} → ${record.get('n3')} → ${record.get('n4')} → ${record.get('n1')}`)
    })

  } finally {
    await session.close()
    await driver.close()
  }
}

main().catch(console.error)
