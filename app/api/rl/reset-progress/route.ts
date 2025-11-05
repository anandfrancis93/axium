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
 * - learning_sessions for this chapter
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

    console.log('Reset progress complete')

    return NextResponse.json({
      success: true,
      message: 'Progress reset successfully',
      deleted: {
        responses: responsesDeleted,
        sessions: sessionsDeleted,
        mastery: masteryDeleted,
        armStats: armStatsDeleted
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
