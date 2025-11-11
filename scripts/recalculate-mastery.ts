/**
 * Recalculate all mastery scores allowing negative values
 * Replays all user responses in chronological order using actual reward logic
 */

import { createClient } from '@supabase/supabase-js'
import { calculateReward } from '@/lib/rl/reward'
import { calculateLearningGain } from '@/lib/rl/mastery'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role key

const supabase = createClient(supabaseUrl, supabaseKey)

async function recalculateMastery() {
  console.log('Starting mastery recalculation...')

  // Get all unique user-topic-bloom combinations
  const { data: combinations } = await supabase
    .from('user_responses')
    .select('user_id, topic_id, bloom_level, chapter_id')
    .order('user_id', { ascending: true })

  if (!combinations) {
    console.error('No data found')
    return
  }

  // Deduplicate
  const uniqueCombos = Array.from(
    new Map(
      combinations.map(c => [
        `${c.user_id}-${c.topic_id}-${c.bloom_level}`,
        c
      ])
    ).values()
  )

  console.log(`Processing ${uniqueCombos.length} combinations...`)

  for (const combo of uniqueCombos) {
    let currentMastery = 0
    let currentStreak = 0

    // Get all responses for this combination in chronological order
    const { data: responses } = await supabase
      .from('user_responses')
      .select('*')
      .eq('user_id', combo.user_id)
      .eq('topic_id', combo.topic_id)
      .eq('bloom_level', combo.bloom_level)
      .order('created_at', { ascending: true })

    if (!responses || responses.length === 0) continue

    // Replay each response
    for (const response of responses) {
      // Update streak
      if (response.is_correct) {
        currentStreak++
      } else {
        currentStreak = 0
      }

      // Calculate reward components (simplified - you may need to adjust)
      const rewardComponents = calculateReward({
        isCorrect: response.is_correct,
        confidence: response.confidence,
        currentMastery: currentMastery,
        bloomLevel: response.bloom_level,
        responseTime: null, // Not tracked in old data
        currentStreak: currentStreak
      })

      // Calculate learning gain
      const learningGain = calculateLearningGain(
        rewardComponents.calibration,
        rewardComponents.recognition,
        response.bloom_level
      )

      // Apply learning gain WITHOUT floor (allow negative), but cap at 100%
      const newMastery = Math.min(100, currentMastery + learningGain)

      currentMastery = newMastery
    }

    // Update the final mastery score
    const { error } = await supabase
      .from('user_topic_mastery')
      .update({
        mastery_score: currentMastery,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', combo.user_id)
      .eq('topic_id', combo.topic_id)
      .eq('bloom_level', combo.bloom_level)
      .eq('chapter_id', combo.chapter_id)

    if (error) {
      console.error(`Error updating ${combo.user_id} - ${combo.topic_id} - ${combo.bloom_level}:`, error)
    } else {
      console.log(`✓ Updated mastery to ${currentMastery.toFixed(1)}% for user ${combo.user_id.substring(0, 8)}... topic ${combo.topic_id.substring(0, 8)}... bloom ${combo.bloom_level}`)
    }
  }

  console.log('Mastery recalculation complete!')
}

recalculateMastery().catch(console.error)
