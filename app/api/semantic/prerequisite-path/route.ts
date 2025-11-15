/**
 * GET /api/semantic/prerequisite-path
 *
 * Fetch cached prerequisite path for a given topic from Supabase
 *
 * Query params:
 * - topicId: UUID of the target topic
 *
 * Returns:
 * - Prerequisite path from root to target topic
 * - 404 if no path exists (topic is a foundation concept)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const topicId = searchParams.get('topicId')

    if (!topicId) {
      return NextResponse.json(
        { error: 'topicId is required' },
        { status: 400 }
      )
    }

    // Get topic details to find the entity
    const { data: topic, error: topicError } = await supabase
      .from('topics')
      .select('id, full_name, name')
      .eq('id', topicId)
      .single()

    if (topicError || !topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      )
    }

    // Find the entity in graphrag_entities by full_name
    const { data: entity, error: entityError } = await supabase
      .from('graphrag_entities')
      .select('id')
      .eq('full_path', topic.full_name)
      .single()

    if (entityError || !entity) {
      // Topic exists but not in knowledge graph - treat as foundation
      return NextResponse.json(
        { error: 'No prerequisite path found' },
        { status: 404 }
      )
    }

    // Get the cached prerequisite path
    const { data: path, error: pathError } = await supabase
      .from('graphrag_prerequisite_paths')
      .select('*')
      .eq('target_entity_id', entity.id)
      .single()

    if (pathError || !path) {
      // No path cached - this is a foundation topic
      return NextResponse.json(
        { error: 'No prerequisite path found' },
        { status: 404 }
      )
    }

    // Return the path
    return NextResponse.json({
      target_entity_id: path.target_entity_id,
      path_depth: path.path_depth,
      path_names: path.path_names,
      path_entity_ids: path.path_entity_ids,
      total_difficulty: path.total_difficulty,
      estimated_total_time: path.estimated_total_time,
      synced_at: path.synced_at
    })

  } catch (error) {
    console.error('Error fetching prerequisite path:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
