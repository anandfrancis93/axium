/**
 * Reinforcement Learning Algorithms for Topic Selection
 *
 * Implements:
 * - Epsilon-Greedy
 * - Upper Confidence Bound (UCB)
 * - Thompson Sampling
 */

import { TopicPerformance, RLConfig, TopicRecommendation } from './types'

/**
 * Epsilon-Greedy Selection
 *
 * With probability ε, explore (random selection)
 * With probability 1-ε, exploit (select best known topic)
 */
export function epsilonGreedySelection(
  topics: TopicPerformance[],
  config: RLConfig
): TopicPerformance {
  const shouldExplore = Math.random() < config.epsilon

  if (shouldExplore || topics.every(t => t.attempts === 0)) {
    // Explore: random selection
    return topics[Math.floor(Math.random() * topics.length)]
  }

  // Exploit: select topic with highest estimated value
  return topics.reduce((best, current) =>
    current.estimatedValue > best.estimatedValue ? current : best
  )
}

/**
 * Upper Confidence Bound (UCB1) Selection
 *
 * Balances exploration and exploitation using confidence bounds
 * UCB(a) = Q(a) + c * sqrt(ln(N) / n(a))
 *
 * Where:
 * - Q(a) = estimated value of action a
 * - N = total attempts across all topics
 * - n(a) = attempts for action a
 * - c = exploration parameter
 */
export function ucbSelection(
  topics: TopicPerformance[],
  config: RLConfig
): TopicPerformance {
  const totalAttempts = topics.reduce((sum, t) => sum + t.attempts, 0)

  if (totalAttempts === 0) {
    // No data yet, random selection
    return topics[Math.floor(Math.random() * topics.length)]
  }

  const c = config.explorationRate || 2.0

  const ucbScores = topics.map(topic => {
    if (topic.attempts === 0) {
      // Unvisited topics get infinite score (prioritize exploration)
      return { topic, score: Infinity }
    }

    const exploitationValue = topic.estimatedValue
    const explorationBonus = c * Math.sqrt(Math.log(totalAttempts) / topic.attempts)
    const ucbScore = exploitationValue + explorationBonus

    return { topic, score: ucbScore }
  })

  // Select topic with highest UCB score
  return ucbScores.reduce((best, current) =>
    current.score > best.score ? current : best
  ).topic
}

/**
 * Thompson Sampling Selection
 *
 * Bayesian approach: sample from posterior distribution
 * Assumes Beta distribution for success probability
 */
export function thompsonSamplingSelection(
  topics: TopicPerformance[],
  config: RLConfig
): TopicPerformance {
  const samples = topics.map(topic => {
    // Beta distribution parameters
    // Prior: Beta(1, 1) (uniform)
    // Posterior: Beta(α + successes, β + failures)
    const alpha = 1 + topic.correctAnswers
    const beta = 1 + (topic.attempts - topic.correctAnswers)

    // Sample from Beta distribution using approximation
    const sample = betaSample(alpha, beta)

    return { topic, sample }
  })

  // Select topic with highest sample
  return samples.reduce((best, current) =>
    current.sample > best.sample ? current : best
  ).topic
}

/**
 * Beta distribution sampling using Gamma approximation
 */
function betaSample(alpha: number, beta: number): number {
  const x = gammaSample(alpha)
  const y = gammaSample(beta)
  return x / (x + y)
}

/**
 * Gamma distribution sampling using Marsaglia & Tsang method
 */
function gammaSample(alpha: number): number {
  if (alpha < 1) {
    // Use alpha + 1, then scale
    return gammaSample(alpha + 1) * Math.pow(Math.random(), 1 / alpha)
  }

  const d = alpha - 1 / 3
  const c = 1 / Math.sqrt(9 * d)

  while (true) {
    let x, v
    do {
      x = normalSample(0, 1)
      v = 1 + c * x
    } while (v <= 0)

    v = v * v * v
    const u = Math.random()

    if (u < 1 - 0.0331 * x * x * x * x) {
      return d * v
    }

    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
      return d * v
    }
  }
}

/**
 * Normal distribution sampling using Box-Muller transform
 */
function normalSample(mean: number, stdDev: number): number {
  const u1 = Math.random()
  const u2 = Math.random()
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  return z0 * stdDev + mean
}

/**
 * Softmax Selection
 *
 * Probabilistic selection based on estimated values
 * P(a) = exp(Q(a) / τ) / Σ exp(Q(i) / τ)
 *
 * Where τ (tau) is temperature parameter
 */
export function softmaxSelection(
  topics: TopicPerformance[],
  config: RLConfig
): TopicPerformance {
  const temperature = config.temperature || 1.0

  // Calculate softmax probabilities
  const expValues = topics.map(t => Math.exp(t.estimatedValue / temperature))
  const sumExp = expValues.reduce((sum, val) => sum + val, 0)
  const probabilities = expValues.map(val => val / sumExp)

  // Sample from categorical distribution
  const rand = Math.random()
  let cumulative = 0

  for (let i = 0; i < topics.length; i++) {
    cumulative += probabilities[i]
    if (rand < cumulative) {
      return topics[i]
    }
  }

  // Fallback (shouldn't reach here)
  return topics[topics.length - 1]
}

/**
 * Select topic using configured RL algorithm
 */
export function selectTopicWithRL(
  topics: TopicPerformance[],
  config: RLConfig
): TopicPerformance {
  if (topics.length === 0) {
    throw new Error('No topics available for selection')
  }

  if (topics.length === 1) {
    return topics[0]
  }

  switch (config.algorithm) {
    case 'epsilon_greedy':
      return epsilonGreedySelection(topics, config)
    case 'ucb':
      return ucbSelection(topics, config)
    case 'thompson_sampling':
      return thompsonSamplingSelection(topics, config)
    case 'random':
      return topics[Math.floor(Math.random() * topics.length)]
    default:
      throw new Error(`Unknown RL algorithm: ${config.algorithm}`)
  }
}

/**
 * Get default RL config based on learning phase
 */
export function getDefaultRLConfig(
  phase: 'cold_start' | 'exploration' | 'optimization' | 'stabilization' | 'adaptation' | 'meta_learning',
  totalAttempts: number
): RLConfig {
  switch (phase) {
    case 'cold_start':
      // Pure exploration
      return {
        algorithm: 'random',
        epsilon: 1.0,
        explorationRate: 2.0,
        learningRate: 0.1,
        discountFactor: 0.9,
        temperature: 1.0
      }

    case 'exploration':
      // High exploration
      return {
        algorithm: 'epsilon_greedy',
        epsilon: 0.3,
        explorationRate: 2.0,
        learningRate: 0.1,
        discountFactor: 0.9,
        temperature: 1.0
      }

    case 'optimization':
      // Balanced exploration-exploitation
      return {
        algorithm: 'ucb',
        epsilon: 0.1,
        explorationRate: 1.5,
        learningRate: 0.05,
        discountFactor: 0.95,
        temperature: 0.5
      }

    case 'stabilization':
      // Low exploration
      return {
        algorithm: 'epsilon_greedy',
        epsilon: 0.05,
        explorationRate: 1.0,
        learningRate: 0.01,
        discountFactor: 0.95,
        temperature: 0.3
      }

    case 'adaptation':
      // Adaptive exploration
      return {
        algorithm: 'thompson_sampling',
        epsilon: 0.1,
        explorationRate: 1.2,
        learningRate: 0.05,
        discountFactor: 0.9,
        temperature: 0.5
      }

    case 'meta_learning':
      // Sophisticated selection
      return {
        algorithm: 'thompson_sampling',
        epsilon: 0.05,
        explorationRate: 1.0,
        learningRate: 0.01,
        discountFactor: 0.95,
        temperature: 0.2
      }

    default:
      return {
        algorithm: 'epsilon_greedy',
        epsilon: 0.1,
        explorationRate: 1.5,
        learningRate: 0.1,
        discountFactor: 0.9,
        temperature: 1.0
      }
  }
}

/**
 * Calculate estimated value for a topic
 *
 * Combines multiple factors:
 * - Historical performance (mastery score)
 * - Confidence calibration
 * - Recency of practice
 */
export function calculateEstimatedValue(topic: TopicPerformance): number {
  if (topic.attempts === 0) {
    // No data, return neutral value
    return 0.5
  }

  // Performance component (0-1)
  const performanceScore = topic.masteryScore / 100

  // Confidence calibration component (penalty for poor calibration)
  const calibrationPenalty = topic.confidenceCalibrationError
  const calibrationScore = Math.max(0, 1 - calibrationPenalty)

  // Recency component (bonus for topics not seen recently)
  const maxDaysSinceReview = 30
  const recencyBonus = Math.min(topic.timeSinceLastReview / maxDaysSinceReview, 1) * 0.2

  // Weighted combination
  const estimatedValue = (
    performanceScore * 0.6 +
    calibrationScore * 0.2 +
    recencyBonus * 0.2
  )

  return Math.max(0, Math.min(1, estimatedValue))
}

/**
 * Calculate uncertainty for a topic
 *
 * Higher uncertainty = less confident in estimated value
 */
export function calculateUncertainty(topic: TopicPerformance): number {
  if (topic.attempts === 0) {
    return 1.0 // Maximum uncertainty
  }

  // Uncertainty decreases with more attempts (inverse square root)
  const attemptUncertainty = 1 / Math.sqrt(topic.attempts)

  // Add variance-based uncertainty
  const variance = (topic.correctAnswers / topic.attempts) * (1 - topic.correctAnswers / topic.attempts)
  const varianceUncertainty = Math.sqrt(variance)

  // Combine
  return Math.min(1, attemptUncertainty * 0.7 + varianceUncertainty * 0.3)
}
