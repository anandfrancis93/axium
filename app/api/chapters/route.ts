/**
 * Chapters API
 * GET /api/chapters - Get all chapters
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Get all chapters, ordered by name
    const { data: chapters, error } = await supabase
      .from('chapters')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching chapters:', error)
      return NextResponse.json(
        { error: 'Failed to fetch chapters', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(chapters || [])
  } catch (error: any) {
    console.error('Chapters API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
