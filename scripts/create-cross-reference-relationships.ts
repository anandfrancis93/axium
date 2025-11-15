import neo4j from 'neo4j-driver'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

interface EntityPair {
  id: string
  fullPath: string
  entityType: string
  domainName: string
}

interface Candidate {
  name: string
  count: number
  domains: string[]
  entityPairs: EntityPair[]
}

interface CrossReferenceData {
  metadata: {
    generatedAt: string
    count: number
    criteria: string
  }
  candidates: Candidate[]
}

async function createCrossReferenceRelationships() {
  const driver = neo4j.driver(
    process.env.NEO4J_URI!,
    neo4j.auth.basic(process.env.NEO4J_USERNAME!, process.env.NEO4J_PASSWORD!)
  )

  const session = driver.session({ database: 'neo4j' })

  try {
    console.log('\n' + '='.repeat(80))
    console.log('Creating RELATED_CONCEPT Relationships')
    console.log('='.repeat(80))

    // Load cross-reference candidates
    const candidatesPath = path.join(process.cwd(), 'cross-reference-candidates.json')
    if (!fs.existsSync(candidatesPath)) {
      throw new Error('Cross-reference candidates file not found. Run find-cross-references.ts first.')
    }

    const data: CrossReferenceData = JSON.parse(fs.readFileSync(candidatesPath, 'utf-8'))
    console.log(`\n📋 Loaded ${data.candidates.length} cross-reference candidates`)

    // Clear existing RELATED_CONCEPT relationships
    console.log('\n🗑️  Clearing existing RELATED_CONCEPT relationships...')
    const clearResult = await session.run(`
      MATCH ()-[r:RELATED_CONCEPT]->()
      DELETE r
    `)
    console.log('✅ Cleared existing relationships')

    // Create relationships for each candidate
    let totalRelationships = 0

    for (const candidate of data.candidates) {
      const entities = candidate.entityPairs

      // Create bidirectional relationships between all pairs
      for (let i = 0; i < entities.length; i++) {
        for (let j = i + 1; j < entities.length; j++) {
          const entity1 = entities[i]
          const entity2 = entities[j]

          // Determine relationship strength based on context
          const crossDomain = entity1.domainName !== entity2.domainName
          const strength = crossDomain ? 'high' : 'medium'
          const reason = crossDomain
            ? `Cross-domain concept: "${candidate.name}"`
            : `Related concept within same domain: "${candidate.name}"`

          // Create bidirectional relationships
          await session.run(`
            MATCH (e1:CurriculumEntity {id: $id1})
            MATCH (e2:CurriculumEntity {id: $id2})
            CREATE (e1)-[:RELATED_CONCEPT {
              sharedConcept: $sharedConcept,
              strength: $strength,
              reason: $reason,
              crossDomain: $crossDomain,
              createdAt: datetime()
            }]->(e2)
            CREATE (e2)-[:RELATED_CONCEPT {
              sharedConcept: $sharedConcept,
              strength: $strength,
              reason: $reason,
              crossDomain: $crossDomain,
              createdAt: datetime()
            }]->(e1)
          `, {
            id1: entity1.id,
            id2: entity2.id,
            sharedConcept: candidate.name,
            strength,
            reason,
            crossDomain
          })

          totalRelationships += 2 // Bidirectional
        }
      }
    }

    console.log(`\n✅ Created ${totalRelationships} RELATED_CONCEPT relationships`)

    // Validation
    console.log('\n🔍 Validating relationships...')

    const stats = await session.run(`
      MATCH ()-[r:RELATED_CONCEPT]->()
      RETURN
        count(r) AS total,
        sum(CASE WHEN r.crossDomain THEN 1 ELSE 0 END) AS crossDomain,
        sum(CASE WHEN NOT r.crossDomain THEN 1 ELSE 0 END) AS sameDomain
    `)

    const total = stats.records[0].get('total').toNumber()
    const crossDomain = stats.records[0].get('crossDomain').toNumber()
    const sameDomain = stats.records[0].get('sameDomain').toNumber()

    console.log(`\n📊 Relationship Statistics:`)
    console.log(`  Total RELATED_CONCEPT relationships: ${total}`)
    console.log(`  Cross-domain: ${crossDomain}`)
    console.log(`  Same-domain: ${sameDomain}`)

    // Show top concepts by relationship count
    const topConcepts = await session.run(`
      MATCH (e:CurriculumEntity)-[r:RELATED_CONCEPT]->()
      RETURN
        e.name AS name,
        e.domainName AS domain,
        count(r) AS relationshipCount
      ORDER BY relationshipCount DESC
      LIMIT 10
    `)

    console.log(`\n🔗 Top Concepts by Relationship Count:`)
    topConcepts.records.forEach((record, idx) => {
      const name = record.get('name')
      const domain = record.get('domain')
      const count = record.get('relationshipCount').toNumber()
      console.log(`  ${(idx + 1).toString().padStart(2)}. "${name}" (${domain}) - ${count} relationships`)
    })

    // Sample relationships
    const sampleRels = await session.run(`
      MATCH (e1:CurriculumEntity)-[r:RELATED_CONCEPT]->(e2:CurriculumEntity)
      WHERE r.crossDomain = true
      RETURN
        e1.name AS name1,
        e1.domainName AS domain1,
        e2.name AS name2,
        e2.domainName AS domain2,
        r.sharedConcept AS concept,
        r.strength AS strength
      LIMIT 5
    `)

    console.log(`\n📋 Sample Cross-Domain Relationships:`)
    sampleRels.records.forEach((record, idx) => {
      const name1 = record.get('name1')
      const domain1 = record.get('domain1')
      const name2 = record.get('name2')
      const domain2 = record.get('domain2')
      const concept = record.get('concept')
      const strength = record.get('strength')

      console.log(`\n  ${idx + 1}. Shared concept: "${concept}" (${strength} strength)`)
      console.log(`     ${name1} (${domain1})`)
      console.log(`     ↔ ${name2} (${domain2})`)
    })

    console.log('\n' + '='.repeat(80))
    console.log('✅ RELATED_CONCEPT relationships created successfully')
    console.log('='.repeat(80) + '\n')

  } finally {
    await session.close()
    await driver.close()
  }
}

if (require.main === module) {
  createCrossReferenceRelationships()
}

export { createCrossReferenceRelationships }
