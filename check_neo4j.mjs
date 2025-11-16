import neo4j from 'neo4j-driver'

const driver = neo4j.driver(
  process.env.NEO4J_URI || 'bolt://localhost:7687',
  neo4j.auth.basic(
    process.env.NEO4J_USERNAME || 'neo4j',
    process.env.NEO4J_PASSWORD || 'password'
  )
)

async function checkGraph() {
  const session = driver.session()

  try {
    // Count nodes
    const nodesResult = await session.run('MATCH (n) RETURN count(n) AS total')
    console.log('Total Nodes:', nodesResult.records[0].get('total').toNumber())

    // Count relationships
    const relsResult = await session.run('MATCH ()-[r]->() RETURN count(r) AS total')
    console.log('Total Relationships:', relsResult.records[0].get('total').toNumber())

    // Node types
    console.log('\nNode Labels:')
    const labelsResult = await session.run('CALL db.labels() YIELD label RETURN label')
    labelsResult.records.forEach(r => console.log('  -', r.get('label')))

    // Relationship types
    console.log('\nRelationship Types:')
    const relTypesResult = await session.run('CALL db.relationshipTypes() YIELD relationshipType RETURN relationshipType')
    relTypesResult.records.forEach(r => console.log('  -', r.get('relationshipType')))

    // Sample nodes
    console.log('\nSample Nodes (first 5):')
    const sampleNodes = await session.run('MATCH (n) RETURN n LIMIT 5')
    sampleNodes.records.forEach(r => {
      const node = r.get('n')
      const name = node.properties.name || node.properties.id || 'unnamed'
      console.log(`  - ${node.labels[0]}: ${name}`)
    })

  } finally {
    await session.close()
  }

  await driver.close()
}

checkGraph().catch(console.error)
