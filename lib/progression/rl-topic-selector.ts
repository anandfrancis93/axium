/**
 * RL Topic Selection Algorithm
 *
 * Automatically selects the optimal topic and Bloom level for the next question
 * based on reinforcement learning principles.
 *
 * Selection Strategy:
 * - Cold Start (< 10 attempts): Pure random from foundational topics
 * - Exploration (10-50 attempts): ε-greedy with ε=0.3
 * - Optimization (50-150 attempts): ε-greedy with ε=0.1
 * - Stabilization (150+ attempts): Spaced repetition focused
 */

import { createClient } from '@/lib/supabase/server'

export interface TopicSelection {
  topicId: string
  topicName: string
  bloomLevel: number
  selectionReason: string
  priority: number
}

interface UserProgressRow {
  topic_id: string
  topics: {
    id: string
    name: string
    subject_id: string
  }
  total_attempts: number
  current_bloom_level: number
  calibration_mean: number | null
  calibration_stddev: number | null
  calibration_slope: number | null
  rl_phase: string | null
  last_practiced_at: string | null
  mastery_scores: Record<string, any>
}

interface TopicPriority {
  topicId: string
  topicName: string
  priority: number
  reason: string
  recommendedBloomLevel: number
}

/**
 * Main RL topic selection function
 */
export async function selectNextTopic(userId: string): Promise<TopicSelection> {
  const supabase = await createClient()

  // First, get all topics that have knowledge chunks (content available)
  const { data: topicsWithContent, error: contentError } = await supabase
    .from('knowledge_chunks')
    .select('topic_id')
    .not('topic_id', 'is', null)

  if (contentError) {
    console.error('Error fetching topics with content:', contentError)
    throw new Error('Failed to fetch available topics')
  }

  const availableTopicIds = new Set(
    topicsWithContent?.map((chunk: any) => chunk.topic_id) || []
  )

  if (availableTopicIds.size === 0) {
    throw new Error('No learning materials uploaded. Please upload content first.')
  }

  // Fetch all user progress
  const { data: progressData, error } = await supabase
    .from('user_progress')
    .select(`
      topic_id,
      topics!inner (
        id,
        name,
        subject_id
      ),
      total_attempts,
      current_bloom_level,
      calibration_mean,
      calibration_stddev,
      calibration_slope,
      rl_phase,
      last_practiced_at,
      mastery_scores
    `)
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching user progress:', error)
    throw new Error('Failed to fetch user progress')
  }

  const progress = progressData as unknown as UserProgressRow[]

  // Filter to only topics with available content
  const progressWithContent = progress.filter(p => availableTopicIds.has(p.topic_id))

  // Determine total attempts across all topics to establish global phase
  const totalAttempts = progressWithContent.reduce((sum, p) => sum + p.total_attempts, 0)
  const globalPhase = determineGlobalPhase(totalAttempts)

  // Cold start: Pure random from available topics with content
  if (globalPhase === 'cold_start' || progressWithContent.length === 0) {
    return handleColdStart(supabase, userId, availableTopicIds)
  }

  // Calculate priority for each topic (only those with content)
  const priorities = calculateTopicPriorities(progressWithContent, globalPhase)

  if (priorities.length === 0) {
    // Fallback to cold start if no priorities calculated
    return handleColdStart(supabase, userId, availableTopicIds)
  }

  // Apply epsilon-greedy selection
  const epsilonRate = getEpsilonRate(globalPhase)
  const selection = epsilonGreedySelect(priorities, epsilonRate)

  return {
    topicId: selection.topicId,
    topicName: selection.topicName,
    bloomLevel: selection.recommendedBloomLevel,
    selectionReason: selection.reason,
    priority: selection.priority
  }
}

/**
 * Determine global RL phase based on total attempts
 */
function determineGlobalPhase(totalAttempts: number): string {
  if (totalAttempts < 10) return 'cold_start'
  if (totalAttempts < 50) return 'exploration'
  if (totalAttempts < 150) return 'optimization'
  return 'stabilization'
}

/**
 * Handle cold start: Random selection from available topics with content
 */
async function handleColdStart(
  supabase: any,
  userId: string,
  availableTopicIds: Set<string>
): Promise<TopicSelection> {
  // Get all topics that have content
  const { data: allTopics, error } = await supabase
    .from('topics')
    .select('id, name, subject_id')
    .in('id', Array.from(availableTopicIds))
    .order('name')

  if (error || !allTopics || allTopics.length === 0) {
    throw new Error('No topics with learning materials available. Please upload content first.')
  }

  // Random selection from topics with content
  const randomIndex = Math.floor(Math.random() * allTopics.length)
  const selectedTopic = allTopics[randomIndex]

  // Start at Bloom level 1
  return {
    topicId: selectedTopic.id,
    topicName: selectedTopic.name,
    bloomLevel: 1,
    selectionReason: 'Cold start: Random exploration to build initial profile',
    priority: 0
  }
}

/**
 * Calculate priority scores for all topics
 */
function calculateTopicPriorities(
  progress: UserProgressRow[],
  globalPhase: string
): TopicPriority[] {
  const now = new Date()

  return progress.map(p => {
    let priority = 0
    const reasons: string[] = []

    // Component 1: Calibration mean (lower = higher priority)
    // Range: -1.5 to +1.5, normalize to 0-1
    const calibrationMean = p.calibration_mean ?? 0
    const calibrationPriority = (1.5 - calibrationMean) / 3  // 0-1 range
    priority += calibrationPriority * 0.4  // 40% weight
    if (calibrationMean < 0.5) {
      reasons.push('low calibration')
    }

    // Component 2: Time since last practice (spaced repetition)
    const lastPracticed = p.last_practiced_at ? new Date(p.last_practiced_at) : null
    if (lastPracticed) {
      const hoursSince = (now.getTime() - lastPracticed.getTime()) / (1000 * 60 * 60)

      // Optimal spacing: 24h, 72h, 168h (1 day, 3 days, 1 week)
      // Priority increases if we're near or past optimal spacing
      let spacingPriority = 0
      if (hoursSince >= 168) spacingPriority = 0.9  // 1 week+
      else if (hoursSince >= 72) spacingPriority = 0.7  // 3 days
      else if (hoursSince >= 24) spacingPriority = 0.5  // 1 day
      else spacingPriority = 0.1  // Too recent

      priority += spacingPriority * 0.3  // 30% weight
      if (hoursSince >= 72) {
        reasons.push('needs review')
      }
    } else {
      priority += 0.3  // 30% weight for never practiced
      reasons.push('never practiced')
    }

    // Component 3: Mastery gaps (TRACK 2)
    // Check if any Bloom level has low mastery
    const masteryScores = p.mastery_scores
    let lowestMastery = 100
    let lowestLevel = 1

    for (const [level, scores] of Object.entries(masteryScores)) {
      if (typeof scores === 'object') {
        // New format: {"1": {"mcq_single": 85}}
        const avgMastery = Object.values(scores as Record<string, number>).reduce(
          (sum, score) => sum + score, 0
        ) / Object.keys(scores).length

        if (avgMastery < lowestMastery) {
          lowestMastery = avgMastery
          lowestLevel = parseInt(level)
        }
      } else if (typeof scores === 'number') {
        // Legacy format: {"1": 85}
        if (scores < lowestMastery) {
          lowestMastery = scores
          lowestLevel = parseInt(level)
        }
      }
    }

    const masteryPriority = (100 - lowestMastery) / 100  // 0-1 range
    priority += masteryPriority * 0.2  // 20% weight
    if (lowestMastery < 70) {
      reasons.push(`mastery gap at level ${lowestLevel}`)
    }

    // Component 4: Variance/consistency (prefer stable improvement)
    const stddev = p.calibration_stddev ?? 0
    if (stddev > 0.5) {
      priority += 0.1  // 10% weight for high variance (needs stabilization)
      reasons.push('high variance')
    }

    // Recommend Bloom level based on current progress
    let recommendedBloomLevel = p.current_bloom_level

    // If current level is mastered (>80% across formats), advance
    const currentLevelMastery = masteryScores[p.current_bloom_level]
    if (currentLevelMastery) {
      const avgCurrentMastery = typeof currentLevelMastery === 'number'
        ? currentLevelMastery
        : Object.values(currentLevelMastery as Record<string, number>).reduce(
            (sum, score) => sum + score, 0
          ) / Object.keys(currentLevelMastery).length

      if (avgCurrentMastery > 80 && p.current_bloom_level < 6) {
        recommendedBloomLevel = p.current_bloom_level + 1
        reasons.push('ready to advance')
      }
    }

    // If there's a mastery gap at lower level, recommend that level
    if (lowestMastery < 70 && lowestLevel < p.current_bloom_level) {
      recommendedBloomLevel = lowestLevel
      reasons.unshift('fill mastery gap')
    }

    return {
      topicId: p.topic_id,
      topicName: p.topics.name,
      priority: Math.min(priority, 1),  // Clamp to 0-1
      reason: reasons.join(', ') || 'continue practice',
      recommendedBloomLevel
    }
  })
}

/**
 * Get epsilon rate based on global phase
 */
function getEpsilonRate(globalPhase: string): number {
  switch (globalPhase) {
    case 'exploration':
      return 0.3  // 30% random exploration
    case 'optimization':
      return 0.1  // 10% random exploration
    case 'stabilization':
      return 0.05  // 5% random exploration
    default:
      return 0.3
  }
}

/**
 * Epsilon-greedy selection
 */
function epsilonGreedySelect(
  priorities: TopicPriority[],
  epsilon: number
): TopicPriority {
  if (priorities.length === 0) {
    throw new Error('No topics available for selection')
  }

  // Random exploration
  if (Math.random() < epsilon) {
    const randomIndex = Math.floor(Math.random() * priorities.length)
    const selected = priorities[randomIndex]
    return {
      ...selected,
      reason: `Exploration: ${selected.reason}`
    }
  }

  // Exploitation: Select highest priority
  const sortedByPriority = [...priorities].sort((a, b) => b.priority - a.priority)
  const selected = sortedByPriority[0]
  return {
    ...selected,
    reason: `Exploitation: ${selected.reason}`
  }
}
