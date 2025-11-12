/**
 * Mastery Calculation Utilities
 *
 * Handles mastery-related helper functions for the RL system.
 * Note: We now use accuracy-based mastery (high-confidence correct/total per dimension)
 * rather than progressive mastery updates.
 */

/**
 * Check if a topic at a Bloom level has met mastery requirements
 * to unlock the next Bloom level
 *
 * @param masteryScore - Current mastery score (0-100)
 * @param questionsCorrect - Number of correct answers
 * @param threshold - Mastery threshold (default 80%)
 * @param minCorrect - Minimum correct answers required (default 3)
 * @returns True if requirements are met
 */
export function hasMetMasteryRequirements(
  masteryScore: number,
  questionsCorrect: number,
  threshold: number = 80,
  minCorrect: number = 3
): boolean {
  return masteryScore >= threshold && questionsCorrect >= minCorrect
}

/**
 * Calculate confidence calibration score
 * Measures how well user's confidence predicts correctness
 *
 * @param responses - Array of { isCorrect, confidence } pairs
 * @returns Calibration score (0-100, higher is better)
 */
export function calculateConfidenceCalibration(
  responses: Array<{ isCorrect: boolean; confidence: number }>
): number {
  if (responses.length === 0) return 0

  let calibrationSum = 0

  responses.forEach(({ isCorrect, confidence }) => {
    // Perfect calibration examples:
    // - Correct + High confidence (3) → good
    // - Incorrect + Low confidence (1) → good (aware of uncertainty)
    // - Correct + Low confidence (1) → poor (underconfident)
    // - Incorrect + High confidence (3) → poor (overconfident)

    if (isCorrect && confidence >= 3) {
      calibrationSum += 1.0  // Perfect: correct and confident
    } else if (isCorrect && confidence === 2) {
      calibrationSum += 0.7  // Good: correct but moderate confidence
    } else if (isCorrect && confidence <= 1) {
      calibrationSum += 0.3  // Poor: correct but not confident (underconfident)
    } else if (!isCorrect && confidence <= 1) {
      calibrationSum += 0.6  // Good: incorrect and uncertain (aware of gap)
    } else if (!isCorrect && confidence === 2) {
      calibrationSum += 0.3  // Poor: incorrect but moderately confident
    } else if (!isCorrect && confidence >= 3) {
      calibrationSum += 0.0  // Very poor: incorrect but very confident (overconfident)
    }
  })

  return (calibrationSum / responses.length) * 100
}

/**
 * Calculate days since last practice
 *
 * @param lastPracticedAt - ISO timestamp of last practice
 * @returns Number of days since last practice
 */
export function getDaysSinceLastPractice(lastPracticedAt: string | null): number {
  if (!lastPracticedAt) return 0 // Never practiced - no spacing benefit

  const lastPracticed = new Date(lastPracticedAt)
  const now = new Date()
  const diffMs = now.getTime() - lastPracticed.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)

  return Math.floor(diffDays)
}
