import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Configuration
const MAX_HISTORY_ITEMS = 20 // Look at last 20 responses for trend analysis

interface MetricResult {
    slope: number
    stdDev: number
    rSquared: number
    mean: number
    count: number
}

/**
 * Calculate Linear Regression Slope and Standard Deviation
 */
function calculateMetrics(scores: number[]): MetricResult {
    const n = scores.length
    if (n < 2) {
        return { slope: 0, stdDev: 0, rSquared: 0, mean: n === 1 ? scores[0] : 0, count: n }
    }

    // 1. Calculate Mean and Standard Deviation
    const sum = scores.reduce((a, b) => a + b, 0)
    const mean = sum / n

    const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n
    const stdDev = Math.sqrt(variance)

    // 2. Calculate Linear Regression (Least Squares)
    // x = index (0, 1, 2...), y = score
    let sumX = 0
    let sumY = 0
    let sumXY = 0
    let sumXX = 0

    for (let i = 0; i < n; i++) {
        const x = i
        const y = scores[i]

        sumX += x
        sumY += y
        sumXY += x * y
        sumXX += x * x
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    // 3. Calculate R-Squared (Coefficient of Determination)
    // SS_res = sum((y_i - (mx_i + c))^2)
    // SS_tot = sum((y_i - mean_y)^2)
    let ssRes = 0
    let ssTot = 0

    for (let i = 0; i < n; i++) {
        const x = i
        const y = scores[i]
        const predictedY = slope * x + intercept

        ssRes += Math.pow(y - predictedY, 2)
        ssTot += Math.pow(y - mean, 2)
    }

    const rSquared = ssTot === 0 ? 0 : 1 - (ssRes / ssTot)

    return {
        slope,
        stdDev,
        rSquared,
        mean,
        count: n
    }
}

export async function GET(request: NextRequest) {
    // 1. Security Check
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    try {
        // 2. Get all active user-topic pairs from user_progress
        const { data: progressRecords, error: progressError } = await supabase
            .from('user_progress')
            .select('user_id, topic_id')

        if (progressError) {
            throw new Error(`Error fetching user_progress: ${progressError.message}`)
        }

        if (!progressRecords || progressRecords.length === 0) {
            return NextResponse.json({ message: 'No user progress records found', updated: 0 })
        }

        let updatedCount = 0

        for (const record of progressRecords) {
            const { user_id, topic_id } = record

            // 3. Fetch recent responses for this user & topic
            const { data: responses, error: responseError } = await supabase
                .from('user_responses')
                .select('calibration_score, is_correct, created_at')
                .eq('user_id', user_id)
                .eq('topic_id', topic_id)
                .order('created_at', { ascending: false })
                .limit(MAX_HISTORY_ITEMS)

            if (responseError) {
                console.error(`Error fetching responses for user ${user_id} topic ${topic_id}:`, responseError)
                continue
            }

            if (!responses || responses.length === 0) {
                continue
            }

            // Reverse to get chronological order (oldest -> newest)
            const chronologicalResponses = responses.reverse()

            // Extract scores
            const scores = chronologicalResponses.map(r => {
                if (r.calibration_score !== null) return Number(r.calibration_score)
                return r.is_correct ? 1.0 : -1.0
            })

            // 4. Calculate Metrics
            const metrics = calculateMetrics(scores)

            // 5. Update user_progress
            const { error: updateError } = await supabase
                .from('user_progress')
                .update({
                    calibration_mean: metrics.mean,
                    calibration_stddev: metrics.stdDev,
                    calibration_slope: metrics.slope,
                    calibration_r_squared: metrics.rSquared,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', user_id)
                .eq('topic_id', topic_id)

            if (updateError) {
                console.error(`Failed to update metrics for user ${user_id} topic ${topic_id}:`, updateError)
            } else {
                updatedCount++
            }
        }

        return NextResponse.json({
            message: 'Performance metrics recalculated successfully',
            updated: updatedCount
        })

    } catch (error: any) {
        console.error('Error in recalculate-metrics cron:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
