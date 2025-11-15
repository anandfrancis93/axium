/**
 * API: Evaluate Progression and Get Adaptive Recommendations
 *
 * Endpoint: POST /api/progression/evaluate
 *
 * Evaluates user's progression and returns:
 * - Bloom level recommendation (advance/maintain/review/regress)
 * - Adaptive difficulty adjustment
 * - Question format recommendation
 * - Confidence calibration feedback
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { evaluateProgression } from '@/lib/progression/bloom-progression'
import { calculateDifficultyAdjustment, recommendNextDifficulty } from '@/lib/progression/adaptive-difficulty'
import {
  selectQuestionFormat,
  getFormatPerformance,
  generateFormatPerformanceSummary
} from '@/lib/progression/format-selection'
import {
  detectConfidenceBias,
  getCalibrationImprovementSuggestions
} from '@/lib/progression/confidence-calibration'

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { entityId, topicId } = body

    if (!entityId && !topicId) {
      return NextResponse.json(
        { error: 'entityId or topicId required' },
        { status: 400 }
      )
    }

    // Fetch user progress
    let query = supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)

    if (entityId) {
      query = query.eq('entity_id', entityId)
    } else {
      query = query.eq('topic_id', topicId)
    }

    const { data: progressData, error: progressError } = await query.single()

    if (progressError || !progressData) {
      return NextResponse.json(
        { error: 'User progress not found' },
        { status: 404 }
      )
    }

    // Fetch recent responses for this topic
    let responsesQuery = supabase
      .from('user_responses')
      .select('is_correct, confidence_level, created_at, bloom_level')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (entityId) {
      responsesQuery = responsesQuery.eq('entity_id', entityId)
    } else {
      responsesQuery = responsesQuery.eq('topic_id', topicId)
    }

    const { data: responses } = await responsesQuery

    // Build progress object
    const userProgress = {
      currentBloomLevel: progressData.current_bloom_level || 1,
      totalAttempts: progressData.total_attempts || 0,
      masteryScores: (progressData.mastery_scores as Record<number, number>) || {},
      confidenceCalibrationError: progressData.confidence_calibration_error || 0,
      performanceHistory: (responses || []).map(r => ({
        attempts: 1,
        correct: r.is_correct ? 1 : 0,
        timestamp: new Date(r.created_at)
      }))
    }

    // Evaluate Bloom level progression
    const progressionDecision = evaluateProgression(userProgress)

    // Calculate recent accuracy
    const recentResponses = responses || []
    const recentAccuracy = recentResponses.length > 0
      ? recentResponses.filter((r: any) => r.is_correct).length / recentResponses.length
      : 0.5

    // Get adaptive difficulty recommendation
    const difficultyAdjustment = calculateDifficultyAdjustment(
      progressData.current_difficulty || 5,
      recentResponses.map((r: any) => ({
        isCorrect: r.is_correct,
        bloomLevel: r.bloom_level || progressData.current_bloom_level
      }))
    )

    const nextDifficulty = recommendNextDifficulty(
      progressData.current_bloom_level || 1,
      progressionDecision.metrics.masteryScore,
      recentAccuracy
    )

    // Get format recommendation
    const formatPerformanceData = (progressData.rl_metadata as any)?.format_performance || {}
    const formatPerformance = getFormatPerformance(formatPerformanceData)

    const formatRecommendation = selectQuestionFormat(
      progressionDecision.targetLevel,
      formatPerformance,
      'performance_based'
    )

    const formatSummary = generateFormatPerformanceSummary(
      formatPerformance,
      progressionDecision.targetLevel
    )

    // Confidence calibration analysis
    const confidenceResponses = recentResponses.map((r: any) => ({
      confidenceLevel: r.confidence_level || 3,
      wasCorrect: r.is_correct
    }))

    const confidenceBias = detectConfidenceBias(confidenceResponses)
    const calibrationSuggestions = getCalibrationImprovementSuggestions(confidenceResponses)

    // Build comprehensive response
    return NextResponse.json({
      success: true,
      evaluation: {
        // Bloom Level Progression
        bloomProgression: {
          current: progressionDecision.currentLevel,
          recommended: progressionDecision.targetLevel,
          action: progressionDecision.action,
          reason: progressionDecision.reason,
          confidence: progressionDecision.confidence,
          readyToAdvance: progressionDecision.action === 'advance'
        },

        // Adaptive Difficulty
        difficulty: {
          current: difficultyAdjustment.currentDifficulty,
          recommended: nextDifficulty.difficulty,
          recommendedBloomLevel: nextDifficulty.bloomLevel,
          targetAccuracy: difficultyAdjustment.targetAccuracy,
          actualAccuracy: difficultyAdjustment.actualAccuracy,
          adjustmentNeeded: difficultyAdjustment.adjustmentNeeded,
          reason: nextDifficulty.reason
        },

        // Format Recommendation
        format: {
          recommended: formatRecommendation.selectedFormat,
          reason: formatRecommendation.reason,
          alternatives: formatRecommendation.alternativeFormats,
          strongestFormat: formatSummary.strongest,
          weakestFormat: formatSummary.weakest,
          recommendations: formatSummary.recommendations
        },

        // Confidence Calibration
        confidence: {
          bias: confidenceBias.bias,
          magnitude: confidenceBias.magnitude,
          recommendation: confidenceBias.recommendation,
          improvementSuggestions: calibrationSuggestions
        },

        // Performance Metrics
        metrics: {
          totalAttempts: progressData.total_attempts,
          currentMastery: progressionDecision.metrics.masteryScore,
          recentAccuracy,
          trend: progressionDecision.metrics.recentPerformanceTrend,
          rlPhase: progressData.rl_phase
        }
      }
    })
  } catch (error: any) {
    console.error('Error evaluating progression:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to evaluate progression',
        message: error.message
      },
      { status: 500 }
    )
  }
}
