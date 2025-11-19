
import dotenv from 'dotenv'
const postgres = require('postgres')

// Load environment variables
dotenv.config({ path: '.env.local' })

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL

if (!connectionString) {
    console.error('Missing DATABASE_URL')
    process.exit(1)
}

const sql = postgres(connectionString)

async function listTables() {
    try {
        const tables = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `

        console.log('Tables in database:')
        tables.forEach((t: any) => console.log(`- ${t.table_name}`))

        await sql.end()
    } catch (e) {
        console.error('Error listing tables:', e)
    }
}

listTables()
