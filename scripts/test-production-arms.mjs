import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pxtcgyvxgyffaaeugjwc.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4dGNneXZ4Z3lmZmFhZXVnandjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjMwMzk5OSwiZXhwIjoyMDc3ODc5OTk5fQ.mmNbBksqgSCpfjFknzqNYMKHaLdgoWW9AOx8IpbMRYc'

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const chapterId = '0517450a-61b2-4fa2-a425-5846b21ba4b0'

async function testProductionArms() {
  console.log('=== Testing get_available_arms in PRODUCTION ===\n')

  const { data: arms, error } = await supabase.rpc('get_available_arms', {
    p_user_id: '00000000-0000-0000-0000-000000000000',
    p_chapter_id: chapterId
  })

  if (error) {
    console.log('❌ ERROR:', error.message)
    console.log('Details:', error)
    return
  }

  console.log(`✅ Returned ${arms?.length || 0} arms\n`)

  if (arms && arms.length > 0) {
    console.log('First 5 topics returned by get_available_arms:')
    arms.slice(0, 5).forEach((a, i) => {
      console.log(`  ${i + 1}. "${a.topic}" (Bloom L${a.bloom_level})`)
    })

    // Now test if these topics exist in the topics table
    console.log('\n=== Testing if these topics exist in topics table ===\n')

    for (let i = 0; i < Math.min(3, arms.length); i++) {
      const arm = arms[i]

      const { data: topic, error: lookupError } = await supabase
        .from('topics')
        .select('id, name')
        .eq('chapter_id', chapterId)
        .eq('name', arm.topic)
        .single()

      if (lookupError || !topic) {
        console.log(`❌ Topic NOT FOUND: "${arm.topic}"`)
        console.log(`   Error: ${lookupError?.message || 'Not found'}`)

        // Try to find similar
        const { data: similar } = await supabase
          .from('topics')
          .select('name')
          .eq('chapter_id', chapterId)
          .ilike('name', `%${arm.topic.substring(0, 10)}%`)
          .limit(3)

        if (similar && similar.length > 0) {
          console.log('   Similar topics in DB:')
          similar.forEach(s => console.log(`     - "${s.name}"`))
        }
      } else {
        console.log(`✅ Topic FOUND: "${arm.topic}"`)
        console.log(`   ID: ${topic.id}`)
      }
    }
  }
}

testProductionArms().catch(console.error)
