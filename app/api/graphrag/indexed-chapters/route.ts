/**
 * GraphRAG Indexed Chapters API
 *
 * GET /api/graphrag/indexed-chapters
 * Returns list of chapter IDs that have entities in the knowledge graph
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { features } from '@/lib/config/features'

export async function GET() {
  try {
    if (!features.graphRAG.enabled) {
      return NextResponse.json(
        { error: 'GraphRAG feature is not enabled' },
        { status: 403 }
      )
    }

    const supabase = await createClient()

    // Get distinct chapter IDs that have entities
    const { data, error } = await supabase
      .from('graphrag_entities')
      .select('chapter_id')
      .not('chapter_id', 'is', null)

    if (error) throw error

    // Extract unique chapter IDs
    const chapterIds = [...new Set(data.map(row => row.chapter_id))]

    return NextResponse.json({ chapterIds })
  } catch (error: any) {
    console.error('Failed to get indexed chapters:', error)
    return NextResponse.json(
      { error: 'Failed to get indexed chapters', details: error.message },
      { status: 500 }
    )
  }
}
