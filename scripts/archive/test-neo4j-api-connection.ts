import neo4j from 'neo4j-driver'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function testConnection() {
  console.log('\n' + '='.repeat(80))
  console.log('Testing Neo4j Connection for API Usage')
  console.log('='.repeat(80))

  const uri = process.env.NEO4J_URI
  const username = process.env.NEO4J_USERNAME
  const password = process.env.NEO4J_PASSWORD
  const database = process.env.NEO4J_DATABASE || 'neo4j'

  console.log('\n📋 Configuration Check:')
  console.log(`  URI: ${uri ? '✅ Set' : '❌ Missing'}`)
  console.log(`  Username: ${username ? '✅ Set' : '❌ Missing'}`)
  console.log(`  Password: ${password ? '✅ Set (' + password.substring(0, 10) + '...)' : '❌ Missing'}`)
  console.log(`  Database: ${database}`)

  if (!uri || !username || !password) {
    console.error('\n❌ Missing Neo4j configuration in .env.local')
    process.exit(1)
  }

  const driver = neo4j.driver(uri, neo4j.auth.basic(username, password))
  const session = driver.session({ database })

  try {
    // Test basic connectivity
    console.log('\n🔌 Testing basic connectivity...')
    await session.run('RETURN 1 AS test')
    console.log('✅ Connection successful!')

    // Test curriculum entity count
    console.log('\n📊 Testing curriculum data access...')
    const result = await session.run(`
      MATCH (e:CurriculumEntity)
      RETURN count(e) AS totalEntities
    `)
    const count = result.records[0].get('totalEntities').toNumber()
    console.log(`✅ Found ${count} curriculum entities`)

    // Test context retrieval query
    console.log('\n🔎 Testing context retrieval query...')
    const contextResult = await session.run(`
      MATCH (entity:CurriculumEntity {name: $name})
      OPTIONAL MATCH (entity)-[:CHILD_OF]->(parent)
      OPTIONAL MATCH (entity)-[:PARENT_OF]->(child)
      OPTIONAL MATCH (entity)-[r:RELATED_CONCEPT]-(related)
      RETURN
        entity.id AS id,
        entity.name AS name,
        entity.contextSummary AS summary,
        entity.fullPath AS fullPath,
        entity.domainName AS domain,
        entity.scopeTags AS tags,
        parent.name AS parentName,
        collect(DISTINCT child.name) AS childrenNames,
        collect(DISTINCT {
          name: related.name,
          domain: related.domainName,
          concept: r.sharedConcept
        }) AS relatedConcepts
      LIMIT 1
    `, { name: 'Encryption' })

    if (contextResult.records.length > 0) {
      const record = contextResult.records[0]
      console.log('✅ Context retrieval successful!')
      console.log('\n📝 Sample Context for "Encryption":')
      console.log(`  ID: ${record.get('id')}`)
      console.log(`  Domain: ${record.get('domain')}`)
      console.log(`  Parent: ${record.get('parentName')}`)
      console.log(`  Children: ${record.get('childrenNames').slice(0, 3).join(', ')}...`)
      console.log(`  Tags: ${record.get('tags').slice(0, 5).join(', ')}...`)
      console.log(`  Related Concepts: ${record.get('relatedConcepts').length} found`)
      console.log(`  Summary: ${record.get('summary').substring(0, 100)}...`)
    }

    console.log('\n' + '='.repeat(80))
    console.log('✅ All Neo4j API tests passed!')
    console.log('='.repeat(80) + '\n')

  } catch (error) {
    console.error('\n❌ Test failed:', error)
    throw error
  } finally {
    await session.close()
    await driver.close()
  }
}

testConnection()
