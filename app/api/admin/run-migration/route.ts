/**
 * Admin Migration Runner
 *
 * POST /api/admin/run-migration
 *
 * Runs the foreign key constraint removal migration
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

    // Execute SQL to drop the foreign key constraint
    // Note: Supabase client doesn't support DDL directly, so we use the SQL editor API
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE user_responses DROP CONSTRAINT IF EXISTS user_responses_question_id_fkey;
        COMMENT ON COLUMN user_responses.question_id IS 'Question identifier. May reference questions table or be a generated UUID for on-the-fly questions. No foreign key constraint to allow flexibility.';
      `
    })

    if (error) {
      // RPC might not exist, return instructions for manual migration
      return NextResponse.json({
        success: false,
        error: error.message,
        instructions: {
          message: 'Run this SQL command in your database console:',
          sql: 'ALTER TABLE user_responses DROP CONSTRAINT IF EXISTS user_responses_question_id_fkey;',
          note: 'This removes the foreign key constraint that prevents saving responses for generated questions.'
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Foreign key constraint removed successfully',
      details: 'user_responses.question_id no longer requires questions table reference'
    })

  } catch (error) {
    console.error('Error running migration:', error)
    return NextResponse.json(
      {
        error: 'Migration failed',
        details: String(error),
        instructions: {
          message: 'Please run this SQL manually:',
          sql: 'ALTER TABLE user_responses DROP CONSTRAINT IF EXISTS user_responses_question_id_fkey;'
        }
      },
      { status: 500 }
    )
  }
}
