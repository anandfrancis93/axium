/**
 * Quiz Answer Submission API Endpoint
 *
 * POST /api/quiz/submit
 *
 * Submits an answer, checks correctness, calculates calibration score, updates progress
 * Uses TWO-TRACK system:
 * - TRACK 1 (Calibration): Format-independent metacognitive score for RL optimization
 * - TRACK 2 (Correctness): Format-dependent scores for student motivation
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { AnswerSubmission, AnswerResult } from '@/lib/types/quiz'
import { updateQuestionStats } from '@/lib/db/questions'

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

    // Check if answer is correct (TRACK 2: Correctness)
    const isCorrect = checkAnswer(answer, question.correct_answer, question.question_format)

    // Calculate calibration score based on 3D matrix (TRACK 1: Calibration)
    // This is format-independent and measures metacognitive accuracy
    const calibrationScore = calculateCalibrationScore(isCorrect, confidence, recognitionMethod)

    // Store the response (use topicId from submission for on-the-fly questions)
    const responseTopicId = topicId || question.topic_id

    console.log('Attempting to insert response:', {
      user_id: user.id,
      question_id: questionId,
      topic_id: responseTopicId,
      calibration_score: calibrationScore,
      confidence,
      recognition_method: recognitionMethod
    })

    const { data: insertData, error: insertError } = await supabase
      .from('user_responses')
      .insert({
        user_id: user.id,
        question_id: questionId, // Store generated IDs as-is (don't convert to null)
        topic_id: responseTopicId,
        bloom_level: question.bloom_level,
        user_answer: Array.isArray(answer) ? answer : [answer],
        is_correct: isCorrect,                      // TRACK 2: Correctness
        confidence: confidence,
        recognition_method: recognitionMethod,
        time_taken_seconds: timeTaken,
        question_format: question.question_format,
        calibration_score: calibrationScore,        // TRACK 1: Calibration (primary)
        reward: calibrationScore                    // Legacy: Store same value for backward compatibility
      })
      .select()

    if (insertError) {
      console.error('ERROR storing response:', insertError)
      console.error('Insert error details:', JSON.stringify(insertError, null, 2))
      // Return error to client so it's visible
      return NextResponse.json(
        {
          error: 'Failed to save response',
          details: insertError.message,
          code: insertError.code
        },
        { status: 500 }
      )
    }

    console.log('Response saved successfully:', insertData)

    // Update question statistics (times_used, avg_correctness_rate)
    await updateQuestionStats(questionId, isCorrect)

    // Update user progress (TRACK 2: Format-specific correctness)
    // Note: TRACK 1 (calibration statistics) are automatically updated by database trigger
    await updateUserProgress(
      supabase,
      user.id,
      responseTopicId,
      question.bloom_level,
      question.question_format,
      isCorrect
    )

    // Expand correct answer if it's just a letter (A, B, C, D) to full option text
    let expandedCorrectAnswer = question.correct_answer
    if (question.options && (question.question_format === 'mcq_single' || question.question_format === 'mcq_multi')) {
      expandedCorrectAnswer = expandCorrectAnswer(question.correct_answer, question.options)
    }

    // Build result
    const result: AnswerResult = {
      isCorrect,
      correctAnswer: expandedCorrectAnswer,
      explanation: question.explanation,
      calibrationScore,                        // TRACK 1: For RL system
      reward: calibrationScore,                // Legacy: Same as calibrationScore
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
 * Normalize answer by removing letter prefix (e.g., "A. ", "B. ")
 */
function normalizeAnswer(answer: string): string {
  return answer.replace(/^[A-Z]\.\s*/, '').trim()
}

/**
 * Extract letter prefix from answer (e.g., "A. Text" -> "A")
 */
function extractLetter(answer: string): string | null {
  const match = answer.match(/^([A-Z])\./)
  return match ? match[1] : null
}

/**
 * Expand letter-only correct answers (A, B, C) to full option text
 */
function expandCorrectAnswer(
  correctAnswer: string | string[],
  options: string[]
): string | string[] {
  const expandSingle = (ans: string): string => {
    // If answer is just a letter (A, B, C, D), find the matching option
    if (/^[A-Z]$/.test(ans.trim())) {
      const letter = ans.trim()
      const matchingOption = options.find(opt => {
        const optLetter = extractLetter(opt)
        return optLetter === letter
      })
      return matchingOption || ans
    }
    return ans
  }

  if (Array.isArray(correctAnswer)) {
    return correctAnswer.map(expandSingle)
  }
  return expandSingle(correctAnswer)
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
    const userAnswers = Array.isArray(userAnswer) ? userAnswer : [userAnswer]
    const correctAnswers = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer]

    // Check if correct answers are just letters (A, B, C) or full text
    const correctAreLetters = correctAnswers.every(ans => /^[A-Z]$/.test(ans.trim()))

    if (correctAreLetters) {
      // Compare by letter only
      const userLetters = new Set(userAnswers.map(ans => extractLetter(ans) || normalizeAnswer(ans)))
      const correctLetters = new Set(correctAnswers.map(ans => ans.trim()))

      if (userLetters.size !== correctLetters.size) return false

      for (const letter of correctLetters) {
        if (!userLetters.has(letter)) return false
      }
      return true
    } else {
      // Compare by normalized text
      const userSet = new Set(userAnswers.map(normalizeAnswer))
      const correctSet = new Set(correctAnswers.map(normalizeAnswer))

      if (userSet.size !== correctSet.size) return false

      for (const ans of correctSet) {
        if (!userSet.has(ans)) return false
      }
      return true
    }
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

  // Check if correct answer is just a letter (A, B, C, D)
  if (/^[A-Z]$/.test(correctValue.trim())) {
    // Extract letter from user's answer
    const userLetter = extractLetter(userValue)
    return userLetter === correctValue.trim()
  }

  // Otherwise, normalize both values before comparison
  return normalizeAnswer(userValue) === normalizeAnswer(correctValue)
}

/**
 * Calculate TRACK 1 calibration score based on 3D matrix:
 * - Correctness (Correct/Incorrect)
 * - Confidence (Low=1, Medium=2, High=3)
 * - Recognition Method (memory, recognition, educated_guess, random_guess)
 *
 * Total: 2 × 3 × 4 = 24 unique scenarios
 *
 * This score is FORMAT-INDEPENDENT and measures metacognitive accuracy.
 * Used by RL system for topic selection and adaptive learning.
 *
 * Range: -1.5 to +1.5
 * - Positive: Good calibration (confidence matches performance)
 * - Negative: Poor calibration (overconfident when wrong, underconfident when right)
 * - Magnitude: Degree of calibration quality
 */
function calculateCalibrationScore(
  isCorrect: boolean,
  confidence: number,
  recognitionMethod: string
): number {
  // 3D Calibration Matrix
  const calibrationMatrix: Record<string, Record<number, Record<string, number>>> = {
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
  const calibrationScore = calibrationMatrix[correctnessKey]?.[confidence]?.[recognitionMethod]

  if (calibrationScore === undefined) {
    console.warn(`Invalid calibration parameters: ${correctnessKey}, confidence=${confidence}, method=${recognitionMethod}`)
    return isCorrect ? 0.5 : -0.5  // Fallback
  }

  return calibrationScore  // No clamping needed, matrix already balanced
}

/**
 * Update TRACK 2: Mastery scores per Bloom level
 *
 * Updates mastery_scores with overall performance per Bloom level.
 * Structure: {"1": 85, "2": 70, ...}
 *
 * Format-specific performance tracked separately via v_format_performance view.
 */
async function updateUserProgress(
  supabase: any,
  userId: string,
  topicId: string,
  bloomLevel: number,
  questionFormat: string,
  isCorrect: boolean
) {
  // Fetch current progress
  const { data: progress } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('topic_id', topicId)
    .single()

  if (!progress) {
    // Create initial progress record
    const initialMasteryScores = {
      [bloomLevel]: isCorrect ? 100 : 0
    }

    await supabase
      .from('user_progress')
      .insert({
        user_id: userId,
        topic_id: topicId,
        current_bloom_level: bloomLevel,
        mastery_scores: initialMasteryScores,
        total_attempts: 1,
        correct_answers: isCorrect ? 1 : 0,
        last_practiced_at: new Date().toISOString()
      })
  } else {
    // Update existing progress
    const newCorrect = progress.correct_answers + (isCorrect ? 1 : 0)
    const newTotal = progress.total_attempts + 1

    // Update mastery scores (overall per Bloom level, not per format)
    const updatedMasteryScores = { ...progress.mastery_scores }

    // Get all responses for this user/topic/bloom (all formats combined)
    const { data: bloomResponses } = await supabase
      .from('user_responses')
      .select('is_correct')
      .eq('user_id', userId)
      .eq('topic_id', topicId)
      .eq('bloom_level', bloomLevel)

    if (bloomResponses && bloomResponses.length > 0) {
      const bloomCorrect = bloomResponses.filter((r: { is_correct: boolean }) => r.is_correct).length
      const bloomTotal = bloomResponses.length
      const bloomMastery = Math.round((bloomCorrect / bloomTotal) * 100)

      updatedMasteryScores[bloomLevel] = bloomMastery
    } else {
      // First response for this Bloom level
      updatedMasteryScores[bloomLevel] = isCorrect ? 100 : 0
    }

    await supabase
      .from('user_progress')
      .update({
        total_attempts: newTotal,
        correct_answers: newCorrect,
        mastery_scores: updatedMasteryScores,
        last_practiced_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('topic_id', topicId)
  }
}
