/**
 * Recalculate all next_review_date values using new spaced repetition intervals
 *
 * This script updates existing user_question_reviews records to use the
 * new 18-tier interval system based on calibration scores.
 *
 * Run with: npx tsx scripts/recalculate-review-dates.ts
 */

import { createClient } from '@supabase/supabase-js'
import { normalizeCalibration } from '../lib/utils/calibration'

// Interval mapping (same as in spaced-repetition.ts)
const INTERVAL_MAP: { threshold: number; hours: number }[] = [
  { threshold: 0.00, hours: 4 },      // 4 hours
  { threshold: 0.10, hours: 6 },      // 6 hours
  { threshold: 0.17, hours: 8 },      // 8 hours
  { threshold: 0.23, hours: 12 },     // 12 hours
  { threshold: 0.30, hours: 16 },     // 16 hours
  { threshold: 0.33, hours: 20 },     // 20 hours
  { threshold: 0.37, hours: 24 },     // 1 day
  { threshold: 0.40, hours: 36 },     // 1.5 days
  { threshold: 0.43, hours: 48 },     // 2 days
  { threshold: 0.60, hours: 72 },     // 3 days
  { threshold: 0.63, hours: 96 },     // 4 days
  { threshold: 0.67, hours: 120 },    // 5 days
  { threshold: 0.73, hours: 144 },    // 6 days
  { threshold: 0.77, hours: 168 },    // 1 week
  { threshold: 0.80, hours: 192 },    // 8 days
  { threshold: 0.83, hours: 240 },    // 10 days
  { threshold: 0.90, hours: 288 },    // 12 days
  { threshold: 1.00, hours: 336 },    // 2 weeks
]

function getIntervalHours(calibrationScore: number): number {
  const normalized = normalizeCalibration(calibrationScore)
  let hours = INTERVAL_MAP[0].hours

  for (const entry of INTERVAL_MAP) {
    if (normalized >= entry.threshold) {
      hours = entry.hours
    } else {
      break
    }
  }

  return hours
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  console.log('Fetching user_question_reviews with their latest calibration scores...\n')

  // Get all reviews with their associated response calibration scores
  const { data: reviews, error: reviewsError } = await supabase
    .from('user_question_reviews')
    .select(`
      id,
      user_id,
      question_id,
      last_reviewed_at,
      next_review_date
    `)

  if (reviewsError) {
    console.error('Error fetching reviews:', reviewsError)
    process.exit(1)
  }

  console.log(`Found ${reviews?.length || 0} review records to process\n`)

  let updated = 0
  let skipped = 0
  let errors = 0

  for (const review of reviews || []) {
    // Get the most recent response for this user/question to get calibration score
    const { data: response, error: responseError } = await supabase
      .from('user_responses')
      .select('calibration_score, created_at')
      .eq('user_id', review.user_id)
      .eq('question_id', review.question_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (responseError || !response) {
      console.log(`  Skipping review ${review.id} - no matching response found`)
      skipped++
      continue
    }

    const calibrationScore = response.calibration_score ?? 0
    const lastReviewedAt = new Date(review.last_reviewed_at)
    const intervalHours = getIntervalHours(calibrationScore)
    const newNextReviewDate = new Date(lastReviewedAt.getTime() + intervalHours * 60 * 60 * 1000)

    const oldDate = new Date(review.next_review_date)
    const normalized = normalizeCalibration(calibrationScore)

    console.log(`Review ${review.id}:`)
    console.log(`  Calibration: ${calibrationScore.toFixed(2)} (normalized: ${normalized.toFixed(2)})`)
    console.log(`  Interval: ${intervalHours} hours (${(intervalHours / 24).toFixed(1)} days)`)
    console.log(`  Old next_review: ${oldDate.toISOString()}`)
    console.log(`  New next_review: ${newNextReviewDate.toISOString()}`)

    // Update the record
    const { error: updateError } = await supabase
      .from('user_question_reviews')
      .update({ next_review_date: newNextReviewDate.toISOString() })
      .eq('id', review.id)

    if (updateError) {
      console.log(`  ERROR: ${updateError.message}`)
      errors++
    } else {
      console.log(`  Updated successfully\n`)
      updated++
    }
  }

  console.log('\n=== Summary ===')
  console.log(`Total reviews: ${reviews?.length || 0}`)
  console.log(`Updated: ${updated}`)
  console.log(`Skipped: ${skipped}`)
  console.log(`Errors: ${errors}`)
}

main().catch(console.error)
