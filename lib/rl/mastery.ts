/**
 * Mastery Calculation Utilities
 *
 * Handles mastery score updates using Exponential Moving Average (EMA)
 * with confidence weighting and multi-topic support.
 */

export interface MasteryUpdate {
  topic: string
  bloomLevel: number
  oldMastery: number
  newMastery: number
  learningGain: number
}

/**
 * Calculate learning gain from a user response
 * Uses Exponential Moving Average with confidence weighting
 *
 * @param oldMastery - Current mastery score (0-100)
 * @param isCorrect - Whether the user answered correctly
 * @param confidence - User's confidence level (1-5)
 * @returns Learning gain (delta in mastery score)
 */
export function calculateLearningGain(
  oldMastery: number,
  isCorrect: boolean,
  confidence: number
): number {
  // Learning rate increases with confidence
  // High confidence → faster updates (user is certain)
  // Low confidence → slower updates (user is uncertain)
  const learningRate = confidence >= 4 ? 0.4 : confidence >= 3 ? 0.3 : 0.25

  // Target mastery for this response
  const target = isCorrect ? 100 : 0

  // Calculate learning gain (change in mastery)
  const gain = learningRate * (target - oldMastery)

  return gain
}

/**
 * Update mastery score using Exponential Moving Average
 *
 * @param oldMastery - Current mastery score (0-100)
 * @param learningGain - Learning gain from calculateLearningGain
 * @param weight - Weight for multi-topic questions (default 1.0)
 * @returns New mastery score (0-100)
 */
export function updateMastery(
  oldMastery: number,
  learningGain: number,
  weight: number = 1.0
): number {
  const newMastery = oldMastery + (learningGain * weight)

  // Clamp to valid range
  return Math.max(0, Math.min(100, newMastery))
}

/**
 * Check if a topic at a Bloom level has met mastery requirements
 * to unlock the next Bloom level
 *
 * @param masteryScore - Current mastery score (0-100)
 * @param questionsCorrect - Number of correct answers
 * @param threshold - Mastery threshold (default 80%)
 * @param minCorrect - Minimum correct answers required (default 3)
 * @returns True if requirements are met
 */
export function hasMetMasteryRequirements(
  masteryScore: number,
  questionsCorrect: number,
  threshold: number = 80,
  minCorrect: number = 3
): boolean {
  return masteryScore >= threshold && questionsCorrect >= minCorrect
}

/**
 * Calculate mastery updates for a multi-topic question
 *
 * @param primaryTopic - Primary topic being tested
 * @param secondaryTopics - Secondary topics (if any)
 * @param topicWeights - Weights for topics: { primary: 1.0, secondary: [0.3, 0.2] }
 * @param currentMastery - Map of current mastery scores
 * @param bloomLevel - Bloom level of the question
 * @param isCorrect - Whether user answered correctly
 * @param confidence - User's confidence (1-5)
 * @returns Array of mastery updates for all involved topics
 */
export function calculateMultiTopicMasteryUpdates(
  primaryTopic: string,
  secondaryTopics: string[] | null,
  topicWeights: { primary: number; secondary: number[] } | null,
  currentMastery: Map<string, number>,
  bloomLevel: number,
  isCorrect: boolean,
  confidence: number
): MasteryUpdate[] {
  const updates: MasteryUpdate[] = []

  // Calculate base learning gain
  const oldMasteryPrimary = currentMastery.get(`${primaryTopic}_${bloomLevel}`) || 0
  const baseLearningGain = calculateLearningGain(oldMasteryPrimary, isCorrect, confidence)

  // Update primary topic (full weight)
  const primaryWeight = topicWeights?.primary || 1.0
  const newMasteryPrimary = updateMastery(oldMasteryPrimary, baseLearningGain, primaryWeight)

  updates.push({
    topic: primaryTopic,
    bloomLevel,
    oldMastery: oldMasteryPrimary,
    newMastery: newMasteryPrimary,
    learningGain: baseLearningGain * primaryWeight
  })

  // Update secondary topics (if any)
  if (secondaryTopics && secondaryTopics.length > 0) {
    const secondaryWeights = topicWeights?.secondary || []

    secondaryTopics.forEach((topic, index) => {
      const weight = secondaryWeights[index] || 0.1
      const oldMastery = currentMastery.get(`${topic}_${bloomLevel}`) || 0
      const newMastery = updateMastery(oldMastery, baseLearningGain, weight)

      updates.push({
        topic,
        bloomLevel,
        oldMastery,
        newMastery,
        learningGain: baseLearningGain * weight
      })
    })
  }

  return updates
}

/**
 * Calculate confidence calibration score
 * Measures how well user's confidence predicts correctness
 *
 * @param responses - Array of { isCorrect, confidence } pairs
 * @returns Calibration score (0-100, higher is better)
 */
export function calculateConfidenceCalibration(
  responses: Array<{ isCorrect: boolean; confidence: number }>
): number {
  if (responses.length === 0) return 0

  let calibrationSum = 0

  responses.forEach(({ isCorrect, confidence }) => {
    // Perfect calibration examples:
    // - Correct + High confidence (4-5) → good
    // - Incorrect + Low confidence (1-2) → good (aware of uncertainty)
    // - Correct + Low confidence (1-2) → poor (underconfident)
    // - Incorrect + High confidence (4-5) → poor (overconfident)

    if (isCorrect && confidence >= 4) {
      calibrationSum += 1.0  // Perfect: correct and confident
    } else if (isCorrect && confidence === 3) {
      calibrationSum += 0.7  // Good: correct but moderate confidence
    } else if (isCorrect && confidence <= 2) {
      calibrationSum += 0.3  // Poor: correct but not confident (underconfident)
    } else if (!isCorrect && confidence <= 2) {
      calibrationSum += 0.6  // Good: incorrect and uncertain (aware of gap)
    } else if (!isCorrect && confidence === 3) {
      calibrationSum += 0.3  // Poor: incorrect but moderately confident
    } else if (!isCorrect && confidence >= 4) {
      calibrationSum += 0.0  // Very poor: incorrect but very confident (overconfident)
    }
  })

  return (calibrationSum / responses.length) * 100
}

/**
 * Estimate difficulty level based on mastery and Bloom level
 *
 * @param masteryScore - Current mastery (0-100)
 * @param bloomLevel - Bloom taxonomy level (1-6)
 * @returns Difficulty: 'easy', 'medium', or 'hard'
 */
export function estimateDifficulty(
  masteryScore: number,
  bloomLevel: number
): 'easy' | 'medium' | 'hard' {
  // High mastery questions are easier
  if (masteryScore >= 70) {
    return bloomLevel >= 5 ? 'medium' : 'easy'
  }

  // Medium mastery
  if (masteryScore >= 40) {
    return bloomLevel >= 4 ? 'hard' : 'medium'
  }

  // Low mastery - everything is hard
  return bloomLevel >= 3 ? 'hard' : 'medium'
}

/**
 * Calculate days since last practice
 *
 * @param lastPracticedAt - ISO timestamp of last practice
 * @returns Number of days since last practice
 */
export function getDaysSinceLastPractice(lastPracticedAt: string | null): number {
  if (!lastPracticedAt) return 999 // Never practiced

  const lastPracticed = new Date(lastPracticedAt)
  const now = new Date()
  const diffMs = now.getTime() - lastPracticed.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)

  return Math.floor(diffDays)
}
