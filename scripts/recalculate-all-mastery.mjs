import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function recalculateAllMastery() {
  console.log('🔄 Recalculating all mastery scores from raw response data...\n')

  try {
    // Get all users with responses
    const { data: users, error: usersError } = await supabase
      .from('user_responses')
      .select('user_id')
      .order('user_id')

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return
    }

    const uniqueUsers = [...new Set(users.map(u => u.user_id))]
    console.log(`Found ${uniqueUsers.length} users with responses\n`)

    let totalUpdated = 0

    for (const userId of uniqueUsers) {
      console.log(`\n📊 Processing user: ${userId}`)

      // Get all responses for this user, ordered by creation time
      const { data: responses, error: responsesError } = await supabase
        .from('user_responses')
        .select(`
          id,
          topic_id,
          bloom_level,
          is_correct,
          created_at,
          session_id,
          learning_sessions!inner(chapter_id)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: true })

      if (responsesError) {
        console.error('  Error fetching responses:', responsesError)
        continue
      }

      console.log(`  Found ${responses.length} responses`)

      // Get reward components for all responses
      const responseIds = responses.map(r => r.id)
      const { data: rewardLogs, error: rewardError } = await supabase
        .from('rl_decision_log')
        .select('response_id, reward_components, created_at')
        .eq('decision_type', 'reward_calculation')
        .in('response_id', responseIds)

      if (rewardError) {
        console.error('  Error fetching reward logs:', rewardError)
        continue
      }

      // Create map of response_id -> reward_components
      const rewardMap = new Map()
      rewardLogs?.forEach(log => {
        rewardMap.set(log.response_id, log.reward_components)
      })

      console.log(`  Found ${rewardLogs?.length || 0} reward logs`)

      // Group responses by (topic_id, bloom_level, chapter_id)
      const groupedResponses = new Map()

      responses.forEach(response => {
        const key = `${response.topic_id}-${response.bloom_level}-${response.learning_sessions.chapter_id}`
        if (!groupedResponses.has(key)) {
          groupedResponses.set(key, {
            userId,
            topicId: response.topic_id,
            bloomLevel: response.bloom_level,
            chapterId: response.learning_sessions.chapter_id,
            responses: []
          })
        }
        groupedResponses.get(key).responses.push(response)
      })

      console.log(`  Processing ${groupedResponses.size} topic-bloom combinations`)

      // Recalculate mastery for each group
      for (const [key, group] of groupedResponses) {
        let currentMastery = 0
        let questionsCorrect = 0

        // Process responses in chronological order
        for (const response of group.responses) {
          const rewardComponents = rewardMap.get(response.id)

          if (rewardComponents &&
              rewardComponents.calibration !== undefined &&
              rewardComponents.recognition !== undefined) {
            // Calculate learning gain using actual reward formula
            const bloomMultiplier = response.bloom_level >= 4 ? 9 : 10
            const qualityScore = (rewardComponents.calibration + rewardComponents.recognition) / 2.0
            const learningGain = qualityScore * bloomMultiplier

            // Update mastery (allow negative, cap at -100 and 100)
            currentMastery = Math.max(-100, Math.min(100, currentMastery + learningGain))
          } else {
            // Fallback to simplified calculation if no reward components
            // This shouldn't happen for new responses, but handles old data
            const currentScore = response.is_correct ? 100 : 0
            const alpha = 0.3
            currentMastery = alpha * currentScore + (1 - alpha) * currentMastery
          }

          if (response.is_correct) {
            questionsCorrect++
          }
        }

        const questionsAttempted = group.responses.length

        // Update user_topic_mastery with recalculated score
        const { error: updateError } = await supabase
          .from('user_topic_mastery')
          .update({
            mastery_score: currentMastery,
            questions_attempted: questionsAttempted,
            questions_correct: questionsCorrect,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', group.userId)
          .eq('topic_id', group.topicId)
          .eq('bloom_level', group.bloomLevel)
          .eq('chapter_id', group.chapterId)

        if (updateError) {
          console.error(`  ❌ Error updating mastery for ${key}:`, updateError)
        } else {
          totalUpdated++
          const sign = currentMastery >= 0 ? '+' : ''
          console.log(`  ✓ Updated ${key.split('-')[0].substring(0, 8)}... L${group.bloomLevel}: ${sign}${currentMastery.toFixed(1)}%`)
        }
      }
    }

    console.log(`\n✅ Recalculation complete!`)
    console.log(`   Total records updated: ${totalUpdated}`)
    console.log('\nNegative mastery scores now reflect poor performance accurately.')

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

recalculateAllMastery()
