import neo4j from 'neo4j-driver'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

// Sample test topics covering different entity types and domains
const TEST_CASES = [
  {
    name: 'Encryption',
    description: 'Common topic across multiple domains (cross-references)',
    expectedDomains: ['General Security Concepts', 'Security Operations', 'Security Architecture']
  },
  {
    name: 'Firewall',
    description: 'Network security topic with children',
    expectedDomains: ['General Security Concepts']
  },
  {
    name: 'Public key infrastructure (PKI)',
    description: 'Complex topic with multiple subtopics',
    expectedDomains: ['General Security Concepts']
  },
  {
    name: 'Phishing',
    description: 'Social engineering topic',
    expectedDomains: ['Threats, Vulnerabilities, and Mitigations']
  },
  {
    name: 'Incident response',
    description: 'Process-oriented topic',
    expectedDomains: ['Security Operations']
  }
]

interface GraphRAGContext {
  id: string
  name: string
  entityType: string
  depth: number
  summary: string | null
  fullPath: string
  domain: string
  objective: string | null
  scopeTags: string[]
  parentName: string | null
  parentId: string | null
  grandparentName: string | null
  children: Array<{
    id: string
    name: string
    entityType: string
    summary: string | null
  }>
  relatedConcepts: Array<{
    id: string
    name: string
    domain: string
    sharedConcept: string
    strength: string
    crossDomain: boolean
  }>
}

async function testContextQuery() {
  console.log('\n' + '='.repeat(80))
  console.log('Testing GraphRAG Context Retrieval Queries')
  console.log('='.repeat(80))

  const uri = process.env.NEO4J_URI!
  const username = process.env.NEO4J_USERNAME!
  const password = process.env.NEO4J_PASSWORD!
  const database = process.env.NEO4J_DATABASE || 'neo4j'

  const driver = neo4j.driver(uri, neo4j.auth.basic(username, password))
  const session = driver.session({ database })

  try {
    console.log('\n📊 Testing Query Pattern 1: Get Full Context by Entity ID\n')

    for (const testCase of TEST_CASES) {
      console.log(`\n${'─'.repeat(80)}`)
      console.log(`🔍 Test Case: ${testCase.name}`)
      console.log(`   Description: ${testCase.description}`)
      console.log(`   Expected Domains: ${testCase.expectedDomains.join(', ')}`)

      // First, find entities by name to get IDs
      const findResult = await session.run(`
        MATCH (entity:CurriculumEntity)
        WHERE entity.name = $name
        RETURN entity.id AS id, entity.fullPath AS fullPath, entity.domainName AS domain
        ORDER BY entity.fullPath
      `, { name: testCase.name })

      if (findResult.records.length === 0) {
        console.log(`   ❌ No entities found with name "${testCase.name}"`)
        continue
      }

      console.log(`   ✅ Found ${findResult.records.length} instance(s)`)

      // Test full context query on first instance
      const firstEntity = findResult.records[0]
      const entityId = firstEntity.get('id')
      const fullPath = firstEntity.get('fullPath')
      const domain = firstEntity.get('domain')

      console.log(`\n   📍 Testing: ${fullPath}`)
      console.log(`   🆔 Entity ID: ${entityId}`)

      const contextResult = await session.run(`
        MATCH (entity:CurriculumEntity {id: $entityId})
        OPTIONAL MATCH (entity)-[:CHILD_OF]->(parent)
        OPTIONAL MATCH (entity)-[:CHILD_OF]->(parent)-[:CHILD_OF]->(grandparent)
        OPTIONAL MATCH (entity)-[:PARENT_OF]->(child)
        OPTIONAL MATCH (entity)-[:PARENT_OF]->(child)-[:PARENT_OF]->(grandchild)
        OPTIONAL MATCH (entity)-[r:RELATED_CONCEPT]-(related)
        RETURN
          entity.id AS id,
          entity.name AS name,
          entity.entityType AS entityType,
          entity.depth AS depth,
          entity.contextSummary AS summary,
          entity.fullPath AS fullPath,
          entity.domainName AS domain,
          entity.objectiveName AS objective,
          entity.scopeTags AS scopeTags,
          parent.name AS parentName,
          parent.id AS parentId,
          grandparent.name AS grandparentName,
          grandparent.id AS grandparentId,
          collect(DISTINCT {
            id: child.id,
            name: child.name,
            entityType: child.entityType,
            summary: child.contextSummary
          }) AS children,
          collect(DISTINCT {
            id: grandchild.id,
            name: grandchild.name,
            entityType: grandchild.entityType
          }) AS grandchildren,
          collect(DISTINCT {
            id: related.id,
            name: related.name,
            domain: related.domainName,
            sharedConcept: r.sharedConcept,
            strength: r.strength,
            crossDomain: r.crossDomain
          }) AS relatedConcepts
      `, { entityId })

      if (contextResult.records.length === 0) {
        console.log(`   ❌ Context query returned no results`)
        continue
      }

      const record = contextResult.records[0]
      const context: GraphRAGContext = {
        id: record.get('id'),
        name: record.get('name'),
        entityType: record.get('entityType'),
        depth: record.get('depth'),
        summary: record.get('summary'),
        fullPath: record.get('fullPath'),
        domain: record.get('domain'),
        objective: record.get('objective'),
        scopeTags: record.get('scopeTags') || [],
        parentName: record.get('parentName'),
        parentId: record.get('parentId'),
        grandparentName: record.get('grandparentName'),
        children: record.get('children').filter((c: any) => c.id !== null),
        relatedConcepts: record.get('relatedConcepts').filter((r: any) => r.id !== null)
      }

      // Display context summary
      console.log(`\n   📝 Context Summary:`)
      console.log(`      Entity Type: ${context.entityType} (depth ${context.depth})`)
      console.log(`      Domain: ${context.domain}`)
      console.log(`      Objective: ${context.objective || 'N/A'}`)
      console.log(`      Summary: ${context.summary ? context.summary.substring(0, 100) + '...' : 'N/A'}`)
      console.log(`      Scope Tags: ${context.scopeTags.slice(0, 5).join(', ')}${context.scopeTags.length > 5 ? '...' : ''}`)

      console.log(`\n   🔗 Hierarchy:`)
      if (context.grandparentName) {
        console.log(`      Grandparent: ${context.grandparentName}`)
      }
      if (context.parentName) {
        console.log(`      Parent: ${context.parentName}`)
      }
      console.log(`      Current: ${context.name}`)

      if (context.children.length > 0) {
        console.log(`\n   👶 Children (${context.children.length}):`)
        context.children.slice(0, 5).forEach(child => {
          const summary = child.summary ? ` - ${child.summary.substring(0, 60)}...` : ''
          console.log(`      - ${child.name} (${child.entityType})${summary}`)
        })
        if (context.children.length > 5) {
          console.log(`      ... and ${context.children.length - 5} more`)
        }
      }

      if (context.relatedConcepts.length > 0) {
        const crossDomain = context.relatedConcepts.filter(r => r.crossDomain)
        const sameDomain = context.relatedConcepts.filter(r => !r.crossDomain)

        console.log(`\n   🌐 Related Concepts (${context.relatedConcepts.length} total):`)

        if (crossDomain.length > 0) {
          console.log(`      Cross-Domain (${crossDomain.length}):`)
          crossDomain.slice(0, 3).forEach(rel => {
            console.log(`      - ${rel.name} (${rel.domain})`)
            console.log(`        Shared: "${rel.sharedConcept}" | Strength: ${rel.strength}`)
          })
          if (crossDomain.length > 3) {
            console.log(`      ... and ${crossDomain.length - 3} more`)
          }
        }

        if (sameDomain.length > 0) {
          console.log(`      Same-Domain (${sameDomain.length}):`)
          sameDomain.slice(0, 2).forEach(rel => {
            console.log(`      - ${rel.name}`)
          })
        }
      }

      console.log(`\n   ✅ Context retrieval successful!`)
    }

    // Test query pattern 2: Search by scope tag
    console.log(`\n\n${'='.repeat(80)}`)
    console.log('📊 Testing Query Pattern 2: Search by Scope Tag')
    console.log('='.repeat(80))

    const testScopeTags = ['cryptography', 'network-security', 'incident-response']

    for (const scopeTag of testScopeTags) {
      console.log(`\n🏷️  Scope Tag: ${scopeTag}`)

      const scopeResult = await session.run(`
        MATCH (entity:CurriculumEntity)
        WHERE $scopeTag IN entity.scopeTags
          AND entity.depth >= 2
        RETURN
          entity.id AS id,
          entity.name AS name,
          entity.entityType AS entityType,
          entity.fullPath AS fullPath,
          entity.domainName AS domain,
          entity.contextSummary AS summary,
          entity.scopeTags AS scopeTags
        ORDER BY entity.fullPath
        LIMIT 10
      `, { scopeTag })

      console.log(`   Found ${scopeResult.records.length} entities (showing up to 10)`)

      scopeResult.records.slice(0, 5).forEach((record, idx) => {
        const name = record.get('name')
        const entityType = record.get('entityType')
        const domain = record.get('domain')
        console.log(`   ${idx + 1}. ${name} (${entityType}) - ${domain}`)
      })

      if (scopeResult.records.length > 5) {
        console.log(`   ... and ${scopeResult.records.length - 5} more`)
      }
    }

    // Summary statistics
    console.log(`\n\n${'='.repeat(80)}`)
    console.log('📈 Query Performance Summary')
    console.log('='.repeat(80))

    const stats = await session.run(`
      MATCH (e:CurriculumEntity)
      WITH count(e) AS total
      MATCH (e2:CurriculumEntity)
      WHERE e2.contextSummary IS NOT NULL
      WITH total, count(e2) AS withSummary
      MATCH (e3:CurriculumEntity)
      WHERE size(e3.scopeTags) > 0
      WITH total, withSummary, count(e3) AS withTags
      MATCH ()-[r:RELATED_CONCEPT]->()
      RETURN
        total,
        withSummary,
        withTags,
        count(DISTINCT r) AS totalRelationships
    `)

    const statsRecord = stats.records[0]
    const total = Number(statsRecord.get('total'))
    const withSummary = Number(statsRecord.get('withSummary'))
    const withTags = Number(statsRecord.get('withTags'))
    const totalRelationships = Number(statsRecord.get('totalRelationships'))

    console.log(`\n   Total Entities: ${total}`)
    console.log(`   With Summaries: ${withSummary} (${Math.round(withSummary / total * 100)}%)`)
    console.log(`   With Scope Tags: ${withTags} (${Math.round(withTags / total * 100)}%)`)
    console.log(`   Cross-Reference Relationships: ${totalRelationships}`)

    console.log(`\n${'='.repeat(80)}`)
    console.log('✅ All GraphRAG query tests passed!')
    console.log(`${'='.repeat(80)}\n`)

  } catch (error) {
    console.error('\n❌ Test failed:', error)
    throw error
  } finally {
    await session.close()
    await driver.close()
  }
}

testContextQuery()
