import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pxtcgyvxgyffaaeugjwc.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4dGNneXZ4Z3lmZmFhZXVnandjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjMwMzk5OSwiZXhwIjoyMDc3ODc5OTk5fQ.mmNbBksqgSCpfjFknzqNYMKHaLdgoWW9AOx8IpbMRYc'

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const chapterId = '0517450a-61b2-4fa2-a425-5846b21ba4b0'

async function checkArms() {
  // Check topics table
  const { data: topicsCount } = await supabase
    .from('topics')
    .select('id', { count: 'exact', head: true })
    .eq('chapter_id', chapterId)

  console.log('=== TOPICS TABLE ===')
  console.log(`Topics in database: ${topicsCount?.length || 0}`)

  const { data: sampleTopics } = await supabase
    .from('topics')
    .select('name, available_bloom_levels')
    .eq('chapter_id', chapterId)
    .limit(5)

  if (sampleTopics && sampleTopics.length > 0) {
    console.log('\nSample topics:')
    sampleTopics.forEach(t => {
      console.log(`  - ${t.name}`)
      console.log(`    Bloom levels: ${JSON.stringify(t.available_bloom_levels)}`)
    })
  }

  // Check chapter_topics table
  const { data: chapterTopicsCount } = await supabase
    .from('chapter_topics')
    .select('id', { count: 'exact', head: true })
    .eq('chapter_id', chapterId)

  console.log(`\n=== CHAPTER_TOPICS TABLE ===`)
  console.log(`Records: ${chapterTopicsCount?.length || 0}`)

  const { data: sampleChapterTopics } = await supabase
    .from('chapter_topics')
    .select('topic, bloom_level')
    .eq('chapter_id', chapterId)
    .limit(5)

  if (sampleChapterTopics && sampleChapterTopics.length > 0) {
    console.log('\nSample chapter_topics:')
    sampleChapterTopics.forEach(ct => {
      console.log(`  - ${ct.topic} (Bloom L${ct.bloom_level})`)
    })
  }

  // Try calling get_available_arms with a test user
  console.log('\n=== CALLING get_available_arms() ===')
  const testUserId = '00000000-0000-0000-0000-000000000000'

  const { data: arms, error: armsError } = await supabase.rpc('get_available_arms', {
    p_user_id: testUserId,
    p_chapter_id: chapterId
  })

  if (armsError) {
    console.log('❌ Error:', armsError.message)
    console.log('Details:', armsError)
  } else {
    console.log(`✓ Returned ${arms?.length || 0} arms`)
    if (arms && arms.length > 0) {
      console.log('\nFirst 5 arms:')
      arms.slice(0, 5).forEach(a => {
        console.log(`  - Topic: "${a.topic}"`)
        console.log(`    Bloom: ${a.bloom_level}`)
        console.log(`    Unlocked: ${a.is_unlocked}`)
      })
    } else {
      console.log('\n❌ No arms returned!')
      console.log('\nThis is why you see "No available questions" error.')
      console.log('\nLikely causes:')
      console.log('  1. Migration not applied yet (get_available_arms still uses chapter_topics)')
      console.log('  2. OR chapter_topics table is empty/different chapter_id')
    }
  }
}

checkArms().catch(console.error)
