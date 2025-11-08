import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/rl/reset-progress/preview
 *
 * Preview what data will be deleted for a chapter reset (counts only, no deletion)
 *
 * Body:
 * - chapter_id: UUID of the chapter
 *
 * Returns counts of:
 * - user_responses
 * - user_topic_mastery
 * - rl_arm_stats
 * - user_dimension_coverage
 * - learning_sessions
 * - user_progress
 * - AI-generated questions
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

    // Get sessions for this chapter to count responses
    const { data: sessions } = await supabase
      .from('learning_sessions')
      .select('id')
      .eq('user_id', user.id)
      .eq('chapter_id', chapter_id)

    let responsesCount = 0
    if (sessions && sessions.length > 0) {
      const sessionIds = sessions.map(s => s.id)
      const { count } = await supabase
        .from('user_responses')
        .select('id', { count: 'exact', head: true })
        .in('session_id', sessionIds)
      responsesCount = count || 0
    }

    // Count learning_sessions
    const { count: sessionsCount } = await supabase
      .from('learning_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('chapter_id', chapter_id)

    // Count user_topic_mastery
    const { count: masteryCount } = await supabase
      .from('user_topic_mastery')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('chapter_id', chapter_id)

    // Count rl_arm_stats
    const { count: armStatsCount } = await supabase
      .from('rl_arm_stats')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('chapter_id', chapter_id)

    // Count user_dimension_coverage
    const { count: dimensionCoverageCount } = await supabase
      .from('user_dimension_coverage')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('chapter_id', chapter_id)

    // Count user_progress using JOIN with topics
    const { data: progressRecords, error: progressError } = await supabase
      .from('user_progress')
      .select('id, topics!inner(chapter_id)')
      .eq('user_id', user.id)
      .eq('topics.chapter_id', chapter_id)

    console.log('Preview - user_progress query:', {
      chapter_id,
      user_id: user.id,
      records: progressRecords,
      count: progressRecords?.length || 0,
      error: progressError
    })

    const progressCount = progressRecords?.length || 0

    // Count AI-generated questions
    const { data: questionsRecords } = await supabase
      .from('questions')
      .select('id, topic_id, topics!inner(chapter_id)')
      .eq('user_id', user.id)
      .eq('topics.chapter_id', chapter_id)
      .eq('source_type', 'ai_generated_realtime')

    const questionsCount = questionsRecords?.length || 0

    return NextResponse.json({
      success: true,
      counts: {
        responses: responsesCount,
        sessions: sessionsCount || 0,
        mastery: masteryCount || 0,
        armStats: armStatsCount || 0,
        dimensionCoverage: dimensionCoverageCount || 0,
        progress: progressCount,
        questions: questionsCount
      }
    })
  } catch (error) {
    console.error('Error in POST /api/rl/reset-progress/preview:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
