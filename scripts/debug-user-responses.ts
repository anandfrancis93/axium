
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

import fs from 'fs'
import path from 'path'

const envPath = path.resolve(process.cwd(), '.env.local')
console.log('Loading env from:', envPath)
console.log('File exists:', fs.existsSync(envPath))

// Load environment variables from .env.local
dotenv.config({ path: envPath })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
// Try Service Role Key first, then Anon Key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Environment Check:')
console.log('URL:', supabaseUrl ? 'Found' : 'Missing')
console.log('Service Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Found' : 'Missing')
console.log('Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Found' : 'Missing')
console.log('Using Key:', supabaseKey ? (supabaseKey === process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Service Role' : 'Anon') : 'None')

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
    console.log('\nDebugging User Responses...')

    // Fetch recent responses
    const { data: responses, error } = await supabase
        .from('user_responses')
        .select('user_id, topic_id, is_correct, calibration_score, created_at')
        .order('created_at', { ascending: false })
        .limit(50)

    if (error) {
        console.error('Error fetching responses:', error)
        return
    }

    if (!responses || responses.length === 0) {
        console.log('No responses found.')
        return
    }

    console.log(`Found ${responses.length} recent responses.`)

    // Group by Topic
    const byTopic: Record<string, any[]> = {}
    responses.forEach(r => {
        if (!byTopic[r.topic_id]) byTopic[r.topic_id] = []
        byTopic[r.topic_id].push(r)
    })

    Object.entries(byTopic).forEach(([topicId, topicResponses]) => {
        console.log(`\nTopic: ${topicId}`)
        console.log(`Count: ${topicResponses.length}`)
        console.log('Recent 5:')
        topicResponses.slice(0, 5).forEach((r: any) => {
            console.log(`  - ${r.created_at}: Correct=${r.is_correct}, Score=${r.calibration_score}`)
        })
    })
}

main()
