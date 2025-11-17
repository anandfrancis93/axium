import neo4j from 'neo4j-driver'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const NEO4J_URI = process.env.NEO4J_URI!
const NEO4J_USER = process.env.NEO4J_USERNAME!
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD!

async function main() {
  console.log('📊 Verifying Neo4j Structure...\n')

  const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD))

  try {
    const session = driver.session()

    // Count node types
    console.log('Node Types:')
    const subjectCount = await session.run('MATCH (n:Subject) RETURN count(n) as count')
    const topicCount = await session.run('MATCH (n:Topic) RETURN count(n) as count')
    const entityCount = await session.run('MATCH (n:Entity) RETURN count(n) as count')

    console.log(`  Subject: ${subjectCount.records[0].get('count').toInt()}`)
    console.log(`  Topic: ${topicCount.records[0].get('count').toInt()}`)
    console.log(`  Entity: ${entityCount.records[0].get('count').toInt()}`)

    // Count relationship types
    console.log('\nRelationship Types:')
    const hasTopicCount = await session.run('MATCH ()-[r:HAS_TOPIC]->() RETURN count(r) as count')
    const hasSubtopicCount = await session.run('MATCH ()-[r:HAS_SUBTOPIC]->() RETURN count(r) as count')
    const relatedToCount = await session.run('MATCH ()-[r:RELATED_TO]->() RETURN count(r) as count')

    console.log(`  HAS_TOPIC: ${hasTopicCount.records[0].get('count').toInt()}`)
    console.log(`  HAS_SUBTOPIC: ${hasSubtopicCount.records[0].get('count').toInt()}`)
    console.log(`  RELATED_TO: ${relatedToCount.records[0].get('count').toInt()}`)

    // Show topic hierarchy distribution
    console.log('\nTopic Hierarchy:')
    const hierarchyResult = await session.run(
      `MATCH (t:Topic)
       RETURN t.hierarchy_level as level, count(*) as count
       ORDER BY level`
    )

    for (const record of hierarchyResult.records) {
      const level = record.get('level')
      const count = record.get('count')
      console.log(`  Level ${level}: ${count} topics`)
    }

    // Sample topics from each level
    console.log('\nSample Topics:')
    const sampleResult = await session.run(
      `MATCH (t:Topic)
       WITH t.hierarchy_level as level, collect(t.name)[0..3] as samples
       RETURN level, samples
       ORDER BY level`
    )

    for (const record of sampleResult.records) {
      const level = record.get('level')
      const samples = record.get('samples')
      console.log(`  Level ${level}: ${samples.slice(0, 3).join(', ')}...`)
    }

    await session.close()
    console.log('\n✅ Verification complete!')

  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await driver.close()
  }
}

main()
