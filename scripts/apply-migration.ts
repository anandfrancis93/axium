/**
 * Apply Supabase migration for Phase 3 semantic cache
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyMigration() {
  console.log('📋 Reading migration file...')

  const migrationPath = join(process.cwd(), 'supabase', 'migrations', '20250114_add_semantic_cache_fields.sql')
  const migrationSQL = readFileSync(migrationPath, 'utf-8')

  console.log(`✅ Loaded migration (${migrationSQL.length} characters)`)
  console.log('\n🚀 Applying migration to Supabase...\n')

  try {
    // Execute the migration SQL
    // Note: Supabase client doesn't have a direct SQL execution method
    // We need to use the REST API or split into individual statements

    // For now, let's inform the user to apply it manually or use psql
    console.log('⚠️  Supabase JS client cannot execute DDL directly.')
    console.log('\n📝 Please apply the migration using one of these methods:\n')

    console.log('Method 1: Supabase Dashboard')
    console.log('  1. Go to:', supabaseUrl.replace('https://', 'https://supabase.com/dashboard/project/'))
    console.log('  2. Navigate to SQL Editor')
    console.log('  3. Paste and run: supabase/migrations/20250114_add_semantic_cache_fields.sql')

    console.log('\nMethod 2: psql (if you have direct database access)')
    console.log('  psql "<your-database-url>" -f supabase/migrations/20250114_add_semantic_cache_fields.sql')

    console.log('\nMethod 3: Supabase CLI (recommended)')
    console.log('  npm install -g supabase')
    console.log('  supabase link --project-ref <your-project-ref>')
    console.log('  supabase db push')

    // Let's try to verify if tables already exist
    console.log('\n🔍 Checking if migration is already applied...\n')

    const { data: entities, error: entitiesError } = await supabase
      .from('graphrag_entities')
      .select('difficulty_score')
      .limit(1)

    if (!entitiesError) {
      console.log('✅ Column graphrag_entities.difficulty_score exists - migration appears to be applied!')
      return true
    } else if (entitiesError.code === 'PGRST116' || entitiesError.message.includes('column')) {
      console.log('❌ Migration NOT applied yet - difficulty_score column does not exist')
      console.log('\nPlease apply the migration using one of the methods above.')
      return false
    } else {
      console.log('⚠️  Could not verify migration status:', entitiesError.message)
      return false
    }

  } catch (error) {
    console.error('❌ Error:', error)
    return false
  }
}

applyMigration()
  .then((applied) => {
    if (applied) {
      console.log('\n✅ Migration verification complete!')
      process.exit(0)
    } else {
      console.log('\n⚠️  Please apply migration manually')
      process.exit(1)
    }
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
