import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env.local')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
    const migrationFile = path.join(process.cwd(), 'supabase/migrations/20251118_fix_updated_at_column.sql')
    const sql = fs.readFileSync(migrationFile, 'utf8')

    console.log('Applying migration:', migrationFile)

    try {
        const postgres = require('postgres')
        const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL

        if (!connectionString) {
            console.error('Missing DATABASE_URL or POSTGRES_URL')
            process.exit(1)
        }

        const sqlClient = postgres(connectionString)

        await sqlClient.file(migrationFile)

        console.log('Migration applied successfully!')
        await sqlClient.end()
    } catch (e) {
        console.error('Error applying migration:', e)
    }
}

applyMigration()
