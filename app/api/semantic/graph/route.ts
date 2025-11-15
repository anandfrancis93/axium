/**
 * API endpoint for fetching knowledge graph data (nodes + edges)
 *
 * Returns GraphRAG entities and relationships in react-force-graph format
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface GraphNode {
  id: string
  name: string
  type: string
  difficulty_score?: number
  learning_depth?: number
  full_path: string
  val: number  // Node size for force-graph
  color: string
}

interface GraphLink {
  source: string
  target: string
  type: string
  confidence?: number
  reasoning?: string
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams

    // Optional filters
    const scope = searchParams.get('scope')  // e.g., "CompTIA Security+"
    const limit = parseInt(searchParams.get('limit') || '200')  // Default: 200 nodes max
    const focusNodeId = searchParams.get('focusNodeId')  // Highlight specific node and neighborhood

    // Fetch entities (nodes)
    let entitiesQuery = supabase
      .from('graphrag_entities')
      .select('id, name, type, difficulty_score, learning_depth, full_path')
      .order('learning_depth', { ascending: true })
      .limit(limit)

    if (scope) {
      entitiesQuery = entitiesQuery.ilike('full_path', `${scope}%`)
    }

    const { data: entities, error: entitiesError } = await entitiesQuery

    if (entitiesError) {
      console.error('Error fetching entities:', entitiesError)
      return NextResponse.json(
        { error: 'Failed to fetch graph entities' },
        { status: 500 }
      )
    }

    if (!entities || entities.length === 0) {
      return NextResponse.json({
        nodes: [],
        links: []
      })
    }

    // Get entity IDs for relationship filtering
    const entityIds = entities.map(e => e.id)

    // Fetch relationships (edges) between these entities
    // Note: Large entityId arrays may cause query failures, so we handle this gracefully
    let relationships: Array<{
      source_entity_id: string
      target_entity_id: string
      relationship_type: string
      confidence: number | null
      reasoning: string | null
    }> = []

    try {
      const { data, error: relationshipsError } = await supabase
        .from('graphrag_relationships')
        .select('source_entity_id, target_entity_id, relationship_type, confidence, reasoning')
        .in('source_entity_id', entityIds)
        .in('target_entity_id', entityIds)

      if (relationshipsError) {
        console.error('Error fetching relationships:', relationshipsError)
        // Continue without relationships rather than failing completely
        relationships = []
      } else {
        relationships = data || []
      }
    } catch (error) {
      console.error('Error fetching relationships:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : '',
        hint: 'Query may be too large, consider using scope filter',
        code: (error as any).code || ''
      })
      // Continue without relationships rather than failing completely
      relationships = []
    }

    // Transform to react-force-graph format
    const nodes: GraphNode[] = entities.map(entity => ({
      id: entity.id,
      name: entity.name,
      type: entity.type,
      difficulty_score: entity.difficulty_score,
      learning_depth: entity.learning_depth,
      full_path: entity.full_path,
      val: getNodeSize(entity.learning_depth, entity.difficulty_score),
      color: getNodeColor(entity.learning_depth, entity.type, entity.id === focusNodeId)
    }))

    const links: GraphLink[] = (relationships || []).map(rel => ({
      source: rel.source_entity_id,
      target: rel.target_entity_id,
      type: rel.relationship_type,
      confidence: rel.confidence,
      reasoning: rel.reasoning
    }))

    return NextResponse.json({
      nodes,
      links,
      stats: {
        nodeCount: nodes.length,
        linkCount: links.length,
        scope: scope || 'all',
        focusNodeId: focusNodeId || null
      }
    })

  } catch (error) {
    console.error('Error in graph API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Calculate node size based on learning depth and difficulty
 */
function getNodeSize(depth: number | null, difficulty: number | null): number {
  const baseSize = 10
  const depthFactor = (depth || 0) * 2  // Deeper = larger
  const difficultyFactor = (difficulty || 5) * 0.5  // Harder = larger
  return baseSize + depthFactor + difficultyFactor
}

/**
 * Determine node color based on learning depth and type
 */
function getNodeColor(
  depth: number | null,
  type: string,
  isFocus: boolean
): string {
  // Focus node highlighted
  if (isFocus) return '#3b82f6'  // Blue (primary)

  // Color by learning depth
  switch (depth) {
    case 0:
      return '#6b7280'  // Gray - Foundation
    case 1:
      return '#10b981'  // Green - L1
    case 2:
      return '#06b6d4'  // Cyan - L2
    case 3:
      return '#8b5cf6'  // Purple - L3
    case 4:
      return '#f59e0b'  // Yellow - L4
    case 5:
    case 6:
      return '#ef4444'  // Red - L5+
    default:
      return '#9ca3af'  // Gray - Unknown
  }
}
