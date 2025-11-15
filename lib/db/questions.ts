/**
 * Database utilities for questions table
 * Handles persistence of generated questions for spaced repetition
 */

import { createClient } from '@/lib/supabase/server'

export interface QuestionData {
  id: string
  topic_id: string
  bloom_level: number
  question_format: string
  question_text: string
  options?: string[]
  correct_answer: string | string[]  // Can be string or array
  correct_answers?: string[]  // For mcq_multi (separate field in DB)
  explanation?: string
  rag_context?: string
  source_type?: 'manual' | 'ai_generated_realtime' | 'ai_generated_graphrag'
  model?: string
  tokens_used?: number
  generation_cost?: number
}

/**
 * Save a generated question to the database for future reuse
 */
export async function saveQuestion(question: QuestionData) {
  try {
    const supabase = await createClient()

    // Handle correct_answer: if array, store in correct_answers and use first item for correct_answer
    const isMultiAnswer = Array.isArray(question.correct_answer)
    const correctAnswer = isMultiAnswer ? question.correct_answer[0] : question.correct_answer
    const correctAnswers = isMultiAnswer ? question.correct_answer : (question.correct_answers || null)

    const { data, error } = await supabase
      .from('questions')
      .insert({
        id: question.id,
        topic_id: question.topic_id,
        bloom_level: question.bloom_level,
        question_text: question.question_text,
        question_type: question.question_format, // Map to old schema field
        question_format: question.question_format, // New schema field
        options: question.options || null,
        correct_answer: correctAnswer,
        correct_answers: correctAnswers,
        explanation: question.explanation || null,
        rag_context: question.rag_context || null,
        source_type: question.source_type || 'ai_generated_realtime',
        model: question.model || 'grok-beta',
        tokens_used: question.tokens_used || null,
        generation_cost: question.generation_cost || null,
        times_used: 1  // First time being used
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving question to database:', error)
      throw error
    }

    console.log('Question saved successfully:', question.id)
    return data
  } catch (error) {
    console.error('Failed to save question:', error)
    // Don't throw - allow quiz to continue even if persistence fails
    return null
  }
}

/**
 * Save multiple questions in a batch
 */
export async function saveQuestions(questions: QuestionData[]) {
  try {
    const supabase = await createClient()

    const questionsToInsert = questions.map(q => {
      // Handle correct_answer: if array, store in correct_answers and use first item for correct_answer
      const isMultiAnswer = Array.isArray(q.correct_answer)
      const correctAnswer = isMultiAnswer ? q.correct_answer[0] : q.correct_answer
      const correctAnswers = isMultiAnswer ? q.correct_answer : (q.correct_answers || null)

      return {
        id: q.id,
        topic_id: q.topic_id,
        bloom_level: q.bloom_level,
        question_text: q.question_text,
        question_type: q.question_format,
        question_format: q.question_format,
        options: q.options || null,
        correct_answer: correctAnswer,
        correct_answers: correctAnswers,
        explanation: q.explanation || null,
        rag_context: q.rag_context || null,
        source_type: q.source_type || 'ai_generated_realtime',
        model: q.model || 'grok-beta',
        tokens_used: q.tokens_used || null,
        generation_cost: q.generation_cost || null,
        times_used: 1
      }
    })

    const { data, error } = await supabase
      .from('questions')
      .insert(questionsToInsert)
      .select()

    if (error) {
      console.error('Error saving questions batch to database:', error)
      throw error
    }

    console.log(`Successfully saved ${questions.length} questions to database`)
    return data
  } catch (error) {
    console.error('Failed to save questions batch:', error)
    // Don't throw - allow quiz to continue even if persistence fails
    return null
  }
}

/**
 * Increment usage counter when a question is shown to a user
 */
export async function incrementQuestionUsage(questionId: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase.rpc('increment_question_usage', {
      p_question_id: questionId
    })

    if (error) {
      console.error('Error incrementing question usage:', error)
    }
  } catch (error) {
    console.error('Failed to increment question usage:', error)
  }
}

/**
 * Update question correctness rate after a user answers
 */
export async function updateQuestionStats(questionId: string, isCorrect: boolean) {
  try {
    const supabase = await createClient()

    // Fetch current stats
    const { data: question, error: fetchError } = await supabase
      .from('questions')
      .select('times_used, avg_correctness_rate')
      .eq('id', questionId)
      .single()

    if (fetchError || !question) {
      console.error('Error fetching question stats:', fetchError)
      return
    }

    // Calculate new average
    const currentRate = question.avg_correctness_rate || 0
    const timesUsed = question.times_used || 1
    const newRate = ((currentRate * (timesUsed - 1)) + (isCorrect ? 1 : 0)) / timesUsed

    // Update stats
    const { error: updateError } = await supabase
      .from('questions')
      .update({
        avg_correctness_rate: newRate
      })
      .eq('id', questionId)

    if (updateError) {
      console.error('Error updating question stats:', updateError)
    }
  } catch (error) {
    console.error('Failed to update question stats:', error)
  }
}
