/**
 * Bloom Level Progression Logic
 *
 * Determines when learners should:
 * - Advance to next Bloom level
 * - Stay at current level
 * - Review at current level
 * - Regress to previous level
 */

import { ProgressionRules, ProgressionDecision, DEFAULT_PROGRESSION_RULES } from './types'

export interface UserProgress {
  currentBloomLevel: number
  totalAttempts: number
  masteryScores: Record<number, number> // Bloom level -> mastery score
  confidenceCalibrationError: number
  performanceHistory: {
    attempts: number
    correct: number
    timestamp: Date
  }[]
}

/**
 * Evaluate whether user should advance, maintain, review, or regress
 */
export function evaluateProgression(
  progress: UserProgress,
  rules: ProgressionRules = DEFAULT_PROGRESSION_RULES
): ProgressionDecision {
  const currentLevel = progress.currentBloomLevel
  const currentMastery = progress.masteryScores[currentLevel] || 0
  const attempts = progress.totalAttempts
  const calibrationError = progress.confidenceCalibrationError

  // Calculate performance trend
  const performanceTrend = calculatePerformanceTrend(progress.performanceHistory)

  // Decision logic
  if (currentMastery < rules.autoRegressionThreshold && currentLevel > 1) {
    // Performance is very poor, regress to previous level
    return {
      action: 'regress',
      currentLevel,
      targetLevel: currentLevel - 1,
      reason: `Mastery (${currentMastery}%) is below regression threshold (${rules.autoRegressionThreshold}%). Returning to Level ${currentLevel - 1} to rebuild foundation.`,
      confidence: 0.9,
      metrics: {
        masteryScore: currentMastery,
        attempts,
        confidenceCalibrationError: calibrationError,
        recentPerformanceTrend: performanceTrend
      }
    }
  }

  if (currentMastery < rules.autoReviewThreshold) {
    // Performance needs improvement, stay and review
    return {
      action: 'review',
      currentLevel,
      targetLevel: currentLevel,
      reason: `Mastery (${currentMastery}%) is below review threshold (${rules.autoReviewThreshold}%). Continue practicing at Level ${currentLevel}.`,
      confidence: 0.8,
      metrics: {
        masteryScore: currentMastery,
        attempts,
        confidenceCalibrationError: calibrationError,
        recentPerformanceTrend: performanceTrend
      }
    }
  }

  if (
    currentMastery >= rules.masteryThresholdForAdvancement &&
    attempts >= rules.minAttemptsForAdvancement &&
    calibrationError <= rules.confidenceCalibrationThreshold &&
    currentLevel < 6
  ) {
    // Ready to advance
    const confidence = calculateAdvancementConfidence(
      currentMastery,
      attempts,
      calibrationError,
      performanceTrend,
      rules
    )

    return {
      action: 'advance',
      currentLevel,
      targetLevel: currentLevel + 1,
      reason: `Mastery (${currentMastery}%) exceeds advancement threshold (${rules.masteryThresholdForAdvancement}%) with ${attempts} attempts. Ready for Level ${currentLevel + 1}.`,
      confidence,
      metrics: {
        masteryScore: currentMastery,
        attempts,
        confidenceCalibrationError: calibrationError,
        recentPerformanceTrend: performanceTrend
      }
    }
  }

  // Default: maintain current level
  const reason = getMaintainReason(currentMastery, attempts, calibrationError, currentLevel, rules)

  return {
    action: 'maintain',
    currentLevel,
    targetLevel: currentLevel,
    reason,
    confidence: 0.7,
    metrics: {
      masteryScore: currentMastery,
      attempts,
      confidenceCalibrationError: calibrationError,
      recentPerformanceTrend: performanceTrend
    }
  }
}

/**
 * Calculate performance trend from recent history
 */
function calculatePerformanceTrend(
  history: { attempts: number; correct: number; timestamp: Date }[]
): 'improving' | 'stable' | 'declining' {
  if (history.length < 5) return 'stable'

  // Look at last 10 attempts
  const recent = history.slice(-10)

  // Split into first half and second half
  const firstHalf = recent.slice(0, Math.floor(recent.length / 2))
  const secondHalf = recent.slice(Math.floor(recent.length / 2))

  const firstAccuracy = firstHalf.reduce((sum, h) => sum + (h.correct / h.attempts), 0) / firstHalf.length
  const secondAccuracy = secondHalf.reduce((sum, h) => sum + (h.correct / h.attempts), 0) / secondHalf.length

  const change = secondAccuracy - firstAccuracy

  if (change > 0.1) return 'improving'
  if (change < -0.1) return 'declining'
  return 'stable'
}

/**
 * Calculate confidence in advancement decision
 */
function calculateAdvancementConfidence(
  mastery: number,
  attempts: number,
  calibrationError: number,
  trend: 'improving' | 'stable' | 'declining',
  rules: ProgressionRules
): number {
  let confidence = 0.5

  // Higher mastery = higher confidence
  const masteryExcess = mastery - rules.masteryThresholdForAdvancement
  confidence += Math.min(0.3, masteryExcess / 100)

  // More attempts = higher confidence
  const attemptExcess = attempts - rules.minAttemptsForAdvancement
  confidence += Math.min(0.2, attemptExcess / 20)

  // Better calibration = higher confidence
  const calibrationBonus = (rules.confidenceCalibrationThreshold - calibrationError) * 0.5
  confidence += Math.max(0, calibrationBonus)

  // Trend bonus
  if (trend === 'improving') confidence += 0.1
  if (trend === 'declining') confidence -= 0.1

  return Math.max(0.3, Math.min(1, confidence))
}

/**
 * Get reason for maintaining current level
 */
function getMaintainReason(
  mastery: number,
  attempts: number,
  calibrationError: number,
  currentLevel: number,
  rules: ProgressionRules
): string {
  const reasons: string[] = []

  if (mastery < rules.masteryThresholdForAdvancement) {
    reasons.push(`Mastery (${mastery}%) has not reached advancement threshold (${rules.masteryThresholdForAdvancement}%)`)
  }

  if (attempts < rules.minAttemptsForAdvancement) {
    reasons.push(`Need more practice (${attempts}/${rules.minAttemptsForAdvancement} attempts)`)
  }

  if (calibrationError > rules.confidenceCalibrationThreshold) {
    reasons.push(`Confidence calibration needs improvement (error: ${(calibrationError * 100).toFixed(1)}%)`)
  }

  if (currentLevel === 6) {
    reasons.push('Already at maximum Bloom level')
  }

  if (reasons.length === 0) {
    return `Continue practicing at Level ${currentLevel} to reinforce mastery`
  }

  return reasons.join('; ')
}

/**
 * Check if ready to advance to next Bloom level
 */
export function shouldAdvanceBloomLevel(
  progress: UserProgress,
  rules: ProgressionRules = DEFAULT_PROGRESSION_RULES
): boolean {
  const decision = evaluateProgression(progress, rules)
  return decision.action === 'advance'
}

/**
 * Get recommended Bloom level for next session
 */
export function getRecommendedBloomLevel(
  progress: UserProgress,
  rules: ProgressionRules = DEFAULT_PROGRESSION_RULES
): number {
  const decision = evaluateProgression(progress, rules)
  return decision.targetLevel
}

/**
 * Calculate mastery score for a specific Bloom level
 *
 * Based on recent performance at that level
 */
export function calculateBloomLevelMastery(
  responses: { isCorrect: boolean; confidence: number }[],
  bloomLevel: number
): number {
  if (responses.length === 0) return 0

  const totalResponses = responses.length
  const correctResponses = responses.filter(r => r.isCorrect).length
  const baseAccuracy = correctResponses / totalResponses

  // Adjust for confidence calibration
  const calibrationErrors = responses.map(r => {
    const expectedCorrectness = r.confidence / 5 // Normalize 1-5 to 0-1
    const actualCorrectness = r.isCorrect ? 1 : 0
    return Math.abs(expectedCorrectness - actualCorrectness)
  })
  const avgCalibrationError = calibrationErrors.reduce((sum, e) => sum + e, 0) / calibrationErrors.length

  // Penalty for poor calibration (max 20% reduction)
  const calibrationPenalty = Math.min(0.2, avgCalibrationError * 0.5)

  const masteryScore = Math.max(0, Math.min(100, (baseAccuracy - calibrationPenalty) * 100))

  return Math.round(masteryScore)
}

/**
 * Determine if user is ready for a specific Bloom level
 */
export function isReadyForBloomLevel(
  progress: UserProgress,
  targetLevel: number,
  rules: ProgressionRules = DEFAULT_PROGRESSION_RULES
): { ready: boolean; reason: string } {
  if (targetLevel < 1 || targetLevel > 6) {
    return { ready: false, reason: 'Invalid Bloom level' }
  }

  if (targetLevel === 1) {
    return { ready: true, reason: 'Level 1 is always accessible' }
  }

  // Check mastery of previous level
  const previousLevel = targetLevel - 1
  const previousMastery = progress.masteryScores[previousLevel] || 0

  if (previousMastery < rules.masteryThresholdForAdvancement) {
    return {
      ready: false,
      reason: `Must achieve ${rules.masteryThresholdForAdvancement}% mastery at Level ${previousLevel} (currently ${previousMastery}%)`
    }
  }

  // Check if already practicing at this level
  if (progress.currentBloomLevel === targetLevel) {
    return { ready: true, reason: 'Currently at this level' }
  }

  // Check if jumping too many levels
  if (targetLevel > progress.currentBloomLevel + 1) {
    return {
      ready: false,
      reason: `Cannot skip levels. Must complete Level ${progress.currentBloomLevel + 1} first`
    }
  }

  return { ready: true, reason: 'Ready to advance' }
}
