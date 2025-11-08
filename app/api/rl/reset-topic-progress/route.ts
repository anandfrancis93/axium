import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    // Note: We do NOT delete sessions for topic reset
    // Sessions may contain responses for multiple topics
    // Deleting a session would cascade-delete responses for other topics
    // Sessions are only deleted during full chapter reset

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

      // Note: Sessions are NOT deleted for topic reset
      // They may contain responses for other topics
      sessionsDeleted = 0

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
