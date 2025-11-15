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
    console.log('Adding DELETE policy for api_call_log...')

    console.log('')
    console.log('Please run the following SQL in your Supabase SQL Editor:')
    console.log('https://supabase.com/dashboard/project/pxtcgyvxgyffaaeugjwc/sql/new')
    console.log('')
    console.log('────────────────────────────────────────────────────────')

    const migrationSQL = readFileSync(
      join(__dirname, '..', 'supabase', 'migrations', '20250112_add_api_call_log_delete_policy.sql'),
      'utf-8'
    )

    console.log(migrationSQL)
    console.log('────────────────────────────────────────────────────────')
    console.log('')
    console.log('After running this SQL, the audit reset will be able to delete API call logs.')

  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

applyMigration()
