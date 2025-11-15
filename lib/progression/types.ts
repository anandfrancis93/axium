/**
 * Types for Adaptive Difficulty & Progression (Phase 4C)
 */

export interface ProgressionRules {
  // Bloom level advancement
  minAttemptsForAdvancement: number
  masteryThresholdForAdvancement: number // 0-100
  confidenceCalibrationThreshold: number // Max error allowed

  // Automatic review triggers
  autoReviewThreshold: number // If mastery drops below, trigger review
  autoRegressionThreshold: number // If mastery drops below, regress to previous level

  // Format selection
  minAttemptsPerFormat: number
  formatRotationEnabled: boolean

  // Difficulty adjustment
  dynamicDifficultyEnabled: boolean
  difficultyAdjustmentRate: number // How quickly to adjust (0-1)
}

export const DEFAULT_PROGRESSION_RULES: ProgressionRules = {
  minAttemptsForAdvancement: 5,
  masteryThresholdForAdvancement: 80,
  confidenceCalibrationThreshold: 0.3,
  autoReviewThreshold: 60,
  autoRegressionThreshold: 40,
  minAttemptsPerFormat: 3,
  formatRotationEnabled: true,
  dynamicDifficultyEnabled: true,
  difficultyAdjustmentRate: 0.2
}

export interface ProgressionDecision {
  action: 'advance' | 'maintain' | 'review' | 'regress'
  currentLevel: number
  targetLevel: number
  reason: string
  confidence: number // How confident we are in this decision
  metrics: {
    masteryScore: number
    attempts: number
    confidenceCalibrationError: number
    recentPerformanceTrend: 'improving' | 'stable' | 'declining'
  }
}

export interface ConfidenceCalibration {
  confidenceLevel: number // 1-5 (user's stated confidence)
  wasCorrect: boolean
  isWellCalibrated: boolean
  calibrationError: number // Absolute difference between confidence and correctness
  feedback: string
}

export interface DifficultyLevel {
  numeric: number // 1-10
  label: 'very_easy' | 'easy' | 'medium' | 'hard' | 'very_hard'
  bloomLevel: number
  expectedMasteryForThisLevel: number // What mastery score indicates this is appropriate
}

export interface AdaptiveDifficultyConfig {
  currentDifficulty: number // 1-10
  targetAccuracy: number // Desired accuracy rate (0-1)
  actualAccuracy: number // Current accuracy rate (0-1)
  adjustmentNeeded: number // How much to adjust difficulty (-1 to 1)
  recommendedBloomLevel: number
  recommendedFormat: string
}

export interface FormatSelectionStrategy {
  strategy: 'performance_based' | 'rotation' | 'bloom_aligned' | 'weakness_targeting'
  selectedFormat: string
  reason: string
  alternativeFormats: string[]
}
