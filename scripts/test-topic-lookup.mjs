import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pxtcgyvxgyffaaeugjwc.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4dGNneXZ4Z3lmZmFhZXVnandjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjMwMzk5OSwiZXhwIjoyMDc3ODc5OTk5fQ.mmNbBksqgSCpfjFknzqNYMKHaLdgoWW9AOx8IpbMRYc'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testTopicLookup() {
  const chapterId = '0517450a-61b2-4fa2-a425-5846b21ba4b0'

  // 1. Get a topic from Thompson Sampling (get_available_arms)
  console.log('=== STEP 1: Get topic from Thompson Sampling ===')
  const { data: arms, error: armsError } = await supabase.rpc('get_available_arms', {
    p_user_id: '00000000-0000-0000-0000-000000000000',
    p_chapter_id: chapterId
  })

  if (armsError || !arms || arms.length === 0) {
    console.log('❌ Failed to get arms:', armsError?.message)
    return
  }

  const sampleArm = arms[0]
  console.log(`✓ Thompson Sampling returned: "${sampleArm.topic}"`)
  console.log(`  Bloom Level: ${sampleArm.bloom_level}`)

  // 2. Try to look up this topic in the topics table
  console.log('\n=== STEP 2: Look up topic in topics table ===')
  const topicName = sampleArm.topic
  const { data: topicRecord, error: lookupError } = await supabase
    .from('topics')
    .select('id, name')
    .eq('chapter_id', chapterId)
    .eq('name', topicName)
    .single()

  if (lookupError || !topicRecord) {
    console.log('❌ Topic lookup FAILED!')
    console.log(`  Searched for: "${topicName}"`)
    console.log(`  Error: ${lookupError?.message || 'Not found'}`)

    // Check if topic exists with different name
    const { data: similarTopics } = await supabase
      .from('topics')
      .select('name')
      .eq('chapter_id', chapterId)
      .ilike('name', `%${topicName.substring(0, 10)}%`)
      .limit(5)

    if (similarTopics && similarTopics.length > 0) {
      console.log('\n  Similar topics in database:')
      similarTopics.forEach(t => console.log(`    - "${t.name}"`))
    }

    console.log('\n❌ THIS IS WHY RESPONSES AREN\'T BEING SAVED!')
    console.log('Topic lookup fails → topic_id = null → database rejects insert')
  } else {
    console.log('✅ Topic lookup SUCCEEDED!')
    console.log(`  Found topic_id: ${topicRecord.id}`)
    console.log(`  Topic name: "${topicRecord.name}"`)
    console.log('\n✅ Responses SHOULD be saved correctly now!')
  }

  // 3. Test a few more topics to be sure
  console.log('\n=== STEP 3: Test 5 more topics ===')
  let successCount = 0
  let failCount = 0

  for (let i = 1; i < Math.min(6, arms.length); i++) {
    const arm = arms[i]
    const { data: topic } = await supabase
      .from('topics')
      .select('id')
      .eq('chapter_id', chapterId)
      .eq('name', arm.topic)
      .single()

    if (topic) {
      successCount++
      console.log(`  ✓ "${arm.topic}"`)
    } else {
      failCount++
      console.log(`  ✗ "${arm.topic}"`)
    }
  }

  console.log(`\nResults: ${successCount} successes, ${failCount} failures`)

  if (failCount === 0) {
    console.log('\n🎉 ALL topic lookups work! Responses should now be saved.')
  } else {
    console.log('\n⚠️  Some topic lookups still failing. Need to investigate.')
  }
}

testTopicLookup().catch(console.error)
