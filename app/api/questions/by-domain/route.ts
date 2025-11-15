import { NextRequest, NextResponse } from 'next/server'
import { getQuestionsByDomain } from '@/lib/graphrag/storage'

/**
 * GET /api/questions/by-domain
 *
 * Retrieve questions by CompTIA domain with optional filters
 *
 * Query parameters:
 *   domain: string (required) - CompTIA domain name
 *   bloomLevel?: number - Filter by Bloom level (1-6)
 *   limit?: number - Max questions to return (default: 100)
 *
 * Response:
 * {
 *   success: boolean,
 *   domain: string,
 *   count: number,
 *   questions: Question[]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const domain = searchParams.get('domain')

    // Validate required parameters
    if (!domain) {
      return NextResponse.json(
        { error: 'domain query parameter is required' },
        { status: 400 }
      )
    }

    // Valid CompTIA Security+ domains
    const validDomains = [
      'General Security Concepts',
      'Threats, Vulnerabilities, and Mitigations',
      'Security Architecture',
      'Security Operations',
      'Security Program Management and Oversight'
    ]

    if (!validDomains.includes(domain)) {
      return NextResponse.json(
        {
          error: 'Invalid domain',
          validDomains
        },
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

    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam) : 100

    if (limit < 1 || limit > 500) {
      return NextResponse.json(
        { error: 'limit must be between 1 and 500' },
        { status: 400 }
      )
    }

    // Fetch questions
    const questions = await getQuestionsByDomain(
      domain,
      bloomLevel,
      limit
    )

    return NextResponse.json({
      success: true,
      domain,
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
