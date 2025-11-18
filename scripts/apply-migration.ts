import postgres from 'postgres'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function applyMigration() {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL

    if (!connectionString) {
        console.error('Error: DATABASE_URL or POSTGRES_URL environment variable is not set.')
        console.log('Please ensure .env.local contains your database connection string.')
        process.exit(1)
    }

    console.log('Connecting to database...')
    const sql = postgres(connectionString, {
        ssl: { rejectUnauthorized: false }, // Required for Supabase connection pooling usually
        max: 1
    })

    try {
        const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20241118_add_performance_metrics_columns.sql')
        const migrationSql = fs.readFileSync(migrationPath, 'utf8')

        console.log('Applying migration...')
        console.log(migrationSql)

        await sql.unsafe(migrationSql)

        console.log('✅ Migration applied successfully!')
    } catch (error) {
        console.error('❌ Error applying migration:', error)
        process.exit(1)
    } finally {
        await sql.end()
    }
}

applyMigration()
