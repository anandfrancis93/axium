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
    const { data: sessions } = await supabase
      .from('learning_sessions')
      .select('id')
      .eq('user_id', user.id)
      .eq('chapter_id', chapter_id)

    // Delete user_responses for this chapter's sessions
    if (sessions && sessions.length > 0) {
      const sessionIds = sessions.map(s => s.id)
      await supabase
        .from('user_responses')
        .delete()
        .in('session_id', sessionIds)
    }

    // Delete learning_sessions for this chapter
    await supabase
      .from('learning_sessions')
      .delete()
      .eq('user_id', user.id)
      .eq('chapter_id', chapter_id)

    // Delete user_topic_mastery for this chapter
    await supabase
      .from('user_topic_mastery')
      .delete()
      .eq('user_id', user.id)
      .eq('chapter_id', chapter_id)

    // Delete rl_arm_stats for this chapter
    await supabase
      .from('rl_arm_stats')
      .delete()
      .eq('user_id', user.id)
      .eq('chapter_id', chapter_id)

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
