import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logDataDeletion } from '@/lib/rl/decision-logger'

/**
 * POST /api/progress/reset
 *
 * Reset all progress data for a specific topic
 *
 * Body:
 * - topicId: The topic UUID to reset
 *
 * Deletes:
 * - user_responses (all attempts)
 * - user_topic_mastery (mastery scores)
 * - rl_arm_stats (Thompson sampling stats)
 * - user_dimension_coverage (dimension tracking)
 * - user_progress (overall progress)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { topicId } = body

    if (!topicId) {
      return NextResponse.json(
        { error: 'topicId is required' },
        { status: 400 }
      )
    }

    // Get topic info for logging
    const { data: topicData } = await supabase
      .from('topics')
      .select('name, chapter_id')
      .eq('id', topicId)
      .single()

    // Snapshot current data before deletion
    const [responsesSnapshot, masterySnapshot, armStatsSnapshot, dimensionSnapshot, progressSnapshot] = await Promise.all([
      supabase.from('user_responses').select('*').eq('user_id', user.id).eq('topic_id', topicId),
      supabase.from('user_topic_mastery').select('*').eq('user_id', user.id).eq('topic_id', topicId),
      supabase.from('rl_arm_stats').select('*').eq('user_id', user.id).eq('topic_id', topicId),
      supabase.from('user_dimension_coverage').select('*').eq('user_id', user.id).eq('topic_id', topicId),
      supabase.from('user_progress').select('*').eq('user_id', user.id).eq('topic_id', topicId)
    ])

    const snapshot = {
      responses: responsesSnapshot.data || [],
      mastery: masterySnapshot.data || [],
      arm_stats: armStatsSnapshot.data || [],
      dimension_coverage: dimensionSnapshot.data || [],
      progress: progressSnapshot.data || []
    }

    // Delete all data for this topic
    const [
      responsesResult,
      masteryResult,
      armStatsResult,
      dimensionResult,
      progressResult
    ] = await Promise.all([
      supabase.from('user_responses').delete().eq('user_id', user.id).eq('topic_id', topicId),
      supabase.from('user_topic_mastery').delete().eq('user_id', user.id).eq('topic_id', topicId),
      supabase.from('rl_arm_stats').delete().eq('user_id', user.id).eq('topic_id', topicId),
      supabase.from('user_dimension_coverage').delete().eq('user_id', user.id).eq('topic_id', topicId),
      supabase.from('user_progress').delete().eq('user_id', user.id).eq('topic_id', topicId)
    ])

    // Check for errors
    const errors = [
      responsesResult.error,
      masteryResult.error,
      armStatsResult.error,
      dimensionResult.error,
      progressResult.error
    ].filter(Boolean)

    if (errors.length > 0) {
      console.error('Errors during reset:', errors)
      return NextResponse.json(
        { error: 'Failed to reset some data', details: errors },
        { status: 500 }
      )
    }

    // Count deleted items
    const deletedCounts = {
      responses: snapshot.responses.length,
      sessions: 0, // Not deleting sessions
      mastery: snapshot.mastery.length,
      armStats: snapshot.arm_stats.length,
      dimensionCoverage: snapshot.dimension_coverage.length,
      progress: snapshot.progress.length,
      questions: 0 // Not deleting questions
    }

    // Log the data deletion
    await logDataDeletion({
      userId: user.id,
      topicId: topicId,
      chapterId: topicData?.chapter_id,
      reason: 'User requested topic reset',
      scope: 'topic',
      deletedData: deletedCounts,
      snapshot: snapshot
    })

    return NextResponse.json({
      success: true,
      deleted: deletedCounts,
      message: `Reset complete for topic: ${topicData?.name || topicId}`
    })

  } catch (error) {
    console.error('Error in POST /api/progress/reset:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
