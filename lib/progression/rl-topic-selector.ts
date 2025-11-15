/**
 * Enhanced RL Topic Selection Algorithm v2.0
 *
 * 80-20 SPLIT:
 * - 8 out of 10 questions: RL-driven (calibration, mastery gaps, variance)
 * - 2 out of 10 questions: Spaced repetition (time-based review)
 *
 * PREREQUISITE CHECKING:
 * - Uses Supabase prerequisites array
 * - Verifies prerequisite mastery before unlocking topics
 * - Filters to only eligible topics
 *
 * CONTINUOUS LEARNING:
 * - No session concept - generates questions indefinitely
 * - Tracks question count in user_responses
 * - Adapts strategy based on total attempts
 */

import { createClient } from '@/lib/supabase/server'
import { createSession } from '@/lib/neo4j/client'

export interface TopicSelection {
  topicId: string
  topicName: string
  bloomLevel: number
  selectionReason: string
  priority: number
  selectionMethod: 'rl' | 'spaced_repetition'
}

interface UserProgressRow {
  topic_id: string
  topics: {
    id: string
    name: string
    subject_id: string
    prerequisites: string[]
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
  prerequisites: string[]
}

/**
 * Main RL topic selection function with 80-20 RL/SR split
 */
export async function selectNextTopic(userId: string): Promise<TopicSelection> {
  const supabase = await createClient()

  // Get total questions asked by this user
  const { count: totalQuestions } = await supabase
    .from('user_responses')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  const questionCount = totalQuestions || 0
  console.log(`[RL] User has answered ${questionCount} questions total`)

  // Determine if this should be RL or Spaced Repetition
  // 2 out of every 10 questions (20%) are SR, rest are RL
  // SR on questions: 5, 10, 15, 20, 25, 30... (every 5th)
  const isSpacedRepetition = ((questionCount + 1) % 5 === 0)

  console.log(`[RL] Question ${questionCount + 1}: ${isSpacedRepetition ? 'SPACED REPETITION (20%)' : 'RL-DRIVEN (80%)'}`)

  // Get all available topics
  const { data: allTopics, error: topicsError } = await supabase
    .from('topics')
    .select('id, name, prerequisites, chapter_id, chapters(subject_id, subjects(name))')

  if (topicsError || !allTopics || allTopics.length === 0) {
    throw new Error('No topics found in database')
  }

  // Get user progress for all topics
  const { data: progressData } = await supabase
    .from('user_progress')
    .select(`
      topic_id,
      topics!inner (
        id,
        name,
        subject_id,
        prerequisites
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

  const progress = (progressData || []) as unknown as UserProgressRow[]

  // Filter topics to only those with prerequisites met
  const eligibleTopics = await filterByPrerequisites(
    supabase,
    userId,
    allTopics,
    progress
  )

  if (eligibleTopics.length === 0) {
    throw new Error('No eligible topics found. Please check prerequisite requirements.')
  }

  console.log(`[RL] ${eligibleTopics.length} topics eligible (prerequisites met)`)

  // Determine selection method
  if (isSpacedRepetition) {
    return selectSpacedRepetitionTopic(eligibleTopics, progress)
  } else {
    return selectRLTopic(eligibleTopics, progress, questionCount)
  }
}

/**
 * Filter topics to only those with prerequisites met
 */
async function filterByPrerequisites(
  supabase: any,
  userId: string,
  allTopics: any[],
  progress: UserProgressRow[]
): Promise<any[]> {
  // Build a map of topic mastery status
  const topicMastery = new Map<string, { mastered: boolean; highestBloom: number }>()

  for (const p of progress) {
    // Calculate average mastery across all Bloom levels for this topic
    const masteryScores = p.mastery_scores
    let totalMastery = 0
    let count = 0

    for (const scores of Object.values(masteryScores)) {
      if (typeof scores === 'object') {
        const avgForLevel = Object.values(scores as Record<string, number>).reduce(
          (sum, score) => sum + score, 0
        ) / Object.keys(scores).length
        totalMastery += avgForLevel
        count++
      } else if (typeof scores === 'number') {
        totalMastery += scores
        count++
      }
    }

    const avgMastery = count > 0 ? totalMastery / count : 0
    const mastered = avgMastery >= 70 // 70% threshold for prerequisite completion
    const highestBloom = p.current_bloom_level

    topicMastery.set(p.topic_id, { mastered, highestBloom })
  }

  // Filter topics
  const eligible = allTopics.filter(topic => {
    const prereqs = topic.prerequisites || []

    // No prerequisites - always eligible
    if (prereqs.length === 0) {
      return true
    }

    // Check if all prerequisites are mastered
    for (const prereqId of prereqs) {
      const prereqStatus = topicMastery.get(prereqId)

      // If prerequisite not attempted or not mastered, not eligible
      if (!prereqStatus || !prereqStatus.mastered) {
        return false
      }
    }

    return true
  })

  return eligible
}

/**
 * Select topic using Spaced Repetition (SR)
 */
function selectSpacedRepetitionTopic(
  eligibleTopics: any[],
  progress: UserProgressRow[]
): TopicSelection {
  const now = new Date()

  // Filter to topics that have been practiced before (have progress)
  const practicedTopics = progress.filter(p =>
    eligibleTopics.some(t => t.id === p.topic_id)
  )

  if (practicedTopics.length === 0) {
    // No practiced topics yet - fall back to RL for cold start
    console.log('[SR] No practiced topics - falling back to RL')
    return selectRLTopic(eligibleTopics, progress, 0)
  }

  // Calculate time since last practice for each topic
  const overdueTopics = practicedTopics.map(p => {
    const lastPracticed = p.last_practiced_at ? new Date(p.last_practiced_at) : new Date(0)
    const hoursSince = (now.getTime() - lastPracticed.getTime()) / (1000 * 60 * 60)

    // Spaced repetition intervals: 1 day, 3 days, 1 week, 2 weeks, 1 month
    let dueScore = 0
    if (hoursSince >= 720) dueScore = 5      // 1 month+
    else if (hoursSince >= 336) dueScore = 4 // 2 weeks
    else if (hoursSince >= 168) dueScore = 3 // 1 week
    else if (hoursSince >= 72) dueScore = 2  // 3 days
    else if (hoursSince >= 24) dueScore = 1  // 1 day
    else dueScore = 0                        // Too recent

    return {
      ...p,
      hoursSince,
      dueScore
    }
  })

  // Sort by most overdue
  overdueTopics.sort((a, b) => b.dueScore - a.dueScore || b.hoursSince - a.hoursSince)

  const selected = overdueTopics[0]

  if (!selected) {
    // Fallback
    return selectRLTopic(eligibleTopics, progress, 0)
  }

  return {
    topicId: selected.topic_id,
    topicName: selected.topics.name,
    bloomLevel: selected.current_bloom_level,
    selectionReason: `Spaced repetition: Last practiced ${Math.round(selected.hoursSince)} hours ago`,
    priority: selected.dueScore,
    selectionMethod: 'spaced_repetition'
  }
}

/**
 * Select topic using RL optimization
 */
function selectRLTopic(
  eligibleTopics: any[],
  progress: UserProgressRow[],
  totalAttempts: number
): TopicSelection {
  // Filter progress to only eligible topics
  const eligibleProgress = progress.filter(p =>
    eligibleTopics.some(t => t.id === p.topic_id)
  )

  // Determine global phase
  const globalPhase = determineGlobalPhase(totalAttempts)
  console.log(`[RL] Global phase: ${globalPhase}`)

  // Cold start: Random selection from eligible topics
  if (globalPhase === 'cold_start' || eligibleProgress.length === 0) {
    const randomIndex = Math.floor(Math.random() * eligibleTopics.length)
    const selected = eligibleTopics[randomIndex]

    return {
      topicId: selected.id,
      topicName: selected.name,
      bloomLevel: 1,
      selectionReason: 'Cold start: Random exploration from eligible topics',
      priority: 0,
      selectionMethod: 'rl'
    }
  }

  // Calculate priority for each topic with progress
  const priorities = calculateTopicPriorities(eligibleProgress, globalPhase)

  if (priorities.length === 0) {
    // Fallback to cold start
    const randomIndex = Math.floor(Math.random() * eligibleTopics.length)
    const selected = eligibleTopics[randomIndex]

    return {
      topicId: selected.id,
      topicName: selected.name,
      bloomLevel: 1,
      selectionReason: 'Fallback: No priority scores available',
      priority: 0,
      selectionMethod: 'rl'
    }
  }

  // Apply epsilon-greedy selection
  const epsilonRate = getEpsilonRate(globalPhase)
  const selection = epsilonGreedySelect(priorities, epsilonRate)

  return {
    topicId: selection.topicId,
    topicName: selection.topicName,
    bloomLevel: selection.recommendedBloomLevel,
    selectionReason: `RL: ${selection.reason}`,
    priority: selection.priority,
    selectionMethod: 'rl'
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

    // Component 1: Calibration mean (lower = higher priority) - 40% weight
    const calibrationMean = p.calibration_mean ?? 0
    const calibrationPriority = (1.5 - calibrationMean) / 3
    priority += calibrationPriority * 0.4
    if (calibrationMean < 0.5) {
      reasons.push('low calibration')
    }

    // Component 2: Time since last practice - 30% weight
    const lastPracticed = p.last_practiced_at ? new Date(p.last_practiced_at) : null
    if (lastPracticed) {
      const hoursSince = (now.getTime() - lastPracticed.getTime()) / (1000 * 60 * 60)
      let spacingPriority = 0
      if (hoursSince >= 168) spacingPriority = 0.9
      else if (hoursSince >= 72) spacingPriority = 0.7
      else if (hoursSince >= 24) spacingPriority = 0.5
      else spacingPriority = 0.1

      priority += spacingPriority * 0.3
      if (hoursSince >= 72) {
        reasons.push('needs review')
      }
    } else {
      priority += 0.3
      reasons.push('never practiced')
    }

    // Component 3: Mastery gaps - 20% weight
    const masteryScores = p.mastery_scores
    let lowestMastery = 100
    let lowestLevel = 1

    for (const [level, scores] of Object.entries(masteryScores)) {
      if (typeof scores === 'object') {
        const avgMastery = Object.values(scores as Record<string, number>).reduce(
          (sum, score) => sum + score, 0
        ) / Object.keys(scores).length

        if (avgMastery < lowestMastery) {
          lowestMastery = avgMastery
          lowestLevel = parseInt(level)
        }
      } else if (typeof scores === 'number') {
        if (scores < lowestMastery) {
          lowestMastery = scores
          lowestLevel = parseInt(level)
        }
      }
    }

    const masteryPriority = (100 - lowestMastery) / 100
    priority += masteryPriority * 0.2
    if (lowestMastery < 70) {
      reasons.push(`mastery gap at level ${lowestLevel}`)
    }

    // Component 4: Variance - 10% weight
    const stddev = p.calibration_stddev ?? 0
    if (stddev > 0.5) {
      priority += 0.1
      reasons.push('high variance')
    }

    // Recommend Bloom level
    let recommendedBloomLevel = p.current_bloom_level

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

    if (lowestMastery < 70 && lowestLevel < p.current_bloom_level) {
      recommendedBloomLevel = lowestLevel
      reasons.unshift('fill mastery gap')
    }

    return {
      topicId: p.topic_id,
      topicName: p.topics.name,
      priority: Math.min(priority, 1),
      reason: reasons.join(', ') || 'continue practice',
      recommendedBloomLevel,
      prerequisites: p.topics.prerequisites || []
    }
  })
}

/**
 * Get epsilon rate based on global phase
 */
function getEpsilonRate(globalPhase: string): number {
  switch (globalPhase) {
    case 'exploration':
      return 0.3
    case 'optimization':
      return 0.1
    case 'stabilization':
      return 0.05
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
