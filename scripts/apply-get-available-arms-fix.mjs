import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const supabaseUrl = 'https://pxtcgyvxgyffaaeugjwc.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4dGNneXZ4Z3lmZmFhZXVnandjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjMwMzk5OSwiZXhwIjoyMDc3ODc5OTk5fQ.mmNbBksqgSCpfjFknzqNYMKHaLdgoWW9AOx8IpbMRYc'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  console.log('📊 Applying get_available_arms fix migration...\n')

  // Read migration SQL
  const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20250106_fix_get_available_arms.sql')
  const migrationSQL = readFileSync(migrationPath, 'utf-8')

  console.log('Executing SQL...\n')

  // Execute the SQL
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: migrationSQL
  })

  if (error) {
    console.error('❌ Error applying migration:', error)
    process.exit(1)
  }

  console.log('✅ Migration applied successfully!\n')

  // Test the function
  console.log('Testing get_available_arms...')
  const { data: arms, error: testError } = await supabase.rpc('get_available_arms', {
    p_user_id: '00000000-0000-0000-0000-000000000000',  // Test user
    p_chapter_id: '0517450a-61b2-4fa2-a425-5846b21ba4b0'
  })

  if (testError) {
    console.error('Test error:', testError)
  } else {
    console.log(`✓ Function working! Returned ${arms?.length || 0} arms`)
    if (arms && arms.length > 0) {
      console.log('\nFirst 5 arms:')
      arms.slice(0, 5).forEach((a, i) => {
        console.log(`  ${i + 1}. ${a.topic} (Bloom L${a.bloom_level}) - Unlocked: ${a.is_unlocked}`)
      })
    }
  }

  console.log('\n✅ All done! Thompson Sampling now uses topics table.')
}

applyMigration().catch(console.error)
