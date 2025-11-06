import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pxtcgyvxgyffaaeugjwc.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4dGNneXZ4Z3lmZmFhZXVnandjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjMwMzk5OSwiZXhwIjoyMDc3ODc5OTk5fQ.mmNbBksqgSCpfjFknzqNYMKHaLdgoWW9AOx8IpbMRYc'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkSessionData() {
  const sessionId = '9ca2fc77-4c63-425d-9128-8aaa9360ac46'

  // Check user responses for this session
  const { data: responses, error: respError } = await supabase
    .from('user_responses')
    .select('*')
    .eq('session_id', sessionId)

  console.log('=== USER RESPONSES FOR SESSION ===')
  console.log(`Session ID: ${sessionId}`)
  console.log(`Count: ${responses?.length || 0}`)

  if (respError) {
    console.log('Error:', respError.message)
  }

  if (responses && responses.length > 0) {
    responses.forEach((r, i) => {
      console.log(`\nResponse ${i + 1}:`)
      console.log(`  Question ID: ${r.question_id}`)
      console.log(`  Topic ID: ${r.topic_id || 'NULL ❌'}`)
      console.log(`  Bloom Level: ${r.bloom_level || 'NULL ❌'}`)
      console.log(`  Correct: ${r.is_correct}`)
      console.log(`  Confidence: ${r.confidence}`)
      console.log(`  Created: ${r.created_at}`)
    })
  } else {
    console.log('\n❌ No responses found for this session!')
    console.log('\nThis means the submit-response endpoint is NOT saving data.')
  }

  // Check if question exists in database
  if (responses && responses.length > 0) {
    const questionId = responses[0].question_id

    const { data: question, error: qError } = await supabase
      .from('questions')
      .select('*')
      .eq('id', questionId)
      .single()

    console.log('\n=== QUESTION IN DATABASE ===')
    if (qError || !question) {
      console.log('❌ Question NOT found in database')
      console.log('This means question was generated as ephemeral (not stored)')
    } else {
      console.log('✅ Question found in database')
      console.log(`  Topic: ${question.topic}`)
      console.log(`  Topic ID: ${question.topic_id || 'NULL ❌'}`)
      console.log(`  Bloom Level: ${question.bloom_level}`)
    }
  }

  // Check user_progress
  const { data: progress, error: progError } = await supabase
    .from('user_progress')
    .select('*')

  console.log('\n=== USER PROGRESS (all time) ===')
  console.log(`Count: ${progress?.length || 0}`)

  if (progress && progress.length > 0) {
    progress.forEach((p, i) => {
      console.log(`\nProgress ${i + 1}:`)
      console.log(`  Topic ID: ${p.topic_id?.substring(0, 8)}...`)
      console.log(`  RL Phase: ${p.rl_phase}`)
      console.log(`  Bloom Level: ${p.current_bloom_level}`)
      console.log(`  Total Attempts: ${p.total_attempts}`)
    })
  }
}

checkSessionData().catch(console.error)
