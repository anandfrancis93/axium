import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pxtcgyvxgyffaaeugjwc.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4dGNneXZ4Z3lmZmFhZXVnandjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjMwMzk5OSwiZXhwIjoyMDc3ODc5OTk5fQ.mmNbBksqgSCpfjFknzqNYMKHaLdgoWW9AOx8IpbMRYc'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function backfillUserProgress() {
  try {
    console.log('🔄 Backfilling user_progress from existing user_responses...\n')

    // Get all user_responses grouped by user and topic
    const { data: responses, error: fetchError } = await supabase
      .from('user_responses')
      .select('user_id, topic_id, bloom_level, is_correct')
      .order('created_at', { ascending: true })

    if (fetchError) {
      console.error('❌ Error fetching responses:', fetchError.message)
      process.exit(1)
    }

    if (!responses || responses.length === 0) {
      console.log('✅ No user responses found')
      process.exit(0)
    }

    console.log(`Found ${responses.length} user responses\n`)

    // Group by user_id and topic_id
    const grouped = {}
    responses.forEach(response => {
      const key = `${response.user_id}_${response.topic_id}`
      if (!grouped[key]) {
        grouped[key] = {
          user_id: response.user_id,
          topic_id: response.topic_id,
          responses: []
        }
      }
      grouped[key].responses.push(response)
    })

    console.log(`Found ${Object.keys(grouped).length} unique user-topic combinations\n`)

    let created = 0
    let errors = 0

    for (const [key, data] of Object.entries(grouped)) {
      const { user_id, topic_id, responses: userResponses } = data

      // Calculate stats
      const totalAttempts = userResponses.length
      const correctAnswers = userResponses.filter(r => r.is_correct).length

      // Calculate mastery scores per Bloom level
      const masteryScores = {}
      for (let i = 1; i <= 6; i++) {
        const levelResponses = userResponses.filter(r => r.bloom_level === i)
        if (levelResponses.length > 0) {
          const correct = levelResponses.filter(r => r.is_correct).length
          masteryScores[i] = Math.round((correct / levelResponses.length) * 100)
        } else {
          masteryScores[i] = 0
        }
      }

      // Get current bloom level (highest tested level)
      const currentBloomLevel = Math.max(...userResponses.map(r => r.bloom_level), 1)

      // Insert or update user_progress
      const { error: upsertError } = await supabase
        .from('user_progress')
        .upsert({
          user_id,
          topic_id,
          current_bloom_level: currentBloomLevel,
          total_attempts: totalAttempts,
          correct_answers: correctAnswers,
          mastery_scores: masteryScores,
          rl_phase: 'cold_start', // Will be recalculated by trigger
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,topic_id'
        })

      if (upsertError) {
        console.error(`❌ Error for user ${user_id.substring(0, 8)} topic ${topic_id.substring(0, 8)}:`, upsertError.message)
        errors++
      } else {
        created++
        if (created % 10 === 0) {
          console.log(`✅ Processed ${created} records...`)
        }
      }
    }

    console.log(`\n✅ Backfill complete!`)
    console.log(`   Created/Updated: ${created}`)
    console.log(`   Errors: ${errors}`)

    // Now update RL phases
    console.log('\n🔄 Calculating RL phases...')
    const { error: updateError } = await supabase.rpc('exec_sql', {
      sql_query: `
        UPDATE user_progress
        SET rl_phase = calculate_rl_phase(
          total_attempts,
          mastery_scores,
          current_bloom_level,
          confidence_calibration_error,
          rl_metadata
        );
      `
    }).catch(async () => {
      // Fallback if RPC doesn't work
      console.log('⚠️  RPC not available, run this SQL manually in Supabase:')
      console.log('UPDATE user_progress SET rl_phase = calculate_rl_phase(total_attempts, mastery_scores, current_bloom_level, confidence_calibration_error, rl_metadata);')
      return { error: null }
    })

    if (!updateError) {
      console.log('✅ RL phases calculated!')
    }

    console.log('\n🎉 All done! Check your topic mastery page now.')

  } catch (error) {
    console.error('❌ Backfill failed:', error.message)
    process.exit(1)
  }
}

backfillUserProgress()
