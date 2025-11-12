import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const maxDuration = 300 // 5 minutes for long-running recalculation

export async function POST() {
  try {
    const supabase = await createClient()

    // Check if user is authenticated (optional: add admin check)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔄 Starting mastery recalculation for all users...')

    // Get all users with responses
    const { data: users, error: usersError } = await supabase
      .from('user_responses')
      .select('user_id')
      .order('user_id')

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json({ error: 'Failed to fetch users', details: usersError }, { status: 500 })
    }

    const uniqueUsers = [...new Set(users.map((u: any) => u.user_id))]
    console.log(`Found ${uniqueUsers.length} users with responses`)

    let totalUpdated = 0
    const results: any[] = []

    for (const userId of uniqueUsers) {
      console.log(`Processing user: ${userId}`)

      // Get all responses for this user, ordered by creation time
      const { data: responses, error: responsesError } = await supabase
        .from('user_responses')
        .select(`
          id,
          topic_id,
          topics!inner(
            name,
            chapter_id,
            chapters!inner(subject_id)
          ),
          bloom_level,
          is_correct,
          created_at
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: true })

      if (responsesError) {
        console.error('Error fetching responses:', responsesError)
        results.push({ error: 'Failed to fetch responses', details: responsesError.message })
        continue
      }

      if (!responses || responses.length === 0) {
        console.log(`  No responses found for user ${userId}`)
        continue
      }

      console.log(`  Found ${responses.length} responses`)
      console.log(`  Sample response:`, responses[0])

      // Get reward components for all responses
      const responseIds = responses.map((r: any) => r.id)
      const { data: rewardLogs, error: rewardError } = await supabase
        .from('rl_decision_log')
        .select('response_id, reward_components, created_at')
        .eq('decision_type', 'reward_calculation')
        .in('response_id', responseIds)

      if (rewardError) {
        console.error('Error fetching reward logs:', rewardError)
        continue
      }

      // Create map of response_id -> reward_components
      const rewardMap = new Map()
      rewardLogs?.forEach((log: any) => {
        rewardMap.set(log.response_id, log.reward_components)
      })

      console.log(`  Found ${rewardLogs?.length || 0} reward logs`)

      // Group responses by (topic_name, bloom_level, chapter_id)
      const groupedResponses = new Map()

      responses.forEach((response: any) => {
        const topicName = response.topics?.name
        const chapterId = response.topics?.chapter_id
        const subjectId = response.topics?.chapters?.subject_id

        if (!topicName || !chapterId || !subjectId) {
          console.log(`  Skipping response - missing data:`, { topicName, chapterId, subjectId })
          return
        }

        const key = `${topicName}-${response.bloom_level}-${chapterId}`
        if (!groupedResponses.has(key)) {
          groupedResponses.set(key, {
            userId,
            topicName,
            bloomLevel: response.bloom_level,
            chapterId,
            subjectId,
            responses: []
          })
        }
        groupedResponses.get(key).responses.push(response)
      })

      console.log(`  Processing ${groupedResponses.size} topic-bloom combinations`)

      if (groupedResponses.size === 0) {
        console.log(`  No valid topic-bloom groups found for user ${userId}`)
        continue
      }

      // Log first group for debugging
      const firstGroup = Array.from(groupedResponses.values())[0]
      console.log(`  Sample group:`, {
        topicName: firstGroup.topicName,
        bloomLevel: firstGroup.bloomLevel,
        chapterId: firstGroup.chapterId,
        subjectId: firstGroup.subjectId,
        responseCount: firstGroup.responses.length
      })

      // Recalculate mastery for each group
      for (const [key, group] of groupedResponses) {
        let currentMastery = 0
        let questionsCorrect = 0

        // Process responses in chronological order
        for (const response of group.responses) {
          const rewardComponents = rewardMap.get(response.id)

          if (rewardComponents &&
              rewardComponents.calibration !== undefined &&
              rewardComponents.recognition !== undefined) {
            // Calculate learning gain using actual reward formula
            const bloomMultiplier = response.bloom_level >= 4 ? 9 : 10
            const qualityScore = (rewardComponents.calibration + rewardComponents.recognition) / 2.0
            const learningGain = qualityScore * bloomMultiplier

            // Update mastery (allow negative, cap at -100 and 100)
            currentMastery = Math.max(-100, Math.min(100, currentMastery + learningGain))
          } else {
            // Fallback to simplified calculation if no reward components
            const currentScore = response.is_correct ? 100 : 0
            const alpha = 0.3
            currentMastery = alpha * currentScore + (1 - alpha) * currentMastery
          }

          if (response.is_correct) {
            questionsCorrect++
          }
        }

        const questionsAttempted = group.responses.length

        // Upsert user_topic_mastery with recalculated score
        // Note: onConflict is omitted - Supabase will auto-detect from UNIQUE constraint
        const { error: updateError } = await supabase
          .from('user_topic_mastery')
          .upsert({
            user_id: group.userId,
            topic: group.topicName,
            bloom_level: group.bloomLevel,
            chapter_id: group.chapterId,
            subject_id: group.subjectId,
            mastery_score: currentMastery,
            questions_attempted: questionsAttempted,
            questions_correct: questionsCorrect,
            last_practiced_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (updateError) {
          console.error(`Error upserting mastery for ${key}:`, updateError)
          console.error(`  Attempted to upsert:`, {
            user_id: group.userId,
            topic: group.topicName,
            bloom_level: group.bloomLevel,
            chapter_id: group.chapterId,
            subject_id: group.subjectId,
            mastery_score: currentMastery
          })
          results.push({
            error: `Failed to upsert ${key}`,
            details: updateError.message,
            data: {
              topic: group.topicName,
              bloom: group.bloomLevel,
              mastery: currentMastery
            }
          })
        } else {
          totalUpdated++
          const sign = currentMastery >= 0 ? '+' : ''
          console.log(`  ✓ Upserted ${group.topicName} L${group.bloomLevel}: ${sign}${currentMastery.toFixed(1)}%`)

          results.push({
            topic: group.topicName,
            bloomLevel: group.bloomLevel,
            mastery: currentMastery,
            attempts: questionsAttempted,
            correct: questionsCorrect
          })
        }
      }
    }

    console.log(`✅ Recalculation complete! Total records updated: ${totalUpdated}`)

    // Separate errors from successful results
    const errors = results.filter(r => r.error)
    const successes = results.filter(r => !r.error)

    return NextResponse.json({
      success: true,
      message: 'Mastery recalculation complete',
      totalUpdated,
      usersProcessed: uniqueUsers.length,
      results: successes.slice(0, 20), // Return first 20 successful results for preview
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined // Return first 10 errors if any
    })

  } catch (error: any) {
    console.error('Error in mastery recalculation:', error)
    return NextResponse.json(
      { error: 'Recalculation failed', details: error.message },
      { status: 500 }
    )
  }
}
