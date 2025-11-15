/**
 * Diagnose Cycles in IS_A Relationships
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
    // Check for cycles in IS_A relationships
    console.log('Checking for cycles in IS_A relationships...\n')

    const cycleResult = await session.run(`
      MATCH path = (a:CurriculumEntity)-[:IS_A*]->(b:CurriculumEntity)
      WHERE a = b
      RETURN a.name as entity, length(path) as cycleLength
      LIMIT 10
    `)

    if (cycleResult.records.length > 0) {
      console.log('❌ Found cycles in IS_A relationships:')
      cycleResult.records.forEach(record => {
        console.log(`  ${record.get('entity')} (cycle length: ${record.get('cycleLength')})`)
      })
    } else {
      console.log('✓ No cycles in IS_A relationships')
    }

    // Check subtopic-to-subtopic IS_A relationships
    console.log('\nChecking subtopic → subtopic IS_A relationships...')
    const subtopicResult = await session.run(`
      MATCH (a:CurriculumEntity {level: 'subtopic'})-[r:IS_A]->(b:CurriculumEntity {level: 'subtopic'})
      RETURN count(r) as count
    `)

    const subtopicCount = subtopicResult.records[0].get('count').toNumber()
    console.log(`  Found ${subtopicCount} subtopic → subtopic IS_A relationships`)

    //Sample some
    if (subtopicCount > 0) {
      const sampleResult = await session.run(`
        MATCH (a:CurriculumEntity {level: 'subtopic'})-[r:IS_A]->(b:CurriculumEntity {level: 'subtopic'})
        RETURN a.name as from, b.name as to
        LIMIT 10
      `)

      console.log('\nSamples:')
      sampleResult.records.forEach(record => {
        console.log(`  ${record.get('from')} IS_A ${record.get('to')}`)
      })
    }

    // Check topic-to-topic IS_A relationships
    console.log('\nChecking topic → topic IS_A relationships...')
    const topicResult = await session.run(`
      MATCH (a:CurriculumEntity {level: 'topic'})-[r:IS_A]->(b:CurriculumEntity {level: 'topic'})
      RETURN count(r) as count
    `)

    const topicCount = topicResult.records[0].get('count').toNumber()
    console.log(`  Found ${topicCount} topic → topic IS_A relationships`)

  } finally {
    await session.close()
    await driver.close()
  }
}

main().catch(console.error)
