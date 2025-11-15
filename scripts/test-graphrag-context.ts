/**
 * Test GraphRAG Context with Semantic Relationships
 *
 * Verifies that enhanced context retrieval includes:
 * - IS_A relationships
 * - PART_OF relationships
 * - PREREQUISITE relationships
 * - Difficulty scores and learning metadata
 */

import {
  getContextById,
  findEntitiesByName,
  getContextByPath,
  formatContextForLLM
} from '../lib/graphrag/context'
import neo4j from 'neo4j-driver'

const NEO4J_URI = process.env.NEO4J_URI || ''
const NEO4J_USER = process.env.NEO4J_USERNAME || 'neo4j'
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || ''

interface TestResults {
  passed: number
  failed: number
  tests: Array<{
    name: string
    status: 'PASS' | 'FAIL'
    message?: string
  }>
}

const results: TestResults = {
  passed: 0,
  failed: 0,
  tests: []
}

function recordTest(name: string, passed: boolean, message?: string) {
  results.tests.push({
    name,
    status: passed ? 'PASS' : 'FAIL',
    message
  })
  if (passed) {
    results.passed++
  } else {
    results.failed++
  }
}

async function testGetContextById() {
  console.log('\n📋 Test 1: Get Context by ID with Semantic Relationships\n')

  // Find an entity with semantic relationships
  const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD))
  const session = driver.session()

  try {
    // Find a subtopic with prerequisites
    const result = await session.run(`
      MATCH (entity:CurriculumEntity {level: 'subtopic'})
      WHERE EXISTS {
        MATCH (prereq)-[:PREREQUISITE]->(entity)
      }
      RETURN entity.id as id, entity.name as name
      LIMIT 1
    `)

    if (result.records.length === 0) {
      recordTest('Find entity with prerequisites', false, 'No entities with prerequisites found')
      return
    }

    const entityId = result.records[0].get('id')
    const entityName = result.records[0].get('name')
    console.log(`Testing entity: ${entityName} (${entityId})`)

    // Get context
    const context = await getContextById(entityId)

    if (!context) {
      recordTest('getContextById returns context', false, 'Context is null')
      return
    }

    recordTest('getContextById returns context', true)

    // Check semantic relationships exist
    const hasSemanticRelationships = context.semanticRelationships !== undefined
    recordTest('Context has semanticRelationships', hasSemanticRelationships)

    // Check learning metadata exists
    const hasLearningMetadata = context.learningMetadata !== undefined
    recordTest('Context has learningMetadata', hasLearningMetadata)

    if (hasSemanticRelationships) {
      const hasPrerequisites = context.semanticRelationships.prerequisites.length > 0
      recordTest('Entity has prerequisites', hasPrerequisites,
        `Found ${context.semanticRelationships.prerequisites.length} prerequisites`)

      if (hasPrerequisites) {
        console.log('\nPrerequisites:')
        context.semanticRelationships.prerequisites.forEach(prereq => {
          console.log(`  - ${prereq.name} (difficulty: ${prereq.difficultyScore}/10)`)
          console.log(`    Strategy: ${prereq.strategy}`)
          console.log(`    Reasoning: ${prereq.reasoning}`)
        })
      }

      console.log('\nIS_A relationships:', context.semanticRelationships.isA.length)
      console.log('PART_OF relationships:', context.semanticRelationships.partOf.length)
      console.log('Enables concepts:', context.semanticRelationships.enablesConcepts.length)
    }

    if (hasLearningMetadata) {
      console.log('\nLearning Metadata:')
      console.log(`  Difficulty Score: ${context.learningMetadata.difficultyScore}/10`)
      console.log(`  Learning Depth: ${context.learningMetadata.learningDepth}`)
      console.log(`  Estimated Study Time: ${context.learningMetadata.estimatedStudyTime} minutes`)
      console.log(`  Has Prerequisites: ${context.learningMetadata.hasPrerequisites}`)
      console.log(`  Prerequisite Count: ${context.learningMetadata.prerequisiteCount}`)

      const metadataComplete =
        context.learningMetadata.difficultyScore > 0 &&
        context.learningMetadata.estimatedStudyTime > 0
      recordTest('Learning metadata is complete', metadataComplete)
    }

  } finally {
    await session.close()
    await driver.close()
  }
}

async function testFindEntitiesByName() {
  console.log('\n📋 Test 2: Find Entities by Name with Semantic Relationships\n')

  // Use a common name that appears in multiple domains
  const testName = 'Encryption'

  console.log(`Searching for entities named: "${testName}"`)
  const entities = await findEntitiesByName(testName)

  const foundEntities = entities.length > 0
  recordTest('findEntitiesByName returns results', foundEntities,
    `Found ${entities.length} entities`)

  if (foundEntities) {
    entities.forEach((entity, index) => {
      console.log(`\nEntity ${index + 1}: ${entity.name}`)
      console.log(`  Path: ${entity.fullPath}`)
      console.log(`  Difficulty: ${entity.learningMetadata.difficultyScore}/10`)
      console.log(`  Prerequisites: ${entity.learningMetadata.prerequisiteCount}`)
      console.log(`  IS_A: ${entity.semanticRelationships.isA.length}`)
      console.log(`  PART_OF: ${entity.semanticRelationships.partOf.length}`)
    })

    const allHaveMetadata = entities.every(e =>
      e.semanticRelationships !== undefined &&
      e.learningMetadata !== undefined
    )
    recordTest('All entities have semantic relationships and metadata', allHaveMetadata)
  }
}

async function testGetContextByPath() {
  console.log('\n📋 Test 3: Get Context by Path with Semantic Relationships\n')

  const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD))
  const session = driver.session()

  try {
    // Find a path with semantic relationships
    const result = await session.run(`
      MATCH (entity:CurriculumEntity)
      WHERE EXISTS {
        MATCH (entity)-[:IS_A|PART_OF]->()
      }
      RETURN entity.fullPath as path
      LIMIT 1
    `)

    if (result.records.length === 0) {
      recordTest('Find entity with semantic relationships', false,
        'No entities with IS_A or PART_OF found')
      return
    }

    const testPath = result.records[0].get('path')
    console.log(`Testing path: "${testPath}"`)

    const context = await getContextByPath(testPath)

    if (!context) {
      recordTest('getContextByPath returns context', false, 'Context is null')
      return
    }

    recordTest('getContextByPath returns context', true)

    const hasSemanticData =
      context.semanticRelationships !== undefined &&
      context.learningMetadata !== undefined

    recordTest('Context has semantic data', hasSemanticData)

    if (hasSemanticData) {
      console.log('\nSemantic Relationships:')
      console.log(`  IS_A: ${context.semanticRelationships.isA.length}`)
      console.log(`  PART_OF: ${context.semanticRelationships.partOf.length}`)
      console.log(`  Prerequisites: ${context.semanticRelationships.prerequisites.length}`)
      console.log(`  Enables: ${context.semanticRelationships.enablesConcepts.length}`)
      console.log(`\nDifficulty: ${context.learningMetadata.difficultyScore}/10`)
    }

  } finally {
    await session.close()
    await driver.close()
  }
}

async function testFormatContextForLLM() {
  console.log('\n📋 Test 4: Format Context for LLM with Semantic Info\n')

  const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD))
  const session = driver.session()

  try {
    // Find an entity with rich context
    const result = await session.run(`
      MATCH (entity:CurriculumEntity {level: 'subtopic'})
      WHERE EXISTS {
        MATCH (prereq)-[:PREREQUISITE]->(entity)
      }
      AND EXISTS {
        MATCH (entity)-[:IS_A|PART_OF]->()
      }
      RETURN entity.id as id, entity.name as name
      LIMIT 1
    `)

    if (result.records.length === 0) {
      recordTest('Find entity with rich context', false,
        'No entities with prerequisites and semantic relationships found')
      return
    }

    const entityId = result.records[0].get('id')
    const entityName = result.records[0].get('name')
    console.log(`Testing entity: ${entityName} (${entityId})`)

    const context = await getContextById(entityId)

    if (!context) {
      recordTest('Get context for formatting', false, 'Context is null')
      return
    }

    recordTest('Get context for formatting', true)

    const formatted = formatContextForLLM(context)

    // Check that formatted string includes semantic info
    const includesDifficulty = formatted.includes('Difficulty Level:')
    recordTest('Formatted context includes difficulty', includesDifficulty)

    const includesPrerequisites = formatted.includes('Prerequisite Knowledge Required:')
    recordTest('Formatted context includes prerequisites section', includesPrerequisites)

    const includesLearningDepth = formatted.includes('Learning Depth:')
    recordTest('Formatted context includes learning depth', includesLearningDepth)

    console.log('\nFormatted Context Preview (first 500 chars):')
    console.log(formatted.substring(0, 500))
    console.log('...')

  } finally {
    await session.close()
    await driver.close()
  }
}

async function testPrerequisitePaths() {
  console.log('\n📋 Test 5: Prerequisite Path Traversal\n')

  const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD))
  const session = driver.session()

  try {
    // Find learning paths
    const result = await session.run(`
      MATCH path = (start)-[:PREREQUISITE*2..3]->(end)
      WHERE NOT EXISTS {
        MATCH ()-[:PREREQUISITE]->(start)
      }
      RETURN
        start.id as startId,
        start.name as startName,
        end.id as endId,
        end.name as endName,
        length(path) as pathLength,
        [node in nodes(path) | node.name] as pathNames
      ORDER BY pathLength DESC
      LIMIT 3
    `)

    const foundPaths = result.records.length > 0
    recordTest('Find prerequisite paths', foundPaths,
      `Found ${result.records.length} learning paths`)

    if (foundPaths) {
      result.records.forEach((record, index) => {
        const pathNames = record.get('pathNames')
        const pathLength = record.get('pathLength')

        console.log(`\nPath ${index + 1} (depth ${pathLength}):`)
        pathNames.forEach((name: string, i: number) => {
          console.log(`  ${i + 1}. ${name}`)
        })
      })

      // Test that we can get context for each step
      const firstPath = result.records[0]
      const startId = firstPath.get('startId')
      const endId = firstPath.get('endId')

      const startContext = await getContextById(startId)
      const endContext = await getContextById(endId)

      const pathContextsValid =
        startContext !== null &&
        endContext !== null &&
        startContext.learningMetadata.learningDepth < endContext.learningMetadata.learningDepth

      recordTest('Path contexts have increasing depth', pathContextsValid,
        `Start depth: ${startContext?.learningMetadata.learningDepth}, End depth: ${endContext?.learningMetadata.learningDepth}`)
    }

  } finally {
    await session.close()
    await driver.close()
  }
}

async function runTests() {
  console.log('🧪 Testing GraphRAG Context with Semantic Relationships\n')
  console.log('=' .repeat(60))

  try {
    await testGetContextById()
    await testFindEntitiesByName()
    await testGetContextByPath()
    await testFormatContextForLLM()
    await testPrerequisitePaths()

    console.log('\n' + '='.repeat(60))
    console.log('\n📊 Test Results Summary\n')

    results.tests.forEach(test => {
      const icon = test.status === 'PASS' ? '✅' : '❌'
      console.log(`${icon} ${test.name}`)
      if (test.message) {
        console.log(`   ${test.message}`)
      }
    })

    console.log(`\nTotal: ${results.passed + results.failed} tests`)
    console.log(`Passed: ${results.passed} ✅`)
    console.log(`Failed: ${results.failed} ❌`)

    const passRate = ((results.passed / (results.passed + results.failed)) * 100).toFixed(1)
    console.log(`Pass Rate: ${passRate}%`)

    if (results.failed === 0) {
      console.log('\n🎉 All tests passed! GraphRAG context enhancement is working correctly.')
    } else {
      console.log('\n⚠️  Some tests failed. Review the results above.')
      process.exit(1)
    }

  } catch (error) {
    console.error('\n❌ Test execution failed:', error)
    process.exit(1)
  }
}

runTests()
