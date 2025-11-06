import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pxtcgyvxgyffaaeugjwc.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4dGNneXZ4Z3lmZmFhZXVnandjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjMwMzk5OSwiZXhwIjoyMDc3ODc5OTk5fQ.mmNbBksqgSCpfjFknzqNYMKHaLdgoWW9AOx8IpbMRYc'

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const chapterId = '0517450a-61b2-4fa2-a425-5846b21ba4b0'

async function testBloomUnlocking() {
  console.log('=== TESTING BLOOM LEVEL UNLOCKING ===\n')

  // Get current user progress to see mastery levels
  const { data: progress } = await supabase
    .from('user_progress')
    .select('*, topics(name)')
    .limit(5)

  console.log('Current User Progress:')
  if (progress && progress.length > 0) {
    progress.forEach(p => {
      const masteryPct = p.total_attempts > 0
        ? Math.round((p.correct_answers / p.total_attempts) * 100)
        : 0

      console.log(`  Topic: ${p.topics.name}`)
      console.log(`    Bloom Level: ${p.current_bloom_level}`)
      console.log(`    Mastery: ${masteryPct}% (${p.correct_answers}/${p.total_attempts})`)
      console.log(`    Should unlock next level: ${masteryPct >= 80 && p.correct_answers >= 3 ? 'YES' : 'NO'}`)
      console.log()
    })
  } else {
    console.log('  No progress yet\n')
  }

  // Test get_available_arms
  console.log('=== CALLING get_available_arms() ===\n')

  const { data: arms, error } = await supabase.rpc('get_available_arms', {
    p_user_id: '00000000-0000-0000-0000-000000000000',
    p_chapter_id: chapterId
  })

  if (error) {
    console.log('❌ ERROR:', error.message)
    return
  }

  console.log(`Total arms returned: ${arms.length}`)

  // Group by topic to show unlocking progression
  const topicMap = new Map()

  arms.forEach(arm => {
    if (!topicMap.has(arm.topic)) {
      topicMap.set(arm.topic, [])
    }
    topicMap.get(arm.topic).push(arm)
  })

  // Show first 3 topics with their Bloom level unlocking
  console.log('\nBloom Level Unlocking Status (first 3 topics):\n')

  let count = 0
  for (const [topic, topicArms] of topicMap) {
    if (count >= 3) break
    count++

    console.log(`Topic: ${topic}`)

    // Sort by bloom level
    topicArms.sort((a, b) => a.bloom_level - b.bloom_level)

    topicArms.forEach(arm => {
      const status = arm.is_unlocked ? '✅ UNLOCKED' : '🔒 LOCKED'
      const mastery = arm.mastery_score || 0
      console.log(`  L${arm.bloom_level}: ${status} (Mastery: ${mastery}%)`)
    })

    console.log()
  }

  // Check for expected behavior
  console.log('=== VALIDATION ===\n')

  const allTopicsOnlyL1Unlocked = Array.from(topicMap.values()).every(topicArms => {
    // For topics with no progress, only L1 should be unlocked
    const hasNoProgress = topicArms.every(arm => arm.mastery_score === 0)
    if (hasNoProgress) {
      return topicArms.filter(arm => arm.is_unlocked).every(arm => arm.bloom_level === 1)
    }
    return true
  })

  if (allTopicsOnlyL1Unlocked) {
    console.log('✅ CORRECT: Topics with no progress only have Bloom L1 unlocked')
  } else {
    console.log('❌ INCORRECT: Some topics have higher Bloom levels unlocked without mastery')
  }

  // Check if any higher levels are unlocked inappropriately
  const inappropriateUnlocks = arms.filter(arm =>
    arm.is_unlocked && arm.bloom_level > 1 && arm.mastery_score < 80
  )

  if (inappropriateUnlocks.length === 0) {
    console.log('✅ CORRECT: No higher Bloom levels unlocked without mastery')
  } else {
    console.log(`❌ INCORRECT: ${inappropriateUnlocks.length} higher Bloom levels unlocked without mastery:`)
    inappropriateUnlocks.slice(0, 5).forEach(arm => {
      console.log(`  ${arm.topic} - L${arm.bloom_level} (Mastery: ${arm.mastery_score}%)`)
    })
  }
}

testBloomUnlocking().catch(console.error)
