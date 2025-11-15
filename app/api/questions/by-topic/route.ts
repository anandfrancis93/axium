import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/questions/by-topic
 *
 * Retrieve questions by Supabase topic ID with optional filters
 *
 * Query parameters:
 *   topicId: string (required) - UUID of the Supabase topic
 *   bloomLevel?: number - Filter by Bloom level (1-6)
 *   format?: QuestionFormat - Filter by question format
 *   difficulty?: string - Filter by difficulty (easy, medium, hard)
 *   limit?: number - Max questions to return (default: 50)
 *   sourceType?: string - Filter by source (manual, ai_generated_graphrag, ai_generated_realtime)
 *
 * Response:
 * {
 *   success: boolean,
 *   topicId: string,
 *   topicName?: string,
 *   count: number,
 *   questions: Question[]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const topicId = searchParams.get('topicId')

    // Validate required parameters
    if (!topicId) {
      return NextResponse.json(
        { error: 'topicId query parameter is required' },
        { status: 400 }
      )
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(topicId)) {
      return NextResponse.json(
        { error: 'Invalid topicId format. Expected UUID.' },
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
    const difficulty = searchParams.get('difficulty') || undefined
    const sourceType = searchParams.get('sourceType') || undefined

    if (difficulty && !['easy', 'medium', 'hard'].includes(difficulty)) {
      return NextResponse.json(
        { error: 'difficulty must be easy, medium, or hard' },
        { status: 400 }
      )
    }

    if (sourceType && !['manual', 'ai_generated_graphrag', 'ai_generated_realtime'].includes(sourceType)) {
      return NextResponse.json(
        { error: 'sourceType must be manual, ai_generated_graphrag, or ai_generated_realtime' },
        { status: 400 }
      )
    }

    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam) : 50

    if (limit < 1 || limit > 200) {
      return NextResponse.json(
        { error: 'limit must be between 1 and 200' },
        { status: 400 }
      )
    }

    // Build query
    const supabase = await createClient()
    let query = supabase
      .from('questions')
      .select('*')
      .eq('topic_id', topicId)

    // Apply optional filters
    if (bloomLevel !== undefined) {
      query = query.eq('bloom_level', bloomLevel)
    }

    if (format) {
      query = query.eq('question_format', format)
    }

    if (difficulty) {
      query = query.eq('difficulty_level', difficulty)
    }

    if (sourceType) {
      query = query.eq('source_type', sourceType)
    }

    query = query
      .order('created_at', { ascending: false })
      .limit(limit)

    const { data: questions, error } = await query

    if (error) {
      console.error('Supabase query error:', error)
      throw new Error(`Database query failed: ${error.message}`)
    }

    // Get topic name
    let topicName: string | undefined
    if (questions && questions.length > 0) {
      const { data: topicData } = await supabase
        .from('topics')
        .select('name')
        .eq('id', topicId)
        .single()

      topicName = topicData?.name
    }

    return NextResponse.json({
      success: true,
      topicId,
      topicName,
      count: questions?.length || 0,
      questions: questions || []
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
