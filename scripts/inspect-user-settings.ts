
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

async function inspectUserSettings() {
    try {
        // Check columns of user_settings
        const columns = await sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'user_settings';
        `
        console.log('Columns in user_settings:')
        columns.forEach((c: any) => console.log(`- ${c.column_name} (${c.data_type})`))

        // Check content
        const rows = await sql`SELECT * FROM user_settings LIMIT 5`
        console.log('Sample data:', rows)

        await sql.end()
    } catch (e) {
        console.error('Error inspecting user_settings:', e)
    }
}

inspectUserSettings()
