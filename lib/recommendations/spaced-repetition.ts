/**
 * Spaced Repetition System (SM-2 Algorithm)
 *
 * Based on SuperMemo SM-2 algorithm with modifications for:
 * - Mastery scores instead of grades
 * - Confidence calibration
 * - Adaptive intervals
 */

import { SpacedRepetitionConfig, SpacedRepetitionItem, TopicPerformance } from './types'

export const DEFAULT_SR_CONFIG: SpacedRepetitionConfig = {
  easeFactor: 2.5,
  minEaseFactor: 1.3,
  firstInterval: 1,
  secondInterval: 6,
  masteryThresholdForAdvancement: 80,
  masteryThresholdForReview: 60
}

/**
 * Calculate next review date for a topic
 *
 * @param item Current spaced repetition state
 * @param performance Latest performance metrics
 * @param config SR configuration
 * @returns Updated SR item
 */
export function calculateNextReview(
  item: SpacedRepetitionItem,
  performance: TopicPerformance,
  config: SpacedRepetitionConfig = DEFAULT_SR_CONFIG
): SpacedRepetitionItem {
  const quality = calculateQuality(performance)
  const newEaseFactor = calculateEaseFactor(item.easeFactor, quality, config)

  let newInterval: number
  let newRepetitions: number

  if (quality < 3) {
    // Failed review, reset
    newInterval = config.firstInterval
    newRepetitions = 0
  } else {
    // Passed review, advance
    newRepetitions = item.repetitions + 1

    if (newRepetitions === 1) {
      newInterval = config.firstInterval
    } else if (newRepetitions === 2) {
      newInterval = config.secondInterval
    } else {
      newInterval = Math.round(item.interval * newEaseFactor)
    }
  }

  const now = new Date()
  const nextReviewDate = new Date(now)
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval)

  return {
    entityId: item.entityId,
    interval: newInterval,
    easeFactor: newEaseFactor,
    repetitions: newRepetitions,
    lastReviewDate: now,
    nextReviewDate,
    masteryScore: performance.masteryScore
  }
}

/**
 * Convert mastery score to SM-2 quality (0-5)
 *
 * Quality scale:
 * 5 - Perfect (100%)
 * 4 - Correct with hesitation (80-99%)
 * 3 - Correct with difficulty (60-79%)
 * 2 - Incorrect but remembered (40-59%)
 * 1 - Incorrect, barely remembered (20-39%)
 * 0 - Complete blackout (0-19%)
 */
function calculateQuality(performance: TopicPerformance): number {
  const mastery = performance.masteryScore

  // Adjust for confidence calibration
  const calibrationPenalty = performance.confidenceCalibrationError * 20
  const adjustedMastery = Math.max(0, mastery - calibrationPenalty)

  if (adjustedMastery >= 95) return 5
  if (adjustedMastery >= 80) return 4
  if (adjustedMastery >= 60) return 3
  if (adjustedMastery >= 40) return 2
  if (adjustedMastery >= 20) return 1
  return 0
}

/**
 * Calculate new ease factor based on quality
 *
 * EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
 */
function calculateEaseFactor(
  currentEF: number,
  quality: number,
  config: SpacedRepetitionConfig
): number {
  const newEF = currentEF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  return Math.max(config.minEaseFactor, newEF)
}

/**
 * Check if a topic is due for review
 */
export function isDueForReview(item: SpacedRepetitionItem, now: Date = new Date()): boolean {
  return now >= item.nextReviewDate
}

/**
 * Get topics due for review
 */
export function getTopicsDueForReview(
  items: SpacedRepetitionItem[],
  now: Date = new Date()
): SpacedRepetitionItem[] {
  return items.filter(item => isDueForReview(item, now))
}

/**
 * Get topics approaching review
 *
 * @param items SR items
 * @param daysAhead How many days ahead to look
 * @param now Current date
 */
export function getUpcomingReviews(
  items: SpacedRepetitionItem[],
  daysAhead: number = 3,
  now: Date = new Date()
): SpacedRepetitionItem[] {
  const futureDate = new Date(now)
  futureDate.setDate(futureDate.getDate() + daysAhead)

  return items.filter(item =>
    item.nextReviewDate > now && item.nextReviewDate <= futureDate
  )
}

/**
 * Initialize SR item for new topic
 */
export function initializeSpacedRepetition(
  entityId: string,
  config: SpacedRepetitionConfig = DEFAULT_SR_CONFIG
): SpacedRepetitionItem {
  const now = new Date()
  const nextReviewDate = new Date(now)
  nextReviewDate.setDate(nextReviewDate.getDate() + config.firstInterval)

  return {
    entityId,
    interval: config.firstInterval,
    easeFactor: config.easeFactor,
    repetitions: 0,
    lastReviewDate: now,
    nextReviewDate,
    masteryScore: 0
  }
}

/**
 * Calculate days since last review
 */
export function daysSinceLastReview(item: SpacedRepetitionItem, now: Date = new Date()): number {
  const diffMs = now.getTime() - item.lastReviewDate.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * Calculate days until next review
 */
export function daysUntilNextReview(item: SpacedRepetitionItem, now: Date = new Date()): number {
  const diffMs = item.nextReviewDate.getTime() - now.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * Recommend review priority
 *
 * Returns priority score (0-1):
 * - 1.0 = Overdue, high priority
 * - 0.5 = Due today
 * - 0.0 = Not due yet
 */
export function calculateReviewPriority(
  item: SpacedRepetitionItem,
  config: SpacedRepetitionConfig = DEFAULT_SR_CONFIG,
  now: Date = new Date()
): number {
  const daysUntil = daysUntilNextReview(item, now)

  if (daysUntil <= 0) {
    // Overdue - priority increases with how overdue
    const daysOverdue = Math.abs(daysUntil)
    return Math.min(1, 0.5 + (daysOverdue * 0.1))
  } else if (daysUntil <= 1) {
    // Due today or tomorrow
    return 0.5
  } else if (daysUntil <= 3) {
    // Due soon
    return 0.3
  } else {
    // Not due yet
    return Math.max(0, 0.3 - (daysUntil * 0.05))
  }
}

/**
 * Adjust interval based on mastery trend
 *
 * If mastery is improving, slightly increase interval
 * If mastery is declining, slightly decrease interval
 */
export function adjustIntervalForTrend(
  item: SpacedRepetitionItem,
  currentMastery: number,
  previousMastery: number
): number {
  const masteryChange = currentMastery - previousMastery

  if (masteryChange > 10) {
    // Significant improvement, increase interval by 20%
    return Math.round(item.interval * 1.2)
  } else if (masteryChange < -10) {
    // Significant decline, decrease interval by 20%
    return Math.round(item.interval * 0.8)
  }

  // No significant change, keep interval
  return item.interval
}

/**
 * Calculate optimal review schedule for multiple topics
 *
 * Distributes reviews across days to avoid clustering
 */
export function createReviewSchedule(
  items: SpacedRepetitionItem[],
  maxReviewsPerDay: number = 10,
  now: Date = new Date()
): Map<string, Date> {
  const schedule = new Map<string, Date>()

  // Sort by priority (overdue first)
  const sortedItems = [...items].sort((a, b) => {
    const priorityA = calculateReviewPriority(a, DEFAULT_SR_CONFIG, now)
    const priorityB = calculateReviewPriority(b, DEFAULT_SR_CONFIG, now)
    return priorityB - priorityA
  })

  const reviewsPerDay = new Map<string, number>()

  for (const item of sortedItems) {
    let scheduledDate = new Date(item.nextReviewDate)

    // If scheduled date has too many reviews, push to next available day
    while ((reviewsPerDay.get(scheduledDate.toDateString()) || 0) >= maxReviewsPerDay) {
      scheduledDate.setDate(scheduledDate.getDate() + 1)
    }

    schedule.set(item.entityId, scheduledDate)

    const dateKey = scheduledDate.toDateString()
    reviewsPerDay.set(dateKey, (reviewsPerDay.get(dateKey) || 0) + 1)
  }

  return schedule
}
