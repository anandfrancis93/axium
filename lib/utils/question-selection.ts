/**
 * Question Selection Utilities for 7-2-1 Split Pattern
 */

export type QuestionType = 'new_topic' | 'spaced_repetition' | 'dimension_practice'

export interface QuestionPosition {
  position: number // 1-10
  type: QuestionType
  description: string
}

/**
 * Determine what type of question to select based on position in 10-question cycle
 *
 * Pattern:
 * - Position 1-7: New topics (RL selection)
 * - Position 8-9: Spaced repetition (exact same questions)
 * - Position 10: Round-robin dimension practice
 *
 * @param position - Current position (1-10)
 * @returns Question type and description
 */
export function determineQuestionType(position: number): QuestionPosition {
  const normalizedPosition = ((position - 1) % 10) + 1

  if (normalizedPosition >= 1 && normalizedPosition <= 7) {
    return {
      position: normalizedPosition,
      type: 'new_topic',
      description: 'New topic selected by RL'
    }
  } else if (normalizedPosition >= 8 && normalizedPosition <= 9) {
    return {
      position: normalizedPosition,
      type: 'spaced_repetition',
      description: 'Review previous question (spaced repetition)'
    }
  } else { // position 10
    return {
      position: normalizedPosition,
      type: 'dimension_practice',
      description: 'Practice uncovered dimension on known topic'
    }
  }
}

/**
 * Get next question position for a user
 * Looks across all their active topics and finds the most recent position
 *
 * @param supabase - Supabase client
 * @param userId - User ID
 * @returns Next position (1-10)
 */
export async function getNextQuestionPosition(
  supabase: any,
  userId: string
): Promise<number> {
  // Get the global question_position from user_global_progress
  const { data, error } = await supabase
    .from('user_global_progress')
    .select('question_position')
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    return 1 // Start at position 1 if no global progress yet
  }

  // Return current position (already 1-10)
  // If it's 0 or null, default to 1
  return data.question_position || 1
}
