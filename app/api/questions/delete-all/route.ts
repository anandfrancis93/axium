import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/questions/delete-all
 *
 * Delete all questions for a specific chapter
 *
 * Body:
 * - chapter_id: UUID of the chapter
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

    // Delete all questions for this chapter
    const { error: deleteError } = await supabase
      .from('questions')
      .delete()
      .eq('chapter_id', chapter_id)

    if (deleteError) {
      console.error('Error deleting questions:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete questions: ' + deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'All questions deleted successfully'
    })
  } catch (error) {
    console.error('Error in POST /api/questions/delete-all:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
