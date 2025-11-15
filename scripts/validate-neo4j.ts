import neo4j, { Driver, Session } from 'neo4j-driver'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

class Neo4jValidator {
  private driver: Driver
  private database: string

  constructor() {
    const uri = process.env.NEO4J_URI
    const username = process.env.NEO4J_USERNAME
    const password = process.env.NEO4J_PASSWORD
    this.database = process.env.NEO4J_DATABASE || 'neo4j'

    if (!uri || !username || !password) {
      throw new Error('Neo4j configuration missing. Check .env.local file.')
    }

    this.driver = neo4j.driver(uri, neo4j.auth.basic(username, password))
  }

  async runValidations(): Promise<void> {
    const session = this.driver.session({ database: this.database })

    try {
      console.log('\n' + '='.repeat(80))
      console.log('Neo4j Database Validation')
      console.log('='.repeat(80))

      // 1. Total node count
      await this.checkTotalNodes(session)

      // 2. Nodes by type
      await this.checkNodesByType(session)

      // 3. Relationship counts
      await this.checkRelationships(session)

      // 4. Check for orphans
      await this.checkOrphans(session)

      // 5. Check depth distribution
      await this.checkDepthDistribution(session)

      // 6. Check context summaries
      await this.checkContextSummaries(session)

      // 7. Sample hierarchy query
      await this.sampleHierarchyQuery(session)

      // 8. Sample search queries
      await this.sampleSearchQueries(session)

      console.log('\n' + '='.repeat(80))
      console.log('✅ Validation completed')
      console.log('='.repeat(80) + '\n')

    } catch (error) {
      console.error('❌ Validation failed:', error)
      throw error
    } finally {
      await session.close()
    }
  }

  async checkTotalNodes(session: Session): Promise<void> {
    console.log('\n📊 Total Nodes:')
    const result = await session.run(`
      MATCH (e:CurriculumEntity)
      RETURN count(e) AS total
    `)
    const total = result.records[0].get('total').toNumber()
    console.log(`  ${total} curriculum entities`)
  }

  async checkNodesByType(session: Session): Promise<void> {
    console.log('\n📋 Nodes by Type:')
    const result = await session.run(`
      MATCH (e:CurriculumEntity)
      RETURN e.entityType AS type, count(e) AS count
      ORDER BY
        CASE e.entityType
          WHEN 'Domain' THEN 1
          WHEN 'Objective' THEN 2
          WHEN 'Topic' THEN 3
          WHEN 'Subtopic' THEN 4
          WHEN 'Sub-subtopic' THEN 5
          ELSE 6
        END
    `)

    result.records.forEach(record => {
      const type = record.get('type') || 'undefined'
      const count = record.get('count').toNumber()
      console.log(`  ${type.padEnd(15)} : ${count}`)
    })
  }

  async checkRelationships(session: Session): Promise<void> {
    console.log('\n🔗 Relationships:')

    const parentOf = await session.run(`
      MATCH ()-[r:PARENT_OF]->()
      RETURN count(r) AS count
    `)
    console.log(`  PARENT_OF      : ${parentOf.records[0].get('count').toNumber()}`)

    const childOf = await session.run(`
      MATCH ()-[r:CHILD_OF]->()
      RETURN count(r) AS count
    `)
    console.log(`  CHILD_OF       : ${childOf.records[0].get('count').toNumber()}`)
  }

  async checkOrphans(session: Session): Promise<void> {
    console.log('\n🔍 Orphan Check:')

    const orphans = await session.run(`
      MATCH (e:CurriculumEntity)
      WHERE e.depth > 0 AND NOT (e)-[:CHILD_OF]->()
      RETURN e.name AS name, e.fullPath AS path, e.depth AS depth
      LIMIT 10
    `)

    if (orphans.records.length === 0) {
      console.log('  ✅ No orphaned nodes (all non-root nodes have parents)')
    } else {
      console.log(`  ⚠️  Found ${orphans.records.length} orphaned nodes:`)
      orphans.records.forEach(record => {
        console.log(`    - ${record.get('name')} (depth: ${record.get('depth')})`)
        console.log(`      Path: ${record.get('path')}`)
      })
    }
  }

  async checkDepthDistribution(session: Session): Promise<void> {
    console.log('\n📏 Depth Distribution:')
    const result = await session.run(`
      MATCH (e:CurriculumEntity)
      RETURN e.depth AS depth, count(e) AS count
      ORDER BY depth
    `)

    result.records.forEach(record => {
      const depth = record.get('depth')
      const count = record.get('count').toNumber()
      const bar = '█'.repeat(Math.min(50, Math.floor(count / 10)))
      console.log(`  Depth ${depth}: ${count.toString().padStart(4)} ${bar}`)
    })
  }

  async checkContextSummaries(session: Session): Promise<void> {
    console.log('\n📝 Context Summaries:')

    const withSummary = await session.run(`
      MATCH (e:CurriculumEntity)
      WHERE e.contextSummary IS NOT NULL
      RETURN count(e) AS count
    `)

    const withoutSummary = await session.run(`
      MATCH (e:CurriculumEntity)
      WHERE e.contextSummary IS NULL
      RETURN count(e) AS count
    `)

    const total = await session.run(`
      MATCH (e:CurriculumEntity)
      RETURN count(e) AS count
    `)

    const hasCount = withSummary.records[0].get('count').toNumber()
    const noCount = withoutSummary.records[0].get('count').toNumber()
    const totalCount = total.records[0].get('count').toNumber()
    const percentage = Math.round((hasCount / totalCount) * 100)

    console.log(`  With summaries    : ${hasCount} (${percentage}%)`)
    console.log(`  Without summaries : ${noCount}`)
  }

  async sampleHierarchyQuery(session: Session): Promise<void> {
    console.log('\n🌳 Sample Hierarchy (First Domain):')

    const result = await session.run(`
      MATCH (domain:CurriculumEntity {depth: 0})
      WITH domain LIMIT 1
      OPTIONAL MATCH (domain)-[:PARENT_OF]->(objective:CurriculumEntity)
      WITH domain, objective LIMIT 5
      OPTIONAL MATCH (objective)-[:PARENT_OF]->(topic:CurriculumEntity)
      WITH domain, objective, topic LIMIT 3
      RETURN domain.name AS domain,
             objective.name AS objective,
             topic.name AS topic
    `)

    let currentDomain = ''
    let currentObjective = ''

    result.records.forEach(record => {
      const domain = record.get('domain')
      const objective = record.get('objective')
      const topic = record.get('topic')

      if (domain && domain !== currentDomain) {
        console.log(`\n  ${domain}`)
        currentDomain = domain
      }

      if (objective && objective !== currentObjective) {
        console.log(`    ├─ ${objective}`)
        currentObjective = objective
      }

      if (topic) {
        console.log(`       └─ ${topic}`)
      }
    })
  }

  async sampleSearchQueries(session: Session): Promise<void> {
    console.log('\n🔎 Sample Search Queries:')

    // Search for "encryption"
    console.log('\n  Search: "encryption" (showing top 5)')
    const searchResult = await session.run(`
      MATCH (e:CurriculumEntity)
      WHERE toLower(e.name) CONTAINS toLower($searchTerm)
         OR toLower(e.fullPath) CONTAINS toLower($searchTerm)
      RETURN e.name AS name, e.entityType AS type, e.fullPath AS path
      LIMIT 5
    `, { searchTerm: 'encryption' })

    searchResult.records.forEach(record => {
      const name = record.get('name')
      const type = record.get('type')
      console.log(`    - [${type}] ${name}`)
    })

    // Get all root domains
    console.log('\n  All Domains:')
    const domains = await session.run(`
      MATCH (e:CurriculumEntity {depth: 0})
      RETURN e.name AS name
      ORDER BY e.name
    `)

    domains.records.forEach(record => {
      console.log(`    - ${record.get('name')}`)
    })
  }

  async close(): Promise<void> {
    await this.driver.close()
  }
}

async function main() {
  const validator = new Neo4jValidator()

  try {
    await validator.runValidations()
  } catch (error) {
    console.error('Validation failed:', error)
    process.exit(1)
  } finally {
    await validator.close()
  }
}

if (require.main === module) {
  main()
}

export { Neo4jValidator }
