import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pxtcgyvxgyffaaeugjwc.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4dGNneXZ4Z3lmZmFhZXVnandjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjMwMzk5OSwiZXhwIjoyMDc3ODc5OTk5fQ.mmNbBksqgSCpfjFknzqNYMKHaLdgoWW9AOx8IpbMRYc'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkRecentActivity() {
  // Get questions from last 10 minutes
  const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()

  const { data: recent } = await supabase
    .from('questions')
    .select('id, topic, topic_id, bloom_level, created_at')
    .gte('created_at', tenMinAgo)
    .order('created_at', { ascending: false })

  console.log('=== QUESTIONS (last 10 min) ===')
  console.log(`Count: ${recent?.length || 0}`)

  if (recent && recent.length > 0) {
    recent.forEach((q, i) => {
      console.log(`\n  Question ${i + 1}:`)
      console.log(`    Topic: ${q.topic}`)
      console.log(`    Topic ID: ${q.topic_id ? q.topic_id.substring(0, 8) + '... ✅' : 'NULL ❌'}`)
      console.log(`    Bloom: ${q.bloom_level}`)
      console.log(`    Created: ${q.created_at}`)
    })
  } else {
    console.log('  No new questions generated!')
  }

  // Check user_responses in last 10 minutes
  const { data: responses } = await supabase
    .from('user_responses')
    .select('*')
    .gte('created_at', tenMinAgo)
    .order('created_at', { ascending: false })

  console.log(`\n\n=== USER RESPONSES (last 10 min) ===`)
  console.log(`Count: ${responses?.length || 0}`)

  if (responses && responses.length > 0) {
    responses.forEach((r, i) => {
      console.log(`\n  Response ${i + 1}:`)
      console.log(`    Topic ID: ${r.topic_id ? r.topic_id.substring(0, 8) + '... ✅' : 'NULL ❌'}`)
      console.log(`    Bloom Level: ${r.bloom_level || 'NULL ❌'}`)
      console.log(`    Correct: ${r.is_correct}`)
      console.log(`    Created: ${r.created_at}`)
    })
  } else {
    console.log('  No responses saved!')
  }

  // Check user_progress
  const { data: progress } = await supabase
    .from('user_progress')
    .select('*')

  console.log(`\n\n=== USER PROGRESS (all time) ===`)
  console.log(`Total records: ${progress?.length || 0}`)

  if (progress && progress.length > 0) {
    progress.forEach((p, i) => {
      console.log(`\n  Progress ${i + 1}:`)
      console.log(`    Topic ID: ${p.topic_id?.substring(0, 8)}...`)
      console.log(`    RL Phase: ${p.rl_phase}`)
      console.log(`    Attempts: ${p.total_attempts}`)
      console.log(`    Correct: ${p.correct_answers}`)
    })
  } else {
    console.log('  No progress records!')
  }

  console.log('\n\n=== DIAGNOSIS ===')
  if (recent && recent.length > 0) {
    if (recent[0].topic_id) {
      console.log('✅ New questions ARE being generated with topic_id')

      if (responses && responses.length > 0) {
        console.log('✅ Responses ARE being saved')

        if (progress && progress.length > 0) {
          console.log('✅ user_progress IS being created')
          console.log('\n🎉 Everything is working! Check the performance page.')
        } else {
          console.log('❌ user_progress NOT created - trigger may be failing')
        }
      } else {
        console.log('❌ Responses NOT being saved - submit endpoint failing')
      }
    } else {
      console.log('❌ New questions have NULL topic_id - lookup is failing')
    }
  } else {
    console.log('❌ No new questions in last 10 min - generation not happening')
  }
}

checkRecentActivity().catch(console.error)
