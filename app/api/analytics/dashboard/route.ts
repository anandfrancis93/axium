/**
 * API: Analytics Dashboard
 *
 * Endpoint: GET /api/analytics/dashboard
 *
 * Returns comprehensive analytics for user dashboard:
 * - Overall stats
 * - Domain performance
 * - Bloom level breakdown
 * - Learning velocity
 * - Performance trends
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getUserStats,
  getDomainPerformance,
  getBloomLevelBreakdown,
  getLearningVelocity,
  getPerformanceTrend
} from '@/lib/analytics/queries'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const period = (searchParams.get('period') || 'week') as 'day' | 'week' | 'month'

    // Fetch all analytics data in parallel
    const [
      userStats,
      domainPerformance,
      bloomLevelBreakdown,
      learningVelocity,
      performanceTrend
    ] = await Promise.all([
      getUserStats(user.id),
      getDomainPerformance(user.id),
      getBloomLevelBreakdown(user.id),
      getLearningVelocity(user.id),
      getPerformanceTrend(user.id, period)
    ])

    // Generate insights
    const insights = generateInsights(
      userStats,
      domainPerformance,
      bloomLevelBreakdown,
      performanceTrend
    )

    return NextResponse.json({
      success: true,
      analytics: {
        userStats,
        domainPerformance,
        bloomLevelBreakdown,
        learningVelocity,
        performanceTrend,
        insights
      }
    })
  } catch (error: any) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch analytics',
        message: error.message
      },
      { status: 500 }
    )
  }
}

/**
 * Generate learning insights from analytics data
 */
function generateInsights(
  userStats: any,
  domainPerformance: any[],
  bloomLevelBreakdown: any[],
  performanceTrend: any
): {
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  nextSteps: string[]
  confidenceTrend: 'improving' | 'stable' | 'declining'
  motivationalMessage: string
} {
  const strengths: string[] = []
  const weaknesses: string[] = []
  const recommendations: string[] = []
  const nextSteps: string[] = []

  // Overall accuracy
  if (userStats.overallAccuracy >= 0.8) {
    strengths.push(`Strong overall accuracy (${(userStats.overallAccuracy * 100).toFixed(0)}%)`)
  } else if (userStats.overallAccuracy < 0.6) {
    weaknesses.push(`Overall accuracy needs improvement (${(userStats.overallAccuracy * 100).toFixed(0)}%)`)
    recommendations.push('Review fundamentals and practice more questions at current level')
  }

  // Streak
  if (userStats.currentStreak >= 7) {
    strengths.push(`Excellent ${userStats.currentStreak}-day study streak!`)
  } else if (userStats.currentStreak === 0) {
    recommendations.push('Build a daily study habit to improve retention')
  }

  // Domain performance
  const strongDomains = domainPerformance.filter(d => d.masteryScore >= 80)
  const weakDomains = domainPerformance.filter(d => d.masteryScore < 60)

  if (strongDomains.length > 0) {
    strengths.push(`Mastered ${strongDomains.length} domain(s): ${strongDomains.map(d => d.domain).join(', ')}`)
  }

  if (weakDomains.length > 0) {
    weaknesses.push(`Need work in: ${weakDomains.map(d => d.domain).join(', ')}`)
    nextSteps.push(`Focus on ${weakDomains[0].domain} - complete ${weakDomains[0].topicsNotStarted + weakDomains[0].topicsInProgress} topics`)
  }

  // Bloom level progression
  const currentLevels = bloomLevelBreakdown.filter(b => b.isCurrentLevel)
  const readyToAdvance = bloomLevelBreakdown.filter(b => b.readyToAdvance)

  if (readyToAdvance.length > 0) {
    nextSteps.push(`Ready to advance to Bloom Level ${readyToAdvance[0].bloomLevel + 1} in ${readyToAdvance.length} topic(s)`)
  }

  // Performance trend
  if (performanceTrend.overallTrend === 'improving') {
    strengths.push(`Performance trending upward (+${performanceTrend.changeRate.toFixed(0)}%)`)
  } else if (performanceTrend.overallTrend === 'declining') {
    weaknesses.push(`Performance declining (-${Math.abs(performanceTrend.changeRate).toFixed(0)}%)`)
    recommendations.push('Take a break if needed, then review recent topics')
  }

  // Confidence trend (simplified)
  const confidenceTrend: 'improving' | 'stable' | 'declining' =
    performanceTrend.overallTrend === 'improving' ? 'improving' :
    performanceTrend.overallTrend === 'declining' ? 'declining' : 'stable'

  // Motivational message
  const motivationalMessage = generateMotivationalMessage(
    userStats,
    performanceTrend.overallTrend
  )

  return {
    strengths,
    weaknesses,
    recommendations,
    nextSteps,
    confidenceTrend,
    motivationalMessage
  }
}

function generateMotivationalMessage(
  userStats: any,
  trend: string
): string {
  if (userStats.totalAttempts === 0) {
    return "Welcome! Let's start your learning journey. 🚀"
  }

  if (trend === 'improving') {
    return "You're on fire! Your skills are growing every day. Keep it up! 🔥"
  }

  if (trend === 'declining') {
    return "Everyone has off days. Take a break if needed, you've got this! 💪"
  }

  if (userStats.currentStreak >= 7) {
    return `${userStats.currentStreak} days strong! Consistency is key to mastery. 🌟`
  }

  if (userStats.overallAccuracy >= 0.8) {
    return "Outstanding accuracy! You're demonstrating real expertise. 🎯"
  }

  return "You're making progress! Every question brings you closer to mastery. 📚"
}
