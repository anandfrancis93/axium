
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env.local')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkProgress() {
    console.log('Checking for leftover user progress data...')

    // Get all users (limit to 5 for brevity)
    const { data: users, error: userError } = await supabase.auth.admin.listUsers({ perPage: 5 })

    if (userError) {
        console.error('Error fetching users:', userError)
        return
    }

    if (!users || users.users.length === 0) {
        console.log('No users found.')
        return
    }

    console.log(`Found ${users.users.length} users. Checking progress for each...`)

    for (const user of users.users) {
        console.log(`\n--- User: ${user.email} (${user.id}) ---`)

        // Check user_progress
        const { count: progressCount, error: progressError } = await supabase
            .from('user_progress')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)

        if (progressError) console.error('Error checking user_progress:', progressError.message)
        else console.log(`user_progress records: ${progressCount}`)

        // Check user_responses
        const { count: responseCount, error: responseError } = await supabase
            .from('user_responses')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)

        if (responseError) console.error('Error checking user_responses:', responseError.message)
        else console.log(`user_responses records: ${responseCount}`)

        // Check user_global_progress
        const { data: globalProgress, error: globalError } = await supabase
            .from('user_global_progress')
            .select('*')
            .eq('user_id', user.id)
            .single()

        if (globalError && globalError.code !== 'PGRST116') { // Ignore "not found" error
            console.error('Error checking user_global_progress:', globalError.message)
        } else if (globalProgress) {
            console.log('user_global_progress:', globalProgress)
        } else {
            console.log('user_global_progress: None')
        }
    }

    // Check questions table (shared)
    console.log('\n--- Shared Data ---')
    const { count: questionsCount, error: questionsError } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })

    if (questionsError) console.error('Error checking questions:', questionsError.message)
    else console.log(`Total questions in database: ${questionsCount}`)

}

checkProgress().catch(console.error)
