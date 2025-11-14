/**
 * Topics API
 * GET /api/topics?chapterId=xxx - Get topics for a chapter
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const chapterId = searchParams.get('chapterId')

    if (!chapterId) {
      return NextResponse.json(
        { error: 'chapterId is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get all topics for the chapter
    const { data: topics, error } = await supabase
      .from('topics')
      .select('*')
      .eq('chapter_id', chapterId)
      .order('name')

    if (error) {
      console.error('Error fetching topics:', error)
      return NextResponse.json(
        { error: 'Failed to fetch topics', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(topics || [])
  } catch (error: any) {
    console.error('Topics API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
