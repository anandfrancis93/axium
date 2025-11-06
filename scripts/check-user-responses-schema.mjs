import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pxtcgyvxgyffaaeugjwc.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4dGNneXZ4Z3lmZmFhZXVnandjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjMwMzk5OSwiZXhwIjoyMDc3ODc5OTk5fQ.mmNbBksqgSCpfjFknzqNYMKHaLdgoWW9AOx8IpbMRYc'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkSchema() {
  // Try to get any existing record to see the structure
  const { data: existing, error } = await supabase
    .from('user_responses')
    .select('*')
    .limit(1)

  if (existing && existing.length > 0) {
    console.log('=== USER_RESPONSES TABLE STRUCTURE ===')
    console.log('Columns:', Object.keys(existing[0]))
    console.log('\nSample record:')
    console.log(JSON.stringify(existing[0], null, 2))
  } else {
    console.log('No existing records. Checking table info via query...')

    // Get column info from information_schema
    const { data: columns, error: colError } = await supabase
      .rpc('exec_sql', {
        query: `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = 'user_responses'
          ORDER BY ordinal_position
        `
      })

    if (colError) {
      console.log('Cannot query schema. Error:', colError.message)
    } else {
      console.log('Table columns:', columns)
    }
  }

  // Also check if we can insert a test record to see what error we get
  console.log('\n=== TESTING INSERT ===')
  const testInsert = {
    session_id: '9ca2fc77-4c63-425d-9128-8aaa9360ac46',
    question_id: '00000000-0000-0000-0000-000000000001',  // Valid UUID
    user_id: '00000000-0000-0000-0000-000000000000',
    topic_id: null,  // Test if null is allowed
    bloom_level: 1,
    user_answer: 'Test',
    is_correct: true,
    confidence: 3,
    reward: 1.0
  }

  console.log('Attempting insert with:', Object.keys(testInsert))

  const { data: inserted, error: insertError } = await supabase
    .from('user_responses')
    .insert(testInsert)
    .select()

  if (insertError) {
    console.log('❌ Insert failed:', insertError.message)
    console.log('Details:', insertError)
  } else {
    console.log('✅ Insert succeeded!')
    console.log('Inserted record ID:', inserted[0]?.id)

    // Clean up test record
    await supabase
      .from('user_responses')
      .delete()
      .eq('id', inserted[0].id)
    console.log('Test record deleted')
  }
}

checkSchema().catch(console.error)
