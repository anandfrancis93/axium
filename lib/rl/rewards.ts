/**
 * Reward Calculation for RL System
 *
 * Multi-component reward function that optimizes for:
 * 1. Learning gain (primary)
 * 2. Confidence calibration
 * 3. Engagement (appropriate difficulty)
 * 4. Spaced repetition (retention)
 */

export interface RewardComponents {
  learningGain: number
  calibration: number
  engagement: number
  spacing: number
  total: number
}

/**
 * Calculate learning gain reward
 * Rewards improvement in mastery
 *
 * @param learningGain - Change in mastery score
 * @returns Reward component (-10 to +10)
 */
function calculateLearningGainReward(learningGain: number): number {
  // Learning gain ranges from -100 to +100
  // Normalize to -10 to +10
  return Math.max(-10, Math.min(10, learningGain / 10))
}

/**
 * Calculate confidence calibration reward
 * Rewards accurate self-assessment
 *
 * @param isCorrect - Whether answer was correct
 * @param confidence - User's confidence (1-5)
 * @returns Reward component (-5 to +5)
 */
function calculateCalibrationReward(
  isCorrect: boolean,
  confidence: number
): number {
  if (isCorrect && confidence >= 4) {
    return 5  // Correctly confident
  } else if (isCorrect && confidence === 3) {
    return 2  // Moderately confident, correct
  } else if (isCorrect && confidence <= 2) {
    return -2  // Underconfident (correct but uncertain)
  } else if (!isCorrect && confidence <= 2) {
    return 2  // Correctly uncertain (good metacognition)
  } else if (!isCorrect && confidence === 3) {
    return -2  // Moderately confident but wrong
  } else if (!isCorrect && confidence >= 4) {
    return -5  // Overconfident (very wrong - worst case)
  }

  return 0
}

/**
 * Calculate engagement reward
 * Penalizes questions that are too easy or too hard
 *
 * @param currentMastery - Current mastery score (0-100)
 * @param isCorrect - Whether answer was correct
 * @returns Reward component (-3 to 0)
 */
function calculateEngagementReward(
  currentMastery: number,
  isCorrect: boolean
): number {
  // Too easy: high mastery + correct answer (no challenge)
  if (currentMastery > 90 && isCorrect) {
    return -3
  }

  // Too hard: low mastery + incorrect answer (discouraging)
  if (currentMastery < 20 && !isCorrect) {
    return -3
  }

  // Appropriate difficulty
  return 0
}

/**
 * Calculate spaced repetition reward
 * Rewards good retention over time
 *
 * @param daysSinceLastPractice - Days since topic was last practiced
 * @param isCorrect - Whether answer was correct
 * @returns Reward component (0 to +5)
 */
function calculateSpacingReward(
  daysSinceLastPractice: number,
  isCorrect: boolean
): number {
  if (!isCorrect) {
    return 0  // Only reward correct answers after spacing
  }

  // Bonus for good retention
  if (daysSinceLastPractice >= 7) {
    return 5  // Excellent long-term retention (1+ week)
  } else if (daysSinceLastPractice >= 3) {
    return 3  // Good retention (3-7 days)
  } else if (daysSinceLastPractice >= 1) {
    return 1  // Some spacing (1-3 days)
  }

  return 0  // Same day practice (no spacing benefit)
}

/**
 * Calculate total reward for a user response
 *
 * @param params - Reward calculation parameters
 * @returns Reward components and total reward
 */
export function calculateReward(params: {
  learningGain: number
  isCorrect: boolean
  confidence: number
  currentMastery: number
  daysSinceLastPractice: number
}): RewardComponents {
  const {
    learningGain,
    isCorrect,
    confidence,
    currentMastery,
    daysSinceLastPractice
  } = params

  // Calculate each component
  const learningGainReward = calculateLearningGainReward(learningGain)
  const calibrationReward = calculateCalibrationReward(isCorrect, confidence)
  const engagementReward = calculateEngagementReward(currentMastery, isCorrect)
  const spacingReward = calculateSpacingReward(daysSinceLastPractice, isCorrect)

  // Total reward (range: approximately -18 to +23)
  // Typically: -10 to +20 for normal cases
  const total = learningGainReward + calibrationReward + engagementReward + spacingReward

  return {
    learningGain: learningGainReward,
    calibration: calibrationReward,
    engagement: engagementReward,
    spacing: spacingReward,
    total
  }
}

/**
 * Normalize reward to [0, 1] range for Thompson Sampling
 * Assumes reward range of [-10, 20]
 *
 * @param reward - Raw reward value
 * @returns Normalized reward in [0, 1]
 */
export function normalizeReward(reward: number): number {
  // Map [-10, 20] → [0, 1]
  const normalized = (reward + 10) / 30
  return Math.max(0, Math.min(1, normalized))
}

/**
 * Calculate exploration bonus for Thompson Sampling
 * Encourages trying arms (topics) that haven't been selected much
 *
 * @param timesSelected - How many times this arm has been selected
 * @param totalSelections - Total selections across all arms
 * @returns Exploration bonus (0 to 1)
 */
export function calculateExplorationBonus(
  timesSelected: number,
  totalSelections: number
): number {
  if (totalSelections === 0) return 1.0

  // Higher bonus for less-selected arms
  const selectionRate = timesSelected / totalSelections
  const explorationBonus = 1.0 - Math.sqrt(selectionRate)

  return Math.max(0, Math.min(1, explorationBonus))
}

/**
 * Get a human-readable description of reward components
 *
 * @param components - Reward components
 * @returns Human-readable string
 */
export function describeReward(components: RewardComponents): string {
  const parts: string[] = []

  if (components.learningGain > 5) {
    parts.push('Strong learning gain!')
  } else if (components.learningGain > 0) {
    parts.push('Learning gain')
  } else if (components.learningGain < -5) {
    parts.push('Mastery decreased')
  }

  if (components.calibration > 3) {
    parts.push('Excellent calibration')
  } else if (components.calibration < -3) {
    parts.push('Calibration needs work')
  }

  if (components.engagement < -2) {
    parts.push('Difficulty mismatch')
  }

  if (components.spacing > 3) {
    parts.push('Great retention!')
  }

  return parts.length > 0 ? parts.join(' • ') : 'Moderate progress'
}
