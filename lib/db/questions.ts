/**
 * Database utilities for questions table
 */

import { createClient } from '@/lib/supabase/server'

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
