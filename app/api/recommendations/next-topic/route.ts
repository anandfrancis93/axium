/**
 * API: Get Next Topic Recommendation
 *
 * Endpoint: GET /api/recommendations/next-topic
 *
 * Query params:
 * - domain (optional): Filter by domain
 * - bloomLevel (optional): Target Bloom level
 * - count (optional): Number of recommendations (default 3)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTopicRecommendations, getNextTopic } from '@/lib/recommendations/engine'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const domain = searchParams.get('domain') || undefined
    const bloomLevelStr = searchParams.get('bloomLevel')
    const countStr = searchParams.get('count')
    const single = searchParams.get('single') === 'true'

    const bloomLevel = bloomLevelStr ? parseInt(bloomLevelStr) : undefined
    const count = countStr ? parseInt(countStr) : 3

    // Validate parameters
    if (bloomLevel && (bloomLevel < 1 || bloomLevel > 6)) {
      return NextResponse.json(
        { error: 'bloomLevel must be between 1 and 6' },
        { status: 400 }
      )
    }

    if (count < 1 || count > 20) {
      return NextResponse.json(
        { error: 'count must be between 1 and 20' },
        { status: 400 }
      )
    }

    if (single) {
      // Get single recommendation
      const recommendation = await getNextTopic(user.id, { domain, bloomLevel })

      if (!recommendation) {
        return NextResponse.json({
          success: true,
          recommendation: null,
          message: 'No topics available for recommendation'
        })
      }

      return NextResponse.json({
        success: true,
        recommendation
      })
    } else {
      // Get multiple recommendations
      const recommendations = await getTopicRecommendations(user.id, {
        count,
        domain,
        minBloomLevel: bloomLevel,
        maxBloomLevel: bloomLevel
      })

      return NextResponse.json({
        success: true,
        count: recommendations.length,
        recommendations
      })
    }
  } catch (error: any) {
    console.error('Error generating recommendations:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate recommendations',
        message: error.message
      },
      { status: 500 }
    )
  }
}
