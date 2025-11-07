import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyMigration() {
  console.log('Applying leaf topics filter migration...')

  const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20250108_filter_leaf_topics_only.sql')
  const sql = readFileSync(migrationPath, 'utf-8')

  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })

  if (error) {
    console.error('Error applying migration:', error)
    process.exit(1)
  }

  console.log('✓ Migration applied successfully')
  console.log('Available arms will now only include leaf topics (depth >= 2)')
}

applyMigration()
