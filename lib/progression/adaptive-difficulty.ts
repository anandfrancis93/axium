/**
 * Adaptive Difficulty Adjustment
 *
 * Dynamically adjusts question difficulty to maintain optimal challenge level
 * Target: ~70-80% accuracy (flow state)
 */

import { AdaptiveDifficultyConfig, DifficultyLevel } from './types'
import { QuestionFormat } from './format-selection'

/**
 * Difficulty levels mapped to Bloom levels and expected mastery
 */
export const DIFFICULTY_LEVELS: DifficultyLevel[] = [
  { numeric: 1, label: 'very_easy', bloomLevel: 1, expectedMasteryForThisLevel: 95 },
  { numeric: 2, label: 'very_easy', bloomLevel: 1, expectedMasteryForThisLevel: 90 },
  { numeric: 3, label: 'easy', bloomLevel: 2, expectedMasteryForThisLevel: 85 },
  { numeric: 4, label: 'easy', bloomLevel: 2, expectedMasteryForThisLevel: 80 },
  { numeric: 5, label: 'medium', bloomLevel: 3, expectedMasteryForThisLevel: 75 },
  { numeric: 6, label: 'medium', bloomLevel: 4, expectedMasteryForThisLevel: 70 },
  { numeric: 7, label: 'hard', bloomLevel: 4, expectedMasteryForThisLevel: 65 },
  { numeric: 8, label: 'hard', bloomLevel: 5, expectedMasteryForThisLevel: 60 },
  { numeric: 9, label: 'very_hard', bloomLevel: 5, expectedMasteryForThisLevel: 55 },
  { numeric: 10, label: 'very_hard', bloomLevel: 6, expectedMasteryForThisLevel: 50 }
]

/**
 * Target accuracy for optimal learning (flow state)
 */
export const OPTIMAL_ACCURACY_RANGE = {
  min: 0.65, // Below this: too hard, reduce difficulty
  target: 0.75, // Ideal: challenging but achievable
  max: 0.85 // Above this: too easy, increase difficulty
}

/**
 * Calculate adaptive difficulty adjustment
 *
 * @param currentDifficulty Current difficulty level (1-10)
 * @param recentResponses Recent question responses
 * @param targetAccuracy Desired accuracy rate (default 0.75)
 */
export function calculateDifficultyAdjustment(
  currentDifficulty: number,
  recentResponses: { isCorrect: boolean; bloomLevel: number }[],
  targetAccuracy: number = OPTIMAL_ACCURACY_RANGE.target
): AdaptiveDifficultyConfig {
  if (recentResponses.length < 5) {
    // Not enough data, maintain current difficulty
    return {
      currentDifficulty,
      targetAccuracy,
      actualAccuracy: 0,
      adjustmentNeeded: 0,
      recommendedBloomLevel: getDifficultyLevel(currentDifficulty).bloomLevel,
      recommendedFormat: 'mcq_single'
    }
  }

  // Calculate actual accuracy from recent responses
  const correctCount = recentResponses.filter(r => r.isCorrect).length
  const actualAccuracy = correctCount / recentResponses.length

  // Determine adjustment needed
  let adjustmentNeeded = 0

  if (actualAccuracy < OPTIMAL_ACCURACY_RANGE.min) {
    // Too hard, reduce difficulty
    const deficit = OPTIMAL_ACCURACY_RANGE.min - actualAccuracy
    adjustmentNeeded = -Math.ceil(deficit / 0.1) // -1 to -3 typically
  } else if (actualAccuracy > OPTIMAL_ACCURACY_RANGE.max) {
    // Too easy, increase difficulty
    const surplus = actualAccuracy - OPTIMAL_ACCURACY_RANGE.max
    adjustmentNeeded = Math.ceil(surplus / 0.1) // +1 to +3 typically
  }

  // Apply adjustment with bounds
  const newDifficulty = Math.max(1, Math.min(10, currentDifficulty + adjustmentNeeded))

  const difficultyLevel = getDifficultyLevel(newDifficulty)

  return {
    currentDifficulty: newDifficulty,
    targetAccuracy,
    actualAccuracy,
    adjustmentNeeded,
    recommendedBloomLevel: difficultyLevel.bloomLevel,
    recommendedFormat: getDefaultFormatForBloomLevel(difficultyLevel.bloomLevel)
  }
}

/**
 * Get difficulty level details
 */
export function getDifficultyLevel(numeric: number): DifficultyLevel {
  const level = DIFFICULTY_LEVELS.find(d => d.numeric === numeric)
  if (!level) {
    return DIFFICULTY_LEVELS[4] // Default to medium (level 5)
  }
  return level
}

/**
 * Get difficulty numeric from Bloom level and mastery
 */
export function getDifficultyFromBloomAndMastery(
  bloomLevel: number,
  masteryScore: number
): number {
  // Find difficulty levels for this Bloom level
  const levelsForBloom = DIFFICULTY_LEVELS.filter(d => d.bloomLevel === bloomLevel)

  if (levelsForBloom.length === 0) {
    // Default to middle difficulty
    return 5
  }

  // Higher mastery = can handle higher difficulty
  if (masteryScore >= 85) {
    // High mastery, use harder variant of this Bloom level
    return levelsForBloom[levelsForBloom.length - 1].numeric
  } else if (masteryScore >= 70) {
    // Medium mastery, use middle variant
    const midIndex = Math.floor(levelsForBloom.length / 2)
    return levelsForBloom[midIndex].numeric
  } else {
    // Low mastery, use easier variant
    return levelsForBloom[0].numeric
  }
}

/**
 * Recommend difficulty for next question
 */
export function recommendNextDifficulty(
  currentBloomLevel: number,
  masteryScore: number,
  recentAccuracy: number
): {
  difficulty: number
  bloomLevel: number
  reason: string
} {
  // Start with baseline difficulty for current Bloom level and mastery
  let difficulty = getDifficultyFromBloomAndMastery(currentBloomLevel, masteryScore)

  // Adjust based on recent accuracy
  if (recentAccuracy < OPTIMAL_ACCURACY_RANGE.min) {
    difficulty = Math.max(1, difficulty - 1)
    return {
      difficulty,
      bloomLevel: getDifficultyLevel(difficulty).bloomLevel,
      reason: `Recent accuracy (${(recentAccuracy * 100).toFixed(0)}%) is below target. Reducing difficulty to build confidence.`
    }
  }

  if (recentAccuracy > OPTIMAL_ACCURACY_RANGE.max) {
    difficulty = Math.min(10, difficulty + 1)
    return {
      difficulty,
      bloomLevel: getDifficultyLevel(difficulty).bloomLevel,
      reason: `Recent accuracy (${(recentAccuracy * 100).toFixed(0)}%) is above target. Increasing difficulty for optimal challenge.`
    }
  }

  return {
    difficulty,
    bloomLevel: currentBloomLevel,
    reason: `Accuracy (${(recentAccuracy * 100).toFixed(0)}%) is in optimal range. Maintaining current difficulty.`
  }
}

/**
 * Check if difficulty should be adjusted
 */
export function shouldAdjustDifficulty(
  recentResponses: { isCorrect: boolean }[],
  minResponses: number = 5
): boolean {
  if (recentResponses.length < minResponses) {
    return false
  }

  const correctCount = recentResponses.filter(r => r.isCorrect).length
  const accuracy = correctCount / recentResponses.length

  // Adjust if outside optimal range
  return accuracy < OPTIMAL_ACCURACY_RANGE.min || accuracy > OPTIMAL_ACCURACY_RANGE.max
}

/**
 * Calculate difficulty trajectory
 *
 * Shows how difficulty has changed over time
 */
export function calculateDifficultyTrajectory(
  history: { difficulty: number; timestamp: Date }[]
): {
  current: number
  trend: 'increasing' | 'stable' | 'decreasing'
  changeRate: number // Average change per session
} {
  if (history.length < 2) {
    return {
      current: history[0]?.difficulty || 5,
      trend: 'stable',
      changeRate: 0
    }
  }

  const current = history[history.length - 1].difficulty
  const previous = history[history.length - 2].difficulty

  // Calculate average change
  const changes = []
  for (let i = 1; i < history.length; i++) {
    changes.push(history[i].difficulty - history[i - 1].difficulty)
  }

  const avgChange = changes.reduce((sum, c) => sum + c, 0) / changes.length

  let trend: 'increasing' | 'stable' | 'decreasing'
  if (avgChange > 0.3) {
    trend = 'increasing'
  } else if (avgChange < -0.3) {
    trend = 'decreasing'
  } else {
    trend = 'stable'
  }

  return {
    current,
    trend,
    changeRate: avgChange
  }
}

/**
 * Generate difficulty feedback for user
 */
export function generateDifficultyFeedback(
  config: AdaptiveDifficultyConfig
): string {
  const { actualAccuracy, targetAccuracy, adjustmentNeeded } = config

  if (Math.abs(actualAccuracy - targetAccuracy) < 0.05) {
    return '🎯 Perfect! The difficulty level is just right for optimal learning.'
  }

  if (actualAccuracy < OPTIMAL_ACCURACY_RANGE.min) {
    return `📉 Questions are challenging right now (${(actualAccuracy * 100).toFixed(0)}% accuracy). We're adjusting to a more comfortable level.`
  }

  if (actualAccuracy > OPTIMAL_ACCURACY_RANGE.max) {
    return `📈 You're doing great (${(actualAccuracy * 100).toFixed(0)}% accuracy)! We're increasing difficulty to keep you challenged.`
  }

  if (adjustmentNeeded > 0) {
    return `💪 Increasing difficulty by ${adjustmentNeeded} level(s) to maintain optimal challenge.`
  }

  if (adjustmentNeeded < 0) {
    return `🎓 Reducing difficulty by ${Math.abs(adjustmentNeeded)} level(s) to support learning.`
  }

  return '✨ Maintaining current difficulty level.'
}

// Helper functions

function getDefaultFormatForBloomLevel(bloomLevel: number): QuestionFormat {
  const defaults: Record<number, QuestionFormat> = {
    1: 'true_false',
    2: 'mcq_single',
    3: 'mcq_multi',
    4: 'mcq_multi',
    5: 'open_ended',
    6: 'open_ended'
  }
  return defaults[bloomLevel] || 'mcq_single'
}

/**
 * Validate difficulty parameters
 */
export function validateDifficulty(difficulty: number): {
  valid: boolean
  error?: string
  corrected?: number
} {
  if (!Number.isInteger(difficulty)) {
    return {
      valid: false,
      error: 'Difficulty must be an integer',
      corrected: Math.round(difficulty)
    }
  }

  if (difficulty < 1) {
    return {
      valid: false,
      error: 'Difficulty must be at least 1',
      corrected: 1
    }
  }

  if (difficulty > 10) {
    return {
      valid: false,
      error: 'Difficulty cannot exceed 10',
      corrected: 10
    }
  }

  return { valid: true }
}
