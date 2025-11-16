import neo4j from 'neo4j-driver'

const driver = neo4j.driver(
  process.env.NEO4J_URI || 'bolt://localhost:7687',
  neo4j.auth.basic(
    process.env.NEO4J_USERNAME || 'neo4j',
    process.env.NEO4J_PASSWORD || 'password'
  )
)

async function showRelationships() {
  const session = driver.session()

  try {
    console.log('='.repeat(70))
    console.log('RELATIONSHIP TYPE DISTRIBUTION')
    console.log('='.repeat(70))

    // Count by type
    const countResult = await session.run(`
      MATCH ()-[r]->()
      RETURN type(r) AS relationshipType, count(*) AS count
      ORDER BY count DESC
    `)

    countResult.records.forEach(record => {
      const type = record.get('relationshipType')
      const count = record.get('count').toNumber()
      console.log(`${type.padEnd(30)} : ${count}`)
    })

    console.log('\n' + '='.repeat(70))
    console.log('SAMPLE RELATIONSHIPS (First 20)')
    console.log('='.repeat(70))

    // Show sample relationships
    const sampleResult = await session.run(`
      MATCH (n)-[r]->(m)
      RETURN n.name AS source, type(r) AS relationship, m.name AS target
      LIMIT 20
    `)

    sampleResult.records.forEach((record, i) => {
      const source = record.get('source')
      const rel = record.get('relationship')
      const target = record.get('target')
      console.log(`${i + 1}. ${source} --[${rel}]--> ${target}`)
    })

    console.log('\n' + '='.repeat(70))
    console.log(`Total: ${countResult.records.reduce((sum, r) => sum + r.get('count').toNumber(), 0)} relationships`)
    console.log('='.repeat(70))

  } finally {
    await session.close()
    await driver.close()
  }
}

showRelationships().catch(console.error)
