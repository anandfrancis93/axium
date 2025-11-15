/**
 * Calculate Difficulty Scores for Curriculum Entities
 *
 * Scores entities on a 1-10 scale based on:
 * 1. Learning depth (from prerequisite DAG)
 * 2. Number of prerequisites
 * 3. Hierarchy level (subtopic > topic > objective)
 * 4. Content complexity (based on context summary length/keywords)
 */

import neo4j, { Driver, Session } from 'neo4j-driver'

const NEO4J_URI = process.env.NEO4J_URI || 'neo4j+s://db8f88e0.databases.neo4j.io'
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j'
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || ''

interface DifficultyFactors {
  learningDepth: number
  prerequisiteCount: number
  hierarchyLevel: number
  contentComplexity: number
}

interface DifficultyStats {
  totalEntities: number
  updated: number
  byDifficulty: Record<number, number>
  averageDifficulty: number
}

/**
 * Calculate difficulty score (1-10)
 */
function calculateDifficultyScore(factors: DifficultyFactors): number {
  // Weighted factors
  const depthScore = Math.min(factors.learningDepth * 2, 4) // Max 4 points
  const prereqScore = Math.min(factors.prerequisiteCount * 0.5, 3) // Max 3 points
  const levelScore = factors.hierarchyLevel // Max 2 points
  const complexityScore = factors.contentComplexity // Max 1 point

  const rawScore = depthScore + prereqScore + levelScore + complexityScore

  // Normalize to 1-10 scale
  const normalized = Math.ceil((rawScore / 10) * 10)
  return Math.max(1, Math.min(10, normalized))
}

/**
 * Determine hierarchy level score
 */
function getHierarchyScore(level: string): number {
  switch (level) {
    case 'domain':
      return 0
    case 'objective':
      return 0.5
    case 'topic':
      return 1
    case 'subtopic':
      return 2
    default:
      return 0
  }
}

/**
 * Assess content complexity based on keywords and length
 */
function assessContentComplexity(contextSummary: string): number {
  if (!contextSummary) return 0

  const length = contextSummary.length

  // Keywords that indicate complexity
  const advancedKeywords = [
    'advanced', 'complex', 'cryptographic', 'algorithm',
    'implementation', 'enterprise', 'architecture', 'framework',
    'integration', 'orchestration', 'sophisticated', 'multi-'
  ]

  const foundKeywords = advancedKeywords.filter(keyword =>
    contextSummary.toLowerCase().includes(keyword)
  ).length

  // Length score (longer summaries = more complex)
  const lengthScore = length > 500 ? 0.5 : length > 300 ? 0.3 : 0.1

  // Keyword score
  const keywordScore = Math.min(foundKeywords * 0.2, 0.5)

  return lengthScore + keywordScore
}

/**
 * Update difficulty scores for all entities
 */
async function updateDifficultyScores(session: Session): Promise<DifficultyStats> {
  console.log('\n📊 Calculating difficulty scores...')

  // Get all entities with their factors
  const query = `
    MATCH (entity:CurriculumEntity)
    OPTIONAL MATCH (prereq)-[:PREREQUISITE]->(entity)
    WITH entity,
         coalesce(entity.learningDepth, 0) as learningDepth,
         count(prereq) as prerequisiteCount
    RETURN entity.id as id,
           entity.name as name,
           entity.level as level,
           entity.contextSummary as contextSummary,
           learningDepth,
           prerequisiteCount
  `

  const result = await session.run(query)

  const stats: DifficultyStats = {
    totalEntities: result.records.length,
    updated: 0,
    byDifficulty: {},
    averageDifficulty: 0
  }

  let totalScore = 0

  for (const record of result.records) {
    const id = record.get('id')
    const name = record.get('name')
    const level = record.get('level')
    const contextSummary = record.get('contextSummary') || ''
    const learningDepth = typeof record.get('learningDepth') === 'number'
      ? record.get('learningDepth')
      : record.get('learningDepth')?.toNumber() || 0
    const prerequisiteCount = typeof record.get('prerequisiteCount') === 'number'
      ? record.get('prerequisiteCount')
      : record.get('prerequisiteCount')?.toNumber() || 0

    // Calculate factors
    const factors: DifficultyFactors = {
      learningDepth,
      prerequisiteCount,
      hierarchyLevel: getHierarchyScore(level),
      contentComplexity: assessContentComplexity(contextSummary)
    }

    // Calculate score
    const difficultyScore = calculateDifficultyScore(factors)

    // Update entity
    await session.run(`
      MATCH (entity:CurriculumEntity {id: $id})
      SET entity.difficultyScore = $difficultyScore,
          entity.difficultyFactors = $factors
      RETURN entity
    `, {
      id,
      difficultyScore,
      factors: JSON.stringify(factors)
    })

    stats.updated++
    stats.byDifficulty[difficultyScore] = (stats.byDifficulty[difficultyScore] || 0) + 1
    totalScore += difficultyScore

    if (stats.updated % 100 === 0) {
      console.log(`  Processed ${stats.updated}/${stats.totalEntities} entities`)
    }
  }

  stats.averageDifficulty = totalScore / stats.totalEntities

  return stats
}

/**
 * Generate difficulty distribution report
 */
async function generateDifficultyReport(session: Session): Promise<void> {
  console.log('\n📈 Difficulty Score Distribution:\n')

  const query = `
    MATCH (entity:CurriculumEntity)
    WHERE entity.difficultyScore IS NOT NULL
    RETURN entity.difficultyScore as score, count(*) as count
    ORDER BY score
  `

  const result = await session.run(query)

  result.records.forEach(record => {
    const score = record.get('score')
    const count = record.get('count').toNumber()
    const bar = '█'.repeat(Math.ceil(count / 10))
    console.log(`  ${score}/10: ${bar} (${count} entities)`)
  })

  // Sample hardest entities
  console.log('\n🔥 Hardest Topics (Difficulty 8-10):\n')

  const hardestQuery = `
    MATCH (entity:CurriculumEntity)
    WHERE entity.difficultyScore >= 8
    RETURN entity.name as name,
           entity.level as level,
           entity.difficultyScore as score,
           entity.learningDepth as depth
    ORDER BY score DESC, depth DESC
    LIMIT 10
  `

  const hardestResult = await session.run(hardestQuery)
  hardestResult.records.forEach((record, index) => {
    const name = record.get('name')
    const level = record.get('level')
    const score = record.get('score')
    const depth = record.get('depth')?.toNumber() || 0
    console.log(`  ${index + 1}. [${score}/10] ${name} (${level}, depth: ${depth})`)
  })

  // Sample easiest entities
  console.log('\n✅ Easiest Topics (Difficulty 1-3):\n')

  const easiestQuery = `
    MATCH (entity:CurriculumEntity)
    WHERE entity.difficultyScore <= 3
      AND entity.level IN ['topic', 'subtopic']
    RETURN entity.name as name,
           entity.level as level,
           entity.difficultyScore as score
    ORDER BY score ASC
    LIMIT 10
  `

  const easiestResult = await session.run(easiestQuery)
  easiestResult.records.forEach((record, index) => {
    const name = record.get('name')
    const level = record.get('level')
    const score = record.get('score')
    console.log(`  ${index + 1}. [${score}/10] ${name} (${level})`)
  })
}

/**
 * Main execution
 */
async function main() {
  console.log('='.repeat(80))
  console.log('Difficulty Score Calculator')
  console.log('='.repeat(80))

  if (!NEO4J_PASSWORD) {
    console.error('\n❌ Error: NEO4J_PASSWORD environment variable not set')
    process.exit(1)
  }

  console.log(`\nConnecting to Neo4j at ${NEO4J_URI}...`)
  const driver = neo4j.driver(
    NEO4J_URI,
    neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD)
  )

  const session = driver.session()

  try {
    await driver.verifyConnectivity()
    console.log('✓ Connected to Neo4j')

    // Calculate and update scores
    const stats = await updateDifficultyScores(session)

    console.log('\n' + '='.repeat(80))
    console.log('Calculation Complete')
    console.log('='.repeat(80))
    console.log(`\nTotal Entities: ${stats.totalEntities}`)
    console.log(`Updated: ${stats.updated}`)
    console.log(`Average Difficulty: ${stats.averageDifficulty.toFixed(2)}/10`)

    // Generate report
    await generateDifficultyReport(session)

    console.log('\n✅ Difficulty scores calculated and stored')

  } catch (error: any) {
    console.error('\n❌ Error:', error)
    process.exit(1)
  } finally {
    await session.close()
    await driver.close()
  }
}

// Run
main()
  .then(() => {
    console.log('\n✅ Difficulty calculation complete')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n❌ Calculation failed:', error)
    process.exit(1)
  })
