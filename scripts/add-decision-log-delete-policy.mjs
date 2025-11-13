import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  try {
    console.log('Applying DELETE policy migration for rl_decision_log...')

    // Check if policy already exists
    const { data: existingPolicies, error: checkError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'rl_decision_log')
      .eq('policyname', 'Users can delete their own decision logs')

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing policies:', checkError)
    }

    if (existingPolicies && existingPolicies.length > 0) {
      console.log('⚠️  DELETE policy already exists')
      return
    }

    console.log('Creating DELETE policy...')
    console.log('')
    console.log('Please run the following SQL in your Supabase SQL Editor:')
    console.log('https://supabase.com/dashboard/project/pxtcgyvxgyffaaeugjwc/sql/new')
    console.log('')
    console.log('────────────────────────────────────────────────────────')

    const migrationSQL = readFileSync(
      join(__dirname, '..', 'supabase', 'migrations', '20250112_add_decision_log_delete_policy.sql'),
      'utf-8'
    )

    console.log(migrationSQL)
    console.log('────────────────────────────────────────────────────────')
    console.log('')
    console.log('After running this SQL, the audit reset functionality will work properly.')

  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

applyMigration()
