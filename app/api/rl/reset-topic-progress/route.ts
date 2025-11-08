import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logDataDeletion } from '@/lib/rl/decision-logger'

/**
 * POST /api/rl/reset-topic-progress
 *
 * Reset learning progress for a specific topic or topic×bloom level
 *
 * Body:
 * - chapter_id: UUID of the chapter
 * - topic_id: UUID of the topic
 * - bloom_level: (optional) Specific Bloom level to reset. If omitted, resets all levels for the topic
 *
 * Deletes:
 * - user_responses for this topic (and bloom level if specified)
 * - user_topic_mastery for this topic (and bloom level if specified)
 * - rl_arm_stats for this topic (and bloom level if specified)
 * - user_dimension_coverage for this topic (and bloom level if specified)
 * - learning_sessions for this topic (only if full topic reset)
 * - AI-generated questions for this topic (only if full topic reset)
 * - user_progress for this topic (only if full topic reset)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { chapter_id, topic_id, bloom_level } = body

    if (!chapter_id || !topic_id) {
      return NextResponse.json(
        { error: 'chapter_id and topic_id are required' },
        { status: 400 }
      )
    }

    const isFullTopicReset = !bloom_level
    const resetScope = isFullTopicReset
      ? 'all Bloom levels'
      : `Bloom level ${bloom_level}`

    console.log('Reset topic progress request:', {
      user_id: user.id,
      chapter_id,
      topic_id,
      bloom_level: bloom_level || 'all',
      scope: resetScope,
      timestamp: new Date().toISOString()
    })

    // Capture snapshot of data before deletion for transparency
    const dataSnapshot: any = {}

    // Build snapshot queries
    let responsesSnapshotQuery = supabase
      .from('user_responses')
      .select('*')
      .eq('user_id', user.id)
      .eq('topic_id', topic_id)

    let masterySnapshotQuery = supabase
      .from('user_topic_mastery')
      .select('*')
      .eq('user_id', user.id)
      .eq('chapter_id', chapter_id)
      .eq('topic_id', topic_id)

    let armStatsSnapshotQuery = supabase
      .from('rl_arm_stats')
      .select('*')
      .eq('user_id', user.id)
      .eq('chapter_id', chapter_id)
      .eq('topic_id', topic_id)

    // Add bloom_level filter if specified
    if (bloom_level) {
      responsesSnapshotQuery = responsesSnapshotQuery.eq('bloom_level', bloom_level)
      masterySnapshotQuery = masterySnapshotQuery.eq('bloom_level', bloom_level)
      armStatsSnapshotQuery = armStatsSnapshotQuery.eq('bloom_level', bloom_level)
    }

    // Get snapshots
    const { data: responsesSnapshot } = await responsesSnapshotQuery
    const { data: masterySnapshot } = await masterySnapshotQuery
    const { data: armStatsSnapshot } = await armStatsSnapshotQuery

    dataSnapshot.responses = responsesSnapshot || []
    dataSnapshot.mastery = masterySnapshot || []
    dataSnapshot.armStats = armStatsSnapshot || []

    // Get progress snapshot (only if full topic reset)
    if (isFullTopicReset) {
      const { data: progressSnapshot } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('topic_id', topic_id)
      dataSnapshot.progress = progressSnapshot || []
    }

    let responsesDeleted = 0
    let masteryDeleted = 0
    let armStatsDeleted = 0
    let dimensionCoverageDeleted = 0
    let progressDeleted = 0
    let sessionsDeleted = 0
    let questionsDeleted = 0

    // Build base queries
    let responsesQuery = supabase
      .from('user_responses')
      .delete({ count: 'exact' })
      .eq('user_id', user.id)
      .eq('topic_id', topic_id)

    let masteryQuery = supabase
      .from('user_topic_mastery')
      .delete({ count: 'exact' })
      .eq('user_id', user.id)
      .eq('chapter_id', chapter_id)
      .eq('topic_id', topic_id)

    let armStatsQuery = supabase
      .from('rl_arm_stats')
      .delete({ count: 'exact' })
      .eq('user_id', user.id)
      .eq('chapter_id', chapter_id)
      .eq('topic_id', topic_id)

    let dimensionCoverageQuery = supabase
      .from('user_dimension_coverage')
      .delete({ count: 'exact' })
      .eq('user_id', user.id)
      .eq('chapter_id', chapter_id)
      .eq('topic_id', topic_id)

    // Add bloom_level filter if specified
    if (bloom_level) {
      responsesQuery = responsesQuery.eq('bloom_level', bloom_level)
      masteryQuery = masteryQuery.eq('bloom_level', bloom_level)
      armStatsQuery = armStatsQuery.eq('bloom_level', bloom_level)
      dimensionCoverageQuery = dimensionCoverageQuery.eq('bloom_level', bloom_level)
    }

    // Get session IDs BEFORE deleting responses (to check if they become empty)
    const { data: responsesToDelete } = await supabase
      .from('user_responses')
      .select('session_id')
      .eq('user_id', user.id)
      .eq('topic_id', topic_id)

    const affectedSessionIds = responsesToDelete
      ? [...new Set(responsesToDelete.map(r => r.session_id))]
      : []

    // Execute deletions
    const { count: responsesCount, error: responsesError } = await responsesQuery
    if (responsesError) {
      console.error('Error deleting responses:', responsesError)
      return NextResponse.json(
        { error: `Failed to delete responses: ${responsesError.message}` },
        { status: 500 }
      )
    }
    responsesDeleted = responsesCount || 0

    const { count: masteryCount, error: masteryError } = await masteryQuery
    if (masteryError) {
      console.error('Error deleting mastery:', masteryError)
      return NextResponse.json(
        { error: `Failed to delete mastery: ${masteryError.message}` },
        { status: 500 }
      )
    }
    masteryDeleted = masteryCount || 0

    const { count: armStatsCount, error: armStatsError } = await armStatsQuery
    if (armStatsError) {
      console.error('Error deleting arm stats:', armStatsError)
      return NextResponse.json(
        { error: `Failed to delete arm stats: ${armStatsError.message}` },
        { status: 500 }
      )
    }
    armStatsDeleted = armStatsCount || 0

    const { count: dimensionCoverageCount, error: dimensionCoverageError } = await dimensionCoverageQuery
    if (dimensionCoverageError) {
      console.error('Error deleting dimension coverage:', dimensionCoverageError)
      return NextResponse.json(
        { error: `Failed to delete dimension coverage: ${dimensionCoverageError.message}` },
        { status: 500 }
      )
    }
    dimensionCoverageDeleted = dimensionCoverageCount || 0

    // Delete user_progress for this topic (only if resetting all levels)
    if (isFullTopicReset) {
      const { count: progressCount, error: progressError } = await supabase
        .from('user_progress')
        .delete({ count: 'exact' })
        .eq('user_id', user.id)
        .eq('topic_id', topic_id)

      if (progressError) {
        console.error('Error deleting user_progress:', progressError)
        return NextResponse.json(
          { error: `Failed to delete user_progress: ${progressError.message}` },
          { status: 500 }
        )
      }
      progressDeleted = progressCount || 0

      // Delete sessions that became empty after deleting this topic's responses
      // Check each affected session to see if it has any remaining responses
      if (affectedSessionIds.length > 0) {
        const emptySessionIds: string[] = []

        for (const sessionId of affectedSessionIds) {
          const { count: remainingCount } = await supabase
            .from('user_responses')
            .select('id', { count: 'exact', head: true })
            .eq('session_id', sessionId)

          // If no responses remain, mark session for deletion
          if (remainingCount === 0) {
            emptySessionIds.push(sessionId)
          }
        }

        if (emptySessionIds.length > 0) {
          const { count: sessionsCount, error: sessionsError } = await supabase
            .from('learning_sessions')
            .delete({ count: 'exact' })
            .in('id', emptySessionIds)

          if (sessionsError) {
            console.error('Error deleting empty sessions:', sessionsError)
          } else {
            sessionsDeleted = sessionsCount || 0
            console.log(`Deleted ${sessionsDeleted} empty sessions`)
          }
        }
      }

      // Delete AI-generated questions for this user for this topic
      const { count: questionsCount, error: questionsError } = await supabase
        .from('questions')
        .delete({ count: 'exact' })
        .eq('user_id', user.id)
        .eq('topic_id', topic_id)
        .eq('source_type', 'ai_generated_realtime')

      if (questionsError) {
        console.error('Error deleting AI-generated questions:', questionsError)
      } else {
        questionsDeleted = questionsCount || 0
        console.log(`Deleted ${questionsDeleted} AI-generated questions`)
      }
    }

    console.log('Reset topic progress complete:', {
      scope: resetScope,
      deleted: {
        responses: responsesDeleted,
        mastery: masteryDeleted,
        armStats: armStatsDeleted,
        dimensionCoverage: dimensionCoverageDeleted,
        progress: progressDeleted,
        sessions: sessionsDeleted,
        questions: questionsDeleted
      }
    })

    // Log deletion for transparency
    try {
      await logDataDeletion({
        userId: user.id,
        chapterId: chapter_id,
        topicId: topic_id,
        bloomLevel: bloom_level,
        reason: `User-initiated ${resetScope} reset`,
        scope: isFullTopicReset ? 'topic' : 'topic_bloom_level',
        deletedData: {
          responses: responsesDeleted,
          sessions: sessionsDeleted,
          mastery: masteryDeleted,
          armStats: armStatsDeleted,
          dimensionCoverage: dimensionCoverageDeleted,
          progress: progressDeleted,
          questions: questionsDeleted
        },
        snapshot: dataSnapshot
      })
      console.log('Deletion logged to rl_decision_log')
    } catch (logError) {
      console.error('Failed to log deletion (non-fatal):', logError)
      // Don't fail the request if logging fails
    }

    return NextResponse.json({
      success: true,
      message: `Progress reset successfully for ${resetScope}`,
      scope: resetScope,
      deleted: {
        responses: responsesDeleted,
        mastery: masteryDeleted,
        armStats: armStatsDeleted,
        dimensionCoverage: dimensionCoverageDeleted,
        progress: progressDeleted,
        sessions: sessionsDeleted,
        questions: questionsDeleted
      }
    })
  } catch (error) {
    console.error('Error in POST /api/rl/reset-topic-progress:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
