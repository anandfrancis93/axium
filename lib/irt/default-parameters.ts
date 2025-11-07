/**
 * Default IRT Parameters by Bloom Level
 *
 * These parameters are used when empirical calibration data is insufficient.
 * Based on typical patterns in cognitive assessments and certification exams.
 *
 * Parameters:
 * - a (discrimination): How well the item differentiates ability levels (0.5-2.5)
 * - b (difficulty): Item difficulty on theta scale (-3 to +3)
 * - c (guessing): Probability of guessing correctly (0-0.25)
 */

export interface IRTParameters {
  a: number // Discrimination
  b: number // Difficulty
  c: number // Guessing
}

/**
 * Default IRT parameters by Bloom level
 *
 * Rationale:
 * - Lower Bloom levels (Remember, Understand) are easier (negative b)
 * - Higher Bloom levels (Evaluate, Create) are harder (positive b)
 * - Discrimination increases with Bloom level (better differentiation at higher levels)
 * - Guessing is constant at 0.20 (assuming 5-option MCQs)
 */
export const DEFAULT_IRT_BY_BLOOM: Record<number, IRTParameters> = {
  1: {
    // Remember - Easiest, recall facts
    a: 1.0,  // Moderate discrimination
    b: -1.5, // Easy (negative difficulty)
    c: 0.20  // 20% guessing (1/5 for MCQ)
  },
  2: {
    // Understand - Explain concepts
    a: 1.2,
    b: -0.8,
    c: 0.20
  },
  3: {
    // Apply - Use knowledge in new situations
    a: 1.5,  // Better discrimination
    b: 0.0,  // Medium difficulty (neutral)
    c: 0.20
  },
  4: {
    // Analyze - Break down and examine
    a: 1.8,
    b: 0.8,  // Harder (positive difficulty)
    c: 0.20
  },
  5: {
    // Evaluate - Make judgments
    a: 2.0,  // High discrimination
    b: 1.2,
    c: 0.20
  },
  6: {
    // Create - Produce original work
    a: 2.2,  // Highest discrimination
    b: 1.8,  // Hardest (high positive difficulty)
    c: 0.20
  }
}

/**
 * Get default IRT parameters for a question based on Bloom level
 */
export function getDefaultIRTParameters(bloomLevel: number): IRTParameters {
  const params = DEFAULT_IRT_BY_BLOOM[bloomLevel]

  if (!params) {
    console.warn(`Invalid Bloom level ${bloomLevel}, using default (level 3)`)
    return DEFAULT_IRT_BY_BLOOM[3]
  }

  return params
}

/**
 * Adjust default parameters based on question type
 *
 * Different question formats may have different guessing probabilities:
 * - True/False: c = 0.50
 * - MCQ 4-option: c = 0.25
 * - MCQ 5-option: c = 0.20 (default)
 * - Code/Open-ended: c = 0.05 (very low guessing)
 */
export function adjustParametersForQuestionType(
  baseParams: IRTParameters,
  questionType: string
): IRTParameters {
  let adjustedC = baseParams.c

  switch (questionType) {
    case 'true_false':
      adjustedC = 0.50
      break
    case 'mcq_single':
      adjustedC = 0.25 // Assuming 4 options (typical)
      break
    case 'mcq_multi':
      adjustedC = 0.15 // Lower for multiple correct
      break
    case 'code_trace':
    case 'code_debug':
    case 'code_writing':
      adjustedC = 0.05 // Very low guessing for code
      break
    case 'fill_blank':
      adjustedC = 0.05
      break
    case 'open_ended':
      adjustedC = 0.01 // Essentially no guessing
      break
    default:
      adjustedC = baseParams.c
  }

  return {
    ...baseParams,
    c: adjustedC
  }
}

/**
 * Get IRT parameters with all adjustments applied
 */
export function getQuestionIRTParameters(
  bloomLevel: number,
  questionType: string = 'mcq_single'
): IRTParameters {
  const baseParams = getDefaultIRTParameters(bloomLevel)
  return adjustParametersForQuestionType(baseParams, questionType)
}
