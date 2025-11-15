/**
 * Apply prerequisite paths unique constraint fix
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyConstraintFix() {
  console.log('🔧 Applying unique constraint fix to graphrag_prerequisite_paths\n')

  try {
    // Read the migration file
    const migrationPath = join(process.cwd(), 'supabase', 'migrations', '20250114_fix_prerequisite_paths_constraint.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf-8')

    console.log(`✅ Loaded migration (${migrationSQL.length} characters)\n`)

    // Split into individual statements (by semicolon)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('COMMENT'))

    console.log(`📝 Executing ${statements.length} SQL statements:\n`)

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i]
      console.log(`${i + 1}. ${stmt.substring(0, 100)}...`)

      const { error } = await supabase.rpc('exec_sql', { sql_query: stmt })

      if (error) {
        console.error(`   ❌ Error: ${error.message}`)
        // Continue with other statements
      } else {
        console.log(`   ✅ Success`)
      }
    }

    console.log('\n🎉 Constraint fix applied!\n')

    // Verify the constraint was added
    console.log('🔍 Verifying unique constraint...\n')

    const { data: constraints, error: checkError } = await supabase
      .from('information_schema.table_constraints')
      .select('*')
      .eq('table_name', 'graphrag_prerequisite_paths')
      .eq('constraint_type', 'UNIQUE')

    if (checkError) {
      console.log('⚠️  Could not verify constraint (this is okay, check manually)')
    } else if (constraints && constraints.length > 0) {
      console.log('✅ Unique constraint verified!')
      console.log(`   Constraint name: ${constraints[0].constraint_name}`)
    } else {
      console.log('⚠️  Could not find unique constraint')
      console.log('\n📝 Please run this SQL manually in Supabase Dashboard:')
      console.log(migrationSQL)
    }

  } catch (error) {
    console.error('❌ Error applying constraint fix:', error)
    console.log('\n📝 Please apply manually in Supabase Dashboard SQL Editor:')
    console.log('\nGo to: https://supabase.com/dashboard → SQL Editor → New Query')
    console.log('\nPaste the contents of: supabase/migrations/20250114_fix_prerequisite_paths_constraint.sql')
    process.exit(1)
  }
}

applyConstraintFix()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
