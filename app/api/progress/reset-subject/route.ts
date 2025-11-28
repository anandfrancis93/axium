/**
 * Reset User Progress for a Subject
 *
 * DELETE /api/progress/reset-subject
 * Deletes all user progress for a specific subject (e.g., Cybersecurity)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - please log in' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { subject } = body

    if (!subject) {
      return NextResponse.json(
        { error: 'Subject name is required' },
        { status: 400 }
      )
    }

    // Get all topics for the specified subject
    // First get the subject ID
    const { data: subjects, error: subjectError } = await supabase
      .from('subjects')
      .select('id')
      .eq('name', subject)
      .single()

    if (subjectError || !subjects) {
      console.error('Error fetching subject:', subjectError)
      return NextResponse.json(
        { error: `Subject not found: ${subject}` },
        { status: 404 }
      )
    }

    // Get all topics for this subject (no more chapters)
    const { data: topics, error: topicsError } = await supabase
      .from('topics')
      .select('id')
      .eq('subject_id', subjects.id)

    if (topicsError) {
      console.error('Error fetching topics:', topicsError)
      return NextResponse.json(
        { error: 'Failed to fetch topics', details: topicsError.message },
        { status: 500 }
      )
    }

    if (!topics || topics.length === 0) {
      return NextResponse.json({
        success: true,
        deletedCount: 0,
        message: `No topics found for subject: ${subject}`
      })
    }

    // Extract topic IDs
    const topicIds = topics.map(t => t.id)
    console.log(`Found ${topicIds.length} topics for subject: ${subject}`)

    if (topicIds.length === 0) {
      return NextResponse.json({
        success: true,
        deletedCount: 0,
        message: `No topics found for subject: ${subject}`
      })
    }

    // Count records before deletion using batched queries (Supabase has parameter limits)
    const BATCH_SIZE = 100
    let progressCount = 0
    let responsesCount = 0
    let questionsCount = 0
    let reviewsCount = 0

    // Batch count for user_progress
    for (let i = 0; i < topicIds.length; i += BATCH_SIZE) {
      const batch = topicIds.slice(i, i + BATCH_SIZE)
      const { count, error } = await supabase
        .from('user_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .in('topic_id', batch)
      if (!error && count) progressCount += count
    }

    // Batch count for user_responses
    for (let i = 0; i < topicIds.length; i += BATCH_SIZE) {
      const batch = topicIds.slice(i, i + BATCH_SIZE)
      const { count, error } = await supabase
        .from('user_responses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .in('topic_id', batch)
      if (!error && count) responsesCount += count
    }

    // Batch count for questions
    for (let i = 0; i < topicIds.length; i += BATCH_SIZE) {
      const batch = topicIds.slice(i, i + BATCH_SIZE)
      const { count, error } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .in('topic_id', batch)
      if (!error && count) questionsCount += count
    }

    // Get all question IDs for counting user_question_reviews (also batched)
    const allQuestionIds: string[] = []
    for (let i = 0; i < topicIds.length; i += BATCH_SIZE) {
      const batch = topicIds.slice(i, i + BATCH_SIZE)
      const { data: batchQuestions } = await supabase
        .from('questions')
        .select('id')
        .in('topic_id', batch)
      if (batchQuestions) {
        allQuestionIds.push(...batchQuestions.map((q: any) => q.id))
      }
    }

    // Batch count for user_question_reviews
    for (let i = 0; i < allQuestionIds.length; i += BATCH_SIZE) {
      const batch = allQuestionIds.slice(i, i + BATCH_SIZE)
      const { count, error } = await supabase
        .from('user_question_reviews')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .in('question_id', batch)
      if (!error && count) reviewsCount += count
    }

    console.log(`Found ${progressCount} progress records, ${responsesCount} response records, ${reviewsCount} review records, and ${questionsCount} questions to delete`)

    // Batch delete (using same BATCH_SIZE defined above)
    let totalProgressDeleted = 0
    let totalResponsesDeleted = 0

    for (let i = 0; i < topicIds.length; i += BATCH_SIZE) {
      const batch = topicIds.slice(i, i + BATCH_SIZE)
      console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(topicIds.length / BATCH_SIZE)} (${batch.length} topics)`)

      // Delete user_progress for this batch
      const { error: deleteProgressError } = await supabase
        .from('user_progress')
        .delete()
        .eq('user_id', user.id)
        .in('topic_id', batch)

      if (deleteProgressError) {
        console.error(`Error deleting user_progress batch ${i}-${i + batch.length}:`, deleteProgressError)
        return NextResponse.json(
          {
            error: 'Failed to delete progress records',
            details: deleteProgressError.message,
            code: deleteProgressError.code,
            hint: deleteProgressError.hint,
            batch: `${i}-${i + batch.length}`
          },
          { status: 500 }
        )
      }

      // Delete user_responses for this batch
      const { error: deleteResponsesError } = await supabase
        .from('user_responses')
        .delete()
        .eq('user_id', user.id)
        .in('topic_id', batch)

      if (deleteResponsesError) {
        console.error(`Error deleting user_responses batch ${i}-${i + batch.length}:`, deleteResponsesError)
        // Continue anyway - progress deletion is more important
      }

      // Get question IDs for this batch of topics
      const { data: batchQuestions } = await supabase
        .from('questions')
        .select('id')
        .in('topic_id', batch)

      const batchQIds = batchQuestions?.map((q: any) => q.id) || []

      // Delete user_question_reviews for this batch (spaced repetition data)
      if (batchQIds.length > 0) {
        const { error: deleteReviewsError } = await supabase
          .from('user_question_reviews')
          .delete()
          .eq('user_id', user.id)
          .in('question_id', batchQIds)

        if (deleteReviewsError) {
          console.error(`Error deleting user_question_reviews batch ${i}-${i + batch.length}:`, deleteReviewsError)
          // Continue anyway
        }
      }

      // Delete questions for this batch (not user-specific)
      const { error: deleteQuestionsError } = await supabase
        .from('questions')
        .delete()
        .in('topic_id', batch)

      if (deleteQuestionsError) {
        console.error(`Error deleting questions batch ${i}-${i + batch.length}:`, deleteQuestionsError)
        // Continue anyway
      }
    }

    console.log(`Successfully deleted all records in ${Math.ceil(topicIds.length / BATCH_SIZE)} batches`)

    // Reset global question position to 1 (restart 7-2-1 cycle)
    const { error: resetGlobalError } = await supabase
      .from('user_global_progress')
      .update({
        question_position: 1,
        last_updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)

    if (resetGlobalError) {
      console.error('Error resetting global question position:', resetGlobalError)
      // Continue anyway, not critical enough to fail the whole request
    } else {
      console.log('Successfully reset global question position to 1')
    }

    const totalDeleted = (progressCount || 0) + (responsesCount || 0) + reviewsCount + (questionsCount || 0)

    // ============================================================
    // RECALCULATE GLOBAL PROGRESS
    // Since we deleted a large chunk of data, we must update the global stats
    // to reflect only the remaining history.
    // ============================================================
    try {
      const { calculateMetrics } = await import('@/lib/analytics')

      // Fetch remaining responses (limit to last 100 for performance, similar to submit logic)
      const { data: remainingResponses } = await supabase
        .from('user_responses')
        .select('calibration_score, is_correct, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100)

      if (remainingResponses && remainingResponses.length > 0) {
        // Reverse to get chronological order (oldest -> newest)
        const chronologicalResponses = remainingResponses.reverse()

        const scores = chronologicalResponses.map((r: any) => {
          if (r.calibration_score !== null) return Number(r.calibration_score)
          return r.is_correct ? 1.0 : -1.0
        })

        const newMetrics = calculateMetrics(scores)

        // Update global progress with new metrics
        await supabase
          .from('user_global_progress')
          .update({
            calibration_mean: newMetrics.mean,
            calibration_stddev: newMetrics.stdDev,
            calibration_slope: newMetrics.slope,
            calibration_r_squared: newMetrics.rSquared,
            total_responses_analyzed: newMetrics.count,
            last_updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)

        console.log(`Recalculated global progress: mean=${newMetrics.mean}, count=${newMetrics.count}`)
      } else {
        // No responses left (complete reset of all subjects)
        await supabase
          .from('user_global_progress')
          .update({
            calibration_mean: 0,
            calibration_stddev: 0,
            calibration_slope: 0,
            calibration_r_squared: 0,
            total_responses_analyzed: 0,
            last_updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)

        console.log('Reset global progress to zero (no remaining responses)')
      }
    } catch (recalcError) {
      console.error('Error recalculating global progress:', recalcError)
      // Non-critical, don't fail the request
    }

    return NextResponse.json({
      success: true,
      deletedCount: totalDeleted,
      progressRecords: progressCount || 0,
      responseRecords: responsesCount || 0,
      reviewRecords: reviewsCount,
      questionsRecords: questionsCount || 0,
      message: `Successfully deleted ${totalDeleted} records for ${subject}`
    })

  } catch (error) {
    console.error('Error in reset-subject API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
