
export interface MetricResult {
    slope: number
    stdDev: number
    rSquared: number
    mean: number
    count: number
}

/**
 * Calculate Linear Regression Slope and Standard Deviation
 */
export function calculateMetrics(scores: number[]): MetricResult {
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
