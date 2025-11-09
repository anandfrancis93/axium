/**
 * Reward Calculation for RL System
 *
 * Multi-component reward function that optimizes for:
 * 1. Learning gain (primary)
 * 2. Confidence calibration
 * 3. Spaced repetition (retention)
 * 4. Recognition method (retrieval strength)
 * 5. Response time (retrieval fluency)
 */

export type RecognitionMethod = 'memory' | 'recognition' | 'educated_guess' | 'random'
export type QuestionFormat = 'mcq_single' | 'mcq_multi' | 'true_false' | 'fill_blank' | 'matching' | 'open_ended'

export interface RewardComponents {
  learningGain: number
  calibration: number
  spacing: number
  recognition: number
  responseTime: number
  streak: number
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
 * @returns Reward component (-3 to +3)
 */
function calculateCalibrationReward(
  isCorrect: boolean,
  confidence: number
): number {
  if (isCorrect) {
    // Correct answers: reward based on confidence level
    if (confidence >= 4) {
      return 3  // High confidence + correct (perfect calibration)
    } else if (confidence === 3) {
      return 2  // Medium confidence + correct (moderate calibration)
    } else {
      return 1  // Low confidence + correct (underconfident)
    }
  } else {
    // Incorrect answers: penalty based on confidence level
    if (confidence <= 2) {
      return -1  // Low confidence + incorrect (good uncertainty)
    } else if (confidence === 3) {
      return -2  // Medium confidence + incorrect (moderate overconfidence)
    } else {
      return -3  // High confidence + incorrect (severe overconfidence)
    }
  }
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
 * Calculate recognition method reward
 * Rewards stronger retrieval methods (memory > recognition > guess)
 *
 * @param recognitionMethod - How user arrived at answer
 * @param isCorrect - Whether answer was correct
 * @returns Reward component (-4 to +3)
 */
function calculateRecognitionReward(
  recognitionMethod: RecognitionMethod | null,
  isCorrect: boolean
): number {
  if (!recognitionMethod) {
    return 0  // No recognition method recorded
  }

  if (isCorrect) {
    // Correct answer: reward based on retrieval strength
    switch (recognitionMethod) {
      case 'memory':
        return 3  // Best: Knew from memory (strong retrieval)
      case 'recognition':
        return 2  // Good: Recognized correct answer
      case 'educated_guess':
        return 1  // Fair: Narrowed down options
      case 'random':
        return 0  // Lucky guess (no credit)
      default:
        return 0
    }
  } else {
    // Incorrect answer: penalty for overconfidence in method
    switch (recognitionMethod) {
      case 'memory':
        return -4  // Thought they knew but were wrong (false memory - worst)
      case 'recognition':
        return -3  // Thought they recognized but were wrong
      case 'educated_guess':
        return -2  // Guess was wrong
      case 'random':
        return -1  // Expected (honest about not knowing)
      default:
        return 0
    }
  }
}

/**
 * Count words in text (helper for reading time estimation)
 */
function countWords(text: string): number {
  return text.trim().split(/\s+/).length
}

/**
 * Calculate streak reward
 * Rewards consecutive correct answers for the same topic (across Bloom levels)
 *
 * @param currentStreak - Number of consecutive correct answers for this topic
 * @param isCorrect - Whether the current answer was correct
 * @returns Reward component (0 to +5)
 */
function calculateStreakReward(
  currentStreak: number,
  isCorrect: boolean
): number {
  // Only reward correct answers
  if (!isCorrect) {
    return 0  // No reward (streak will be reset to 0)
  }

  // Reward based on streak length (AFTER this correct answer)
  const newStreak = currentStreak + 1

  if (newStreak >= 10) {
    return 5  // Outstanding streak! (10+ in a row)
  } else if (newStreak >= 5) {
    return 3  // Excellent streak (5-9 in a row)
  } else if (newStreak >= 3) {
    return 2  // Good streak (3-4 in a row)
  } else if (newStreak >= 2) {
    return 1  // Building momentum (2 in a row)
  } else {
    return 0  // First correct or just broke streak (no bonus yet)
  }
}

/**
 * Calculate response time reward with reading-time-aware evaluation
 * Separates reading time from thinking time to fairly evaluate retrieval speed
 *
 * @param responseTimeSeconds - Time taken to answer in seconds
 * @param isCorrect - Whether answer was correct
 * @param bloomLevel - Current Bloom level (1-6)
 * @param questionText - The question text
 * @param options - Answer options object
 * @param questionFormat - Format of the question
 * @returns Reward component (-3 to +5)
 */
function calculateResponseTimeReward(
  responseTimeSeconds: number,
  isCorrect: boolean,
  bloomLevel: number,
  questionText: string,
  options: Record<string, string> | null,
  questionFormat: QuestionFormat | null
): number {
  // Calculate total word count
  const questionWords = countWords(questionText)
  const optionWords = options
    ? Object.values(options).reduce((sum, opt) => sum + countWords(opt), 0)
    : 0
  const totalWords = questionWords + optionWords

  // Calculate estimated reading time
  // Average reading speed for technical content: 220 WPM (slower than casual 250-300 WPM)
  const readingSpeedWPM = 220
  const estimatedReadingTime = (totalWords / readingSpeedWPM) * 60 // Convert to seconds

  // Calculate thinking/processing time (actual cognitive work)
  // Floor at 0 - student may answer before finishing reading (instant recognition)
  const thinkingTime = Math.max(0, responseTimeSeconds - estimatedReadingTime)

  // Thinking time thresholds by Bloom level (cognitive processing, not reading)
  // These are MUCH shorter than old total-time thresholds
  const thinkingThresholds: Record<number, { fluent: number, good: number, slow: number }> = {
    1: { fluent: 5, good: 15, slow: 30 },    // Remember - quick recall
    2: { fluent: 5, good: 15, slow: 30 },    // Understand - quick comprehension
    3: { fluent: 10, good: 20, slow: 40 },   // Apply - some analysis
    4: { fluent: 15, good: 30, slow: 60 },   // Analyze - deeper thinking
    5: { fluent: 20, good: 45, slow: 90 },   // Evaluate - complex judgment
    6: { fluent: 20, good: 45, slow: 90 }    // Create - synthesis required
  }

  // Format-specific thinking time modifiers
  const formatModifiers: Record<string, number> = {
    true_false: 0.8,      // Simpler decision - 2 options
    mcq_single: 1.0,      // Baseline - 4 options, one correct
    fill_blank: 1.2,      // Need to recall exact term
    mcq_multi: 1.5,       // Evaluate multiple correct answers
    matching: 1.7,        // Multiple pairings to consider
    open_ended: 2.5       // Formulate and type explanation
  }

  const thresholds = thinkingThresholds[bloomLevel] || thinkingThresholds[1]
  const formatModifier = questionFormat ? (formatModifiers[questionFormat] || 1.0) : 1.0

  // Apply format modifier to thresholds
  const fluentThreshold = thresholds.fluent * formatModifier
  const goodThreshold = thresholds.good * formatModifier
  const slowThreshold = thresholds.slow * formatModifier

  if (isCorrect) {
    // Correct answer: reward based on thinking speed (not total time)
    if (thinkingTime < fluentThreshold) {
      return 5  // Fluent mastery (automatic retrieval)
    } else if (thinkingTime < goodThreshold) {
      return 3  // Solid knowledge (thoughtful retrieval)
    } else if (thinkingTime < slowThreshold) {
      return 1  // Slow retrieval (struggling but got it)
    } else {
      return -1  // Too slow (very uncertain or overthinking)
    }
  } else {
    // Incorrect answer: penalize carelessness
    if (thinkingTime < fluentThreshold * 0.75) {
      return -3  // Careless/impulsive (rushed and wrong)
    } else {
      return 0  // Expected (took time but still wrong - honest attempt)
    }
  }
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
  recognitionMethod?: RecognitionMethod | null
  responseTimeSeconds?: number | null
  bloomLevel?: number
  questionText?: string
  options?: Record<string, string> | null
  questionFormat?: QuestionFormat | null
  currentStreak?: number
}): RewardComponents {
  const {
    learningGain,
    isCorrect,
    confidence,
    currentMastery,
    daysSinceLastPractice,
    recognitionMethod = null,
    responseTimeSeconds = null,
    bloomLevel = 1,
    questionText = '',
    options = null,
    questionFormat = null,
    currentStreak = 0
  } = params

  // Calculate each component
  const learningGainReward = calculateLearningGainReward(learningGain)
  const calibrationReward = calculateCalibrationReward(isCorrect, confidence)
  const spacingReward = calculateSpacingReward(daysSinceLastPractice, isCorrect)
  const recognitionReward = calculateRecognitionReward(recognitionMethod, isCorrect)

  // Calculate response time reward (only if time is provided)
  const responseTimeReward = responseTimeSeconds !== null
    ? calculateResponseTimeReward(responseTimeSeconds, isCorrect, bloomLevel, questionText, options, questionFormat)
    : 0

  // Calculate streak reward
  const streakReward = calculateStreakReward(currentStreak, isCorrect)

  // Total reward (range: approximately -21 to +35)
  const total = learningGainReward + calibrationReward + spacingReward + recognitionReward + responseTimeReward + streakReward

  return {
    learningGain: learningGainReward,
    calibration: calibrationReward,
    spacing: spacingReward,
    recognition: recognitionReward,
    responseTime: responseTimeReward,
    streak: streakReward,
    total
  }
}

/**
 * Normalize reward to [0, 1] range for Thompson Sampling
 * Assumes reward range of [-21, 30]
 *
 * @param reward - Raw reward value
 * @returns Normalized reward in [0, 1]
 */
export function normalizeReward(reward: number): number {
  // Map [-21, 30] → [0, 1]
  const normalized = (reward + 21) / 51
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

  if (components.recognition === 5) {
    parts.push('Strong retrieval from memory!')
  } else if (components.recognition === 3) {
    parts.push('Good recognition')
  } else if (components.recognition < -2) {
    parts.push('False memory - review this topic')
  }

  if (components.spacing > 3) {
    parts.push('Great retention!')
  }

  return parts.length > 0 ? parts.join(' • ') : 'Moderate progress'
}
