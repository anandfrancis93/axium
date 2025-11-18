/**
 * Import Semantic Relationships to Neo4j
 *
 * Takes the extracted semantic relationships from semantic-relationships.json
 * and creates them in the Neo4j knowledge graph
 */

import neo4j, { Driver, Session } from 'neo4j-driver'
import * as fs from 'fs'
import * as path from 'path'

const NEO4J_URI = process.env.NEO4J_URI || 'neo4j+s://db8f88e0.databases.neo4j.io'
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j'
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || ''

interface SemanticRelationship {
  fromId: string
  fromName: string
  toId: string
  toName: string
  relationshipType: 'IS_A' | 'PART_OF' | 'PREVENTS' | 'USES' | 'DEPENDS_ON' | 'PREREQUISITE'
  confidence: number
  reasoning: string
  extractedFrom: 'hierarchy' | 'context' | 'name_pattern'
}

interface ImportStats {
  totalRelationships: number
  imported: number
  failed: number
  byType: Record<string, number>
  errors: Array<{ relationship: SemanticRelationship; error: string }>
}

/**
 * Import a single relationship to Neo4j
 */
async function importRelationship(
  session: Session,
  relationship: SemanticRelationship
): Promise<boolean> {
  const query = `
    MATCH (from:CurriculumEntity {id: $fromId})
    MATCH (to:CurriculumEntity {id: $toId})
    MERGE (from)-[r:${relationship.relationshipType}]->(to)
    SET r.confidence = $confidence,
        r.reasoning = $reasoning,
        r.extractedFrom = $extractedFrom,
        r.createdAt = datetime()
    RETURN r
  `

  try {
    await session.run(query, {
      fromId: relationship.fromId,
      toId: relationship.toId,
      confidence: relationship.confidence,
      reasoning: relationship.reasoning,
      extractedFrom: relationship.extractedFrom
    })
    return true
  } catch (error: any) {
    console.error(`  Failed to import ${relationship.relationshipType}: ${relationship.fromName} -> ${relationship.toName}`)
    console.error(`  Error: ${error.message}`)
    return false
  }
}

/**
 * Import all relationships in batches
 */
async function importAllRelationships(
  driver: Driver,
  relationships: SemanticRelationship[]
): Promise<ImportStats> {
  const stats: ImportStats = {
    totalRelationships: relationships.length,
    imported: 0,
    failed: 0,
    byType: {},
    errors: []
  }

  console.log('\n📦 Importing relationships to Neo4j...')
  console.log(`Total relationships to import: ${relationships.length}`)

  const batchSize = 50
  const batches = Math.ceil(relationships.length / batchSize)

  for (let i = 0; i < batches; i++) {
    const batch = relationships.slice(i * batchSize, (i + 1) * batchSize)

    console.log(`\nBatch ${i + 1}/${batches} (${batch.length} relationships)`)

    const session = driver.session()

    try {
      for (const relationship of batch) {
        const success = await importRelationship(session, relationship)

        if (success) {
          stats.imported++
          stats.byType[relationship.relationshipType] = (stats.byType[relationship.relationshipType] || 0) + 1
        } else {
          stats.failed++
          stats.errors.push({ relationship, error: 'Import failed' })
        }
      }
    } finally {
      await session.close()
    }

    // Progress update
    const progress = ((i + 1) / batches * 100).toFixed(1)
    console.log(`  Progress: ${progress}% (${stats.imported}/${stats.totalRelationships})`)
  }

  return stats
}

/**
 * Create indexes for semantic relationships
 */
async function createIndexes(driver: Driver): Promise<void> {
  console.log('\n🔧 Creating indexes for semantic relationships...')

  const session = driver.session()

  try {
    // Create index on relationship types for faster queries
    const indexQueries = [
      'CREATE INDEX rel_is_a_idx IF NOT EXISTS FOR ()-[r:IS_A]-() ON (r.confidence)',
      'CREATE INDEX rel_part_of_idx IF NOT EXISTS FOR ()-[r:PART_OF]-() ON (r.confidence)',
      'CREATE INDEX rel_prevents_idx IF NOT EXISTS FOR ()-[r:PREVENTS]-() ON (r.confidence)',
      'CREATE INDEX rel_uses_idx IF NOT EXISTS FOR ()-[r:USES]-() ON (r.confidence)',
      'CREATE INDEX rel_depends_on_idx IF NOT EXISTS FOR ()-[r:DEPENDS_ON]-() ON (r.confidence)'
    ]

    for (const query of indexQueries) {
      try {
        await session.run(query)
        console.log(`  ✓ Created index`)
      } catch (error: any) {
        // Index might already exist
        if (!error.message.includes('already exists')) {
          console.log(`  ⚠ ${error.message}`)
        }
      }
    }
  } finally {
    await session.close()
  }
}

/**
 * Validate imported relationships
 */
async function validateImport(driver: Driver): Promise<void> {
  console.log('\n✅ Validating import...')

  const session = driver.session()

  try {
    // Count relationships by type
    const result = await session.run(`
      MATCH ()-[r]->()
      WHERE type(r) IN ['IS_A', 'PART_OF', 'PREVENTS', 'USES', 'DEPENDS_ON']
      RETURN type(r) as relationshipType, count(r) as count
      ORDER BY count DESC
    `)

    console.log('\nRelationships in Neo4j:')
    result.records.forEach(record => {
      const type = record.get('relationshipType')
      const count = record.get('count').toNumber()
      console.log(`  ${type}: ${count}`)
    })

    // Sample a few relationships
    const sampleResult = await session.run(`
      MATCH (from)-[r:IS_A]->(to)
      RETURN from.name as fromName, to.name as toName, r.confidence as confidence
      LIMIT 5
    `)

    console.log('\nSample IS_A relationships:')
    sampleResult.records.forEach(record => {
      const fromName = record.get('fromName')
      const toName = record.get('toName')
      const confidence = record.get('confidence')
      console.log(`  ${fromName} IS_A ${toName} (confidence: ${confidence})`)
    })
  } finally {
    await session.close()
  }
}

/**
 * Main import function
 */
async function main() {
  console.log('='.repeat(80))
  console.log('Semantic Relationship Import to Neo4j')
  console.log('='.repeat(80))

  // Load relationships
  const relationshipsPath = path.join(process.cwd(), 'semantic-relationships.json')
  const data = JSON.parse(fs.readFileSync(relationshipsPath, 'utf-8'))
  const relationships: SemanticRelationship[] = data.relationships

  console.log(`\nLoaded ${relationships.length} relationships from file`)
  console.log(`  IS_A: ${data.byType.IS_A || 0}`)
  console.log(`  PART_OF: ${data.byType.PART_OF || 0}`)
  console.log(`  PREVENTS: ${data.byType.PREVENTS || 0}`)

  // Check Neo4j credentials
  if (!NEO4J_PASSWORD) {
    console.error('\n❌ Error: NEO4J_PASSWORD environment variable not set')
    console.error('Please set it in your .env.local file')
    process.exit(1)
  }

  // Connect to Neo4j
  console.log(`\nConnecting to Neo4j at ${NEO4J_URI}...`)
  const driver = neo4j.driver(
    NEO4J_URI,
    neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD)
  )

  try {
    // Test connection
    await driver.verifyConnectivity()
    console.log('✓ Connected to Neo4j')

    // Create indexes first
    await createIndexes(driver)

    // Import relationships
    const stats = await importAllRelationships(driver, relationships)

    // Validate
    await validateImport(driver)

    // Print final stats
    console.log('\n' + '='.repeat(80))
    console.log('Import Complete')
    console.log('='.repeat(80))
    console.log(`\nTotal Relationships: ${stats.totalRelationships}`)
    console.log(`  Imported: ${stats.imported}`)
    console.log(`  Failed: ${stats.failed}`)
    console.log('\nBy Type:')
    for (const [type, count] of Object.entries(stats.byType)) {
      console.log(`  ${type}: ${count}`)
    }

    if (stats.errors.length > 0) {
      console.log(`\n⚠ Errors encountered: ${stats.errors.length}`)
      console.log('See above for details')
    }

    console.log('\n✅ Semantic relationships imported to Neo4j')

  } catch (error: any) {
    console.error('\n❌ Import failed:', error)
    process.exit(1)
  } finally {
    await driver.close()
  }
}

// Run import
main()
  .then(() => {
    console.log('\n✅ Import pipeline complete')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n❌ Import failed:', error)
    process.exit(1)
  })
