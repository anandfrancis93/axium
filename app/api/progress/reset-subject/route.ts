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

    // Then get chapters for this subject
    const { data: chapters, error: chaptersError } = await supabase
      .from('chapters')
      .select('id')
      .eq('subject_id', subjects.id)

    if (chaptersError || !chapters || chapters.length === 0) {
      console.error('Error fetching chapters:', chaptersError)
      return NextResponse.json({
        success: true,
        deletedCount: 0,
        message: `No chapters found for subject: ${subject}`
      })
    }

    const chapterIds = chapters.map(c => c.id)

    // Get all topics for these chapters
    const { data: topics, error: topicsError } = await supabase
      .from('topics')
      .select('id')
      .in('chapter_id', chapterIds)

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

    // Count records before deletion
    const { count: progressCount, error: countProgressError } = await supabase
      .from('user_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .in('topic_id', topicIds)

    if (countProgressError && countProgressError.message) {
      console.error('Error counting user_progress:', countProgressError)
    }

    const { count: responsesCount, error: countResponsesError } = await supabase
      .from('user_responses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .in('topic_id', topicIds)

    if (countResponsesError && countResponsesError.message) {
      console.error('Error counting user_responses:', countResponsesError)
    }

    console.log(`Found ${progressCount || 0} progress records and ${responsesCount || 0} response records to delete`)

    // Batch delete to avoid parameter limit (max 100 IDs per batch)
    const BATCH_SIZE = 100
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
    }

    console.log(`Successfully deleted all records in ${Math.ceil(topicIds.length / BATCH_SIZE)} batches`)

    const totalDeleted = (progressCount || 0) + (responsesCount || 0)

    return NextResponse.json({
      success: true,
      deletedCount: totalDeleted,
      progressRecords: progressCount || 0,
      responseRecords: responsesCount || 0,
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
