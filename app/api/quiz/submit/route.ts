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
    const { questionId, question: submittedQuestion, answer, confidence, recognitionMethod, timeTaken, topicId } = submission

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

    // TypeScript guard - should never happen due to check above
    if (!question) {
      return NextResponse.json(
        { error: 'Question data is missing' },
        { status: 400 }
      )
    }

    // Check if answer is correct
    const isCorrect = checkAnswer(answer, question.correct_answer, question.question_format)

    // Calculate reward based on 3D calibration matrix (correctness + confidence + recognition method)
    const reward = calculateReward(isCorrect, confidence, recognitionMethod)

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
        confidence: confidence,
        recognition_method: recognitionMethod,
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
 * Calculate RL reward based on 3D calibration matrix:
 * - Correctness (Correct/Incorrect)
 * - Confidence (Low=1, Medium=2, High=3)
 * - Recognition Method (memory, recognition, educated_guess, random_guess)
 *
 * Total: 2 × 3 × 4 = 24 unique scenarios
 */
function calculateReward(
  isCorrect: boolean,
  confidence: number,
  recognitionMethod: string
): number {
  // 3D Reward Matrix
  const rewardMatrix: Record<string, Record<number, Record<string, number>>> = {
    // CORRECT ANSWERS
    correct: {
      // High Confidence + Correct
      3: {
        memory: 1.5,          // Perfect: recalled from memory with high confidence
        recognition: 1.2,     // Good: recognized correctly with confidence
        educated_guess: 0.8,  // Okay: lucky educated guess, overconfident
        random_guess: 0.3     // Lucky: random guess correct, poor calibration
      },
      // Medium Confidence + Correct
      2: {
        memory: 1.2,          // Good: recall but underconfident
        recognition: 1.0,     // Good: appropriate confidence for recognition
        educated_guess: 0.9,  // Good: reasonable calibration for educated guess
        random_guess: 0.4     // Lucky: random guess, poor calibration
      },
      // Low Confidence + Correct
      1: {
        memory: 0.9,          // Underconfident: recall but very uncertain
        recognition: 0.8,     // Underconfident but appropriate for uncertain recognition
        educated_guess: 0.7,  // Good calibration: uncertain educated guess that worked
        random_guess: 0.5     // Best calibration: knew it was random, got lucky
      }
    },
    // INCORRECT ANSWERS
    incorrect: {
      // High Confidence + Incorrect
      3: {
        memory: -1.5,         // Worst: false memory with high confidence
        recognition: -1.2,    // Bad: misrecognition with high confidence
        educated_guess: -0.8, // Bad: overconfident wrong guess
        random_guess: -0.5    // Odd: why high confidence on random guess?
      },
      // Medium Confidence + Incorrect
      2: {
        memory: -1.0,         // Bad: false memory with moderate confidence
        recognition: -0.8,    // Bad: misrecognition
        educated_guess: -0.6, // Reasonable: moderate confidence on failed logic
        random_guess: -0.4    // Poor calibration: random with medium confidence
      },
      // Low Confidence + Incorrect
      1: {
        memory: -0.6,         // Good calibration: uncertain false memory
        recognition: -0.4,    // Good calibration: uncertain misrecognition
        educated_guess: -0.3, // Good calibration: knew logic was shaky
        random_guess: -0.2    // Excellent calibration: knew it was random, was wrong
      }
    }
  }

  const correctnessKey = isCorrect ? 'correct' : 'incorrect'
  const reward = rewardMatrix[correctnessKey]?.[confidence]?.[recognitionMethod]

  if (reward === undefined) {
    console.warn(`Invalid reward parameters: ${correctnessKey}, confidence=${confidence}, method=${recognitionMethod}`)
    return isCorrect ? 0.5 : -0.5  // Fallback
  }

  return reward  // No clamping needed, matrix already balanced
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
