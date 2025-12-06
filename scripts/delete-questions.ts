import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
    // Count current questions
    const { count } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })

    console.log(`Current question count: ${count}`)

    // Delete all questions
    const { error } = await supabase
        .from('questions')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all rows

    if (error) {
        console.error('Delete error:', error)
    } else {
        console.log('✅ Deleted all questions')
    }
}

main().catch(console.error)
