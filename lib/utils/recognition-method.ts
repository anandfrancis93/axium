/**
 * Recognition Method Utilities
 *
 * Determines which recognition methods are available for each question format
 */

import { QuestionFormat, RecognitionMethod } from '@/lib/types/quiz'

/**
 * Get available recognition methods for a given question format
 *
 * Logic:
 * - MCQ (single/multi), Fill-blank, True/False, Matching: All 4 methods
 *   (These have visible options to recognize)
 * - Open-ended: Only 2 methods (memory, educated_guess)
 *   (No options to recognize, must recall or reason)
 */
export function getAvailableRecognitionMethods(format: QuestionFormat): RecognitionMethod[] {
  switch (format) {
    case 'open_ended':
      // Open-ended has no options to recognize
      return ['memory', 'educated_guess']

    case 'true_false':
      // True/False: "recognition" doesn't apply since True/False aren't
      // recognizable answers - you either know it, reason it, or guess 50/50
      return ['memory', 'educated_guess', 'random_guess']

    case 'mcq_single':
    case 'mcq_multi':
    case 'fill_blank':
      // These formats have options/choices that can be recognized
      return ['memory', 'recognition', 'educated_guess', 'random_guess']

    default:
      // Fallback: all methods
      return ['memory', 'recognition', 'educated_guess', 'random_guess']
  }
}

/**
 * Check if a recognition method is valid for a given format
 */
export function isRecognitionMethodValid(
  method: RecognitionMethod,
  format: QuestionFormat
): boolean {
  const availableMethods = getAvailableRecognitionMethods(format)
  return availableMethods.includes(method)
}

/**
 * Get default recognition method for a format
 * (The most common/appropriate method for that format)
 */
export function getDefaultRecognitionMethod(format: QuestionFormat): RecognitionMethod {
  switch (format) {
    case 'open_ended':
      return 'educated_guess'  // Most common for open-ended
    case 'true_false':
      return 'educated_guess'  // Most common for true/false (reasoning about the statement)
    case 'mcq_single':
    case 'mcq_multi':
      return 'recognition'  // Most common for MCQ-style
    case 'fill_blank':
      return 'memory'  // Most common for recall-based
    default:
      return 'recognition'
  }
}

/**
 * Get explanation for why certain methods are unavailable
 */
export function getUnavailableMethodExplanation(format: QuestionFormat): string | null {
  switch (format) {
    case 'open_ended':
      return 'For open-ended questions, you cannot recognize from options or guess randomly, so only memory recall and educated reasoning are available.'
    case 'true_false':
      return 'For true/false questions, "recognition" does not apply since True and False are not recognizable answers - you either know it, reason it out, or guess.'
    default:
      return null  // All methods available
  }
}
