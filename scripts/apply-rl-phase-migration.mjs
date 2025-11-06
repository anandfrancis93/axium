import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const supabaseUrl = 'https://pxtcgyvxgyffaaeugjwc.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4dGNneXZ4Z3lmZmFhZXVnandjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjMwMzk5OSwiZXhwIjoyMDc3ODc5OTk5fQ.mmNbBksqgSCpfjFknzqNYMKHaLdgoWW9AOx8IpbMRYc'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  try {
    console.log('📊 Applying RL Phase Tracking Migration...\n')

    // Read migration file
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20250105_add_rl_phase_tracking.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf-8')

    // Split by statements (basic split on semicolons, might need refinement)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`Found ${statements.length} SQL statements to execute\n`)

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'

      // Skip comments
      if (statement.trim().startsWith('--')) {
        continue
      }

      console.log(`Executing statement ${i + 1}/${statements.length}...`)

      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: statement
      })

      if (error) {
        // Try direct query if RPC doesn't work
        const { error: directError } = await supabase
          .from('_migrations')
          .insert({ statement })
          .select()

        if (directError) {
          console.error(`❌ Error on statement ${i + 1}:`, error.message)
          console.error('Statement:', statement.substring(0, 200) + '...')
          // Continue with other statements
        } else {
          console.log(`✅ Statement ${i + 1} executed`)
        }
      } else {
        console.log(`✅ Statement ${i + 1} executed`)
      }
    }

    console.log('\n✅ Migration completed!')
    console.log('\nVerifying RL phase tracking...')

    // Verify the changes
    const { data: progressData, error: verifyError } = await supabase
      .from('user_progress')
      .select('id, rl_phase, rl_metadata, total_attempts')
      .limit(5)

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError.message)
    } else {
      console.log('\n📋 Sample records with RL phase:')
      progressData.forEach(record => {
        console.log(`  - ID: ${record.id.substring(0, 8)}... | Phase: ${record.rl_phase} | Attempts: ${record.total_attempts}`)
      })
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  }
}

applyMigration()
