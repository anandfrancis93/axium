import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pxtcgyvxgyffaaeugjwc.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4dGNneXZ4Z3lmZmFhZXVnandjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjMwMzk5OSwiZXhwIjoyMDc3ODc5OTk5fQ.mmNbBksqgSCpfjFknzqNYMKHaLdgoWW9AOx8IpbMRYc'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugActivity() {
  console.log('=== CHECKING DATABASE AFTER QUESTIONS ===\n')

  // Check user_responses
  const { data: responses } = await supabase
    .from('user_responses')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  console.log('User Responses:')
  if (responses && responses.length > 0) {
    console.log(`Count: ${responses.length}`)
    responses.forEach((r, i) => {
      console.log(`\n  Response ${i + 1}:`)
      console.log(`    - Created: ${r.created_at}`)
      console.log(`    - Question ID: ${r.question_id?.substring(0, 8)}...`)
      console.log(`    - Topic ID: ${r.topic_id ? r.topic_id.substring(0, 8) + '...' : 'NULL ❌'}`)
      console.log(`    - Bloom Level: ${r.bloom_level || 'NULL ❌'}`)
      console.log(`    - Correct: ${r.is_correct}`)
    })
  } else {
    console.log('  No responses found ❌')
  }

  // Check user_progress
  const { data: progress } = await supabase
    .from('user_progress')
    .select('*')
    .limit(5)

  console.log('\n\nUser Progress:')
  if (progress && progress.length > 0) {
    console.log(`Count: ${progress.length}`)
    progress.forEach((p, i) => {
      console.log(`\n  Progress ${i + 1}:`)
      console.log(`    - Topic ID: ${p.topic_id?.substring(0, 8)}...`)
      console.log(`    - RL Phase: ${p.rl_phase || 'NULL'}`)
      console.log(`    - Total Attempts: ${p.total_attempts}`)
      console.log(`    - Correct: ${p.correct_answers}`)
    })
  } else {
    console.log('  No progress records found ❌')
  }

  // Check recent questions
  const { data: questions } = await supabase
    .from('questions')
    .select('id, topic, topic_id, bloom_level, source_type, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  console.log('\n\nRecent Questions:')
  if (questions && questions.length > 0) {
    console.log(`Count: ${questions.length}`)
    questions.forEach((q, i) => {
      console.log(`\n  Question ${i + 1}:`)
      console.log(`    - Topic: ${q.topic}`)
      console.log(`    - Topic ID: ${q.topic_id ? q.topic_id.substring(0, 8) + '...' : 'NULL ❌'}`)
      console.log(`    - Bloom Level: ${q.bloom_level}`)
      console.log(`    - Source: ${q.source_type}`)
      console.log(`    - Created: ${q.created_at}`)
    })
  } else {
    console.log('  No questions found')
  }

  // Check learning sessions
  const { data: sessions } = await supabase
    .from('learning_sessions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(3)

  console.log('\n\nLearning Sessions:')
  if (sessions && sessions.length > 0) {
    console.log(`Count: ${sessions.length}`)
    sessions.forEach((s, i) => {
      console.log(`\n  Session ${i + 1}:`)
      console.log(`    - Questions Answered: ${s.questions_answered}/${s.total_questions}`)
      console.log(`    - Score: ${s.score}`)
      console.log(`    - Completed: ${s.completed_at ? 'Yes' : 'No'}`)
      console.log(`    - Created: ${s.created_at}`)
    })
  } else {
    console.log('  No sessions found')
  }
}

debugActivity().catch(console.error)
