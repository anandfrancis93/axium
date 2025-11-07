/**
 * Exam Score Prediction - Map theta to CompTIA exam scale
 *
 * CompTIA Security+ uses a scale of 100-900 with passing score of 750
 */

/**
 * Normal cumulative distribution function (CDF)
 */
function normalCDF(x: number, mean: number, sd: number): number {
  const z = (x - mean) / sd

  // Approximation using error function
  // CDF(z) = 0.5 * (1 + erf(z / sqrt(2)))
  const t = 1 / (1 + 0.2316419 * Math.abs(z))
  const d = 0.3989423 * Math.exp(-z * z / 2)
  const prob =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))))

  return z > 0 ? 1 - prob : prob
}

/**
 * Convert theta to CompTIA exam score (100-900 scale)
 *
 * Uses percentile-based transformation for more realistic scoring
 * Assumption: Passing score (750) ≈ 50th percentile (θ = 0)
 */
export function thetaToExamScore(theta: number): number {
  // Clamp theta to reasonable range
  const clampedTheta = Math.max(-3, Math.min(3, theta))

  // Convert to percentile using normal CDF
  const percentile = normalCDF(clampedTheta, 0, 1)

  // Map to exam scale (100-900)
  // We want θ=0 to map to ~750 (passing), so we adjust the formula
  // Linear mapping: score = 100 + percentile * 800
  const score = 100 + percentile * 800

  return Math.round(score)
}

/**
 * Convert exam score back to theta (inverse mapping)
 */
export function examScoreToTheta(score: number): number {
  // Clamp score to valid range
  const clampedScore = Math.max(100, Math.min(900, score))

  // Convert to percentile
  const percentile = (clampedScore - 100) / 800

  // Inverse normal CDF (approximation)
  // For theta at given percentile
  if (percentile <= 0) return -3
  if (percentile >= 1) return 3

  // Simple approximation using probit function
  // For more accuracy, use a proper inverse CDF library
  let theta = 0
  let low = -3
  let high = 3

  // Binary search
  for (let i = 0; i < 20; i++) {
    theta = (low + high) / 2
    const p = normalCDF(theta, 0, 1)

    if (p < percentile) {
      low = theta
    } else {
      high = theta
    }
  }

  return theta
}

/**
 * Calculate confidence interval for exam score
 */
export function calculateScoreConfidenceInterval(
  theta: number,
  standardError: number,
  confidenceLevel: number = 0.95
): { lower: number; upper: number } {
  // Z-scores for common confidence levels
  const zScores: Record<number, number> = {
    0.68: 1.00,  // ±1 SD
    0.90: 1.645,
    0.95: 1.96,
    0.99: 2.576
  }

  const z = zScores[confidenceLevel] || 1.96

  const lowerTheta = theta - z * standardError
  const upperTheta = theta + z * standardError

  return {
    lower: thetaToExamScore(lowerTheta),
    upper: thetaToExamScore(upperTheta)
  }
}

/**
 * Calculate probability of passing the exam (score ≥ 750)
 */
export function calculatePassProbability(
  theta: number,
  standardError: number,
  passingScore: number = 750
): number {
  // Convert passing score to theta
  const passingTheta = examScoreToTheta(passingScore)

  // Calculate z-score
  const z = (theta - passingTheta) / standardError

  // Probability of being above passing threshold
  return normalCDF(z, 0, 1)
}

/**
 * Get interpretation message for predicted score
 */
export function getScoreInterpretation(
  predictedScore: number,
  passProbability: number,
  responsesCount: number
): string {
  const isPassing = predictedScore >= 750
  const highConfidence = responsesCount >= 50

  if (!highConfidence) {
    return `Early estimate based on ${responsesCount} questions. Answer 50+ for reliable prediction.`
  }

  if (isPassing) {
    if (passProbability >= 0.95) {
      return 'Excellent! Very high confidence you will pass.'
    } else if (passProbability >= 0.80) {
      return 'Strong prediction - You are likely ready to pass.'
    } else if (passProbability >= 0.60) {
      return 'Good progress - Continue studying to increase confidence.'
    } else {
      return 'Borderline - Review weak topics before exam.'
    }
  } else {
    if (passProbability < 0.20) {
      return 'Keep studying - You need more preparation.'
    } else if (passProbability < 0.40) {
      return 'Not ready yet - Focus on weak areas.'
    } else {
      return 'Close to passing - A bit more study needed.'
    }
  }
}

/**
 * Calculate reliability of the estimate
 *
 * Based on test information - how precisely we can estimate ability
 */
export function calculateReliability(information: number): number {
  // Reliability = 1 - (error variance / total variance)
  // Total variance assumed to be 1 (standardized theta scale)
  const errorVariance = 1 / information
  const reliability = Math.max(0, Math.min(1, 1 - errorVariance))

  return reliability
}
