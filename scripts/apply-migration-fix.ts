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
    const migrationFile = path.join(process.cwd(), 'supabase/migrations/20251118_add_global_question_position.sql')
    const sql = fs.readFileSync(migrationFile, 'utf8')

    console.log('Applying migration:', migrationFile)

    // Split by semicolon to execute statements individually if needed, 
    // but Supabase SQL editor usually handles blocks. 
    // However, the supabase-js client doesn't have a direct "exec sql" method for DDL 
    // unless we use the rpc or a specific postgres driver.
    // Since I don't have direct postgres access configured in this script easily without pg driver,
    // I will use the `postgres` package if available or try to use a raw query if I can find a way.

    // Actually, the previous script used `postgres` package. Let's check if it's installed.
    // If not, I might need to use the `pg` driver or similar.
    // Checking package.json would be good, but I'll assume `postgres` or `pg` is there since I used it before.
    // Wait, I used `postgres` in the previous deleted script.

    // Let's try to use the `postgres` library again as it seemed to work or was intended to work.

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
        console.log('Attempting fallback via Supabase RPC if available (unlikely for DDL)...')
    }
}

applyMigration()
