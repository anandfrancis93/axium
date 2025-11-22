
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { calculateMetrics } from '../lib/analytics'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env.local')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixStaleGlobalProgress() {
    console.log('Starting global progress repair...')

    // Get all users
    const { data: users, error: userError } = await supabase.auth.admin.listUsers({ perPage: 100 })

    if (userError) {
        console.error('Error fetching users:', userError)
        return
    }

    if (!users || users.users.length === 0) {
        console.log('No users found.')
        return
    }

    console.log(`Found ${users.users.length} users. Checking consistency...`)

    for (const user of users.users) {
        console.log(`\nProcessing User: ${user.email} (${user.id})`)

        // 1. Fetch actual responses
        const { data: responses, error: responseError } = await supabase
            .from('user_responses')
            .select('calibration_score, is_correct, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false }) // Newest first

        if (responseError) {
            console.error(`Error fetching responses for user ${user.id}:`, responseError.message)
            continue
        }

        const responseCount = responses?.length || 0
        console.log(`- Actual responses found: ${responseCount}`)

        // 2. Calculate expected metrics
        let expectedMetrics = {
            mean: 0,
            stdDev: 0,
            slope: 0,
            rSquared: 0,
            count: 0
        }

        if (responseCount > 0) {
            // Reverse to chronological order (Oldest -> Newest) for slope calculation
            const chronologicalResponses = [...responses].reverse()

            const scores = chronologicalResponses.map((r: any) => {
                if (r.calibration_score !== null) return Number(r.calibration_score)
                return r.is_correct ? 1.0 : -1.0
            })

            expectedMetrics = calculateMetrics(scores)
        }

        console.log(`- Expected metrics: Mean=${expectedMetrics.mean.toFixed(2)}, Count=${expectedMetrics.count}`)

        // 3. Fetch current global progress
        const { data: currentGlobal, error: globalError } = await supabase
            .from('user_global_progress')
            .select('*')
            .eq('user_id', user.id)
            .single()

        if (globalError && globalError.code !== 'PGRST116') {
            console.error(`Error fetching global progress for user ${user.id}:`, globalError.message)
            continue
        }

        // 4. Compare and Update if needed
        const currentCount = currentGlobal?.total_responses_analyzed || 0
        const currentMean = currentGlobal?.calibration_mean || 0

        // Simple check: if counts differ or if count is 0 but mean is not 0
        const needsUpdate =
            currentCount !== expectedMetrics.count ||
            (expectedMetrics.count === 0 && currentMean !== 0) ||
            Math.abs(currentMean - expectedMetrics.mean) > 0.01

        if (needsUpdate) {
            console.log(`- MISMATCH DETECTED! Current: Count=${currentCount}, Mean=${currentMean}`)
            console.log(`- Updating to match actual data...`)

            const { error: updateError } = await supabase
                .from('user_global_progress')
                .upsert({
                    user_id: user.id,
                    calibration_mean: expectedMetrics.mean,
                    calibration_stddev: expectedMetrics.stdDev,
                    calibration_slope: expectedMetrics.slope,
                    calibration_r_squared: expectedMetrics.rSquared,
                    total_responses_analyzed: expectedMetrics.count,
                    last_updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' })

            if (updateError) {
                console.error(`Failed to update global progress for user ${user.id}:`, updateError.message)
            } else {
                console.log(`- ✅ Successfully updated global progress.`)
            }
        } else {
            console.log(`- Data is consistent. No changes needed.`)
        }
    }
}

fixStaleGlobalProgress().catch(console.error)
