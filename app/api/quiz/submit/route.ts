/**
 * Quiz Answer Submission API Endpoint
 *
 * POST /api/quiz/submit
 *
 * Submits an answer, checks correctness, calculates reward, updates progress
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { AnswerSubmission, AnswerResult } from '@/lib/types/quiz'

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

    const submission: AnswerSubmission = await request.json()
    const { questionId, question: submittedQuestion, answer, confidence, timeTaken, topicId } = submission

    // Use submitted question (for on-the-fly) or fetch from database
    let question = submittedQuestion

    if (!question) {
      // Try to fetch from database (legacy/stored questions)
      const { data: dbQuestion, error: questionError } = await supabase
        .from('questions')
        .select('*')
        .eq('id', questionId)
        .single()

      if (questionError || !dbQuestion) {
        return NextResponse.json(
          { error: 'Question not found and not provided in submission' },
          { status: 404 }
        )
      }
      question = dbQuestion
    }

    // Check if answer is correct
    const isCorrect = checkAnswer(answer, question.correct_answer, question.question_format)

    // Calculate reward (simplified RL reward)
    const reward = calculateReward(isCorrect, confidence, timeTaken)

    // Store the response (use topicId from submission for on-the-fly questions)
    const responseTopicId = topicId || question.topic_id

    const { error: insertError } = await supabase
      .from('user_responses')
      .insert({
        user_id: user.id,
        question_id: questionId.startsWith('generated-') ? null : questionId, // null for on-the-fly
        topic_id: responseTopicId,
        bloom_level: question.bloom_level,
        user_answer: Array.isArray(answer) ? answer : [answer],
        is_correct: isCorrect,
        confidence_level: confidence,
        response_time_seconds: timeTaken,
        question_format: question.question_format,
        reward: reward
      })

    if (insertError) {
      console.error('Error storing response:', insertError)
      // Continue anyway - don't fail the submission
    }

    // Update user progress
    await updateUserProgress(
      supabase,
      user.id,
      responseTopicId,
      question.bloom_level,
      isCorrect,
      confidence,
      reward
    )

    // Build result
    const result: AnswerResult = {
      isCorrect,
      correctAnswer: question.correct_answer,
      explanation: question.explanation,
      reward,
      sessionComplete: false  // This would be determined by the session state
    }

    return NextResponse.json({
      success: true,
      result
    })

  } catch (error) {
    console.error('Error in quiz submit:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Check if the user's answer is correct
 */
function checkAnswer(
  userAnswer: string | string[],
  correctAnswer: string | string[],
  questionFormat: string
): boolean {
  if (questionFormat === 'mcq_multi') {
    // Multiple select - must match all correct answers
    const userSet = new Set(Array.isArray(userAnswer) ? userAnswer : [userAnswer])
    const correctSet = new Set(Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer])

    if (userSet.size !== correctSet.size) return false

    for (const ans of correctSet) {
      if (!userSet.has(ans)) return false
    }
    return true
  }

  if (questionFormat === 'open_ended' || questionFormat === 'fill_blank') {
    // Text comparison - case insensitive, trimmed
    const userText = Array.isArray(userAnswer) ? userAnswer[0] : userAnswer
    const correctText = Array.isArray(correctAnswer) ? correctAnswer[0] : correctAnswer

    return userText.trim().toLowerCase() === correctText.trim().toLowerCase()
  }

  // Single answer (MCQ single, True/False)
  const userValue = Array.isArray(userAnswer) ? userAnswer[0] : userAnswer
  const correctValue = Array.isArray(correctAnswer) ? correctAnswer[0] : correctAnswer

  return userValue === correctValue
}

/**
 * Calculate RL reward based on correctness, confidence, and time
 */
function calculateReward(
  isCorrect: boolean,
  confidence: number,
  timeTaken: number
): number {
  let reward = 0

  // Base reward for correctness
  if (isCorrect) {
    reward += 1.0
  } else {
    reward -= 0.5
  }

  // Confidence calibration bonus/penalty
  if (isCorrect && confidence >= 4) {
    reward += 0.2  // Well-calibrated confident correct
  } else if (isCorrect && confidence <= 2) {
    reward -= 0.1  // Under-confident but correct
  } else if (!isCorrect && confidence >= 4) {
    reward -= 0.3  // Over-confident and wrong
  } else if (!isCorrect && confidence <= 2) {
    reward += 0.1  // Well-calibrated, knew they didn't know
  }

  // Time penalty for extremely slow responses (>3 minutes)
  if (timeTaken > 180) {
    reward -= 0.1
  }

  // Time bonus for quick correct responses (<30 seconds)
  if (isCorrect && timeTaken < 30) {
    reward += 0.1
  }

  return Math.max(-1, Math.min(1, reward))  // Clamp to [-1, 1]
}

/**
 * Update user progress for the topic/Bloom level
 */
async function updateUserProgress(
  supabase: any,
  userId: string,
  topicId: string,
  bloomLevel: number,
  isCorrect: boolean,
  confidence: number,
  reward: number
) {
  // Fetch current progress
  const { data: progress } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('topic_id', topicId)
    .single()

  if (!progress) {
    // Create initial progress
    await supabase
      .from('user_progress')
      .insert({
        user_id: userId,
        topic_id: topicId,
        current_bloom_level: bloomLevel,
        mastery_scores: { [bloomLevel]: isCorrect ? 100 : 0 },
        total_attempts: 1,
        correct_answers: isCorrect ? 1 : 0,
        confidence_calibration_error: Math.abs((isCorrect ? 5 : 1) - confidence) / 4
      })
  } else {
    // Update existing progress
    const newCorrect = progress.correct_answers + (isCorrect ? 1 : 0)
    const newTotal = progress.total_attempts + 1
    const newMastery = Math.round((newCorrect / newTotal) * 100)

    const updatedMasteryScores = { ...progress.mastery_scores }
    updatedMasteryScores[bloomLevel] = newMastery

    await supabase
      .from('user_progress')
      .update({
        total_attempts: newTotal,
        correct_answers: newCorrect,
        mastery_scores: updatedMasteryScores,
        last_activity: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('topic_id', topicId)
  }
}
