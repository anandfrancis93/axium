/**
 * Debug Analytics Data
 *
 * GET /api/analytics/debug
 *
 * Returns raw data about user responses and topics
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

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

    // Get response counts by topic_id
    const { data: responses, error: responsesError } = await supabase
      .from('user_responses')
      .select('topic_id, calibration_score, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100)

    if (responsesError) {
      throw responsesError
    }

    // Count by topic
    const topicCounts: Record<string, number> = {}
    const topicsWithCalibration: Record<string, number> = {}
    const nullTopicCount = responses?.filter(r => r.topic_id === null).length || 0

    responses?.forEach(r => {
      const topicId = r.topic_id || 'NULL'
      topicCounts[topicId] = (topicCounts[topicId] || 0) + 1
      if (r.calibration_score !== null) {
        topicsWithCalibration[topicId] = (topicsWithCalibration[topicId] || 0) + 1
      }
    })

    // Get user_progress records
    const { data: progressRecords, error: progressError } = await supabase
      .from('user_progress')
      .select('topic_id, total_attempts, calibration_mean')
      .eq('user_id', user.id)

    if (progressError) {
      throw progressError
    }

    // Get unique topic IDs from responses
    const { data: uniqueTopicsData, error: uniqueError } = await supabase
      .from('user_responses')
      .select('topic_id')
      .eq('user_id', user.id)
      .not('calibration_score', 'is', null)

    const uniqueTopicIds = uniqueTopicsData
      ? [...new Set(uniqueTopicsData.map(r => r.topic_id).filter(id => id !== null))]
      : []

    return NextResponse.json({
      success: true,
      data: {
        totalResponses: responses?.length || 0,
        responsesByTopic: topicCounts,
        responsesWithCalibrationByTopic: topicsWithCalibration,
        nullTopicCount,
        uniqueTopicIdsFromResponses: uniqueTopicIds,
        uniqueTopicCount: uniqueTopicIds.length,
        userProgressRecords: progressRecords?.length || 0,
        progressDetails: progressRecords,
        sampleResponses: responses?.slice(0, 5).map(r => ({
          topic_id: r.topic_id,
          has_calibration: r.calibration_score !== null,
          calibration_score: r.calibration_score,
          created_at: r.created_at
        }))
      }
    })

  } catch (error) {
    console.error('Error in debug endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
