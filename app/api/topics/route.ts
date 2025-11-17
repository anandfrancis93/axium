/**
 * Topics API
 * GET /api/topics?subjectId=xxx - Get topics for a subject
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get('subjectId')

    if (!subjectId) {
      return NextResponse.json(
        { error: 'subjectId is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get all topics for the subject
    const { data: topics, error } = await supabase
      .from('topics')
      .select('*')
      .eq('subject_id', subjectId)
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
