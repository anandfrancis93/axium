#!/usr/bin/env node

/**
 * Analyze existing response data to determine IRT calibration feasibility
 *
 * This script checks:
 * 1. How many questions have sufficient responses for calibration (30+ recommended)
 * 2. Current response patterns per question
 * 3. Which questions can be calibrated immediately
 * 4. Which questions need more data
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function analyzeResponseData() {
  console.log('📊 Analyzing Response Data for IRT Calibration\n')
  console.log('=' .repeat(70))

  // 1. Overall statistics
  console.log('\n1️⃣  OVERALL STATISTICS\n')

  const { data: overallStats, error: statsError } = await supabase
    .from('user_responses')
    .select('question_id, user_id, is_correct', { count: 'exact' })

  if (statsError) {
    console.error('Error fetching stats:', statsError)
    return
  }

  const totalResponses = overallStats.length
  const uniqueQuestions = new Set(overallStats.map(r => r.question_id)).size
  const uniqueUsers = new Set(overallStats.map(r => r.user_id)).size

  console.log(`   Total Responses: ${totalResponses}`)
  console.log(`   Unique Questions: ${uniqueQuestions}`)
  console.log(`   Unique Users: ${uniqueUsers}`)
  console.log(`   Avg Responses per Question: ${(totalResponses / uniqueQuestions).toFixed(1)}`)
  console.log(`   Avg Responses per User: ${(totalResponses / uniqueUsers).toFixed(1)}`)

  // 2. Per-question analysis
  console.log('\n2️⃣  PER-QUESTION ANALYSIS\n')

  // Group responses by question
  const questionStats = new Map()

  for (const response of overallStats) {
    if (!questionStats.has(response.question_id)) {
      questionStats.set(response.question_id, {
        total: 0,
        correct: 0,
        users: new Set()
      })
    }
    const stats = questionStats.get(response.question_id)
    stats.total++
    if (response.is_correct) stats.correct++
    stats.users.add(response.user_id)
  }

  // Calculate p-values and categorize
  const calibrationReadiness = {
    ready: [],      // 30+ responses
    partial: [],    // 10-29 responses
    insufficient: [] // < 10 responses
  }

  for (const [questionId, stats] of questionStats.entries()) {
    const pValue = stats.correct / stats.total
    const uniqueUsers = stats.users.size

    const info = {
      questionId,
      responses: stats.total,
      uniqueUsers,
      pValue,
      correct: stats.correct
    }

    if (stats.total >= 30) {
      calibrationReadiness.ready.push(info)
    } else if (stats.total >= 10) {
      calibrationReadiness.partial.push(info)
    } else {
      calibrationReadiness.insufficient.push(info)
    }
  }

  console.log(`   ✅ Ready for Calibration (30+ responses): ${calibrationReadiness.ready.length}`)
  console.log(`   ⚠️  Partial Data (10-29 responses): ${calibrationReadiness.partial.length}`)
  console.log(`   ❌ Insufficient Data (< 10 responses): ${calibrationReadiness.insufficient.length}`)

  // 3. Calibration-ready questions details
  if (calibrationReadiness.ready.length > 0) {
    console.log('\n3️⃣  CALIBRATION-READY QUESTIONS (Sample)\n')

    const sample = calibrationReadiness.ready.slice(0, 10)
    console.log('   Question ID                              | Responses | Users | P-Value | Difficulty Est.')
    console.log('   ' + '-'.repeat(85))

    for (const q of sample) {
      // Simple difficulty estimation using normal ogive
      const difficulty = q.pValue > 0 && q.pValue < 1
        ? (-1.7 * Math.log(q.pValue / (1 - q.pValue))).toFixed(2)
        : 'N/A'

      console.log(`   ${q.questionId.substring(0, 40)} | ${String(q.responses).padStart(9)} | ${String(q.uniqueUsers).padStart(5)} | ${q.pValue.toFixed(3)} | ${String(difficulty).padStart(15)}`)
    }

    if (calibrationReadiness.ready.length > 10) {
      console.log(`   ... and ${calibrationReadiness.ready.length - 10} more`)
    }
  }

  // 4. P-value distribution
  console.log('\n4️⃣  DIFFICULTY DISTRIBUTION (P-Values)\n')

  const allQuestions = [...calibrationReadiness.ready, ...calibrationReadiness.partial]
  const pValueBins = {
    'Very Easy (p > 0.90)': 0,
    'Easy (0.70-0.90)': 0,
    'Medium (0.50-0.70)': 0,
    'Hard (0.30-0.50)': 0,
    'Very Hard (< 0.30)': 0
  }

  for (const q of allQuestions) {
    if (q.pValue > 0.90) pValueBins['Very Easy (p > 0.90)']++
    else if (q.pValue > 0.70) pValueBins['Easy (0.70-0.90)']++
    else if (q.pValue > 0.50) pValueBins['Medium (0.50-0.70)']++
    else if (q.pValue > 0.30) pValueBins['Hard (0.30-0.50)']++
    else pValueBins['Very Hard (< 0.30)']++
  }

  for (const [bin, count] of Object.entries(pValueBins)) {
    const percentage = allQuestions.length > 0 ? ((count / allQuestions.length) * 100).toFixed(1) : 0
    const bar = '█'.repeat(Math.round(count / 2))
    console.log(`   ${bin.padEnd(25)} ${String(count).padStart(3)} (${String(percentage).padStart(5)}%) ${bar}`)
  }

  // 5. Recommendations
  console.log('\n5️⃣  RECOMMENDATIONS\n')

  if (calibrationReadiness.ready.length >= 20) {
    console.log('   ✅ You have enough data to start IRT calibration!')
    console.log(`   ✅ ${calibrationReadiness.ready.length} questions can be calibrated immediately`)
    console.log('   📝 Recommendation: Use empirical calibration (Method 1)')
    console.log('   📝 For remaining questions, use default parameters based on Bloom level')
  } else if (calibrationReadiness.ready.length > 0) {
    console.log('   ⚠️  Limited calibration data available')
    console.log(`   ⚠️  Only ${calibrationReadiness.ready.length} questions have sufficient responses`)
    console.log('   📝 Recommendation: Hybrid approach')
    console.log('      - Calibrate the ready questions empirically')
    console.log('      - Use default parameters for others')
  } else {
    console.log('   ❌ Insufficient data for empirical calibration')
    console.log('   📝 Recommendation: Use default IRT parameters based on Bloom level')
    console.log('   📝 Run calibration again after collecting more responses')
  }

  // 6. User diversity check
  console.log('\n6️⃣  USER DIVERSITY CHECK\n')

  if (calibrationReadiness.ready.length > 0) {
    const avgUsersPerQuestion = calibrationReadiness.ready.reduce((sum, q) => sum + q.uniqueUsers, 0) / calibrationReadiness.ready.length
    console.log(`   Average unique users per calibration-ready question: ${avgUsersPerQuestion.toFixed(1)}`)

    if (avgUsersPerQuestion >= 10) {
      console.log('   ✅ Good user diversity - calibration will be reliable')
    } else if (avgUsersPerQuestion >= 5) {
      console.log('   ⚠️  Moderate user diversity - calibration possible but less reliable')
    } else {
      console.log('   ❌ Low user diversity - consider collecting more diverse user data')
    }
  }

  console.log('\n' + '='.repeat(70))
  console.log('\n✨ Analysis Complete!\n')

  return {
    totalResponses,
    uniqueQuestions,
    uniqueUsers,
    calibrationReadiness
  }
}

// Run analysis
analyzeResponseData()
  .then(() => {
    console.log('Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
