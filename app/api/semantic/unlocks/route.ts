/**
 * GET /api/semantic/unlocks
 *
 * Fetch concepts that become accessible after mastering the given topic
 * (reverse prerequisite lookup)
 *
 * Query params:
 * - topicId: UUID of the current topic
 *
 * Returns:
 * - Array of concepts that require this topic as a prerequisite
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
      .select('id, name')
      .eq('full_path', topic.full_name)
      .single()

    if (entityError || !entity) {
      // Topic exists but not in knowledge graph
      return NextResponse.json(
        { error: 'No knowledge graph data found' },
        { status: 404 }
      )
    }

    // Find all concepts that have this entity as a prerequisite
    // Query: WHERE source_entity_id = current AND relationship_type = 'prerequisite'
    // This gives us: current -> (PREREQUISITE) -> target
    // Meaning: "current is a prerequisite for target"
    const { data: relationships, error: relsError } = await supabase
      .from('graphrag_relationships')
      .select(`
        target_entity_id,
        confidence,
        reasoning
      `)
      .eq('source_entity_id', entity.id)
      .eq('relationship_type', 'prerequisite')
      .order('confidence', { ascending: false })
      .limit(20) // Limit to top 20 most confident relationships

    if (relsError) {
      console.error('Error fetching relationships:', relsError)
      return NextResponse.json(
        { error: 'Failed to fetch relationships' },
        { status: 500 }
      )
    }

    if (!relationships || relationships.length === 0) {
      // No concepts depend on this - it's likely an advanced/endpoint topic
      return NextResponse.json({ unlocks: [] })
    }

    // Get details for each unlocked entity
    const targetEntityIds = relationships.map(r => r.target_entity_id)

    const { data: unlockedEntities, error: entitiesError } = await supabase
      .from('graphrag_entities')
      .select('id, name, difficulty_score, learning_depth, type')
      .in('id', targetEntityIds)

    if (entitiesError) {
      console.error('Error fetching unlocked entities:', entitiesError)
      return NextResponse.json(
        { error: 'Failed to fetch unlocked entities' },
        { status: 500 }
      )
    }

    // Merge relationship data with entity data
    const unlocks = unlockedEntities?.map(e => {
      const rel = relationships.find(r => r.target_entity_id === e.id)
      return {
        id: e.id,
        name: e.name,
        difficulty_score: e.difficulty_score,
        learning_depth: e.learning_depth,
        type: e.type,
        confidence: rel?.confidence || 1.0,
        reasoning: rel?.reasoning
      }
    }) || []

    // Sort by confidence (highest first)
    unlocks.sort((a, b) => (b.confidence || 0) - (a.confidence || 0))

    return NextResponse.json({
      unlocks,
      total_count: unlocks.length
    })

  } catch (error) {
    console.error('Error fetching unlocks:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
