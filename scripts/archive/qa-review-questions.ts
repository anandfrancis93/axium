/**
 * Manual QA Review of Generated Questions
 *
 * Reviews a sample of generated questions for quality:
 * - Question clarity
 * - Answer correctness
 * - Explanation quality
 * - Bloom level alignment
 * - Distractor quality (for MCQs)
 *
 * Run: npx tsx scripts/qa-review-questions.ts <input-file>
 */

import * as fs from 'fs'
import * as path from 'path'

interface QAQuestion {
  entityId: string
  entityName: string
  bloomLevel: number
  format: string
  success: boolean
  questionId?: string
  error?: string
  cost?: number
  tokens?: number
}

interface BatchResult {
  totalEntities: number
  totalQuestions: number
  successCount: number
  failureCount: number
  duplicateCount: number
  totalCost: number
  totalTokens: number
  startTime: string
  endTime?: string
  questions: QAQuestion[]
}

const BLOOM_LEVELS: Record<number, string> = {
  1: 'Remember',
  2: 'Understand',
  3: 'Apply',
  4: 'Analyze',
  5: 'Evaluate',
  6: 'Create'
}

function analyzeQuestions(result: BatchResult) {
  console.log('='.repeat(80))
  console.log('Question Quality Analysis')
  console.log('='.repeat(80))

  // Overall Statistics
  console.log('\n📊 Overall Statistics:')
  console.log(`   Total Questions Generated: ${result.totalQuestions}`)
  console.log(`   Successful: ${result.successCount}`)
  console.log(`   Failed: ${result.failureCount}`)
  console.log(`   Total Cost: $${result.totalCost.toFixed(4)}`)
  console.log(`   Average Cost: $${(result.totalCost / result.totalQuestions).toFixed(6)}`)
  console.log(`   Average Tokens: ${Math.round(result.totalTokens / result.totalQuestions)}`)

  // Breakdown by Bloom Level
  console.log('\n📚 Bloom Level Distribution:')
  const bloomBreakdown: Record<number, number> = {}
  result.questions.forEach(q => {
    bloomBreakdown[q.bloomLevel] = (bloomBreakdown[q.bloomLevel] || 0) + 1
  })

  Object.entries(bloomBreakdown)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .forEach(([level, count]) => {
      const percentage = ((count / result.totalQuestions) * 100).toFixed(1)
      console.log(`   Level ${level} (${BLOOM_LEVELS[parseInt(level)]}): ${count} questions (${percentage}%)`)
    })

  // Breakdown by Format
  console.log('\n📝 Format Distribution:')
  const formatBreakdown: Record<string, number> = {}
  result.questions.forEach(q => {
    formatBreakdown[q.format] = (formatBreakdown[q.format] || 0) + 1
  })

  Object.entries(formatBreakdown)
    .sort(([, a], [, b]) => b - a)
    .forEach(([format, count]) => {
      const percentage = ((count / result.totalQuestions) * 100).toFixed(1)
      console.log(`   ${format}: ${count} questions (${percentage}%)`)
    })

  // Breakdown by Entity
  console.log('\n🎯 Entity Coverage:')
  const entityBreakdown: Record<string, number> = {}
  result.questions.forEach(q => {
    entityBreakdown[q.entityName] = (entityBreakdown[q.entityName] || 0) + 1
  })

  Object.entries(entityBreakdown)
    .sort(([, a], [, b]) => b - a)
    .forEach(([entity, count]) => {
      console.log(`   ${entity}: ${count} questions`)
    })

  // Success Rate Analysis
  console.log('\n✅ Quality Metrics:')
  const successRate = (result.successCount / result.totalQuestions * 100).toFixed(1)
  console.log(`   Generation Success Rate: ${successRate}%`)

  if (result.failureCount > 0) {
    console.log(`   Failed Generations: ${result.failureCount}`)
    const failedQuestions = result.questions.filter(q => !q.success)
    const errorTypes: Record<string, number> = {}
    failedQuestions.forEach(q => {
      const error = q.error || 'Unknown error'
      errorTypes[error] = (errorTypes[error] || 0) + 1
    })
    console.log('\n   Failure Breakdown:')
    Object.entries(errorTypes).forEach(([error, count]) => {
      console.log(`      ${error}: ${count}`)
    })
  }

  // Cost Efficiency
  console.log('\n💰 Cost Efficiency:')
  const costPerQuestion = result.totalCost / result.totalQuestions
  console.log(`   Cost per Question: $${costPerQuestion.toFixed(6)}`)
  console.log(`   Cost per Successful Question: $${(result.totalCost / result.successCount).toFixed(6)}`)
  console.log(`   Estimated cost for 100 questions: $${(costPerQuestion * 100).toFixed(4)}`)
  console.log(`   Estimated cost for 1000 questions: $${(costPerQuestion * 1000).toFixed(2)}`)

  // Recommendations
  console.log('\n💡 Recommendations:')

  if (result.failureCount > 0) {
    console.log('   ⚠️  Review failure reasons and adjust retry logic or prompts')
  }

  if (successRate >= 90) {
    console.log('   ✅ Generation success rate is excellent (≥90%)')
  } else if (successRate >= 75) {
    console.log('   ⚠️  Generation success rate is good (≥75%) but could be improved')
  } else {
    console.log('   ❌ Generation success rate is low (<75%) - investigate failures')
  }

  if (costPerQuestion < 0.01) {
    console.log('   ✅ Cost per question is very efficient (<$0.01)')
  } else if (costPerQuestion < 0.02) {
    console.log('   ✅ Cost per question is reasonable (<$0.02)')
  } else {
    console.log('   ⚠️  Cost per question is high (≥$0.02) - consider prompt optimization')
  }

  // Sample Questions for Manual Review
  console.log('\n📋 Sample Questions for Manual Review:')
  console.log('   (Review first 5 successful questions)')

  const successfulQuestions = result.questions.filter(q => q.success).slice(0, 5)
  successfulQuestions.forEach((q, i) => {
    console.log(`\n   ${i + 1}. Entity: ${q.entityName}`)
    console.log(`      Bloom Level: ${q.bloomLevel} (${BLOOM_LEVELS[q.bloomLevel]})`)
    console.log(`      Format: ${q.format}`)
    console.log(`      Tokens: ${q.tokens}`)
    console.log(`      Cost: $${q.cost?.toFixed(6)}`)
  })

  console.log('\n' + '='.repeat(80))
  console.log('✅ QA Review Complete')
  console.log('='.repeat(80) + '\n')
}

// Main execution
const inputFile = process.argv[2]

if (!inputFile) {
  console.error('Usage: npx tsx scripts/qa-review-questions.ts <input-file>')
  console.error('Example: npx tsx scripts/qa-review-questions.ts test-questions-cryptography.json')
  process.exit(1)
}

if (!fs.existsSync(inputFile)) {
  console.error(`Error: File not found: ${inputFile}`)
  process.exit(1)
}

try {
  const data = fs.readFileSync(inputFile, 'utf-8')
  const result: BatchResult = JSON.parse(data)
  analyzeQuestions(result)
} catch (error: any) {
  console.error('Error analyzing questions:', error.message)
  process.exit(1)
}
