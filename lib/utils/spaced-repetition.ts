/**
 * Spaced Repetition Utilities
 *
 * Calculates next review date based on calibration score (-1.5 to +1.5)
 */

/**
 * Calculate next review date based on calibration score
 *
 * Calibration Score → Interval Mapping:
 * - -1.5 to -1.0: 4 hours (very poor calibration)
 * - -1.0 to -0.5: 12 hours
 * - -0.5 to 0.0:  1 day
 * -  0.0 to 0.5:  2 days
 * -  0.5 to 1.0:  4 days
 * -  1.0 to 1.5:  7 days
 *
 * @param calibrationScore - Score from -1.5 to +1.5
 * @returns Date object for next review
 */
export function calculateNextReviewDate(calibrationScore: number): Date {
  const now = new Date()
  let hoursToAdd: number

  // Clamp calibration score to valid range
  const score = Math.max(-1.5, Math.min(1.5, calibrationScore))

  if (score >= 1.0 && score <= 1.5) {
    hoursToAdd = 7 * 24 // 7 days
  } else if (score >= 0.5 && score < 1.0) {
    hoursToAdd = 4 * 24 // 4 days
  } else if (score >= 0.0 && score < 0.5) {
    hoursToAdd = 2 * 24 // 2 days
  } else if (score >= -0.5 && score < 0.0) {
    hoursToAdd = 1 * 24 // 1 day
  } else if (score >= -1.0 && score < -0.5) {
    hoursToAdd = 12 // 12 hours
  } else { // score >= -1.5 && score < -1.0
    hoursToAdd = 4 // 4 hours
  }

  const nextReviewDate = new Date(now.getTime() + hoursToAdd * 60 * 60 * 1000)
  return nextReviewDate
}

/**
 * Check if a question is due for review
 *
 * @param nextReviewDate - The scheduled review date
 * @returns true if the question is due for review
 */
export function isQuestionDue(nextReviewDate: string | Date | null): boolean {
  if (!nextReviewDate) return false

  const reviewDate = typeof nextReviewDate === 'string'
    ? new Date(nextReviewDate)
    : nextReviewDate

  return reviewDate <= new Date()
}

/**
 * Get interval description for UI display
 *
 * @param calibrationScore - Score from -1.5 to +1.5
 * @returns Human-readable interval description
 */
export function getReviewIntervalDescription(calibrationScore: number): string {
  const score = Math.max(-1.5, Math.min(1.5, calibrationScore))

  if (score >= 1.0) return '7 days'
  if (score >= 0.5) return '4 days'
  if (score >= 0.0) return '2 days'
  if (score >= -0.5) return '1 day'
  if (score >= -1.0) return '12 hours'
  return '4 hours'
}

/**
 * Format time until review for UI display
 * Single source of truth for consistent time formatting across pages
 *
 * @param nextReviewDate - The scheduled review date (string or Date)
 * @returns Human-readable time until review (e.g., "Due now", "In 2 hours", "In 3 days")
 */
export function formatTimeUntilReview(nextReviewDate: string | Date): string {
  const reviewDate = typeof nextReviewDate === 'string'
    ? new Date(nextReviewDate)
    : nextReviewDate
  const now = new Date()
  const timeDiff = reviewDate.getTime() - now.getTime()

  // If overdue or due now (within 1 minute)
  if (timeDiff <= 60 * 1000) {
    return 'Due now'
  }

  const hoursUntil = timeDiff / (1000 * 60 * 60)

  if (hoursUntil < 1) {
    const minutesUntil = Math.ceil(timeDiff / (1000 * 60))
    return `In ${minutesUntil} ${minutesUntil === 1 ? 'minute' : 'minutes'}`
  } else if (hoursUntil < 24) {
    const hours = Math.ceil(hoursUntil)
    return `In ${hours} ${hours === 1 ? 'hour' : 'hours'}`
  } else {
    const days = Math.ceil(hoursUntil / 24)
    return `In ${days} ${days === 1 ? 'day' : 'days'}`
  }
}
