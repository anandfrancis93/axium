/**
 * Confidence Calibration System
 *
 * Measures how well learners can assess their own knowledge
 * Rewards well-calibrated confidence, penalizes over/under-confidence
 */

import { ConfidenceCalibration } from './types'

/**
 * Evaluate confidence calibration for a single response
 *
 * @param confidenceLevel User's stated confidence (1-5)
 *   1 = Just guessing (20% confidence)
 *   2 = Not very confident (40% confidence)
 *   3 = Somewhat confident (60% confidence)
 *   4 = Confident (80% confidence)
 *   5 = Very confident (100% confidence)
 * @param wasCorrect Whether the answer was correct
 */
export function evaluateConfidenceCalibration(
  confidenceLevel: number,
  wasCorrect: boolean
): ConfidenceCalibration {
  // Validate confidence level
  if (confidenceLevel < 1 || confidenceLevel > 5) {
    throw new Error('Confidence level must be between 1 and 5')
  }

  // Convert confidence level to probability (0-1)
  const confidenceProbability = confidenceLevel / 5

  // Actual correctness (0 or 1)
  const actualCorrectness = wasCorrect ? 1 : 0

  // Calculate calibration error (absolute difference)
  const calibrationError = Math.abs(confidenceProbability - actualCorrectness)

  // Determine if well calibrated (error < 0.2)
  const isWellCalibrated = calibrationError <= 0.2

  // Generate feedback
  const feedback = generateCalibrationFeedback(confidenceLevel, wasCorrect, calibrationError)

  return {
    confidenceLevel,
    wasCorrect,
    isWellCalibrated,
    calibrationError,
    feedback
  }
}

/**
 * Generate feedback message for confidence calibration
 */
function generateCalibrationFeedback(
  confidenceLevel: number,
  wasCorrect: boolean,
  calibrationError: number
): string {
  if (wasCorrect && confidenceLevel === 5) {
    return 'Perfect! You were very confident and got it right. 🎯'
  }

  if (wasCorrect && confidenceLevel >= 4) {
    return 'Well calibrated! Your confidence matched your performance. ✅'
  }

  if (wasCorrect && confidenceLevel <= 2) {
    return 'You got it right but were not confident. This suggests you know more than you think! Try to build confidence in areas you actually understand. 📈'
  }

  if (!wasCorrect && confidenceLevel >= 4) {
    return 'Overconfident. You were very sure but got it wrong. This indicates a gap between perceived and actual knowledge. Review this topic carefully. ⚠️'
  }

  if (!wasCorrect && confidenceLevel <= 2) {
    return 'You correctly identified that you were uncertain. This shows good self-awareness. Focus on learning this concept. 💡'
  }

  if (calibrationError <= 0.2) {
    return 'Good calibration! Your confidence level matched your actual performance. Keep it up! ✨'
  }

  return 'Your confidence and performance don\'t quite match. Try to assess your knowledge more accurately. 🎓'
}

/**
 * Calculate overall confidence calibration error
 *
 * Aggregates calibration across multiple responses
 * Returns value between 0 (perfect calibration) and 1 (worst calibration)
 */
export function calculateOverallCalibrationError(
  responses: { confidenceLevel: number; wasCorrect: boolean }[]
): number {
  if (responses.length === 0) return 0

  const errors = responses.map(r =>
    evaluateConfidenceCalibration(r.confidenceLevel, r.wasCorrect).calibrationError
  )

  const totalError = errors.reduce((sum, e) => sum + e, 0)
  return totalError / errors.length
}

/**
 * Calculate Brier score (proper scoring rule for calibration)
 *
 * Lower is better. Perfect calibration = 0, worst = 1
 */
export function calculateBrierScore(
  responses: { confidenceLevel: number; wasCorrect: boolean }[]
): number {
  if (responses.length === 0) return 0

  const brierScores = responses.map(r => {
    const forecast = r.confidenceLevel / 5 // Convert to probability
    const outcome = r.wasCorrect ? 1 : 0
    return Math.pow(forecast - outcome, 2)
  })

  return brierScores.reduce((sum, score) => sum + score, 0) / brierScores.length
}

/**
 * Detect confidence bias
 *
 * Returns:
 * - 'overconfident' if consistently more confident than correct
 * - 'underconfident' if consistently less confident than correct
 * - 'well_calibrated' if confidence matches performance
 */
export function detectConfidenceBias(
  responses: { confidenceLevel: number; wasCorrect: boolean }[]
): {
  bias: 'overconfident' | 'underconfident' | 'well_calibrated'
  magnitude: number // How severe (0-1)
  recommendation: string
} {
  if (responses.length === 0) {
    return {
      bias: 'well_calibrated',
      magnitude: 0,
      recommendation: 'Not enough data yet'
    }
  }

  // Calculate average confidence and average accuracy
  const avgConfidence = responses.reduce((sum, r) => sum + r.confidenceLevel / 5, 0) / responses.length
  const avgAccuracy = responses.filter(r => r.wasCorrect).length / responses.length

  const difference = avgConfidence - avgAccuracy
  const magnitude = Math.abs(difference)

  if (magnitude < 0.1) {
    return {
      bias: 'well_calibrated',
      magnitude,
      recommendation: 'Your confidence levels are well aligned with your actual performance. Keep it up!'
    }
  }

  if (difference > 0.1) {
    return {
      bias: 'overconfident',
      magnitude,
      recommendation: `You tend to be ${(magnitude * 100).toFixed(0)}% more confident than your actual performance. Try to be more critical when assessing your knowledge.`
    }
  }

  return {
    bias: 'underconfident',
    magnitude,
    recommendation: `You tend to be ${(magnitude * 100).toFixed(0)}% less confident than your actual performance. You know more than you give yourself credit for! Build confidence in your abilities.`
  }
}

/**
 * Calculate confidence calibration reward/penalty
 *
 * Returns a value between -1 and 1:
 * - Positive reward for well-calibrated confidence
 * - Penalty for poor calibration
 * - Larger penalty for overconfidence on incorrect answers
 */
export function calculateCalibrationReward(
  confidenceLevel: number,
  wasCorrect: boolean
): number {
  const calibration = evaluateConfidenceCalibration(confidenceLevel, wasCorrect)
  const error = calibration.calibrationError

  if (error <= 0.1) {
    // Excellent calibration
    return 0.5
  } else if (error <= 0.2) {
    // Good calibration
    return 0.3
  } else if (error <= 0.3) {
    // Moderate calibration
    return 0
  } else if (wasCorrect && confidenceLevel <= 2) {
    // Underconfident but correct (minor penalty)
    return -0.2
  } else if (!wasCorrect && confidenceLevel >= 4) {
    // Overconfident and wrong (major penalty)
    return -0.8
  } else {
    // Poor calibration
    return -0.4
  }
}

/**
 * Generate calibration improvement suggestions
 */
export function getCalibrationImprovementSuggestions(
  responses: { confidenceLevel: number; wasCorrect: boolean }[]
): string[] {
  const bias = detectConfidenceBias(responses)
  const brierScore = calculateBrierScore(responses)
  const suggestions: string[] = []

  if (brierScore > 0.3) {
    suggestions.push('Practice metacognition: Before answering, explicitly think about what you know and don\'t know.')
  }

  if (bias.bias === 'overconfident') {
    suggestions.push('When feeling very confident, double-check your reasoning. Ask yourself: "What could I be missing?"')
    suggestions.push('Use lower confidence levels (3-4) more often, reserving 5 for topics you\'ve recently reviewed and verified.')
  }

  if (bias.bias === 'underconfident') {
    suggestions.push('Give yourself credit for what you know. If you can explain the reasoning, use confidence 4-5.')
    suggestions.push('After getting questions right with low confidence, review why you knew the answer. This builds accurate confidence.')
  }

  // Check for specific patterns
  const overconfidentWrong = responses.filter(r => !r.wasCorrect && r.confidenceLevel >= 4).length
  const underconfidentRight = responses.filter(r => r.wasCorrect && r.confidenceLevel <= 2).length

  if (overconfidentWrong > responses.length * 0.2) {
    suggestions.push(`You've been overconfident on ${overconfidentWrong} incorrect answers. Take time to verify your understanding before committing to high confidence.`)
  }

  if (underconfidentRight > responses.length * 0.2) {
    suggestions.push(`You've been underconfident on ${underconfidentRight} correct answers. Trust your knowledge more when you can explain the reasoning.`)
  }

  if (suggestions.length === 0) {
    suggestions.push('Your calibration is improving! Continue being mindful of the difference between guessing, knowing, and being certain.')
  }

  return suggestions
}

/**
 * Calibration curve data for visualization
 *
 * Groups responses by confidence level and calculates actual accuracy
 * Perfect calibration: confidence = accuracy for all levels
 */
export function getCalibrationCurve(
  responses: { confidenceLevel: number; wasCorrect: boolean }[]
): { confidenceLevel: number; expectedAccuracy: number; actualAccuracy: number; count: number }[] {
  const curve = []

  for (let level = 1; level <= 5; level++) {
    const responsesAtLevel = responses.filter(r => r.confidenceLevel === level)

    if (responsesAtLevel.length === 0) {
      curve.push({
        confidenceLevel: level,
        expectedAccuracy: level / 5,
        actualAccuracy: 0,
        count: 0
      })
      continue
    }

    const correctCount = responsesAtLevel.filter(r => r.wasCorrect).length
    const actualAccuracy = correctCount / responsesAtLevel.length

    curve.push({
      confidenceLevel: level,
      expectedAccuracy: level / 5,
      actualAccuracy,
      count: responsesAtLevel.length
    })
  }

  return curve
}
