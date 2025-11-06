import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pxtcgyvxgyffaaeugjwc.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4dGNneXZ4Z3lmZmFhZXVnandjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjMwMzk5OSwiZXhwIjoyMDc3ODc5OTk5fQ.mmNbBksqgSCpfjFknzqNYMKHaLdgoWW9AOx8IpbMRYc'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkSessions() {
  const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()

  const { data: sessions, error } = await supabase
    .from('learning_sessions')
    .select('*')
    .gte('created_at', tenMinAgo)
    .order('created_at', { ascending: false })

  console.log('=== LEARNING SESSIONS (last 10 min) ===')
  console.log(`Count: ${sessions?.length || 0}`)

  if (sessions && sessions.length > 0) {
    sessions.forEach((s, i) => {
      console.log(`\nSession ${i + 1}:`)
      console.log(`  ID: ${s.id}`)
      console.log(`  Chapter: ${s.chapter_id}`)
      console.log(`  Questions answered: ${s.questions_answered}`)
      console.log(`  Created: ${s.created_at}`)
    })
  } else {
    console.log('  No sessions found!')
  }
}

checkSessions().catch(console.error)
