/**
 * Recalculate Calibration Statistics API Endpoint
 *
 * POST /api/analytics/recalculate
 *
 * Manually recalculates calibration statistics for the current user
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
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

    // Get all unique topics the user has answered questions for
    const { data: responseTopics, error: responsesError } = await supabase
      .from('user_responses')
      .select('topic_id')
      .eq('user_id', user.id)
      .not('calibration_score', 'is', null)

    if (responsesError) {
      throw responsesError
    }

    if (!responseTopics || responseTopics.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No practice data found',
        updated: 0
      })
    }

    // Get unique topic IDs
    const uniqueTopicIds = [...new Set(responseTopics.map(r => r.topic_id))]

    let updated = 0

    // Process each topic
    for (const topicId of uniqueTopicIds) {

      // Get all responses for this topic
      const { data: responses, error: responsesError } = await supabase
        .from('user_responses')
        .select('calibration_score, is_correct, created_at')
        .eq('user_id', user.id)
        .eq('topic_id', topicId)
        .not('calibration_score', 'is', null)
        .order('created_at', { ascending: true })

      if (responsesError || !responses || responses.length === 0) {
        continue
      }

      const scores = responses.map(r => r.calibration_score as number)
      const count = scores.length
      const totalAttempts = responses.length
      const correctAnswers = responses.filter(r => r.is_correct).length

      // Calculate mean
      const mean = scores.reduce((sum, score) => sum + score, 0) / count

      // Calculate standard deviation
      const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / count
      const stddev = Math.sqrt(variance)

      let slope = 0
      let rSquared = 0

      // Calculate linear regression if we have enough data points (≥10)
      if (count >= 10) {
        // Prepare data for regression: x = question number (1, 2, 3...), y = calibration score
        const xValues = scores.map((_, index) => index + 1)
        const yValues = scores

        // Calculate sums
        const n = count
        const sumX = xValues.reduce((sum, x) => sum + x, 0)
        const sumY = yValues.reduce((sum, y) => sum + y, 0)
        const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0)
        const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0)
        const sumY2 = yValues.reduce((sum, y) => sum + y * y, 0)

        // Calculate slope (b = (n*sumXY - sumX*sumY) / (n*sumX2 - sumX*sumX))
        const numerator = n * sumXY - sumX * sumY
        const denominator = n * sumX2 - sumX * sumX

        if (denominator !== 0) {
          slope = numerator / denominator

          // Calculate R² (coefficient of determination)
          const meanY = sumY / n
          const ssTotal = sumY2 - n * meanY * meanY
          const ssResidual = yValues.reduce((sum, y, i) => {
            const predicted = slope * xValues[i] + (meanY - slope * (sumX / n))
            return sum + Math.pow(y - predicted, 2)
          }, 0)

          if (ssTotal !== 0) {
            rSquared = 1 - (ssResidual / ssTotal)
            // Clamp R² between 0 and 1
            rSquared = Math.max(0, Math.min(1, rSquared))
          }
        }
      }

      // Calculate questions to mastery (simple estimation)
      // If slope is positive and significant, estimate how many questions until mean reaches 1.0
      let questionsToMastery: number | null = null
      if (slope > 0.001 && mean < 1.0) {
        const questionsNeeded = Math.ceil((1.0 - mean) / slope)
        // Cap at reasonable maximum
        questionsToMastery = Math.min(questionsNeeded, 1000)
      }

      // Upsert user_progress (update if exists, create if doesn't)
      const { error: upsertError } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          topic_id: topicId,
          total_attempts: totalAttempts,
          correct_answers: correctAnswers,
          calibration_mean: Number(mean.toFixed(2)),
          calibration_stddev: Number(stddev.toFixed(2)),
          calibration_slope: Number(slope.toFixed(6)),
          calibration_r_squared: Number(rSquared.toFixed(2)),
          questions_to_mastery: questionsToMastery,
          last_practiced_at: responses[responses.length - 1].created_at,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,topic_id'
        })

      if (!upsertError) {
        updated++
      } else {
        console.error('Error upserting progress for topic', topicId, ':', upsertError)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully recalculated statistics for ${updated} topics`,
      updated
    })

  } catch (error) {
    console.error('Error recalculating statistics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
