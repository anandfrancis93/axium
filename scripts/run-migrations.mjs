import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const supabaseUrl = 'https://pxtcgyvxgyffaaeugjwc.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4dGNneXZ4Z3lmZmFhZXVnandjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjMwMzk5OSwiZXhwIjoyMDc3ODc5OTk5fQ.mmNbBksqgSCpfjFknzqNYMKHaLdgoWW9AOx8IpbMRYc'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration(migrationFile, description) {
  console.log(`\n📝 Running: ${description}`)
  console.log(`   File: ${migrationFile}`)

  try {
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', migrationFile)
    const sql = readFileSync(migrationPath, 'utf8')

    // Split SQL by statement (handle multi-statement files)
    // This is a simple split - for complex migrations, you might need a better parser
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'))

    console.log(`   Found ${statements.length} SQL statements`)

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'

      // Skip comments
      if (statement.trim().startsWith('--') || statement.trim().startsWith('/*')) {
        continue
      }

      const { error } = await supabase.rpc('exec_sql', { sql_query: statement }).catch(async () => {
        // If exec_sql doesn't exist, try direct query
        return await supabase.from('_sqlx_migrations').select('*').limit(0).then(() => {
          // Fallback: use raw SQL execution
          console.log(`   ⚠️  Cannot execute via RPC, trying alternative method...`)
          return { error: new Error('Direct SQL execution not available via JS client') }
        })
      })

      if (error && !error.message.includes('already exists')) {
        console.error(`   ❌ Error on statement ${i + 1}:`, error.message)
        console.error(`   Statement: ${statement.substring(0, 100)}...`)

        // Don't fail on "already exists" errors
        if (!error.message.includes('already exists') &&
            !error.message.includes('duplicate')) {
          throw error
        } else {
          console.log(`   ⚠️  Skipping (already exists)`)
        }
      } else {
        if (i % 5 === 0 && i > 0) {
          console.log(`   ✅ Processed ${i + 1}/${statements.length} statements...`)
        }
      }
    }

    console.log(`   ✅ Migration completed successfully!`)
    return true

  } catch (error) {
    console.error(`   ❌ Migration failed:`, error.message)
    return false
  }
}

async function main() {
  console.log('🚀 Starting database migrations...\n')
  console.log('Target: Supabase project')
  console.log('Project URL:', supabaseUrl)
  console.log('=' .repeat(60))

  // Migration 1: Add question_format column and enum
  const migration1Success = await runMigration(
    '20250105_add_question_format.sql',
    'Add question_format column and ENUM type'
  )

  if (!migration1Success) {
    console.log('\n❌ Migration 1 failed. Stopping.')
    console.log('\n💡 You may need to run these migrations manually via Supabase SQL Editor.')
    console.log('   Go to: https://supabase.com/dashboard/project/_/sql')
    process.exit(1)
  }

  // Migration 2: Add format tracking to RL metadata
  const migration2Success = await runMigration(
    '20250105_add_format_tracking.sql',
    'Add format performance tracking to RL metadata'
  )

  if (!migration2Success) {
    console.log('\n⚠️  Migration 2 failed.')
    console.log('   You may need to run this migration manually.')
  }

  console.log('\n' + '='.repeat(60))
  if (migration1Success && migration2Success) {
    console.log('✅ All migrations completed successfully!')
    console.log('\n📊 Next steps:')
    console.log('   1. Run: node scripts/initialize-question-formats.mjs')
    console.log('   2. Test the admin page at /admin')
  } else {
    console.log('⚠️  Some migrations had issues.')
    console.log('\n💡 Manual migration via Supabase Dashboard:')
    console.log('   1. Go to: https://supabase.com/dashboard/project/pxtcgyvxgyffaaeugjwc/sql/new')
    console.log('   2. Copy contents of: supabase/migrations/20250105_add_question_format.sql')
    console.log('   3. Execute the SQL')
    console.log('   4. Repeat for: supabase/migrations/20250105_add_format_tracking.sql')
  }

  process.exit(migration1Success && migration2Success ? 0 : 1)
}

main()
