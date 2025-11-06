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
  console.log('📊 Applying get_available_arms fix...\n')

  // Read migration SQL
  const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20250106_fix_get_available_arms.sql')
  const migrationSQL = readFileSync(migrationPath, 'utf-8')

  console.log('Executing SQL via raw query...\n')

  try {
    // Use the REST API directly with a raw SQL query
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ query: migrationSQL })
    })

    if (!response.ok) {
      // exec_sql doesn't exist, try direct postgres connection simulation
      console.log('exec_sql RPC not available, using alternative method...\n')

      // Split SQL into statements and execute
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('COMMENT'))

      for (const statement of statements) {
        console.log('Executing statement...')
        // We can't execute raw SQL directly, so we need to use Supabase dashboard
        console.log('Statement:', statement.substring(0, 100) + '...')
      }

      console.log('\n⚠️  Cannot execute SQL programmatically.')
      console.log('\n📋 MANUAL STEP REQUIRED:')
      console.log('1. Go to: https://supabase.com/dashboard/project/pxtcgyvxgyffaaeugjwc/sql/new')
      console.log('2. Copy the contents of: supabase/migrations/20250106_fix_get_available_arms.sql')
      console.log('3. Paste and click RUN\n')

      console.log('OR copy this SQL:\n')
      console.log('=' .repeat(80))
      console.log(migrationSQL)
      console.log('=' .repeat(80))

      return
    }

    const data = await response.json()
    console.log('✅ Migration applied successfully!')
    console.log(data)

  } catch (error) {
    console.error('Error:', error.message)
    console.log('\n📋 MANUAL STEP REQUIRED:')
    console.log('Please apply the migration manually via Supabase Dashboard')
  }

  // Test the function
  console.log('\nTesting get_available_arms...')
  const { data: arms, error: testError } = await supabase.rpc('get_available_arms', {
    p_user_id: '00000000-0000-0000-0000-000000000000',
    p_chapter_id: '0517450a-61b2-4fa2-a425-5846b21ba4b0'
  })

  if (testError) {
    console.log('Still has error:', testError.message)
    console.log('\nMigration not yet applied. Please apply manually.')
  } else {
    console.log(`✅ Function working! Returned ${arms?.length || 0} arms`)
    if (arms && arms.length > 0) {
      console.log('\nFirst 3 arms:')
      arms.slice(0, 3).forEach((a, i) => {
        console.log(`  ${i + 1}. ${a.topic} (Bloom L${a.bloom_level})`)
      })
    }
  }
}

applyMigration().catch(console.error)
