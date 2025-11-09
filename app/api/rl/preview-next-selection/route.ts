import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { selectArmThompsonSampling } from '@/lib/rl/thompson-sampling'

/**
 * Preview Next Selection - Shows what Thompson Sampling will choose next
 * This is a read-only preview that doesn't log to decision_log
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { chapter_id } = body

    if (!chapter_id) {
      return NextResponse.json(
        { error: 'chapter_id is required' },
        { status: 400 }
      )
    }

    // Run Thompson Sampling to get the selection
    const selectedArm = await selectArmThompsonSampling(user.id, chapter_id)

    if (!selectedArm) {
      return NextResponse.json(
        { error: 'No available arms' },
        { status: 404 }
      )
    }

    // Extract decision context (attached by Thompson Sampling)
    const decisionContext = (selectedArm as any)._decisionContext

    if (!decisionContext) {
      return NextResponse.json(
        { error: 'No decision context available' },
        { status: 500 }
      )
    }

    // Format response similar to decision log structure
    const response = {
      selected_arm: {
        topic_id: decisionContext.selectedSample.topic_id,
        topic_name: decisionContext.selectedSample.topic_name,
        bloom_level: decisionContext.selectedSample.bloom_level,
        sampled_value: decisionContext.selectedSample.sampled_value,
        adjusted_value: decisionContext.selectedSample.adjusted_value,
        mastery_score: decisionContext.selectedSample.mastery_score
      },
      all_arms: decisionContext.allSamples,
      reasoning: decisionContext.reasoning,
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('Error in preview-next-selection:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
