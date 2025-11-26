/**
 * Topic Selection Algorithm (7-2-1 Pattern)
 *
 * 10-QUESTION CYCLE:
 * - Positions 1-7: NEW TOPICS (never practiced before)
 *   - Primary: Random selection from unpracticed topics
 *   - Fallback: Priority-based if all topics practiced
 * - Positions 8-9: SPACED REPETITION (saved questions due for review)
 * - Position 10: DIMENSION PRACTICE (practiced topic, new cognitive dimension)
 *
 * PRIORITY COMPONENTS (used as fallback when all topics practiced):
 * - Calibration mean (40%): Lower calibration = higher priority
 * - Time since practice (30%): Longer time = higher priority
 * - Mastery gaps (20%): Lower mastery = higher priority
 * - Variance (10%): Higher inconsistency = higher priority
 *
 * PREREQUISITE CHECKING:
 * - Uses Supabase prerequisites array
 * - Verifies prerequisite mastery before unlocking topics
 * - Filters to only eligible topics
 */

import { createClient } from '@/lib/supabase/server'
import { createSession } from '@/lib/neo4j/client'
import { calibrationToPriority } from '@/lib/utils/calibration'

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
 * Main topic selection function (7-2-1 pattern)
 *
 * Positions 1-7: New topics → Positions 8-9: Spaced repetition → Position 10: Dimension practice
 *
 * @param userId - User ID
 * @param subject - Optional subject slug (e.g., 'it-cs', 'physics') to filter topics
 * @param chapter - Optional chapter slug (e.g., 'cybersecurity', 'mechanics') to filter topics
 */
export async function selectNextTopic(
  userId: string,
  subject?: string,
  chapter?: string
): Promise<TopicSelection> {
  const supabase = await createClient()

  // Get total questions asked by this user
  const { count: totalQuestions } = await supabase
    .from('user_responses')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  const questionCount = totalQuestions || 0


  // Determine if this should be RL or Spaced Repetition
  // 2 out of every 10 questions (20%) are SR, rest are RL
  // SR on questions: 5, 10, 15, 20, 25, 30... (every 5th)
  const isSpacedRepetition = ((questionCount + 1) % 5 === 0)



  // Get all available topics with hierarchy information
  // Only select actual topics (hierarchy_level >= 1+), not domains/objectives
  const { data: allTopics, error: topicsError } = await supabase
    .from('topics')
    .select('id, name, prerequisites, hierarchy_level, parent_topic_id, subject_id, subjects(id, name, slug)')
    .gte('hierarchy_level', 1)

  if (topicsError || !allTopics || allTopics.length === 0) {
    throw new Error('No topics found in database')
  }

  // Filter topics by subject if provided (no more chapters)
  let filteredTopics = allTopics
  if (subject) {
    filteredTopics = allTopics.filter((topic: any) => {
      const topicSubject = topic.subjects?.slug

      // Check subject match if provided
      return subject === topicSubject
    })



    if (filteredTopics.length === 0) {
      throw new Error(`No topics found for subject: ${subject}`)
    }
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
      last_practiced_at,
      mastery_scores
    `)
    .eq('user_id', userId)

  const progress = (progressData || []) as unknown as UserProgressRow[]

  // Filter topics to only those with prerequisites met
  const eligibleTopics = await filterByPrerequisites(
    supabase,
    userId,
    filteredTopics,
    progress
  )

  if (eligibleTopics.length === 0) {
    throw new Error('No eligible topics found. Please check prerequisite requirements.')
  }



  // Determine selection method
  if (isSpacedRepetition) {
    return await selectSpacedRepetitionTopic(eligibleTopics, progress, supabase, userId)
  } else {
    return await selectRLTopic(eligibleTopics, progress, questionCount, supabase, userId)
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
async function selectSpacedRepetitionTopic(
  eligibleTopics: any[],
  progress: UserProgressRow[],
  supabase?: any,
  userId?: string
): Promise<TopicSelection> {
  const now = new Date()

  // Filter to topics that have been practiced before (have progress)
  const practicedTopics = progress.filter(p =>
    eligibleTopics.some(t => t.id === p.topic_id)
  )

  if (practicedTopics.length === 0) {
    // No practiced topics yet - fall back to RL for cold start
    // Log removed
    return await selectRLTopic(eligibleTopics, progress, 0, supabase, userId)
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
    return await selectRLTopic(eligibleTopics, progress, 0, supabase, userId)
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
 * Select topic for positions 1-7 (New Topic Selection)
 *
 * PRIMARY: Select from NEW topics (never practiced by user)
 * FALLBACK: If all topics practiced, use priority-based selection
 */
async function selectRLTopic(
  eligibleTopics: any[],
  progress: UserProgressRow[],
  totalAttempts: number,
  supabase?: any,
  userId?: string
): Promise<TopicSelection> {
  // Find topics user hasn't practiced yet
  const practicedTopicIds = new Set(progress.map(p => p.topic_id))
  const newTopics = eligibleTopics.filter(t => !practicedTopicIds.has(t.id))

  // PRIMARY: Select from NEW topics (positions 1-7 should always be new topics)
  if (newTopics.length > 0) {
    const randomIndex = Math.floor(Math.random() * newTopics.length)
    const selected = newTopics[randomIndex]

    console.log(`[Topic Selection] New topic: "${selected.name}" (${newTopics.length} new topics remaining)`)

    return {
      topicId: selected.id,
      topicName: selected.name,
      bloomLevel: 1,
      selectionReason: `New topic (${newTopics.length} remaining)`,
      priority: 1,
      selectionMethod: 'rl'
    }
  }

  // FALLBACK: All topics have been practiced at least once
  // Use priority-based selection for reinforcement
  console.log(`[Topic Selection] All ${eligibleTopics.length} topics practiced, using priority-based selection`)

  const eligibleProgress = progress.filter(p =>
    eligibleTopics.some(t => t.id === p.topic_id)
  )

  if (eligibleProgress.length === 0) {
    // Edge case: No progress data, random selection
    const randomIndex = Math.floor(Math.random() * eligibleTopics.length)
    const selected = eligibleTopics[randomIndex]

    return {
      topicId: selected.id,
      topicName: selected.name,
      bloomLevel: 1,
      selectionReason: 'Fallback: Random selection',
      priority: 0,
      selectionMethod: 'rl'
    }
  }

  // Calculate priority for practiced topics
  let priorities = calculateTopicPriorities(eligibleProgress)

  // Apply keystone scoring (prioritize high-impact topics in graph)
  try {
    const { applyKeystoneScoring } = await import('./keystone-scoring')
    priorities = await applyKeystoneScoring(priorities)
  } catch (error) {
    console.error('[Topic Selection] Error applying keystone scoring:', error)
  }

  // Select highest priority topic
  const sortedByPriority = [...priorities].sort((a, b) => b.priority - a.priority)
  const selected = sortedByPriority[0]

  return {
    topicId: selected.topicId,
    topicName: selected.topicName,
    bloomLevel: selected.recommendedBloomLevel,
    selectionReason: `Reinforcement: ${selected.reason}`,
    priority: selected.priority,
    selectionMethod: 'rl'
  }
}

/**
 * Calculate priority scores for all topics
 */
function calculateTopicPriorities(
  progress: UserProgressRow[]
): TopicPriority[] {
  const now = new Date()

  return progress.map(p => {
    let priority = 0
    const reasons: string[] = []

    // Component 1: Calibration mean (lower = higher priority) - 40% weight
    const calPriority = calibrationToPriority(p.calibration_mean)
    priority += calPriority * 0.4
    if ((p.calibration_mean ?? 0) < 0.5) {
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

