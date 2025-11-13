import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/audit/reset
 *
 * Delete all audit and API cost data for the current user
 *
 * Deletes:
 * - All records from rl_decision_log table (audit trail)
 * - All records from api_call_log table (API costs)
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

    // Get counts before deletion
    const { count: auditCount } = await supabase
      .from('rl_decision_log')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    const { count: apiCallCount } = await supabase
      .from('api_call_log')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    // Delete all rl_decision_log entries for this user
    const { error: auditDeleteError } = await supabase
      .from('rl_decision_log')
      .delete()
      .eq('user_id', user.id)

    if (auditDeleteError) {
      console.error('Error deleting audit logs:', auditDeleteError)
      return NextResponse.json(
        { error: `Failed to delete audit logs: ${auditDeleteError.message}` },
        { status: 500 }
      )
    }

    // Delete all api_call_log entries for this user
    const { error: apiDeleteError } = await supabase
      .from('api_call_log')
      .delete()
      .eq('user_id', user.id)

    if (apiDeleteError) {
      console.error('Error deleting API call logs:', apiDeleteError)
      return NextResponse.json(
        { error: `Failed to delete API call logs: ${apiDeleteError.message}` },
        { status: 500 }
      )
    }

    console.log('Reset audit log complete:', {
      audit_logs_deleted: auditCount || 0,
      api_calls_deleted: apiCallCount || 0
    })

    return NextResponse.json({
      success: true,
      deleted: {
        audit_logs: auditCount || 0,
        api_calls: apiCallCount || 0,
        total: (auditCount || 0) + (apiCallCount || 0)
      },
      message: `Successfully deleted ${auditCount || 0} audit log entries and ${apiCallCount || 0} API call records`
    })

  } catch (error) {
    console.error('Error in POST /api/audit/reset:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
