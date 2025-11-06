import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pxtcgyvxgyffaaeugjwc.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4dGNneXZ4Z3lmZmFhZXVnandjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjMwMzk5OSwiZXhwIjoyMDc3ODc5OTk5fQ.mmNbBksqgSCpfjFknzqNYMKHaLdgoWW9AOx8IpbMRYc'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkQuestionsSchema() {
  console.log('=== Checking questions table columns ===\n')

  // Get a sample question to see the structure
  const { data: sampleQuestion } = await supabase
    .from('questions')
    .select('*')
    .limit(1)

  if (sampleQuestion && sampleQuestion.length > 0) {
    console.log('Columns in questions table:')
    console.log(Object.keys(sampleQuestion[0]))
    console.log('\nSample question:')
    console.log(JSON.stringify(sampleQuestion[0], null, 2))
  } else {
    console.log('No questions in database yet.')
    console.log('\nTrying to insert a test question to see what columns are required...\n')

    const testQuestion = {
      chapter_id: '0517450a-61b2-4fa2-a425-5846b21ba4b0',
      topic_id: 'bf02e7e4-5285-4675-8093-a82adfb7ba4c', // 802.1X topic
      bloom_level: 1,
      question_text: 'Test question',
      question_type: 'mcq',
      options: { a: 'Option A', b: 'Option B' },
      correct_answer: 'a',
      explanation: 'Test explanation',
      topic: '802.1X (port security)',
      dimension: 'core_understanding',
      difficulty_estimated: 'easy',
      source_type: 'test'
    }

    console.log('Attempting insert with columns:', Object.keys(testQuestion))

    const { data: inserted, error } = await supabase
      .from('questions')
      .insert(testQuestion)
      .select()

    if (error) {
      console.log('\n❌ INSERT FAILED:', error.message)
      console.log('Error code:', error.code)
      console.log('Error details:', error.details)
      console.log('Error hint:', error.hint)

      if (error.message.includes('chapter_or_topic_check')) {
        console.log('\n⚠️  The constraint "questions_chapter_or_topic_check" is active!')
        console.log('This constraint likely requires:')
        console.log('  - EITHER chapter_id is set (and topic_id is null)')
        console.log('  - OR topic_id is set (and chapter_id is null)')
        console.log('  - But NOT both at the same time')
        console.log('\nSOLUTION: Remove chapter_id from question insert, only use topic_id')
      }
    } else {
      console.log('\n✅ Insert succeeded!')
      console.log('Inserted question ID:', inserted[0]?.id)

      // Clean up
      await supabase
        .from('questions')
        .delete()
        .eq('id', inserted[0].id)
      console.log('Test question deleted')
    }
  }
}

checkQuestionsSchema().catch(console.error)
