import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/rl/sessions/start
 *
 * Start a new RL-powered learning session
 *
 * Body:
 * - chapter_id: UUID of the chapter to study
 * - num_questions: Number of questions in session (optional, default 10)
 *
 * Returns:
 * - session_id: UUID of created session
 * - chapter_id: UUID of the chapter
 * - questions_remaining: Number of questions in session
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { chapter_id, num_questions = 10 } = body

    if (!chapter_id) {
      return NextResponse.json(
        { error: 'chapter_id is required' },
        { status: 400 }
      )
    }

    // Verify chapter exists and user has access
    const { data: chapter, error: chapterError } = await supabase
      .from('chapters')
      .select('id, name, subject_id')
      .eq('id', chapter_id)
      .single()

    if (chapterError || !chapter) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      )
    }

    // Create learning session
    const { data: session, error: sessionError } = await supabase
      .from('learning_sessions')
      .insert({
        user_id: user.id,
        chapter_id,
        subject_id: chapter.subject_id,
        total_questions: num_questions,
        questions_answered: 0,
        score: 0,
        selection_algorithm: 'thompson_sampling',
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (sessionError) {
      console.error('Error creating session:', sessionError)
      return NextResponse.json(
        { error: 'Failed to create session: ' + sessionError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      session_id: session.id,
      chapter_id: chapter.id,
      chapter_name: chapter.name,
      questions_remaining: num_questions,
      started_at: session.started_at,
    })
  } catch (error) {
    console.error('Error in POST /api/rl/sessions/start:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
