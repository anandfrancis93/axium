/**
 * Spaced Repetition Utilities
 *
 * Calculates next review date based on calibration score
 * Each of the 18 unique normalized scores (0-1) maps to a unique interval
 */

import { normalizeCalibration } from './calibration'

/**
 * Interval mapping for each unique normalized calibration score
 * Maps normalized score (0-1) to hours until next review
 *
 * 18 unique scores from the calibration matrix:
 * - 0.00 (worst) → 4 hours
 * - 1.00 (best)  → 14 days (336 hours)
 */
const INTERVAL_MAP: { threshold: number; hours: number }[] = [
  { threshold: 0.00, hours: 4 },      // 4 hours
  { threshold: 0.10, hours: 6 },      // 6 hours
  { threshold: 0.17, hours: 8 },      // 8 hours
  { threshold: 0.23, hours: 12 },     // 12 hours
  { threshold: 0.30, hours: 16 },     // 16 hours
  { threshold: 0.33, hours: 20 },     // 20 hours
  { threshold: 0.37, hours: 24 },     // 1 day
  { threshold: 0.40, hours: 36 },     // 1.5 days
  { threshold: 0.43, hours: 48 },     // 2 days
  { threshold: 0.60, hours: 72 },     // 3 days
  { threshold: 0.63, hours: 96 },     // 4 days
  { threshold: 0.67, hours: 120 },    // 5 days
  { threshold: 0.73, hours: 144 },    // 6 days
  { threshold: 0.77, hours: 168 },    // 1 week
  { threshold: 0.80, hours: 192 },    // 8 days
  { threshold: 0.83, hours: 240 },    // 10 days
  { threshold: 0.90, hours: 288 },    // 12 days
  { threshold: 1.00, hours: 336 },    // 2 weeks
]

/**
 * Calculate next review date based on calibration score
 *
 * @param calibrationScore - Raw score from -1.5 to +1.5
 * @returns Date object for next review
 */
export function calculateNextReviewDate(calibrationScore: number): Date {
  const now = new Date()
  const normalized = normalizeCalibration(calibrationScore)

  // Find the appropriate interval by finding the highest threshold <= normalized score
  let hoursToAdd = INTERVAL_MAP[0].hours // Default to minimum

  for (const entry of INTERVAL_MAP) {
    if (normalized >= entry.threshold) {
      hoursToAdd = entry.hours
    } else {
      break
    }
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
 * @param calibrationScore - Raw score from -1.5 to +1.5
 * @returns Human-readable interval description
 */
export function getReviewIntervalDescription(calibrationScore: number): string {
  const normalized = normalizeCalibration(calibrationScore)

  // Find the appropriate interval
  let hours = INTERVAL_MAP[0].hours

  for (const entry of INTERVAL_MAP) {
    if (normalized >= entry.threshold) {
      hours = entry.hours
    } else {
      break
    }
  }

  // Convert hours to human-readable format
  if (hours < 24) {
    return `${hours} hours`
  } else if (hours === 24) {
    return '1 day'
  } else if (hours < 168) {
    const days = hours / 24
    return days % 1 === 0 ? `${days} days` : `${days.toFixed(1)} days`
  } else if (hours === 168) {
    return '1 week'
  } else {
    const days = hours / 24
    return `${Math.round(days)} days`
  }
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
