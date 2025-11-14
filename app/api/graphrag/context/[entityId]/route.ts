import { NextRequest, NextResponse } from 'next/server'
import { getContextById } from '@/lib/graphrag/context'

/**
 * GET /api/graphrag/context/[entityId]
 *
 * Retrieves complete GraphRAG context for an entity by ID.
 * Used for question generation and learning content.
 *
 * @param entityId - UUID of the curriculum entity
 * @returns GraphRAGContext object with full hierarchy and relationships
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { entityId: string } }
) {
  try {
    const { entityId } = params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(entityId)) {
      return NextResponse.json(
        { error: 'Invalid entity ID format. Expected UUID.' },
        { status: 400 }
      )
    }

    // Fetch context from Neo4j
    const context = await getContextById(entityId)

    if (!context) {
      return NextResponse.json(
        { error: 'Entity not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(context, { status: 200 })

  } catch (error: any) {
    console.error('GraphRAG context retrieval error:', error)

    return NextResponse.json(
      {
        error: 'Failed to retrieve context',
        message: error.message
      },
      { status: 500 }
    )
  }
}
