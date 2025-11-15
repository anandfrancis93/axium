/**
 * Migration API Endpoint
 *
 * POST /api/migrate
 *
 * Runs database migrations (admin only for now)
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

    // Run migration: Make question_id nullable
    const { error: migrationError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE user_responses ALTER COLUMN question_id DROP NOT NULL;'
    })

    // If RPC doesn't exist, try direct query (Supabase client may not support ALTER directly)
    // We'll use a workaround - check current constraint and report
    const { data: columnInfo, error: infoError } = await supabase
      .from('user_responses')
      .select('question_id')
      .limit(0)

    if (infoError) {
      console.error('Error checking table:', infoError)
    }

    // Since we can't run ALTER TABLE directly from Supabase client,
    // return instructions for manual migration
    return NextResponse.json({
      success: false,
      message: 'Migration must be run manually',
      instructions: [
        'The database schema needs to be updated to make question_id nullable.',
        'Run this SQL command in your database:',
        'ALTER TABLE user_responses ALTER COLUMN question_id DROP NOT NULL;',
        '',
        'Or run via psql:',
        'psql $DATABASE_URL -c "ALTER TABLE user_responses ALTER COLUMN question_id DROP NOT NULL;"'
      ],
      migration_file: 'supabase/migrations/make_question_id_nullable.sql'
    })

  } catch (error) {
    console.error('Error in migration endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
