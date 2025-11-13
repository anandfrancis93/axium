import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/audit/reset
 *
 * Delete all RL decision log entries for the current user
 *
 * Deletes:
 * - All records from rl_decision_log table
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Reset audit log request:', {
      user_id: user.id,
      timestamp: new Date().toISOString()
    })

    // Get count before deletion
    const { count: totalCount } = await supabase
      .from('rl_decision_log')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    // Delete all rl_decision_log entries for this user
    const { error: deleteError } = await supabase
      .from('rl_decision_log')
      .delete()
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting audit logs:', deleteError)
      return NextResponse.json(
        { error: `Failed to delete audit logs: ${deleteError.message}` },
        { status: 500 }
      )
    }

    console.log('Reset audit log complete:', {
      deleted: totalCount || 0
    })

    return NextResponse.json({
      success: true,
      deleted: totalCount || 0,
      message: `Successfully deleted ${totalCount || 0} audit log entries`
    })

  } catch (error) {
    console.error('Error in POST /api/audit/reset:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
