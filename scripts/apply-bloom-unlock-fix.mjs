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
  console.log('=== APPLYING BLOOM LEVEL UNLOCKING FIX ===\n')

  // Read migration SQL
  const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20250107_fix_bloom_level_unlocking.sql')
  const migrationSQL = readFileSync(migrationPath, 'utf-8')

  console.log('📋 MANUAL STEP REQUIRED:\n')
  console.log('1. Go to: https://supabase.com/dashboard/project/pxtcgyvxgyffaaeugjwc/sql/new')
  console.log('2. Copy the SQL below and paste it into the SQL Editor')
  console.log('3. Click RUN\n')
  console.log('=' .repeat(80))
  console.log(migrationSQL)
  console.log('=' .repeat(80))

  console.log('\n\nAfter applying, test with:')
  console.log('node scripts/test-bloom-unlocking.mjs')
}

applyMigration().catch(console.error)
