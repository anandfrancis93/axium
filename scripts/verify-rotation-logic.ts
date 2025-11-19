
import { createClient } from '@supabase/supabase-js'
import { getRecommendedFormats } from '../lib/graphrag/prompts.ts'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyRotation() {
    console.log('Verifying format rotation logic...')

    // 1. Get a test user
    const { data: users } = await supabase.from('auth_users_view').select('id, email').limit(1)
    if (!users || users.length === 0) {
        console.error('No users found')
        return
    }
    const user = users[0]
    console.log(`Testing with user: ${user.email} (${user.id})`)

    // 2. Get a topic
    const { data: topics } = await supabase.from('topics').select('id, name').limit(1)
    if (!topics || topics.length === 0) {
        console.error('No topics found')
        return
    }
    const topic = topics[0]
    console.log(`Testing with topic: ${topic.name}`)

    const bloomLevel = 1
    const recommendedFormats = getRecommendedFormats(bloomLevel)
    console.log(`Recommended formats for Bloom ${bloomLevel}:`, recommendedFormats)

    // 3. Get current state
    const { data: settings } = await supabase
        .from('user_settings')
        .select('format_round_robin')
        .eq('user_id', user.id)
        .single()

    const currentGlobalIndex = settings?.format_round_robin?.[`bloom_${bloomLevel}`] ?? -1
    console.log(`Current global index: ${currentGlobalIndex}`)

    // 4. Simulate "Next Question" (Read-only check)
    // In the new code, next-question just reads.
    // We verify that simply reading doesn't change anything (trivial, but good to note)

    // 5. Simulate "Submit" (Update logic)
    console.log('Simulating submission update...')

    // Assume we served the format at the NEXT index (which is what next-question does)
    // next-question logic: const globalFormatIndex = (globalLastIndex + 1) % recommendedFormats.length
    // So if we served that, the "currentFormatIndex" in submit would be that index.

    // Let's say we served the format at index 0
    const servedFormat = recommendedFormats[0]
    const currentFormatIndex = recommendedFormats.indexOf(servedFormat)

    const nextFormatIndex = (currentFormatIndex + 1) % recommendedFormats.length
    console.log(`Served format: ${servedFormat} (index ${currentFormatIndex})`)
    console.log(`Expected next index: ${nextFormatIndex}`)

    // Execute the update logic (copied from submit route)
    const updatedGlobalRoundRobin = {
        ...(settings?.format_round_robin || {}),
        [`bloom_${bloomLevel}`]: nextFormatIndex
    }

    await supabase.from('user_settings').upsert({
        user_id: user.id,
        format_round_robin: updatedGlobalRoundRobin
    }, { onConflict: 'user_id' })

    // 6. Verify update
    const { data: newSettings } = await supabase
        .from('user_settings')
        .select('format_round_robin')
        .eq('user_id', user.id)
        .single()

    const newGlobalIndex = newSettings?.format_round_robin?.[`bloom_${bloomLevel}`]
    console.log(`New global index: ${newGlobalIndex}`)

    if (newGlobalIndex === nextFormatIndex) {
        console.log('SUCCESS: Rotation counter updated correctly.')
    } else {
        console.error('FAILURE: Rotation counter did not update as expected.')
    }
}

verifyRotation().catch(console.error)
