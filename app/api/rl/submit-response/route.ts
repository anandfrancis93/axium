import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateLearningGain, calculateMultiTopicMasteryUpdates, getDaysSinceLastPractice } from '@/lib/rl/mastery'
import { calculateReward, RecognitionMethod } from '@/lib/rl/rewards'

/**
 * POST /api/rl/submit-response
 *
 * Submit answer and update RL system
 *
 * Body:
 * - session_id: UUID of the learning session
 * - question_id: UUID of the question
 * - user_answer: User's selected answer (A, B, C, or D)
 * - confidence: Confidence level (1-5 or 'low'/'medium'/'high')
 * - recognition_method: How user arrived at answer ('memory', 'recognition', 'educated_guess', 'random')
 * - arm_selected: { topic_id, topic_name, bloom_level } from next-question response
 *
 * Returns:
 * - is_correct: boolean
 * - correct_answer: The correct answer
 * - explanation: Explanation text
 * - reward_components: Breakdown of reward
 * - mastery_updates: Changes in mastery
 * - session_progress: Updated progress
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      session_id,
      question_id,
      user_answer,
      confidence: rawConfidence,
      recognition_method,
      arm_selected,
      question_metadata // For ephemeral questions
    } = body

    // Validate inputs
    if (!session_id || !question_id || !user_answer) {
      return NextResponse.json(
        { error: 'session_id, question_id, and user_answer are required' },
        { status: 400 }
      )
    }

    // Convert confidence to numeric (1-5)
    let confidence: number
    if (typeof rawConfidence === 'string') {
      const confidenceMap: { [key: string]: number } = {
        low: 2,
        medium: 3,
        high: 4
      }
      confidence = confidenceMap[rawConfidence.toLowerCase()] || 3
    } else {
      confidence = rawConfidence
    }

    // Try to get question from database first (for stored questions)
    let question: any = null
    const { data: dbQuestion } = await supabase
      .from('questions')
      .select('*')
      .eq('id', question_id)
      .single()

    if (dbQuestion) {
      // Question exists in database (stored question)
      question = dbQuestion
    } else if (question_metadata && question_metadata.correct_answer) {
      // Fallback to question_metadata (for ephemeral questions)
      question = {
        id: question_metadata.question_id,
        correct_answer: question_metadata.correct_answer,
        explanation: question_metadata.explanation,
        bloom_level: question_metadata.bloom_level,
        topic: question_metadata.topic,
        primary_topic: question_metadata.topic,
        secondary_topics: null,
        topic_weights: null
      }
    } else {
      return NextResponse.json(
        { error: 'Question not found in database and no question_metadata provided' },
        { status: 404 }
      )
    }

    // Check if correct
    const isCorrect = user_answer === question.correct_answer

    // Get session
    const { data: session } = await supabase
      .from('learning_sessions')
      .select('*')
      .eq('id', session_id)
      .single()

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Get topic_id from question or arm_selected
    const topicId = question.topic_id || arm_selected?.topic_id

    if (!topicId) {
      return NextResponse.json(
        { error: 'Question must have topic_id associated with it' },
        { status: 400 }
      )
    }

    // Get current mastery for the topic
    const { data: masteryData } = await supabase
      .from('user_topic_mastery')
      .select('*')
      .eq('user_id', user.id)
      .eq('chapter_id', session.chapter_id)
      .eq('topic_id', topicId)
      .eq('bloom_level', question.bloom_level)
      .single()

    const currentMastery = masteryData?.mastery_score || 0

    // Calculate learning gain for this topic
    const learningGain = calculateLearningGain(currentMastery, isCorrect, confidence)
    const newMastery = Math.max(0, Math.min(100, currentMastery + learningGain))

    // Get days since last practice for reward calculation
    const daysSince = getDaysSinceLastPractice(masteryData?.last_practiced_at || null)

    // Calculate reward
    const rewardComponents = calculateReward({
      learningGain,
      isCorrect,
      confidence,
      currentMastery,
      daysSinceLastPractice: daysSince,
      recognitionMethod: recognition_method as RecognitionMethod
    })

    // Update mastery for this topic (using new RPC function that uses topic_id)
    await supabase.rpc('update_topic_mastery_by_id', {
      p_user_id: user.id,
      p_topic_id: topicId,
      p_bloom_level: question.bloom_level,
      p_chapter_id: session.chapter_id,
      p_is_correct: isCorrect,
      p_confidence: confidence,
      p_learning_gain: learningGain,
      p_weight: 1.0
    })

    // Update RL arm stats (Thompson Sampling) using topic_id
    if (arm_selected && arm_selected.topic_id) {
      await supabase.rpc('update_arm_stats_by_id', {
        p_user_id: user.id,
        p_chapter_id: session.chapter_id,
        p_topic_id: arm_selected.topic_id,
        p_bloom_level: arm_selected.bloom_level,
        p_reward: rewardComponents.total
      })
    }

    // Store user response (only columns that exist in schema)
    // For ephemeral questions, question_id will be null (they're not in questions table)
    const isEphemeral = question_id && question_id.toString().startsWith('ephemeral-')

    const { data: response, error: responseError } = await supabase
      .from('user_responses')
      .insert({
        session_id,
        question_id: isEphemeral ? null : question_id, // Don't store ephemeral IDs
        user_id: user.id,
        topic_id: topicId,
        bloom_level: question.bloom_level,
        user_answer,
        is_correct: isCorrect,
        confidence: confidence,
        reward: rewardComponents.total,
        // created_at will be set by database default
      })
      .select()
      .single()

    if (responseError) {
      console.error('Error storing response:', responseError)
      throw new Error(`Failed to store response: ${responseError.message}`)
    }

    // Track dimension coverage for comprehensive mastery with unique question tracking
    if (question.dimension && question.bloom_level && topicId) {
      const { data: existingCoverage } = await supabase
        .from('user_dimension_coverage')
        .select('*')
        .eq('user_id', user.id)
        .eq('chapter_id', session.chapter_id)
        .eq('topic_id', topicId)
        .eq('bloom_level', question.bloom_level)
        .eq('dimension', question.dimension)
        .single()

      const scoreForDimension = isCorrect ? 100 : 0
      const questionId = question.id.toString()

      if (existingCoverage) {
        // Check if this is a unique question (not a spaced repetition repeat)
        const uniqueQuestions = existingCoverage.unique_questions_answered || []
        const isNewQuestion = !uniqueQuestions.includes(questionId)

        // Add to unique questions array if new
        const updatedUniqueQuestions = isNewQuestion
          ? [...uniqueQuestions, questionId]
          : uniqueQuestions

        // Calculate new average score (only count unique questions for mastery)
        const newTimesTested = existingCoverage.times_tested + 1
        const newTotalAttempts = (existingCoverage.total_attempts || existingCoverage.times_tested) + 1

        // For average score, we want to track performance across unique questions
        // If this is a repeat, we still update the average to reflect current performance
        const newAvgScore = (
          (existingCoverage.average_score * existingCoverage.times_tested) + scoreForDimension
        ) / newTimesTested

        await supabase
          .from('user_dimension_coverage')
          .update({
            times_tested: newTimesTested,
            total_attempts: newTotalAttempts,
            unique_questions_answered: updatedUniqueQuestions,
            average_score: newAvgScore,
            last_tested_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingCoverage.id)
      } else {
        // Insert new coverage record
        await supabase
          .from('user_dimension_coverage')
          .insert({
            user_id: user.id,
            chapter_id: session.chapter_id,
            topic_id: topicId,
            bloom_level: question.bloom_level,
            dimension: question.dimension,
            times_tested: 1,
            total_attempts: 1,
            unique_questions_answered: [questionId],
            average_score: scoreForDimension,
            last_tested_at: new Date().toISOString()
          })
      }
    }

    // Update session progress
    const newScore = session.score + (isCorrect ? 1 : 0)
    const newQuestionsAnswered = session.questions_answered + 1
    const isComplete = newQuestionsAnswered >= session.total_questions

    await supabase
      .from('learning_sessions')
      .update({
        score: newScore,
        questions_answered: newQuestionsAnswered,
        ...(isComplete ? { completed_at: new Date().toISOString() } : {})
      })
      .eq('id', session_id)

    return NextResponse.json({
      is_correct: isCorrect,
      correct_answer: question.correct_answer,
      explanation: question.explanation,
      reward_components: rewardComponents,
      mastery_update: {
        topic_id: topicId,
        topic_name: arm_selected?.topic_name || 'Unknown',
        bloom_level: question.bloom_level,
        old_mastery: Math.round(currentMastery * 10) / 10,
        new_mastery: Math.round(newMastery * 10) / 10,
        change: Math.round(learningGain * 10) / 10
      },
      session_progress: {
        questions_answered: newQuestionsAnswered,
        total_questions: session.total_questions,
        current_score: newScore,
        is_complete: isComplete
      }
    })
  } catch (error) {
    console.error('Error in POST /api/rl/submit-response:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
