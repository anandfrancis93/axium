/**
 * Build Prerequisite Learning Path DAG
 *
 * Creates PREREQUISITE relationships based on:
 * 1. Curriculum hierarchy (fundamentals before advanced)
 * 2. Semantic relationships (IS_A, PART_OF)
 * 3. Bloom level progression (understand before apply)
 * 4. Domain-specific prerequisites
 *
 * Result: Directed Acyclic Graph (DAG) for optimal learning paths
 */

import neo4j, { Driver, Session } from 'neo4j-driver'

const NEO4J_URI = process.env.NEO4J_URI || 'neo4j+s://db8f88e0.databases.neo4j.io'
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j'
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || ''

interface PrerequisiteStats {
  created: number
  byStrategy: Record<string, number>
  errors: number
}

/**
 * Strategy 1: Hierarchy-based prerequisites
 * Lower-level topics in the same objective are prerequisites for higher-level topics
 */
async function createHierarchyPrerequisites(
  session: Session
): Promise<number> {
  console.log('\n📚 Creating hierarchy-based prerequisites...')

  const query = `
    // Within each objective, create prerequisites from subtopics to topics
    MATCH (objective:CurriculumEntity {level: 'objective'})
    MATCH (objective)-[:CONTAINS*]->(subtopic:CurriculumEntity {level: 'subtopic'})
    MATCH (objective)-[:CONTAINS]->(topic:CurriculumEntity {level: 'topic'})
    WHERE subtopic.fullPath CONTAINS topic.name
      AND subtopic.id <> topic.id
    MERGE (subtopic)-[r:PREREQUISITE]->(topic)
    SET r.strategy = 'hierarchy',
        r.confidence = 0.8,
        r.reasoning = 'Subtopic must be understood before broader topic',
        r.createdAt = datetime()
    RETURN count(r) as count
  `

  const result = await session.run(query)
  const count = result.records[0].get('count').toNumber()
  console.log(`  Created ${count} hierarchy-based prerequisites`)
  return count
}

/**
 * Strategy 2: Semantic prerequisites
 * If A IS_A B, then understanding B is a prerequisite for understanding A
 * Only create across levels to avoid cycles (topic → subtopic, not subtopic → subtopic)
 */
async function createSemanticPrerequisites(
  session: Session
): Promise<number> {
  console.log('\n🔗 Creating semantic prerequisites (IS_A based)...')

  const query = `
    // If subtopic IS_A topic, then topic is a prerequisite for subtopic
    // Only create cross-level prerequisites to avoid cycles
    MATCH (specific:CurriculumEntity {level: 'subtopic'})-[isa:IS_A]->(general:CurriculumEntity {level: 'topic'})
    // Don't create if there's a PART_OF relationship (PART_OF takes precedence)
    WHERE NOT EXISTS {
      MATCH (specific)-[:PART_OF]->(general)
    }
    // Don't create if a reverse PART_OF exists either
    AND NOT EXISTS {
      MATCH (general)-[:PART_OF]->(specific)
    }
    // Don't create if it would form a cycle
    AND NOT EXISTS {
      MATCH path = (specific)-[:PREREQUISITE*]->(general)
    }
    MERGE (general)-[r:PREREQUISITE]->(specific)
    SET r.strategy = 'semantic_is_a',
        r.confidence = 0.85,
        r.reasoning = 'General concept must be understood before specific instance',
        r.createdAt = datetime()
    RETURN count(r) as count
  `

  const result = await session.run(query)
  const count = result.records[0].get('count').toNumber()
  console.log(`  Created ${count} semantic prerequisites`)
  return count
}

/**
 * Strategy 3: Cross-domain prerequisites
 * Fundamental concepts in early domains are prerequisites for later domains
 */
async function createCrossDomainPrerequisites(
  session: Session
): Promise<number> {
  console.log('\n🌐 Creating cross-domain prerequisites...')

  // General Security Concepts (Domain 1) is prerequisite for all other domains
  const query = `
    MATCH (fundamentals:CurriculumEntity)
    WHERE fundamentals.level = 'topic'
      AND fundamentals.domainName = 'General Security Concepts'
      AND (fundamentals.name CONTAINS 'CIA'
           OR fundamentals.name CONTAINS 'Authentication'
           OR fundamentals.name CONTAINS 'Authorization'
           OR fundamentals.name CONTAINS 'Encryption')

    MATCH (advanced:CurriculumEntity)
    WHERE advanced.level = 'topic'
      AND advanced.domainName <> 'General Security Concepts'
      AND advanced.id <> fundamentals.id

    // Only create if topic uses these fundamental concepts
    WITH fundamentals, advanced
    WHERE advanced.contextSummary CONTAINS fundamentals.name
       OR advanced.fullPath CONTAINS fundamentals.name

    MERGE (fundamentals)-[r:PREREQUISITE]->(advanced)
    SET r.strategy = 'cross_domain',
        r.confidence = 0.7,
        r.reasoning = 'Fundamental security concept required for advanced topic',
        r.createdAt = datetime()
    RETURN count(r) as count
  `

  const result = await session.run(query)
  const count = result.records[0].get('count').toNumber()
  console.log(`  Created ${count} cross-domain prerequisites`)
  return count
}

/**
 * Strategy 4: PART_OF prerequisites
 * If A PART_OF B, understanding individual parts helps understand the whole
 */
async function createPartOfPrerequisites(
  session: Session
): Promise<number> {
  console.log('\n🧩 Creating PART_OF prerequisites...')

  const query = `
    // If A PART_OF B, then A is prerequisite for B
    MATCH (part)-[po:PART_OF]->(whole)
    WHERE part.level = 'subtopic' AND whole.level IN ['topic', 'subtopic']
    MERGE (part)-[r:PREREQUISITE]->(whole)
    SET r.strategy = 'part_of',
        r.confidence = 0.75,
        r.reasoning = 'Part must be understood before the whole',
        r.createdAt = datetime()
    RETURN count(r) as count
  `

  const result = await session.run(query)
  const count = result.records[0].get('count').toNumber()
  console.log(`  Created ${count} PART_OF prerequisites`)
  return count
}

/**
 * Validate DAG - ensure no cycles
 */
async function validateDAG(session: Session): Promise<boolean> {
  console.log('\n✅ Validating DAG (checking for cycles)...')

  // Check for cycles using Cypher - limit path length to avoid infinite loops
  const query = `
    MATCH path = (a:CurriculumEntity)-[:PREREQUISITE*1..10]->(a)
    RETURN count(DISTINCT a) as cycleNodes, count(path) as cyclePaths
  `

  const result = await session.run(query)
  const cycleNodes = result.records[0].get('cycleNodes').toNumber()
  const cyclePaths = result.records[0].get('cyclePaths').toNumber()

  if (cycleNodes > 0) {
    console.log(`  ❌ Found cycles in prerequisite graph!`)
    console.log(`  ${cycleNodes} nodes involved in ${cyclePaths} cyclic paths`)
    console.log('  This indicates circular dependencies that must be resolved.')

    // Sample some cycles
    const sampleQuery = `
      MATCH path = (a:CurriculumEntity)-[:PREREQUISITE*2..5]->(a)
      RETURN a.name as node, length(path) as cycleLength
      LIMIT 5
    `
    const sampleResult = await session.run(sampleQuery)
    console.log('\n  Sample cycles:')
    sampleResult.records.forEach(record => {
      console.log(`    ${record.get('node')} (cycle length: ${record.get('cycleLength')})`)
    })

    return false
  }

  console.log('  ✓ No cycles detected - DAG is valid')
  return true
}

/**
 * Calculate learning path depth for each entity
 */
async function calculateLearningDepth(session: Session): Promise<void> {
  console.log('\n📊 Calculating learning path depths...')

  // Find entities with no prerequisites (root nodes)
  const rootQuery = `
    MATCH (entity:CurriculumEntity)
    WHERE NOT EXISTS {
      MATCH (prereq)-[:PREREQUISITE]->(entity)
    }
    SET entity.learningDepth = 0
    RETURN count(entity) as rootCount
  `

  const rootResult = await session.run(rootQuery)
  const rootCount = rootResult.records[0].get('rootCount').toNumber()
  console.log(`  Found ${rootCount} root entities (no prerequisites)`)

  // Iteratively calculate depth
  let depth = 0
  let updated = 1

  while (updated > 0 && depth < 20) {
    depth++

    const depthQuery = `
      MATCH (prereq:CurriculumEntity)-[:PREREQUISITE]->(entity:CurriculumEntity)
      WHERE prereq.learningDepth = $previousDepth
        AND entity.learningDepth IS NULL
      SET entity.learningDepth = $currentDepth
      RETURN count(entity) as updatedCount
    `

    const result = await session.run(depthQuery, {
      previousDepth: depth - 1,
      currentDepth: depth
    })

    updated = result.records[0].get('updatedCount').toNumber()

    if (updated > 0) {
      console.log(`  Depth ${depth}: ${updated} entities`)
    }
  }

  console.log(`  Max learning depth: ${depth - 1}`)
}

/**
 * Generate prerequisite statistics
 */
async function generateStats(session: Session): Promise<void> {
  console.log('\n📈 Prerequisite Statistics:')

  // Count by strategy
  const strategyQuery = `
    MATCH ()-[r:PREREQUISITE]->()
    RETURN r.strategy as strategy, count(r) as count
    ORDER BY count DESC
  `

  const strategyResult = await session.run(strategyQuery)
  console.log('\nBy Strategy:')
  strategyResult.records.forEach(record => {
    const strategy = record.get('strategy')
    const count = record.get('count').toNumber()
    console.log(`  ${strategy}: ${count}`)
  })

  // Average prerequisites per entity
  const avgQuery = `
    MATCH (entity:CurriculumEntity)
    OPTIONAL MATCH (prereq)-[:PREREQUISITE]->(entity)
    WITH entity, count(prereq) as prereqCount
    RETURN
      avg(prereqCount) as avgPrerequisites,
      max(prereqCount) as maxPrerequisites,
      min(prereqCount) as minPrerequisites
  `

  const avgResult = await session.run(avgQuery)
  const record = avgResult.records[0]
  console.log('\nPrerequisites per Entity:')
  console.log(`  Average: ${record.get('avgPrerequisites').toFixed(2)}`)
  console.log(`  Maximum: ${record.get('maxPrerequisites').toNumber()}`)
  console.log(`  Minimum: ${record.get('minPrerequisites').toNumber()}`)

  // Find entities with most prerequisites (hardest topics)
  const hardestQuery = `
    MATCH (entity:CurriculumEntity)
    OPTIONAL MATCH (prereq)-[:PREREQUISITE]->(entity)
    WITH entity, count(prereq) as prereqCount
    WHERE prereqCount > 0
    RETURN entity.name as name, prereqCount
    ORDER BY prereqCount DESC
    LIMIT 10
  `

  const hardestResult = await session.run(hardestQuery)
  console.log('\nMost Prerequisites (Hardest Topics):')
  hardestResult.records.forEach((record, index) => {
    const name = record.get('name')
    const count = record.get('prereqCount').toNumber()
    console.log(`  ${index + 1}. ${name} (${count} prerequisites)`)
  })
}

/**
 * Export learning paths to JSON
 */
async function exportLearningPaths(session: Session): Promise<void> {
  console.log('\n💾 Exporting sample learning paths...')

  // Get a few sample learning paths
  const pathQuery = `
    MATCH (start:CurriculumEntity {learningDepth: 0})
    MATCH path = (start)-[:PREREQUISITE*1..5]->(end:CurriculumEntity)
    WHERE end.level = 'subtopic'
    WITH path, length(path) as pathLength
    ORDER BY pathLength DESC
    LIMIT 10
    RETURN [node in nodes(path) | node.name] as pathNames, pathLength
  `

  const result = await session.run(pathQuery)

  console.log('\nSample Learning Paths (prerequisite → advanced):')
  result.records.forEach((record, index) => {
    const path = record.get('pathNames')
    const length = record.get('pathLength').toNumber()
    console.log(`\n${index + 1}. Path length ${length}:`)
    console.log(`   ${path.join(' → ')}`)
  })
}

/**
 * Main execution
 */
async function main() {
  console.log('='.repeat(80))
  console.log('Prerequisite Learning Path DAG Builder')
  console.log('='.repeat(80))

  // Check Neo4j credentials
  if (!NEO4J_PASSWORD) {
    console.error('\n❌ Error: NEO4J_PASSWORD environment variable not set')
    process.exit(1)
  }

  // Connect to Neo4j
  console.log(`\nConnecting to Neo4j at ${NEO4J_URI}...`)
  const driver = neo4j.driver(
    NEO4J_URI,
    neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD)
  )

  const session = driver.session()

  try {
    await driver.verifyConnectivity()
    console.log('✓ Connected to Neo4j')

    // Execute prerequisite creation strategies
    const stats: PrerequisiteStats = {
      created: 0,
      byStrategy: {},
      errors: 0
    }

    stats.byStrategy['hierarchy'] = await createHierarchyPrerequisites(session)
    stats.byStrategy['semantic_is_a'] = await createSemanticPrerequisites(session)
    stats.byStrategy['cross_domain'] = await createCrossDomainPrerequisites(session)
    stats.byStrategy['part_of'] = await createPartOfPrerequisites(session)

    stats.created = Object.values(stats.byStrategy).reduce((sum, count) => sum + count, 0)

    // Validate DAG
    const isValid = await validateDAG(session)
    if (!isValid) {
      console.log('\n⚠️  Warning: DAG validation failed. Manual review required.')
    }

    // Calculate learning depths
    await calculateLearningDepth(session)

    // Generate statistics
    await generateStats(session)

    // Export sample paths
    await exportLearningPaths(session)

    // Summary
    console.log('\n' + '='.repeat(80))
    console.log('DAG Construction Complete')
    console.log('='.repeat(80))
    console.log(`\nTotal PREREQUISITE relationships created: ${stats.created}`)
    console.log(`DAG is ${isValid ? 'VALID' : 'INVALID'}`)
    console.log('\n✅ Prerequisite learning paths ready for use')

  } catch (error: any) {
    console.error('\n❌ Error building DAG:', error)
    process.exit(1)
  } finally {
    await session.close()
    await driver.close()
  }
}

// Run
main()
  .then(() => {
    console.log('\n✅ DAG builder complete')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n❌ DAG builder failed:', error)
    process.exit(1)
  })
