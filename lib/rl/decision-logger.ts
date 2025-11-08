/**
 * Decision Logger - Records all RL decisions for full transparency
 */

import { createClient } from '@/lib/supabase/server'
import type { ArmSample } from './thompson-sampling'
import type { RewardComponents } from './rewards'

export interface ArmSelectionLog {
  userId: string
  sessionId: string
  chapterId: string
  allArms: {
    topic_id: string
    topic_name: string
    bloom_level: number
    alpha: number
    beta: number
    sampled_value: number
    adjusted_value: number
    mastery_score: number
  }[]
  selectedArm: {
    topic_id: string
    topic_name: string
    bloom_level: number
    alpha: number
    beta: number
    sampled_value: number
    adjusted_value: number
    mastery_score: number
  }
  reasoning: string
  questionId?: string
  topicId: string
  bloomLevel: number
}

export interface RewardCalculationLog {
  userId: string
  sessionId: string
  responseId: string
  questionId: string
  topicId: string
  bloomLevel: number
  isCorrect: boolean
  confidence: number
  responseTimeSeconds: number
  rewardComponents: RewardComponents
}

export interface MasteryUpdateLog {
  userId: string
  sessionId: string
  responseId: string
  topicId: string
  bloomLevel: number
  oldMastery: number
  newMastery: number
  formula: string
}

/**
 * Log arm selection decision (Thompson Sampling)
 */
export async function logArmSelection(log: ArmSelectionLog): Promise<void> {
  try {
    const supabase = await createClient()

    await supabase.from('rl_decision_log').insert({
      user_id: log.userId,
      session_id: log.sessionId,
      decision_type: 'arm_selection',
      all_arms: log.allArms,
      selected_arm: log.selectedArm,
      selection_reasoning: log.reasoning,
      question_id: log.questionId,
      topic_id: log.topicId,
      bloom_level: log.bloomLevel,
      state_snapshot: {
        chapter_id: log.chapterId,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Failed to log arm selection:', error)
    // Don't throw - logging failures shouldn't break the flow
  }
}

/**
 * Log reward calculation
 */
export async function logRewardCalculation(log: RewardCalculationLog): Promise<void> {
  try {
    const supabase = await createClient()

    await supabase.from('rl_decision_log').insert({
      user_id: log.userId,
      session_id: log.sessionId,
      decision_type: 'reward_calculation',
      response_id: log.responseId,
      question_id: log.questionId,
      topic_id: log.topicId,
      bloom_level: log.bloomLevel,
      is_correct: log.isCorrect,
      confidence: log.confidence,
      response_time_seconds: log.responseTimeSeconds,
      reward_components: log.rewardComponents,
      state_snapshot: {
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Failed to log reward calculation:', error)
  }
}

/**
 * Log mastery update
 */
export async function logMasteryUpdate(log: MasteryUpdateLog): Promise<void> {
  try {
    const supabase = await createClient()

    await supabase.from('rl_decision_log').insert({
      user_id: log.userId,
      session_id: log.sessionId,
      decision_type: 'mastery_update',
      response_id: log.responseId,
      topic_id: log.topicId,
      bloom_level: log.bloomLevel,
      old_mastery: log.oldMastery,
      new_mastery: log.newMastery,
      mastery_formula: log.formula,
      state_snapshot: {
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Failed to log mastery update:', error)
  }
}

/**
 * Get recent decisions for a user (for audit/debugging)
 */
export async function getRecentDecisions(
  userId: string,
  limit: number = 50
): Promise<any[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('rl_decision_log')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Failed to get recent decisions:', error)
    return []
  }

  return data || []
}

/**
 * Get decisions for a specific session (for replay)
 */
export async function getSessionDecisions(sessionId: string): Promise<any[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('rl_decision_log')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Failed to get session decisions:', error)
    return []
  }

  return data || []
}
