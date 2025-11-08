import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/rl/reset-progress
 *
 * Reset all learning progress for a specific chapter
 *
 * Body:
 * - chapter_id: UUID of the chapter
 *
 * Deletes:
 * - user_responses for this chapter
 * - user_topic_mastery for this chapter
 * - rl_arm_stats for this chapter
 * - user_dimension_coverage for this chapter
 * - learning_sessions for this chapter
 * - user_progress for this chapter
 * - AI-generated questions for this chapter
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { chapter_id } = body

    if (!chapter_id) {
      return NextResponse.json(
        { error: 'chapter_id is required' },
        { status: 400 }
      )
    }

    console.log('Reset progress request:', {
      user_id: user.id,
      chapter_id,
      timestamp: new Date().toISOString()
    })

    // First check what data exists
    const { data: allSessions, error: checkError } = await supabase
      .from('learning_sessions')
      .select('id, chapter_id, subject_id')
      .eq('user_id', user.id)

    console.log('All user sessions:', allSessions)

    const { data: allMastery } = await supabase
      .from('user_topic_mastery')
      .select('chapter_id, topic')
      .eq('user_id', user.id)

    console.log('All user mastery records:', allMastery)

    // First get all sessions for this chapter (before deleting them)
    const { data: sessions, error: sessionsError } = await supabase
      .from('learning_sessions')
      .select('id')
      .eq('user_id', user.id)
      .eq('chapter_id', chapter_id)

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError)
      return NextResponse.json(
        { error: `Failed to fetch sessions: ${sessionsError.message}` },
        { status: 500 }
      )
    }

    console.log(`Found ${sessions?.length || 0} sessions to delete`)

    let responsesDeleted = 0
    let sessionsDeleted = 0
    let masteryDeleted = 0
    let armStatsDeleted = 0
    let dimensionCoverageDeleted = 0
    let questionsDeleted = 0
    let progressDeleted = 0

    // Delete user_responses for this chapter's sessions
    if (sessions && sessions.length > 0) {
      const sessionIds = sessions.map(s => s.id)
      const { count, error: responsesError } = await supabase
        .from('user_responses')
        .delete({ count: 'exact' })
        .in('session_id', sessionIds)

      if (responsesError) {
        console.error('Error deleting responses:', responsesError)
        return NextResponse.json(
          { error: `Failed to delete responses: ${responsesError.message}` },
          { status: 500 }
        )
      }
      responsesDeleted = count || 0
      console.log(`Deleted ${responsesDeleted} user_responses`)
    }

    // Delete learning_sessions for this chapter
    const { count: sessionsCount, error: sessionsDeleteError } = await supabase
      .from('learning_sessions')
      .delete({ count: 'exact' })
      .eq('user_id', user.id)
      .eq('chapter_id', chapter_id)

    if (sessionsDeleteError) {
      console.error('Error deleting sessions:', sessionsDeleteError)
      return NextResponse.json(
        { error: `Failed to delete sessions: ${sessionsDeleteError.message}` },
        { status: 500 }
      )
    }
    sessionsDeleted = sessionsCount || 0
    console.log(`Deleted ${sessionsDeleted} learning_sessions`)

    // Delete user_topic_mastery for this chapter
    const { count: masteryCount, error: masteryError } = await supabase
      .from('user_topic_mastery')
      .delete({ count: 'exact' })
      .eq('user_id', user.id)
      .eq('chapter_id', chapter_id)

    if (masteryError) {
      console.error('Error deleting mastery:', masteryError)
      return NextResponse.json(
        { error: `Failed to delete mastery: ${masteryError.message}` },
        { status: 500 }
      )
    }
    masteryDeleted = masteryCount || 0
    console.log(`Deleted ${masteryDeleted} user_topic_mastery records`)

    // Delete rl_arm_stats for this chapter
    const { count: armStatsCount, error: armStatsError } = await supabase
      .from('rl_arm_stats')
      .delete({ count: 'exact' })
      .eq('user_id', user.id)
      .eq('chapter_id', chapter_id)

    if (armStatsError) {
      console.error('Error deleting arm stats:', armStatsError)
      return NextResponse.json(
        { error: `Failed to delete arm stats: ${armStatsError.message}` },
        { status: 500 }
      )
    }
    armStatsDeleted = armStatsCount || 0
    console.log(`Deleted ${armStatsDeleted} rl_arm_stats records`)

    // Delete user_dimension_coverage for this chapter
    const { count: dimensionCoverageCount, error: dimensionCoverageError } = await supabase
      .from('user_dimension_coverage')
      .delete({ count: 'exact' })
      .eq('user_id', user.id)
      .eq('chapter_id', chapter_id)

    if (dimensionCoverageError) {
      console.error('Error deleting dimension coverage:', dimensionCoverageError)
      return NextResponse.json(
        { error: `Failed to delete dimension coverage: ${dimensionCoverageError.message}` },
        { status: 500 }
      )
    }
    dimensionCoverageDeleted = dimensionCoverageCount || 0
    console.log(`Deleted ${dimensionCoverageDeleted} user_dimension_coverage records`)

    // Delete user_progress for this chapter
    // Use a subquery with topics to filter by chapter_id
    const { data: progressToDelete, error: fetchProgressError } = await supabase
      .from('user_progress')
      .select('id, topics!inner(chapter_id)')
      .eq('user_id', user.id)
      .eq('topics.chapter_id', chapter_id)

    console.log('Reset - user_progress query:', {
      chapter_id,
      user_id: user.id,
      records: progressToDelete,
      count: progressToDelete?.length || 0,
      error: fetchProgressError
    })

    if (fetchProgressError) {
      console.error('Error fetching user_progress to delete:', fetchProgressError)
    } else if (progressToDelete && progressToDelete.length > 0) {
      const progressIds = progressToDelete.map(p => p.id)
      console.log(`Found ${progressIds.length} user_progress records to delete`)

      const { count: progressCount, error: progressError } = await supabase
        .from('user_progress')
        .delete({ count: 'exact' })
        .in('id', progressIds)

      if (progressError) {
        console.error('Error deleting user_progress:', progressError)
      } else {
        progressDeleted = progressCount || 0
        console.log(`Deleted ${progressDeleted} user_progress records`)
      }
    } else {
      console.log('No user_progress records found for this chapter')
    }

    // Delete AI-generated questions for this user in this chapter
    // We need to delete questions one by one or use a subquery since Supabase doesn't support
    // DELETE with joins directly. First, get the question IDs to delete.
    const { data: questionsToDelete, error: fetchError } = await supabase
      .from('questions')
      .select('id, topic_id, topics!inner(chapter_id)')
      .eq('user_id', user.id)
      .eq('topics.chapter_id', chapter_id)
      .eq('source_type', 'ai_generated_realtime')

    if (fetchError) {
      console.error('Error fetching questions to delete:', fetchError)
    } else if (questionsToDelete && questionsToDelete.length > 0) {
      const questionIds = questionsToDelete.map(q => q.id)

      // Delete using question IDs (much shorter than topic IDs)
      const { count: questionsCount, error: questionsError } = await supabase
        .from('questions')
        .delete({ count: 'exact' })
        .in('id', questionIds)

      if (questionsError) {
        console.error('Error deleting AI-generated questions:', questionsError)
      } else {
        questionsDeleted = questionsCount || 0
        console.log(`Deleted ${questionsDeleted} AI-generated questions for user`)
      }
    }

    console.log('Reset progress complete')

    return NextResponse.json({
      success: true,
      message: 'Progress reset successfully',
      deleted: {
        responses: responsesDeleted,
        sessions: sessionsDeleted,
        mastery: masteryDeleted,
        armStats: armStatsDeleted,
        dimensionCoverage: dimensionCoverageDeleted,
        progress: progressDeleted,
        questions: questionsDeleted
      }
    })
  } catch (error) {
    console.error('Error in POST /api/rl/reset-progress:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
