/**
 * Recommendation Engine - Main orchestrator for topic selection
 *
 * Combines:
 * - User progress data from Supabase
 * - RL algorithms for selection
 * - Spaced repetition for timing
 * - Graph context from Neo4j (when available)
 */

import { createClient } from '@/lib/supabase/server'
import {
  TopicPerformance,
  RecommendationContext,
  TopicRecommendation,
  RLConfig,
  SpacedRepetitionItem
} from './types'
import {
  selectTopicWithRL,
  getDefaultRLConfig,
  calculateEstimatedValue,
  calculateUncertainty
} from './rl-algorithms'
import {
  calculateNextReview,
  isDueForReview,
  calculateReviewPriority,
  DEFAULT_SR_CONFIG,
  daysSinceLastReview
} from './spaced-repetition'

/**
 * Get user's learning context
 */
export async function getUserLearningContext(userId: string): Promise<RecommendationContext> {
  const supabase = await createClient()

  // Fetch all user progress
  const { data: progressData, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)

  if (error) throw error

  const topicPerformances: TopicPerformance[] = progressData.map(progress => {
    const lastAttemptAt = progress.last_attempt_at ? new Date(progress.last_attempt_at) : undefined
    const timeSinceLastReview = lastAttemptAt
      ? (Date.now() - lastAttemptAt.getTime()) / (1000 * 60 * 60 * 24)
      : 0

    const topicPerf: TopicPerformance = {
      topicId: progress.topic_id || '',
      topicName: '', // Will be populated from topic table if needed
      entityId: progress.entity_id || undefined,
      entityName: progress.entity_name || '',
      domain: progress.domain || '',
      fullPath: progress.full_path || '',
      attempts: progress.total_attempts || 0,
      correctAnswers: progress.correct_answers || 0,
      totalQuestions: progress.total_questions || 0,
      masteryScore: calculateMasteryScore(progress.mastery_scores as any, progress.current_bloom_level || 1),
      averageConfidence: calculateAverageConfidence(progress.rl_metadata as any),
      confidenceCalibrationError: progress.confidence_calibration_error || 0,
      lastAttemptAt,
      estimatedValue: 0, // Will be calculated
      uncertainty: 0, // Will be calculated
      timeSinceLastReview,
      bloomLevelScores: (progress.mastery_scores as Record<number, number>) || {},
      currentBloomLevel: progress.current_bloom_level || 1,
      formatPerformance: (progress.rl_metadata as any)?.format_performance || {}
    }

    // Calculate RL metrics
    topicPerf.estimatedValue = calculateEstimatedValue(topicPerf)
    topicPerf.uncertainty = calculateUncertainty(topicPerf)

    return topicPerf
  })

  const totalAttempts = topicPerformances.reduce((sum, p) => sum + p.attempts, 0)
  const overallMasteryScore = topicPerformances.length > 0
    ? topicPerformances.reduce((sum, p) => sum + p.masteryScore, 0) / topicPerformances.length
    : 0

  // Determine RL phase
  const rlPhase = determineRLPhase(totalAttempts, topicPerformances)

  return {
    userId,
    currentTopics: topicPerformances,
    overallMasteryScore,
    totalAttempts,
    rlPhase,
    explorationBudget: calculateExplorationBudget(totalAttempts, rlPhase)
  }
}

/**
 * Generate topic recommendations for user
 */
export async function getTopicRecommendations(
  userId: string,
  options: {
    count?: number
    domain?: string
    minBloomLevel?: number
    maxBloomLevel?: number
    excludeTopicIds?: string[]
    rlConfig?: Partial<RLConfig>
  } = {}
): Promise<TopicRecommendation[]> {
  const context = await getUserLearningContext(userId)

  // Get full RL config
  const rlConfig = {
    ...getDefaultRLConfig(context.rlPhase, context.totalAttempts),
    ...options.rlConfig
  }

  // Filter topics based on options
  let candidateTopics = context.currentTopics

  if (options.domain) {
    candidateTopics = candidateTopics.filter(t => t.domain === options.domain)
  }

  if (options.excludeTopicIds) {
    candidateTopics = candidateTopics.filter(
      t => !options.excludeTopicIds!.includes(t.topicId) && !options.excludeTopicIds!.includes(t.entityId || '')
    )
  }

  if (candidateTopics.length === 0) {
    return [] // No topics available
  }

  // Generate recommendations
  const count = options.count || 3
  const recommendations: TopicRecommendation[] = []
  const selectedTopicIds = new Set<string>()

  for (let i = 0; i < count && candidateTopics.length > 0; i++) {
    // Filter out already selected
    const availableTopics = candidateTopics.filter(
      t => !selectedTopicIds.has(t.topicId) && !selectedTopicIds.has(t.entityId || '')
    )

    if (availableTopics.length === 0) break

    // Select topic using RL
    const selectedTopic = selectTopicWithRL(availableTopics, rlConfig)

    // Create SR item for review priority
    const srItem: SpacedRepetitionItem = {
      entityId: selectedTopic.entityId || selectedTopic.topicId,
      interval: 1,
      easeFactor: DEFAULT_SR_CONFIG.easeFactor,
      repetitions: selectedTopic.attempts,
      lastReviewDate: selectedTopic.lastAttemptAt || new Date(),
      nextReviewDate: new Date(), // Would be calculated properly
      masteryScore: selectedTopic.masteryScore
    }

    const isDue = isDueForReview(srItem)
    const priority = calculateReviewPriority(srItem)
    const daysSince = selectedTopic.lastAttemptAt ? daysSinceLastReview(srItem) : undefined

    // Determine suggested Bloom level
    const suggestedBloomLevel = determineSuggestedBloomLevel(selectedTopic, options)

    // Determine suggested format
    const suggestedFormat = determineSuggestedFormat(selectedTopic, suggestedBloomLevel)

    // Calculate recommendation score
    const recommendationScore = calculateRecommendationScore(
      selectedTopic,
      priority,
      rlConfig
    )

    // Generate reasoning
    const reason = generateRecommendationReason(
      selectedTopic,
      isDue,
      daysSince,
      context.rlPhase
    )

    recommendations.push({
      entityId: selectedTopic.entityId || selectedTopic.topicId,
      entityName: selectedTopic.entityName || selectedTopic.topicName,
      domain: selectedTopic.domain,
      fullPath: selectedTopic.fullPath,
      recommendationScore,
      reason,
      confidence: 1 - selectedTopic.uncertainty,
      suggestedBloomLevel,
      suggestedFormat,
      expectedDifficulty: determineExpectedDifficulty(selectedTopic.masteryScore, suggestedBloomLevel),
      isDueForReview: isDue,
      daysSinceLastReview: daysSince,
      currentMastery: selectedTopic.masteryScore,
      estimatedReward: selectedTopic.estimatedValue,
      explorationValue: selectedTopic.uncertainty,
      exploitationValue: selectedTopic.estimatedValue * (1 - selectedTopic.uncertainty)
    })

    selectedTopicIds.add(selectedTopic.topicId)
    if (selectedTopic.entityId) {
      selectedTopicIds.add(selectedTopic.entityId)
    }
  }

  return recommendations
}

/**
 * Get next topic to study (single recommendation)
 */
export async function getNextTopic(
  userId: string,
  options: {
    domain?: string
    bloomLevel?: number
  } = {}
): Promise<TopicRecommendation | null> {
  const recommendations = await getTopicRecommendations(userId, {
    count: 1,
    ...options
  })

  return recommendations[0] || null
}

// Helper functions

function calculateMasteryScore(
  masteryScores: Record<number, number> | null,
  currentBloomLevel: number
): number {
  if (!masteryScores) return 0
  return masteryScores[currentBloomLevel] || 0
}

function calculateAverageConfidence(metadata: any): number {
  if (!metadata?.confidence_history) return 0.5

  const history = metadata.confidence_history
  if (history.length === 0) return 0.5

  const sum = history.reduce((acc: number, val: number) => acc + val, 0)
  return sum / history.length
}

function determineRLPhase(
  totalAttempts: number,
  topics: TopicPerformance[]
): 'cold_start' | 'exploration' | 'optimization' | 'stabilization' | 'adaptation' | 'meta_learning' {
  if (totalAttempts < 10) return 'cold_start'
  if (totalAttempts < 50) return 'exploration'
  if (totalAttempts < 150) return 'optimization'

  // Calculate variance in mastery scores
  const masteryScores = topics.map(t => t.masteryScore)
  const avgMastery = masteryScores.reduce((sum, val) => sum + val, 0) / masteryScores.length
  const variance = masteryScores.reduce((sum, val) => sum + Math.pow(val - avgMastery, 2), 0) / masteryScores.length

  if (variance < 100) {
    // Low variance, stable performance
    if (totalAttempts >= 500 && avgMastery >= 80) {
      return 'meta_learning'
    }
    return 'stabilization'
  } else {
    // High variance, still adapting
    return 'adaptation'
  }
}

function calculateExplorationBudget(
  totalAttempts: number,
  phase: string
): number {
  switch (phase) {
    case 'cold_start': return 100
    case 'exploration': return 50
    case 'optimization': return 20
    case 'stabilization': return 10
    case 'adaptation': return 30
    case 'meta_learning': return 5
    default: return 20
  }
}

function determineSuggestedBloomLevel(
  topic: TopicPerformance,
  options: any
): number {
  if (options.minBloomLevel && options.maxBloomLevel) {
    // Use provided range
    return Math.floor((options.minBloomLevel + options.maxBloomLevel) / 2)
  }

  // Based on current mastery
  const currentLevel = topic.currentBloomLevel
  const currentMastery = topic.bloomLevelScores[currentLevel] || 0

  if (currentMastery >= 80) {
    // Ready to advance
    return Math.min(6, currentLevel + 1)
  } else if (currentMastery >= 60) {
    // Stay at current level
    return currentLevel
  } else {
    // Review previous level
    return Math.max(1, currentLevel - 1)
  }
}

function determineSuggestedFormat(
  topic: TopicPerformance,
  bloomLevel: number
): string {
  const formatPerf = topic.formatPerformance || {}

  // Get formats sorted by effectiveness
  const sortedFormats = Object.entries(formatPerf)
    .map(([format, stats]) => ({
      format,
      effectiveness: (stats.correct / stats.attempts) * 0.7 + stats.avgConfidence * 0.3
    }))
    .sort((a, b) => b.effectiveness - a.effectiveness)

  if (sortedFormats.length > 0) {
    // Use most effective format
    return sortedFormats[0].format
  }

  // Default based on Bloom level
  if (bloomLevel <= 2) return 'mcq_single'
  if (bloomLevel <= 4) return 'mcq_multi'
  return 'open_ended'
}

function determineExpectedDifficulty(
  masteryScore: number,
  bloomLevel: number
): 'easy' | 'medium' | 'hard' {
  if (bloomLevel >= 5) return 'hard'
  if (bloomLevel >= 3) return 'medium'
  if (masteryScore >= 80) return 'easy'
  if (masteryScore >= 60) return 'medium'
  return 'hard'
}

function calculateRecommendationScore(
  topic: TopicPerformance,
  reviewPriority: number,
  rlConfig: RLConfig
): number {
  // Weighted combination of factors
  const rlScore = topic.estimatedValue * 0.4
  const reviewScore = reviewPriority * 0.3
  const uncertaintyBonus = topic.uncertainty * rlConfig.explorationRate * 0.3

  return Math.max(0, Math.min(1, rlScore + reviewScore + uncertaintyBonus))
}

function generateRecommendationReason(
  topic: TopicPerformance,
  isDue: boolean,
  daysSince: number | undefined,
  phase: string
): string {
  const reasons: string[] = []

  if (isDue) {
    reasons.push('Due for spaced repetition review')
  } else if (daysSince && daysSince >= 7) {
    reasons.push(`Haven't practiced in ${daysSince} days`)
  }

  if (topic.masteryScore < 60) {
    reasons.push('Needs improvement (below 60% mastery)')
  } else if (topic.masteryScore >= 80) {
    reasons.push('Ready to advance to next level')
  }

  if (topic.confidenceCalibrationError > 0.3) {
    reasons.push('Confidence calibration needs work')
  }

  if (topic.attempts < 5) {
    reasons.push('Limited practice data - exploring')
  }

  if (phase === 'cold_start' || phase === 'exploration') {
    reasons.push('Exploration phase - gathering data')
  }

  return reasons.join('; ') || 'Optimal learning progression'
}
