import { NextRequest, NextResponse } from 'next/server'
import { getQuestionsByEntity } from '@/lib/graphrag/storage'

/**
 * GET /api/questions/by-entity
 *
 * Retrieve questions by entity ID with optional filters
 *
 * Query parameters:
 *   entityId: string (required) - UUID of the curriculum entity
 *   bloomLevel?: number - Filter by Bloom level (1-6)
 *   format?: QuestionFormat - Filter by question format
 *   limit?: number - Max questions to return (default: 50)
 *   includeUsageStats?: boolean - Include usage statistics (default: false)
 *
 * Response:
 * {
 *   success: boolean,
 *   entityId: string,
 *   entityName?: string,
 *   count: number,
 *   questions: Question[]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const entityId = searchParams.get('entityId')

    // Validate required parameters
    if (!entityId) {
      return NextResponse.json(
        { error: 'entityId query parameter is required' },
        { status: 400 }
      )
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(entityId)) {
      return NextResponse.json(
        { error: 'Invalid entityId format. Expected UUID.' },
        { status: 400 }
      )
    }

    // Parse optional parameters
    const bloomLevelParam = searchParams.get('bloomLevel')
    const bloomLevel = bloomLevelParam ? parseInt(bloomLevelParam) : undefined

    if (bloomLevel !== undefined && (bloomLevel < 1 || bloomLevel > 6)) {
      return NextResponse.json(
        { error: 'bloomLevel must be between 1 and 6' },
        { status: 400 }
      )
    }

    const format = searchParams.get('format') || undefined
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam) : 50

    if (limit < 1 || limit > 200) {
      return NextResponse.json(
        { error: 'limit must be between 1 and 200' },
        { status: 400 }
      )
    }

    // Fetch questions
    const questions = await getQuestionsByEntity(
      entityId,
      bloomLevel,
      format as any,
      limit
    )

    // Extract entity name from first question (if available)
    const entityName = questions.length > 0 ? questions[0].entity_name : undefined

    return NextResponse.json({
      success: true,
      entityId,
      entityName,
      count: questions.length,
      questions
    })

  } catch (error: any) {
    console.error('Question retrieval error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve questions',
        message: error.message
      },
      { status: 500 }
    )
  }
}
