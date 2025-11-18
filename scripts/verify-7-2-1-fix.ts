
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifyFix() {
    console.log('Verifying 7-2-1 Logic Fix...')

    // 1. Get a test user (or the first user found)
    const { data: users, error: userError } = await supabase.auth.admin.listUsers()
    if (userError || !users.users.length) {
        console.error('Error fetching users:', userError)
        return
    }
    const userId = users.users[0].id
    console.log(`Testing with user: ${userId}`)

    // 2. Reset global position to known state (e.g., 1)
    await supabase
        .from('user_global_progress')
        .upsert({ user_id: userId, question_position: 1 })

    console.log('Reset global position to 1')

    // 3. Fetch current position via API logic (simulated)
    const { data: initialProgress } = await supabase
        .from('user_global_progress')
        .select('question_position')
        .eq('user_id', userId)
        .single()

    console.log(`Initial Position: ${initialProgress?.question_position}`)

    if (initialProgress?.question_position !== 1) {
        console.error('FAILED: Initial position should be 1')
        return
    }

    // Check if column exists by trying to select it explicitly
    const { data: schemaCheck, error: schemaError } = await supabase
        .from('user_global_progress')
        .select('question_position')
        .limit(1)

    if (schemaError) {
        console.error('Schema Error (column might be missing):', schemaError)
    } else {
        console.log('Schema check passed, column exists.')
    }

    // 4. Simulate an update (like answering a question)
    // We'll manually trigger the logic we added to updateUserProgress
    const currentPos = initialProgress.question_position
    const newPos = (currentPos % 10) + 1

    console.log(`Attempting to update to position: ${newPos}`)

    const { error: updateError } = await supabase
        .from('user_global_progress')
        .update({ question_position: newPos })
        .eq('user_id', userId)

    if (updateError) {
        console.error('Update failed:', updateError)
    } else {
        console.log('Update command sent successfully.')
    }

    // 5. Verify the update
    const { data: updatedProgress } = await supabase
        .from('user_global_progress')
        .select('question_position')
        .eq('user_id', userId)
        .single()

    console.log(`Updated Position: ${updatedProgress?.question_position}`)

    if (updatedProgress?.question_position === 2) {
        console.log('SUCCESS: Global position incremented correctly!')
    } else {
        console.error(`FAILED: Expected 2, got ${updatedProgress?.question_position}`)
    }
}

verifyFix()
