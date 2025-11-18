
import postgres from 'postgres'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL

if (!dbUrl) {
    console.error('Missing DATABASE_URL or POSTGRES_URL')
    process.exit(1)
}

const sql = postgres(dbUrl, { ssl: 'require' })

async function applyMigration() {
    const migrationPath = path.join(process.cwd(), 'supabase/migrations/20251118_add_user_global_progress.sql')
    const migrationSql = fs.readFileSync(migrationPath, 'utf8')

    console.log('Applying migration...')
    try {
        // Split by semicolon to run statements individually if needed, but postgres.js might handle it.
        // Usually better to run as one block if it's just DDL.
        await sql.unsafe(migrationSql)
        console.log('Migration applied successfully.')
    } catch (error) {
        console.error('Error applying migration:', error)
    } finally {
        await sql.end()
    }
}

applyMigration()
