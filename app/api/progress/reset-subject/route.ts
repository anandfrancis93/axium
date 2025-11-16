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
    const { data: topics, error: topicsError } = await supabase
      .from('topics')
      .select('id, chapters!inner(subjects!inner(name))')
      .eq('chapters.subjects.name', subject)

    if (topicsError) {
      console.error('Error fetching topics:', topicsError)
      return NextResponse.json(
        { error: 'Failed to fetch topics' },
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

    // Count records before deletion
    const { count: progressCount } = await supabase
      .from('user_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .in('topic_id', topicIds)

    const { count: responsesCount } = await supabase
      .from('user_responses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .in('topic_id', topicIds)

    // Delete all user_progress entries for these topics
    const { error: deleteProgressError } = await supabase
      .from('user_progress')
      .delete()
      .eq('user_id', user.id)
      .in('topic_id', topicIds)

    if (deleteProgressError) {
      console.error('Error deleting user_progress:', deleteProgressError)
      return NextResponse.json(
        { error: 'Failed to delete progress records', details: deleteProgressError.message },
        { status: 500 }
      )
    }

    // Delete all user_responses for these topics
    const { error: deleteResponsesError } = await supabase
      .from('user_responses')
      .delete()
      .eq('user_id', user.id)
      .in('topic_id', topicIds)

    if (deleteResponsesError) {
      console.error('Error deleting user_responses:', deleteResponsesError)
      // Continue anyway - progress deletion is more important
    }

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
