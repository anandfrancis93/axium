/**
 * Thompson Sampling Contextual Bandit Agent
 *
 * Selects optimal (topic, bloom_level) pairs for adaptive learning.
 * Balances exploration (trying new topics) vs exploitation (focusing on what works).
 */

import { createClient } from '@/lib/supabase/server'
import { sampleBeta } from './beta-distribution'
import { getDaysSinceLastPractice, hasMetMasteryRequirements } from './mastery'

export interface Arm {
  topicId: string
  topicName: string
  topicFullName: string  // Full hierarchical name (e.g., "Security Architecture > Application Security > Application")
  bloomLevel: number
}

export interface ArmStats {
  topicId: string
  topicName: string
  bloomLevel: number
  alpha: number
  beta: number
  timesSelected: number
  avgReward: number
}

export interface MasteryData {
  topicId: string
  topicName: string
  bloomLevel: number
  masteryScore: number
  questionsCorrect: number
  questionsAttempted: number
  lastPracticedAt: string | null
}

export interface ArmSample {
  arm: Arm
  sample: number
  adjustedSample: number
  masteryScore: number
  isUnlocked: boolean
  masteryBonus?: number
  spacingBonus?: number
  explorationBonus?: number
  unlockBonus?: number
}

/**
 * Get all available arms (topic, bloom_level pairs) for a user in a chapter
 * Only returns arms that meet prerequisite requirements
 *
 * @param userId - User ID
 * @param chapterId - Chapter ID
 * @returns Array of available arms with unlock status
 */
export async function getAvailableArms(
  userId: string,
  chapterId: string
): Promise<ArmSample[]> {
  const supabase = await createClient()

  // Get unlocked arms from database function
  // Function filters server-side to stay under PostgREST's 1000 row limit
  const { data: arms, error } = await supabase.rpc('get_unlocked_topic_arms', {
    p_user_id: userId,
    p_chapter_id: chapterId
  })

  if (error) {
    console.error('Error getting available arms:', error)
    return []
  }

  if (!arms || arms.length === 0) {
    console.warn('No available arms returned for user', userId, 'in chapter', chapterId)
    return []
  }

  // Map to ArmSample format
  const availableArms = arms
    .map((arm: any) => ({
      arm: {
        topicId: arm.topic_id,
        topicName: arm.topic,
        topicFullName: arm.topic_full_name || arm.topic,
        bloomLevel: arm.bloom_level
      },
      sample: 0,
      adjustedSample: 0,
      masteryScore: arm.mastery_score || 0,
      isUnlocked: true
    }))

  return availableArms
}

/**
 * Get RL arm statistics for all arms in a chapter
 *
 * @param userId - User ID
 * @param chapterId - Chapter ID
 * @returns Map of arm key to statistics
 */
export async function getArmStats(
  userId: string,
  chapterId: string
): Promise<Map<string, ArmStats>> {
  const supabase = await createClient()

  const { data: stats, error } = await supabase
    .from('rl_arm_stats')
    .select('*')
    .eq('user_id', userId)
    .eq('chapter_id', chapterId)

  if (error) {
    console.error('Error getting arm stats:', error)
    return new Map()
  }

  const statsMap = new Map<string, ArmStats>()

  stats?.forEach((stat: any) => {
    const key = `${stat.topic_id}_${stat.bloom_level}`
    statsMap.set(key, {
      topicId: stat.topic_id,
      topicName: stat.topic || '', // May be null if migrating
      bloomLevel: stat.bloom_level,
      alpha: parseFloat(stat.alpha),
      beta: parseFloat(stat.beta),
      timesSelected: stat.times_selected || 0,
      avgReward: parseFloat(stat.avg_reward) || 0
    })
  })

  return statsMap
}

/**
 * Get user's mastery data for a chapter
 *
 * @param userId - User ID
 * @param chapterId - Chapter ID
 * @returns Map of topic_bloomLevel to mastery data
 */
export async function getUserMastery(
  userId: string,
  chapterId: string
): Promise<Map<string, MasteryData>> {
  const supabase = await createClient()

  const { data: mastery, error } = await supabase
    .from('user_topic_mastery')
    .select('*')
    .eq('user_id', userId)
    .eq('chapter_id', chapterId)

  if (error) {
    console.error('Error getting user mastery:', error)
    return new Map()
  }

  const masteryMap = new Map<string, MasteryData>()

  mastery?.forEach((m: any) => {
    const key = `${m.topic_id}_${m.bloom_level}`
    masteryMap.set(key, {
      topicId: m.topic_id,
      topicName: m.topic || '', // May be null if migrating
      bloomLevel: m.bloom_level,
      masteryScore: parseFloat(m.mastery_score) || 0,
      questionsCorrect: m.questions_correct || 0,
      questionsAttempted: m.questions_attempted || 0,
      lastPracticedAt: m.last_practiced_at
    })
  })

  return masteryMap
}

/**
 * Thompson Sampling: Select next (topic, bloom_level) arm to pull
 *
 * Algorithm:
 * 1. For each available arm, sample from its Beta(α, β) distribution
 * 2. Apply context-based multipliers:
 *    - Low mastery → higher priority
 *    - Not practiced recently → higher priority
 *    - Exploration bonus for rarely-selected arms
 * 3. Select arm with highest adjusted sample
 *
 * @param userId - User ID
 * @param chapterId - Chapter ID
 * @returns Selected arm (topic, bloom_level)
 */
export interface ThompsonSamplingResult {
  selectedArm: Arm
  allSamples: ArmSample[]
  reasoning: string
}

export async function selectArmThompsonSampling(
  userId: string,
  chapterId: string
): Promise<Arm | null> {
  // Get available arms
  const availableArms = await getAvailableArms(userId, chapterId)

  if (availableArms.length === 0) {
    console.warn('No available arms for user', userId, 'in chapter', chapterId)
    return null
  }

  // Get arm statistics
  const armStats = await getArmStats(userId, chapterId)

  // Get user mastery
  const mastery = await getUserMastery(userId, chapterId)

  // Thompson Sampling: sample from each arm's Beta distribution
  const samples: ArmSample[] = availableArms.map(armData => {
    const key = `${armData.arm.topicId}_${armData.arm.bloomLevel}`

    // Get arm statistics (default to uniform prior Beta(1, 1))
    const stats = armStats.get(key) || {
      topicId: armData.arm.topicId,
      topicName: armData.arm.topicName,
      bloomLevel: armData.arm.bloomLevel,
      alpha: 1.0,
      beta: 1.0,
      timesSelected: 0,
      avgReward: 0
    }

    // Sample from Beta distribution
    const sample = sampleBeta(stats.alpha, stats.beta)

    // Get mastery data
    const masteryData = mastery.get(key)
    const topicMastery = masteryData?.masteryScore || 0
    const daysSince = getDaysSinceLastPractice(masteryData?.lastPracticedAt || null)

    // Apply context-based multipliers

    // 1. Mastery bonus: Prioritize topics with lower mastery
    // Range: 0 to 1 (low mastery = 1, high mastery = 0)
    const masteryBonus = (100 - topicMastery) / 100

    // 2. Spacing bonus: Prioritize topics not practiced recently
    // Range: 0 to 1.5 (never practiced = 1.5, practiced today = 0)
    const spacingBonus = Math.min(daysSince / 7, 1.5)

    // 3. Exploration bonus: Prioritize rarely-selected arms
    // Range: 0 to 0.5
    const explorationBonus = stats.timesSelected === 0 ? 0.5 : Math.max(0, 0.5 - stats.timesSelected / 20)

    // 4. Recently unlocked bonus: Prioritize newly unlocked Bloom levels
    // Check if this Bloom level was recently unlocked
    const prereqKey = `${armData.arm.topicId}_${armData.arm.bloomLevel - 1}`
    const prereqMastery = mastery.get(prereqKey)
    const isRecentlyUnlocked = armData.arm.bloomLevel > 1 &&
      prereqMastery &&
      hasMetMasteryRequirements(prereqMastery.masteryScore, prereqMastery.questionsCorrect) &&
      (masteryData?.questionsAttempted || 0) < 3

    const unlockBonus = isRecentlyUnlocked ? 0.3 : 0

    // Calculate adjusted sample
    const adjustedSample = sample * (1 + masteryBonus + spacingBonus + explorationBonus + unlockBonus)

    return {
      ...armData,
      sample,
      adjustedSample,
      masteryBonus,
      spacingBonus,
      explorationBonus,
      unlockBonus
    }
  })

  // Select arm with highest adjusted sample
  const selected = samples.reduce((best, current) =>
    current.adjustedSample > best.adjustedSample ? current : best
  )

  console.log('Thompson Sampling selection:', {
    selected: `${selected.arm.topicName}_L${selected.arm.bloomLevel}`,
    topicId: selected.arm.topicId,
    sample: selected.sample.toFixed(3),
    adjustedSample: selected.adjustedSample.toFixed(3),
    mastery: selected.masteryScore.toFixed(1),
    totalArms: samples.length
  })

  // Build user-friendly reasoning
  const reasons: string[] = []

  // Get mastery data for selected arm
  const key = `${selected.arm.topicId}_${selected.arm.bloomLevel}`
  const masteryData = mastery.get(key)
  const daysSince = getDaysSinceLastPractice(masteryData?.lastPracticedAt || null)

  // Main reason based on mastery
  if (selected.masteryScore < 40) {
    reasons.push(`You're still learning this topic (${selected.masteryScore.toFixed(0)}% mastery)`)
  } else if (selected.masteryScore < 70) {
    reasons.push(`You need more practice with this topic (${selected.masteryScore.toFixed(0)}% mastery)`)
  } else {
    reasons.push(`Maintaining your knowledge of this topic (${selected.masteryScore.toFixed(0)}% mastery)`)
  }

  // Spacing reason
  if (daysSince === null || daysSince > 7) {
    reasons.push(`It's been a while since you practiced this`)
  } else if (daysSince > 3) {
    reasons.push(`Good timing to review before you forget`)
  }

  // Exploration reason
  if ((masteryData?.questionsAttempted || 0) === 0) {
    reasons.push(`This is a new topic for you`)
  } else if ((masteryData?.questionsAttempted || 0) < 3) {
    reasons.push(`You've only practiced this ${masteryData?.questionsAttempted || 0} time${(masteryData?.questionsAttempted || 0) === 1 ? '' : 's'} before`)
  }

  // Unlock reason
  if (selected.unlockBonus && selected.unlockBonus > 0) {
    reasons.push(`You recently unlocked this level`)
  }

  const userFriendlyReasoning = reasons.length > 0
    ? reasons.join('. ') + '.'
    : `This topic will help you learn most effectively right now.`

  // Store decision context for logging (will be logged by next-question endpoint)
  ;(selected.arm as any)._decisionContext = {
    allSamples: samples.map(s => ({
      topic_id: s.arm.topicId,
      topic_name: s.arm.topicName,
      bloom_level: s.arm.bloomLevel,
      sampled_value: s.sample,
      adjusted_value: s.adjustedSample,
      mastery_score: s.masteryScore
    })),
    selectedSample: {
      topic_id: selected.arm.topicId,
      topic_name: selected.arm.topicName,
      bloom_level: selected.arm.bloomLevel,
      sampled_value: selected.sample,
      adjusted_value: selected.adjustedSample,
      mastery_score: selected.masteryScore
    },
    reasoning: userFriendlyReasoning
  }

  return selected.arm
}

/**
 * Epsilon-Greedy: Alternative selection strategy
 * With probability epsilon, explore randomly; otherwise exploit best arm
 *
 * @param userId - User ID
 * @param chapterId - Chapter ID
 * @param epsilon - Exploration probability (default 0.1 = 10%)
 * @returns Selected arm
 */
export async function selectArmEpsilonGreedy(
  userId: string,
  chapterId: string,
  epsilon: number = 0.1
): Promise<Arm | null> {
  const availableArms = await getAvailableArms(userId, chapterId)

  if (availableArms.length === 0) {
    return null
  }

  // Explore: select random arm
  if (Math.random() < epsilon) {
    const randomIndex = Math.floor(Math.random() * availableArms.length)
    return availableArms[randomIndex].arm
  }

  // Exploit: select best arm based on average reward
  const armStats = await getArmStats(userId, chapterId)

  const armsWithRewards = availableArms.map(armData => {
    const key = `${armData.arm.topicId}_${armData.arm.bloomLevel}`
    const stats = armStats.get(key)

    return {
      arm: armData.arm,
      avgReward: stats?.avgReward || 0
    }
  })

  const best = armsWithRewards.reduce((best, current) =>
    current.avgReward > best.avgReward ? current : best
  )

  return best.arm
}

/**
 * Get arm key for storage
 *
 * @param arm - Arm to get key for
 * @returns String key
 */
export function getArmKey(arm: Arm): string {
  return `${arm.topicId}_${arm.bloomLevel}`
}
