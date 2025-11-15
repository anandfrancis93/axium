/**
 * Types for Context-Aware Learning Recommendations (Phase 4B)
 */

export type RLAlgorithm = 'epsilon_greedy' | 'ucb' | 'thompson_sampling' | 'random'

export interface RLConfig {
  algorithm: RLAlgorithm
  epsilon: number // For epsilon-greedy (0-1)
  explorationRate: number // General exploration parameter
  learningRate: number // Alpha for RL updates
  discountFactor: number // Gamma for future rewards
  temperature: number // For softmax/Thompson sampling
}

export interface TopicPerformance {
  topicId: string
  topicName: string
  entityId?: string
  entityName?: string
  domain: string
  fullPath: string

  // Performance metrics
  attempts: number
  correctAnswers: number
  totalQuestions: number
  masteryScore: number // 0-100
  averageConfidence: number // 0-1
  confidenceCalibrationError: number // 0-1
  lastAttemptAt?: Date

  // RL metrics
  estimatedValue: number // Expected reward
  uncertainty: number // Confidence interval
  timeSinceLastReview: number // Days

  // Bloom level breakdown
  bloomLevelScores: Record<number, number> // Bloom level -> mastery score
  currentBloomLevel: number

  // Format performance
  formatPerformance?: Record<string, {
    attempts: number
    correct: number
    avgConfidence: number
  }>
}

export interface RecommendationContext {
  userId: string

  // Current state
  currentTopics: TopicPerformance[]
  overallMasteryScore: number
  totalAttempts: number

  // Learning goals
  targetBloomLevel?: number
  targetDomain?: string
  preferredFormats?: string[]

  // Constraints
  excludeTopicIds?: string[]
  minMasteryForAdvancement?: number

  // RL state
  rlPhase: 'cold_start' | 'exploration' | 'optimization' | 'stabilization' | 'adaptation' | 'meta_learning'
  explorationBudget: number // Remaining exploration attempts
}

export interface TopicRecommendation {
  entityId: string
  entityName: string
  domain: string
  fullPath: string

  // Recommendation reasoning
  recommendationScore: number // 0-1
  reason: string
  confidence: number // How confident we are in this recommendation

  // Suggested parameters
  suggestedBloomLevel: number
  suggestedFormat: string
  expectedDifficulty: 'easy' | 'medium' | 'hard'

  // Context
  isDueForReview: boolean
  daysSinceLastReview?: number
  currentMastery: number

  // RL metrics
  estimatedReward: number
  explorationValue: number
  exploitationValue: number
}

export interface SpacedRepetitionConfig {
  // SM-2 algorithm parameters
  easeFactor: number // Default 2.5
  minEaseFactor: number // Default 1.3

  // Intervals
  firstInterval: number // Days (default 1)
  secondInterval: number // Days (default 6)

  // Review thresholds
  masteryThresholdForAdvancement: number // Default 80%
  masteryThresholdForReview: number // Default 60%
}

export interface SpacedRepetitionItem {
  entityId: string
  interval: number // Days until next review
  easeFactor: number
  repetitions: number
  lastReviewDate: Date
  nextReviewDate: Date
  masteryScore: number
}
