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

    // First get all sessions for this chapter (before deleting them)
    const { data: sessions, error: sessionsError } = await supabase
      .from('learning_sessions')
      .select('id')
      .eq('user_id', user.id)
      .eq('chapter_id', chapter_id)

    console.log(`Found ${sessions?.length || 0} sessions to delete`)

    // Delete user_responses for this chapter's sessions
    if (sessions && sessions.length > 0) {
      const sessionIds = sessions.map(s => s.id)
      const { error: responsesError } = await supabase
        .from('user_responses')
        .delete()
        .in('session_id', sessionIds)

      if (responsesError) {
        console.error('Error deleting responses:', responsesError)
      } else {
        console.log('Deleted user_responses')
      }
    }

    // Delete learning_sessions for this chapter
    const { error: sessionsDeleteError } = await supabase
      .from('learning_sessions')
      .delete()
      .eq('user_id', user.id)
      .eq('chapter_id', chapter_id)

    if (sessionsDeleteError) {
      console.error('Error deleting sessions:', sessionsDeleteError)
    } else {
      console.log('Deleted learning_sessions')
    }

    // Delete user_topic_mastery for this chapter
    const { error: masteryError } = await supabase
      .from('user_topic_mastery')
      .delete()
      .eq('user_id', user.id)
      .eq('chapter_id', chapter_id)

    if (masteryError) {
      console.error('Error deleting mastery:', masteryError)
    } else {
      console.log('Deleted user_topic_mastery')
    }

    // Delete rl_arm_stats for this chapter
    const { error: armStatsError } = await supabase
      .from('rl_arm_stats')
      .delete()
      .eq('user_id', user.id)
      .eq('chapter_id', chapter_id)

    if (armStatsError) {
      console.error('Error deleting arm stats:', armStatsError)
    } else {
      console.log('Deleted rl_arm_stats')
    }

    console.log('Reset progress complete')

    return NextResponse.json({
      success: true,
      message: 'Progress reset successfully'
    })
  } catch (error) {
    console.error('Error in POST /api/rl/reset-progress:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
