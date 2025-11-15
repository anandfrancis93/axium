/**
 * Analytics Aggregation Queries
 *
 * Fetches and aggregates user performance data
 */

import { createClient } from '@/lib/supabase/server'
import {
  UserStats,
  DomainPerformance,
  BloomLevelBreakdown,
  LearningVelocity,
  PerformanceTrend,
  QuestionQualityMetrics
} from './types'

/**
 * Get overall user statistics
 */
export async function getUserStats(userId: string): Promise<UserStats> {
  const supabase = await createClient()

  // Fetch all user progress
  const { data: progressData } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)

  // Fetch user responses for additional stats
  const { data: responses } = await supabase
    .from('user_responses')
    .select('is_correct, confidence, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  const totalAttempts = progressData?.reduce((sum, p) => sum + (p.total_attempts || 0), 0) || 0
  const totalQuestions = progressData?.reduce((sum, p) => sum + (p.total_questions || 0), 0) || 0
  const correctAnswers = progressData?.reduce((sum, p) => sum + (p.correct_answers || 0), 0) || 0

  const overallAccuracy = totalAttempts > 0 ? correctAnswers / totalAttempts : 0

  const averageConfidence = responses && responses.length > 0
    ? responses.reduce((sum: number, r) => sum + (r.confidence || 0) / 3, 0) / responses.length
    : 0.5

  const masteryScores = progressData?.map(p => {
    const scores = p.mastery_scores as Record<number, number> | null
    if (!scores) return 0
    const level = p.current_bloom_level || 1
    return scores[level] || 0
  }) || []

  const averageMastery = masteryScores.length > 0
    ? masteryScores.reduce((sum, score) => sum + score, 0) / masteryScores.length
    : 0

  // Calculate streak (simplified - would need more complex logic)
  const currentStreak = calculateStreak(responses || [])
  const longestStreak = currentStreak // Simplified

  return {
    userId,
    totalAttempts,
    totalQuestions,
    correctAnswers,
    overallAccuracy,
    averageConfidence,
    averageMastery,
    studyTimeMinutes: estimateStudyTime(totalAttempts),
    questionsPerSession: totalQuestions > 0 ? Math.round(totalQuestions / Math.max(1, Math.ceil(totalAttempts / 10))) : 0,
    currentStreak,
    longestStreak
  }
}

/**
 * Get performance breakdown by domain
 */
export async function getDomainPerformance(userId: string): Promise<DomainPerformance[]> {
  const supabase = await createClient()

  const { data: progressData } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)

  if (!progressData || progressData.length === 0) {
    return []
  }

  // Group by domain
  const domainMap = new Map<string, any[]>()

  for (const progress of progressData) {
    const domain = progress.domain || 'Unknown'
    if (!domainMap.has(domain)) {
      domainMap.set(domain, [])
    }
    domainMap.get(domain)!.push(progress)
  }

  // Calculate domain-level stats
  const domainPerformance: DomainPerformance[] = []

  for (const [domain, topics] of domainMap) {
    const attempts = topics.reduce((sum, t) => sum + (t.total_attempts || 0), 0)
    const correct = topics.reduce((sum, t) => sum + (t.correct_answers || 0), 0)
    const accuracy = attempts > 0 ? correct / attempts : 0

    const masteryScores = topics.map(t => {
      const scores = t.mastery_scores as Record<number, number> | null
      if (!scores) return 0
      const level = t.current_bloom_level || 1
      return scores[level] || 0
    })

    const masteryScore = masteryScores.length > 0
      ? masteryScores.reduce((sum, score) => sum + score, 0) / masteryScores.length
      : 0

    const topicsCompleted = topics.filter(t => {
      const scores = t.mastery_scores as Record<number, number> | null
      const level = t.current_bloom_level || 1
      return scores && scores[level] >= 80
    }).length

    const topicsInProgress = topics.filter(t => {
      const scores = t.mastery_scores as Record<number, number> | null
      const level = t.current_bloom_level || 1
      return scores && scores[level] < 80 && scores[level] > 0
    }).length

    const topicsNotStarted = topics.length - topicsCompleted - topicsInProgress

    // Identify strengths (>80%) and weaknesses (<60%)
    const strengthAreas = topics
      .filter(t => {
        const scores = t.mastery_scores as Record<number, number> | null
        const level = t.current_bloom_level || 1
        return scores && scores[level] >= 80
      })
      .map(t => t.entity_name || t.topic_id || 'Unknown')
      .slice(0, 5)

    const weaknessAreas = topics
      .filter(t => {
        const scores = t.mastery_scores as Record<number, number> | null
        const level = t.current_bloom_level || 1
        return scores && scores[level] < 60 && scores[level] > 0
      })
      .map(t => t.entity_name || t.topic_id || 'Unknown')
      .slice(0, 5)

    domainPerformance.push({
      domain,
      attempts,
      correct,
      accuracy,
      masteryScore,
      topicsCompleted,
      topicsInProgress,
      topicsNotStarted,
      strengthAreas,
      weaknessAreas
    })
  }

  return domainPerformance.sort((a, b) => b.attempts - a.attempts)
}

/**
 * Get Bloom level breakdown
 */
export async function getBloomLevelBreakdown(userId: string): Promise<BloomLevelBreakdown[]> {
  const supabase = await createClient()

  const { data: progressData } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)

  if (!progressData || progressData.length === 0) {
    return []
  }

  const bloomLevelNames = {
    1: 'Remember',
    2: 'Understand',
    3: 'Apply',
    4: 'Analyze',
    5: 'Evaluate',
    6: 'Create'
  }

  const breakdown: BloomLevelBreakdown[] = []

  for (let level = 1; level <= 6; level++) {
    const topicsAtLevel = progressData.filter(p => p.current_bloom_level === level)

    const attempts = topicsAtLevel.reduce((sum, t) => sum + (t.total_attempts || 0), 0)
    const correct = topicsAtLevel.reduce((sum, t) => sum + (t.correct_answers || 0), 0)
    const accuracy = attempts > 0 ? correct / attempts : 0

    const masteryScores = topicsAtLevel.map(t => {
      const scores = t.mastery_scores as Record<number, number> | null
      return scores && scores[level] || 0
    })

    const masteryScore = masteryScores.length > 0
      ? masteryScores.reduce((sum, score) => sum + score, 0) / masteryScores.length
      : 0

    const topicsCompleted = topicsAtLevel.filter(t => {
      const scores = t.mastery_scores as Record<number, number> | null
      return scores && scores[level] >= 80
    }).length

    const isCurrentLevel = topicsAtLevel.length > 0
    const readyToAdvance = masteryScore >= 80 && level < 6

    breakdown.push({
      bloomLevel: level,
      bloomLevelName: bloomLevelNames[level as keyof typeof bloomLevelNames],
      attempts,
      correct,
      accuracy,
      masteryScore,
      topicsAtLevel: topicsAtLevel.length,
      topicsCompleted,
      isCurrentLevel,
      readyToAdvance
    })
  }

  return breakdown
}

/**
 * Calculate learning velocity
 */
export async function getLearningVelocity(userId: string): Promise<LearningVelocity> {
  const supabase = await createClient()

  const { data: responses } = await supabase
    .from('user_responses')
    .select('created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (!responses || responses.length === 0) {
    return {
      questionsPerDay: 0,
      questionsPerWeek: 0,
      averageSessionDuration: 0,
      sessionsPerWeek: 0,
      trend: 'stable'
    }
  }

  // Calculate questions per day
  const firstResponse = new Date(responses[0].created_at)
  const lastResponse = new Date(responses[responses.length - 1].created_at)
  const daysDiff = Math.max(1, (lastResponse.getTime() - firstResponse.getTime()) / (1000 * 60 * 60 * 24))

  const questionsPerDay = responses.length / daysDiff
  const questionsPerWeek = questionsPerDay * 7

  // Estimate sessions and duration (simplified)
  const sessionsPerWeek = Math.max(1, questionsPerWeek / 10)
  const averageSessionDuration = questionsPerDay > 0 ? (10 * 2) : 0 // Assume 2 min per question

  // Calculate trend
  const recentHalf = responses.slice(Math.floor(responses.length / 2))
  const recentDays = Math.max(1, (new Date().getTime() - new Date(recentHalf[0].created_at).getTime()) / (1000 * 60 * 60 * 24))
  const recentQuestionsPerDay = recentHalf.length / recentDays

  let trend: 'accelerating' | 'stable' | 'decelerating'
  if (recentQuestionsPerDay > questionsPerDay * 1.2) {
    trend = 'accelerating'
  } else if (recentQuestionsPerDay < questionsPerDay * 0.8) {
    trend = 'decelerating'
  } else {
    trend = 'stable'
  }

  return {
    questionsPerDay,
    questionsPerWeek,
    averageSessionDuration,
    sessionsPerWeek,
    trend
  }
}

/**
 * Get performance trend over time
 */
export async function getPerformanceTrend(
  userId: string,
  period: 'day' | 'week' | 'month' = 'week'
): Promise<PerformanceTrend> {
  const supabase = await createClient()

  const { data: responses } = await supabase
    .from('user_responses')
    .select('is_correct, created_at, bloom_level')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (!responses || responses.length === 0) {
    return {
      period,
      dataPoints: [],
      overallTrend: 'stable',
      changeRate: 0
    }
  }

  // Group by period
  const periodMs = period === 'day' ? 86400000 : period === 'week' ? 604800000 : 2592000000
  const groups = new Map<string, any[]>()

  for (const response of responses) {
    const date = new Date(response.created_at)
    const periodKey = new Date(Math.floor(date.getTime() / periodMs) * periodMs).toISOString().split('T')[0]

    if (!groups.has(periodKey)) {
      groups.set(periodKey, [])
    }
    groups.get(periodKey)!.push(response)
  }

  // Calculate stats for each period
  const dataPoints = Array.from(groups.entries()).map(([date, responses]) => {
    const attempts = responses.length
    const correct = responses.filter((r: any) => r.is_correct).length
    const accuracy = attempts > 0 ? correct / attempts : 0

    return {
      date,
      attempts,
      correct,
      accuracy,
      masteryScore: accuracy * 100
    }
  })

  // Calculate trend
  if (dataPoints.length < 2) {
    return {
      period,
      dataPoints,
      overallTrend: 'stable',
      changeRate: 0
    }
  }

  const firstHalf = dataPoints.slice(0, Math.floor(dataPoints.length / 2))
  const secondHalf = dataPoints.slice(Math.floor(dataPoints.length / 2))

  const firstAvgMastery = firstHalf.reduce((sum, d) => sum + d.masteryScore, 0) / firstHalf.length
  const secondAvgMastery = secondHalf.reduce((sum, d) => sum + d.masteryScore, 0) / secondHalf.length

  const changeRate = secondAvgMastery - firstAvgMastery

  let overallTrend: 'improving' | 'stable' | 'declining'
  if (changeRate > 5) {
    overallTrend = 'improving'
  } else if (changeRate < -5) {
    overallTrend = 'declining'
  } else {
    overallTrend = 'stable'
  }

  return {
    period,
    dataPoints,
    overallTrend,
    changeRate
  }
}

// Helper functions

function calculateStreak(responses: any[]): number {
  if (responses.length === 0) return 0

  // Sort by date
  const sorted = [...responses].sort((a, b) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  let currentStreak = 1
  let maxStreak = 1

  for (let i = 1; i < sorted.length; i++) {
    const prevDate = new Date(sorted[i - 1].created_at)
    const currDate = new Date(sorted[i].created_at)

    const daysDiff = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysDiff === 1) {
      currentStreak++
      maxStreak = Math.max(maxStreak, currentStreak)
    } else if (daysDiff > 1) {
      currentStreak = 1
    }
  }

  // Check if streak is current (last response within 2 days)
  const lastResponse = new Date(sorted[sorted.length - 1].created_at)
  const daysSinceLastResponse = Math.floor((Date.now() - lastResponse.getTime()) / (1000 * 60 * 60 * 24))

  if (daysSinceLastResponse > 2) {
    return 0 // Streak broken
  }

  return currentStreak
}

function estimateStudyTime(totalAttempts: number): number {
  // Rough estimate: 2 minutes per attempt
  return totalAttempts * 2
}
