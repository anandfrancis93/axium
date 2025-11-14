import { getContextById, findEntitiesByName } from '../lib/graphrag/context'
import { generateQuestion, generateQuestionWithRetry } from '../lib/graphrag/generate'
import { QuestionFormat } from '../lib/graphrag/prompts'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

/**
 * Test Question Generation End-to-End
 *
 * Tests the complete pipeline:
 * 1. Retrieve GraphRAG context from Neo4j
 * 2. Generate prompts for different Bloom levels and formats
 * 3. Call Claude API to generate questions
 * 4. Validate responses
 */

interface TestCase {
  topicName: string
  expectedInstances: number
  testBloomLevels: number[]
  testFormats: QuestionFormat[]
  description: string
}

const TEST_CASES: TestCase[] = [
  {
    topicName: 'Encryption',
    expectedInstances: 6,
    testBloomLevels: [1, 2, 3],
    testFormats: ['mcq_single', 'true_false', 'fill_blank'],
    description: 'Common cryptography topic with cross-references'
  },
  {
    topicName: 'Firewall',
    expectedInstances: 1,
    testBloomLevels: [2, 3],
    testFormats: ['mcq_single', 'mcq_multi'],
    description: 'Network security topic with children'
  },
  {
    topicName: 'Phishing',
    expectedInstances: 2,
    testBloomLevels: [1, 2, 4],
    testFormats: ['mcq_single', 'true_false'],
    description: 'Social engineering topic'
  },
  {
    topicName: 'Public key infrastructure (PKI)',
    expectedInstances: 1,
    testBloomLevels: [2, 3, 4],
    testFormats: ['mcq_single', 'mcq_multi'],
    description: 'Complex cryptography topic'
  },
  {
    topicName: 'Incident response',
    expectedInstances: 1,
    testBloomLevels: [3, 4, 5],
    testFormats: ['mcq_multi', 'open_ended'],
    description: 'Process-oriented security operations topic'
  }
]

async function testQuestionGeneration() {
  console.log('\n' + '='.repeat(80))
  console.log('Testing GraphRAG Question Generation Pipeline')
  console.log('='.repeat(80))

  let totalTests = 0
  let passedTests = 0
  let failedTests = 0
  let totalTokens = 0
  let totalCost = 0

  for (const testCase of TEST_CASES) {
    console.log(`\n${'─'.repeat(80)}`)
    console.log(`🧪 Test Case: ${testCase.topicName}`)
    console.log(`   Description: ${testCase.description}`)

    try {
      // Step 1: Find entities by name
      console.log(`\n📍 Step 1: Retrieving context from Neo4j...`)
      const entities = await findEntitiesByName(testCase.topicName)

      if (entities.length === 0) {
        console.log(`   ❌ No entities found for "${testCase.topicName}"`)
        failedTests++
        continue
      }

      console.log(`   ✅ Found ${entities.length} instance(s)`)

      if (entities.length !== testCase.expectedInstances) {
        console.log(`   ⚠️  Expected ${testCase.expectedInstances} instances, found ${entities.length}`)
      }

      // Use first entity for testing
      const context = entities[0]
      console.log(`   Testing with: ${context.fullPath}`)

      // Step 2: Test question generation for each Bloom level × format combination
      console.log(`\n🤖 Step 2: Generating questions with Claude...`)

      for (const bloomLevel of testCase.testBloomLevels) {
        for (const format of testCase.testFormats) {
          totalTests++

          console.log(`\n   Test ${totalTests}: Bloom ${bloomLevel} - ${format}`)

          try {
            const startTime = Date.now()

            const question = await generateQuestionWithRetry(context, bloomLevel, format, 2)

            const duration = Date.now() - startTime

            console.log(`   ✅ Question generated successfully!`)
            console.log(`      Time: ${duration}ms`)
            console.log(`      Tokens: ${question.tokensUsed.total} (in: ${question.tokensUsed.input}, out: ${question.tokensUsed.output})`)

            // Calculate cost (Claude Sonnet 4: $3/M input, $15/M output)
            const cost = (question.tokensUsed.input * 3 / 1000000) + (question.tokensUsed.output * 15 / 1000000)
            console.log(`      Cost: $${cost.toFixed(6)}`)

            totalTokens += question.tokensUsed.total
            totalCost += cost

            // Display question preview
            console.log(`\n      📝 Question: ${question.question.substring(0, 100)}${question.question.length > 100 ? '...' : ''}`)

            if (format === 'mcq_single' || format === 'mcq_multi') {
              console.log(`      Options: ${question.options?.length} options`)
              console.log(`      Correct: ${question.correctAnswer || question.correctAnswers?.join(', ')}`)
            } else if (format === 'true_false') {
              console.log(`      Answer: ${question.correctAnswer}`)
            } else if (format === 'fill_blank') {
              console.log(`      Answer: "${question.correctAnswer}"`)
              console.log(`      Acceptable: ${question.acceptableAnswers?.length} variations`)
            } else if (format === 'open_ended') {
              console.log(`      Model Answer: ${question.modelAnswer?.substring(0, 80)}...`)
              console.log(`      Key Points: ${question.keyPoints?.length} points`)
            }

            console.log(`      Explanation: ${question.explanation.substring(0, 100)}...`)

            passedTests++

          } catch (error: any) {
            console.log(`   ❌ Generation failed: ${error.message}`)
            failedTests++
          }

          // Rate limiting delay
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      }

    } catch (error: any) {
      console.log(`   ❌ Test case failed: ${error.message}`)
      failedTests++
    }
  }

  // Summary
  console.log(`\n\n${'='.repeat(80)}`)
  console.log('Test Summary')
  console.log(`${'='.repeat(80)}`)

  console.log(`\n📊 Results:`)
  console.log(`   Total Tests: ${totalTests}`)
  console.log(`   Passed: ${passedTests} (${Math.round(passedTests / totalTests * 100)}%)`)
  console.log(`   Failed: ${failedTests} (${Math.round(failedTests / totalTests * 100)}%)`)

  console.log(`\n💰 Cost Analysis:`)
  console.log(`   Total Tokens: ${totalTokens.toLocaleString()}`)
  console.log(`   Total Cost: $${totalCost.toFixed(4)}`)
  console.log(`   Avg Cost per Question: $${(totalCost / passedTests).toFixed(6)}`)

  console.log(`\n⏱️  Performance:`)
  console.log(`   Questions Generated: ${passedTests}`)
  console.log(`   Avg Tokens per Question: ${Math.round(totalTokens / passedTests)}`)

  if (passedTests === totalTests) {
    console.log(`\n✅ All tests passed!`)
    console.log('='.repeat(80) + '\n')
  } else {
    console.log(`\n⚠️  ${failedTests} test(s) failed. See details above.`)
    console.log('='.repeat(80) + '\n')
  }
}

testQuestionGeneration().catch(error => {
  console.error('\n❌ Test script failed:', error)
  process.exit(1)
})
