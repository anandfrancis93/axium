import neo4j, { Driver, Session } from 'neo4j-driver'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

// Actual structure from curriculum-parsed.json
interface ParsedEntity {
  id: string
  name: string
  level: string // "domain" | "objective" | "topic" | "subtopic" | "sub-subtopic"
  fullPath: string
  parentId: string | null
  domainId: string
  domainName: string
  objectiveId: string | null
  objectiveName: string | null
  contextSummary: string | null
  status: string
  curriculumVersion: string
  createdAt: string
}

// Entity with computed properties for Neo4j
interface Entity extends ParsedEntity {
  entityType: string
  depth: number
}

interface CurriculumData {
  metadata: {
    generatedAt: string
    lastUpdated: string
    summariesGenerated: number
  }
  stats: {
    totalEntities: number
    domains: number
    objectives: number
    topics: number
    subtopics: number
    subsubtopics: number
  }
  entities: Entity[]
  hierarchyPaths?: any
  treeData?: any
}

interface ImportOptions {
  testMode?: boolean
  testLimit?: number
  batchSize?: number
  clearExisting?: boolean
}

// Utility function to calculate depth from level
function getLevelDepth(level: string): number {
  const depthMap: Record<string, number> = {
    'domain': 0,
    'objective': 1,
    'topic': 2,
    'subtopic': 3,
    'subsubtopic': 4,
    'sub-subtopic': 4  // Handle both variations
  }
  return depthMap[level.toLowerCase()] ?? 0
}

// Utility function to get entity type (capitalize first letter)
function getEntityType(level: string): string {
  if (!level) return 'Unknown'
  const normalized = level.toLowerCase()
  if (normalized === 'sub-subtopic' || normalized === 'subsubtopic') return 'Sub-subtopic'
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

// Transform parsed entity to entity with computed properties
function transformEntity(parsed: ParsedEntity): Entity {
  return {
    ...parsed,
    entityType: getEntityType(parsed.level),
    depth: getLevelDepth(parsed.level)
  }
}

class Neo4jImporter {
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

  async verifyConnection(): Promise<void> {
    const session = this.driver.session({ database: this.database })
    try {
      await session.run('RETURN 1')
      console.log('✅ Neo4j connection verified')
    } catch (error) {
      console.error('❌ Neo4j connection failed:', error)
      throw error
    } finally {
      await session.close()
    }
  }

  async clearDatabase(session: Session): Promise<void> {
    console.log('\n🗑️  Clearing existing curriculum data...')

    // Delete all CurriculumEntity nodes and their relationships
    await session.run(`
      MATCH (n:CurriculumEntity)
      DETACH DELETE n
    `)

    console.log('✅ Existing data cleared')
  }

  async createConstraintsAndIndexes(session: Session): Promise<void> {
    console.log('\n📋 Creating constraints and indexes...')

    const statements = [
      // Unique constraint on id
      `CREATE CONSTRAINT curriculum_entity_id IF NOT EXISTS
       FOR (e:CurriculumEntity) REQUIRE e.id IS UNIQUE`,

      // Unique constraint on fullPath
      `CREATE CONSTRAINT curriculum_entity_path IF NOT EXISTS
       FOR (e:CurriculumEntity) REQUIRE e.fullPath IS UNIQUE`,

      // Index on name for search
      `CREATE INDEX curriculum_entity_name IF NOT EXISTS
       FOR (e:CurriculumEntity) ON (e.name)`,

      // Index on entityType for filtering
      `CREATE INDEX curriculum_entity_type IF NOT EXISTS
       FOR (e:CurriculumEntity) ON (e.entityType)`,

      // Index on depth for hierarchy queries
      `CREATE INDEX curriculum_entity_depth IF NOT EXISTS
       FOR (e:CurriculumEntity) ON (e.depth)`
    ]

    for (const statement of statements) {
      try {
        await session.run(statement)
      } catch (error: any) {
        // Ignore if constraint/index already exists
        if (!error.message.includes('already exists')) {
          console.warn(`Warning: ${error.message}`)
        }
      }
    }

    console.log('✅ Constraints and indexes ready')
  }

  async importNodes(
    session: Session,
    entities: Entity[],
    batchSize: number = 100
  ): Promise<void> {
    console.log(`\n📦 Importing ${entities.length} entities in batches of ${batchSize}...`)

    const batches = []
    for (let i = 0; i < entities.length; i += batchSize) {
      batches.push(entities.slice(i, i + batchSize))
    }

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]

      // Create nodes
      await session.run(
        `
        UNWIND $entities AS entity
        CREATE (e:CurriculumEntity {
          id: entity.id,
          name: entity.name,
          level: entity.level,
          entityType: entity.entityType,
          fullPath: entity.fullPath,
          depth: entity.depth,
          parentId: entity.parentId,
          domainId: entity.domainId,
          domainName: entity.domainName,
          objectiveId: entity.objectiveId,
          objectiveName: entity.objectiveName,
          contextSummary: entity.contextSummary,
          status: entity.status,
          curriculumVersion: entity.curriculumVersion,
          createdAt: datetime(),
          updatedAt: datetime()
        })
        `,
        {
          entities: batch.map(e => ({
            id: e.id,
            name: e.name,
            level: e.level,
            entityType: e.entityType,
            fullPath: e.fullPath,
            depth: e.depth,
            parentId: e.parentId,
            domainId: e.domainId,
            domainName: e.domainName,
            objectiveId: e.objectiveId,
            objectiveName: e.objectiveName,
            contextSummary: e.contextSummary,
            status: e.status,
            curriculumVersion: e.curriculumVersion
          }))
        }
      )

      const progress = Math.round(((i + 1) / batches.length) * 100)
      process.stdout.write(`\r  Progress: ${progress}% (${(i + 1) * batchSize}/${entities.length})`)
    }

    console.log('\n✅ Nodes created')
  }

  async createRelationships(
    session: Session,
    entities: Entity[],
    batchSize: number = 100
  ): Promise<void> {
    console.log(`\n🔗 Creating hierarchical relationships...`)

    // Filter entities that have parents
    const entitiesWithParents = entities.filter(e => e.parentId !== null)

    const batches = []
    for (let i = 0; i < entitiesWithParents.length; i += batchSize) {
      batches.push(entitiesWithParents.slice(i, i + batchSize))
    }

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]

      // Create PARENT_OF relationships (parent -> child)
      await session.run(
        `
        UNWIND $relationships AS rel
        MATCH (parent:CurriculumEntity {id: rel.parentId})
        MATCH (child:CurriculumEntity {id: rel.childId})
        CREATE (parent)-[:PARENT_OF]->(child)
        `,
        {
          relationships: batch.map(e => ({
            parentId: e.parentId,
            childId: e.id
          }))
        }
      )

      // Create CHILD_OF relationships (child -> parent)
      await session.run(
        `
        UNWIND $relationships AS rel
        MATCH (parent:CurriculumEntity {id: rel.parentId})
        MATCH (child:CurriculumEntity {id: rel.childId})
        CREATE (child)-[:CHILD_OF]->(parent)
        `,
        {
          relationships: batch.map(e => ({
            parentId: e.parentId,
            childId: e.id
          }))
        }
      )

      const progress = Math.round(((i + 1) / batches.length) * 100)
      process.stdout.write(`\r  Progress: ${progress}% (${(i + 1) * batchSize}/${entitiesWithParents.length})`)
    }

    console.log('\n✅ Relationships created')
  }

  async validateImport(session: Session): Promise<void> {
    console.log('\n🔍 Validating import...')

    // Count nodes by type
    const nodeCount = await session.run(`
      MATCH (e:CurriculumEntity)
      RETURN e.entityType AS type, count(e) AS count
      ORDER BY type
    `)

    console.log('\n📊 Node counts by type:')
    nodeCount.records.forEach(record => {
      const type = record.get('type') || 'undefined'
      const count = record.get('count').toNumber()
      console.log(`  ${type}: ${count}`)
    })

    // Total nodes
    const total = await session.run(`
      MATCH (e:CurriculumEntity)
      RETURN count(e) AS total
    `)
    const totalCount = total.records[0].get('total').toNumber()
    console.log(`\n  Total: ${totalCount}`)

    // Count relationships
    const relCount = await session.run(`
      MATCH ()-[r:PARENT_OF]->()
      RETURN count(r) AS count
    `)
    const relCountNum = relCount.records[0].get('count').toNumber()
    console.log(`\n🔗 Relationships:`)
    console.log(`  PARENT_OF: ${relCountNum}`)

    // Check for orphans (nodes without parents except root domains)
    const orphans = await session.run(`
      MATCH (e:CurriculumEntity)
      WHERE e.depth > 0 AND NOT (e)-[:CHILD_OF]->()
      RETURN count(e) AS orphanCount
    `)
    const orphanCount = orphans.records[0].get('orphanCount').toNumber()

    if (orphanCount > 0) {
      console.log(`\n⚠️  Warning: ${orphanCount} orphaned nodes (depth > 0 without parents)`)
    } else {
      console.log(`\n✅ No orphaned nodes found`)
    }

    // Check for nodes without summaries
    const noSummary = await session.run(`
      MATCH (e:CurriculumEntity)
      WHERE e.contextSummary IS NULL
      RETURN count(e) AS noSummaryCount
    `)
    const noSummaryCount = noSummary.records[0].get('noSummaryCount').toNumber()

    if (noSummaryCount > 0) {
      console.log(`⚠️  Warning: ${noSummaryCount} nodes without context summaries`)
    } else {
      console.log(`✅ All nodes have context summaries`)
    }
  }

  async import(options: ImportOptions = {}): Promise<void> {
    const {
      testMode = false,
      testLimit = 20,
      batchSize = 100,
      clearExisting = true
    } = options

    console.log('\n' + '='.repeat(80))
    console.log('Neo4j Curriculum Import')
    console.log('='.repeat(80))

    // Read curriculum data
    const filePath = path.join(process.cwd(), 'curriculum-parsed.json')
    const rawData = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

    // Transform parsed entities to entities with computed properties
    const transformedEntities = rawData.entities.map((e: ParsedEntity) => transformEntity(e))
    const data: CurriculumData = {
      ...rawData,
      entities: transformedEntities
    }

    let entitiesToImport = data.entities

    if (testMode) {
      console.log(`\n🧪 TEST MODE: Importing first ${testLimit} entities`)
      entitiesToImport = data.entities.slice(0, testLimit)
    } else {
      console.log(`\n📚 FULL IMPORT: Importing all ${data.entities.length} entities`)
    }

    console.log(`\n📊 Import Summary:`)
    console.log(`  Total entities: ${data.entities.length}`)
    console.log(`  With summaries: ${data.metadata.summariesGenerated}`)
    console.log(`  Importing: ${entitiesToImport.length}`)
    console.log(`  Batch size: ${batchSize}`)

    const session = this.driver.session({ database: this.database })

    try {
      // Verify connection
      await this.verifyConnection()

      // Create constraints and indexes
      await this.createConstraintsAndIndexes(session)

      // Clear existing data if requested
      if (clearExisting) {
        await this.clearDatabase(session)
      }

      // Import nodes
      await this.importNodes(session, entitiesToImport, batchSize)

      // Create relationships
      await this.createRelationships(session, entitiesToImport, batchSize)

      // Validate import
      await this.validateImport(session)

      console.log('\n' + '='.repeat(80))
      console.log('✅ Import completed successfully!')
      console.log('='.repeat(80) + '\n')

    } catch (error) {
      console.error('\n❌ Import failed:', error)
      throw error
    } finally {
      await session.close()
    }
  }

  async close(): Promise<void> {
    await this.driver.close()
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2)

  const testMode = args.includes('--test')
  const testLimit = parseInt(args.find(arg => arg.startsWith('--limit='))?.split('=')[1] || '20')
  const batchSize = parseInt(args.find(arg => arg.startsWith('--batch='))?.split('=')[1] || '100')
  const clearExisting = !args.includes('--no-clear')

  const importer = new Neo4jImporter()

  try {
    await importer.import({
      testMode,
      testLimit,
      batchSize,
      clearExisting
    })
  } catch (error) {
    console.error('Import failed:', error)
    process.exit(1)
  } finally {
    await importer.close()
  }
}

if (require.main === module) {
  main()
}

export { Neo4jImporter }
