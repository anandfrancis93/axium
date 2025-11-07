import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Read the migration file
const migrationSQL = readFileSync('./supabase/migrations/20250108_filter_leaf_topics_only.sql', 'utf-8')

console.log('Applying migration: Filter leaf topics only (depth >= 2)')

// Split by semicolons and execute each statement
const statements = migrationSQL
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'))

for (const statement of statements) {
  if (statement.includes('CREATE OR REPLACE FUNCTION')) {
    // Execute function creation
    const { error } = await supabase.rpc('query', { sql: statement + ';' })
    if (error) {
      console.error('Error:', error)
    } else {
      console.log('✓ Function created successfully')
    }
  }
}

console.log('Migration complete!')
