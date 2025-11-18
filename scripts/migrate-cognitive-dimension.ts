/**
 * Migration Script: Add cognitive_dimension columns
 *
 * Adds cognitive_dimension to questions and user_responses tables
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  console.log('🔧 Running migration: Add cognitive_dimension columns\n')

  try {
    // Add cognitive_dimension to questions table
    console.log('1️⃣ Adding cognitive_dimension column to questions table...')
    const { error: questionsError } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'questions' AND column_name = 'cognitive_dimension'
          ) THEN
            ALTER TABLE questions ADD COLUMN cognitive_dimension TEXT;
            COMMENT ON COLUMN questions.cognitive_dimension IS 'Cognitive dimension tested: WHAT, WHY, WHEN, WHERE, HOW, CHARACTERISTICS';
            RAISE NOTICE 'Added cognitive_dimension to questions table';
          ELSE
            RAISE NOTICE 'cognitive_dimension already exists in questions table';
          END IF;
        END $$;
      `
    })

    if (questionsError) {
      // If rpc doesn't exist, fall back to direct column add
      console.log('   Trying direct ALTER TABLE...')

      // Check if column exists first
      const { data: existingCol } = await supabase
        .from('questions')
        .select('cognitive_dimension')
        .limit(1)

      if (!existingCol) {
        console.log('   ⚠️  Cannot add column via Supabase client')
        console.log('   Please run this SQL in Supabase SQL Editor:')
        console.log('\n   ALTER TABLE questions ADD COLUMN cognitive_dimension TEXT;\n')
      } else {
        console.log('   ✅ Column already exists in questions table')
      }
    } else {
      console.log('   ✅ Questions table updated')
    }

    // Add cognitive_dimension to user_responses table
    console.log('\n2️⃣ Adding cognitive_dimension column to user_responses table...')
    const { error: responsesError } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'user_responses' AND column_name = 'cognitive_dimension'
          ) THEN
            ALTER TABLE user_responses ADD COLUMN cognitive_dimension TEXT;
            COMMENT ON COLUMN user_responses.cognitive_dimension IS 'Cognitive dimension tested: WHAT, WHY, WHEN, WHERE, HOW, CHARACTERISTICS';
            RAISE NOTICE 'Added cognitive_dimension to user_responses table';
          ELSE
            RAISE NOTICE 'cognitive_dimension already exists in user_responses table';
          END IF;
        END $$;
      `
    })

    if (responsesError) {
      console.log('   Trying direct ALTER TABLE...')

      const { data: existingCol } = await supabase
        .from('user_responses')
        .select('cognitive_dimension')
        .limit(1)

      if (!existingCol) {
        console.log('   ⚠️  Cannot add column via Supabase client')
        console.log('   Please run this SQL in Supabase SQL Editor:')
        console.log('\n   ALTER TABLE user_responses ADD COLUMN cognitive_dimension TEXT;\n')
      } else {
        console.log('   ✅ Column already exists in user_responses table')
      }
    } else {
      console.log('   ✅ User responses table updated')
    }

    console.log('\n✅ Migration completed!')
    console.log('\nNext steps:')
    console.log('1. If you see ⚠️ warnings above, run the SQL manually in Supabase Dashboard')
    console.log('2. Redeploy on Vercel to pick up the SUPABASE_SERVICE_ROLE_KEY')
    console.log('3. Test by answering a question and checking the topic detail page')

  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    console.error('\nPlease run this SQL manually in Supabase SQL Editor:')
    console.error(`
ALTER TABLE questions ADD COLUMN IF NOT EXISTS cognitive_dimension TEXT;
ALTER TABLE user_responses ADD COLUMN IF NOT EXISTS cognitive_dimension TEXT;

COMMENT ON COLUMN questions.cognitive_dimension IS 'Cognitive dimension tested: WHAT, WHY, WHEN, WHERE, HOW, CHARACTERISTICS';
COMMENT ON COLUMN user_responses.cognitive_dimension IS 'Cognitive dimension tested: WHAT, WHY, WHEN, WHERE, HOW, CHARACTERISTICS';
    `)
    process.exit(1)
  }
}

runMigration()
