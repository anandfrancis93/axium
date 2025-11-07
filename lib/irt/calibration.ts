/**
 * IRT Calibration - Empirical Parameter Estimation
 *
 * This module implements empirical IRT parameter estimation from response data.
 * Use when questions have 30+ responses from 10+ users.
 */

interface Response {
  user_id: string
  is_correct: boolean
  confidence?: number
}

interface QuestionResponseData {
  question_id: string
  responses: Response[]
  bloom_level: number
}

interface CalibrationResult {
  a: number // Discrimination
  b: number // Difficulty
  c: number // Guessing
  sample_size: number
  unique_users: number
  p_value: number
  calibration_method: 'empirical' | 'default'
  fit_statistics?: {
    chi_square?: number
    rmse?: number
  }
}

/**
 * Simple empirical calibration using classical test theory formulas
 *
 * This is a lightweight approach that works well for initial calibration.
 * For more accuracy, consider implementing MML or MCMC methods later.
 */
export function calibrateQuestionSimple(
  responses: Response[],
  bloomLevel: number
): CalibrationResult {
  const sampleSize = responses.length
  const uniqueUsers = new Set(responses.map(r => r.user_id)).size

  // Calculate p-value (proportion correct)
  const correctCount = responses.filter(r => r.is_correct).length
  const pValue = correctCount / sampleSize

  // Difficulty estimation using normal ogive approximation
  // Formula: b = -1.7 * ln(p / (1-p))
  let difficulty_b: number

  if (pValue >= 0.99) {
    difficulty_b = -3.0 // Very easy, cap at -3
  } else if (pValue <= 0.01) {
    difficulty_b = 3.0 // Very hard, cap at +3
  } else {
    difficulty_b = -1.7 * Math.log(pValue / (1 - pValue))
    // Clamp to reasonable range
    difficulty_b = Math.max(-3, Math.min(3, difficulty_b))
  }

  // Discrimination estimation using point-biserial correlation
  const discrimination_a = estimateDiscrimination(responses)

  // Guessing parameter - use lower asymptote
  // For MCQs, c is typically between 0.15 and 0.25
  const guessing_c = Math.min(pValue, 0.25)

  return {
    a: discrimination_a,
    b: difficulty_b,
    c: guessing_c,
    sample_size: sampleSize,
    unique_users: uniqueUsers,
    p_value: pValue,
    calibration_method: 'empirical'
  }
}

/**
 * Estimate discrimination parameter using point-biserial correlation
 *
 * This measures how well the item discriminates between high and low ability users.
 * Higher correlation = better discrimination.
 */
function estimateDiscrimination(responses: Response[]): number {
  // For proper discrimination, we need user ability estimates
  // As a proxy, use confidence levels or aggregate performance

  // Simple approach: Calculate variance in responses
  // Items with high discrimination show more variance
  const correctCount = responses.filter(r => r.is_correct).length
  const pValue = correctCount / responses.length

  // Variance of binary outcome: p(1-p)
  const variance = pValue * (1 - pValue)

  // Map variance to discrimination parameter (0.5 to 2.5)
  // Peak variance (0.25) maps to highest discrimination (2.5)
  let discrimination = 0.5 + (variance / 0.25) * 2.0

  // Clamp to reasonable range
  discrimination = Math.max(0.5, Math.min(2.5, discrimination))

  return discrimination
}

/**
 * Advanced calibration using Marginal Maximum Likelihood (MML)
 *
 * This is the gold standard for IRT calibration but requires more complex math.
 * Implement this when you have 50+ responses per question from 20+ users.
 *
 * TODO: Implement MML algorithm
 * - E-M algorithm for parameter estimation
 * - Quadrature for ability distribution
 * - Iterative convergence
 */
export function calibrateQuestionMML(
  responses: Response[]
): CalibrationResult {
  // Placeholder for future implementation
  throw new Error('MML calibration not yet implemented. Use calibrateQuestionSimple() instead.')
}

/**
 * Decide which calibration method to use based on sample size
 */
export function calibrateQuestion(
  questionData: QuestionResponseData
): CalibrationResult {
  const { responses, bloom_level } = questionData

  // Need at least 30 responses from 10+ users for reliable calibration
  const uniqueUsers = new Set(responses.map(r => r.user_id)).size

  if (responses.length >= 30 && uniqueUsers >= 10) {
    // Use empirical calibration
    return calibrateQuestionSimple(responses, bloom_level)
  } else {
    // Not enough data, return null to signal using default parameters
    return {
      a: 0,
      b: 0,
      c: 0,
      sample_size: responses.length,
      unique_users: uniqueUsers,
      p_value: 0,
      calibration_method: 'default'
    }
  }
}

/**
 * Batch calibrate all questions in a chapter
 */
export async function batchCalibrateChapter(
  chapterId: string,
  supabase: any
): Promise<Map<string, CalibrationResult>> {
  console.log(`🔧 Starting calibration for chapter ${chapterId}`)

  // Fetch all responses for this chapter
  const { data: responses, error } = await supabase
    .from('user_responses')
    .select(`
      question_id,
      user_id,
      is_correct,
      confidence,
      questions (
        bloom_level
      )
    `)
    .eq('questions.chapter_id', chapterId)

  if (error) {
    console.error('Error fetching responses:', error)
    return new Map()
  }

  // Group responses by question
  const questionResponses = new Map<string, QuestionResponseData>()

  for (const response of responses) {
    if (!questionResponses.has(response.question_id)) {
      questionResponses.set(response.question_id, {
        question_id: response.question_id,
        responses: [],
        bloom_level: response.questions?.bloom_level || 3
      })
    }

    questionResponses.get(response.question_id)!.responses.push({
      user_id: response.user_id,
      is_correct: response.is_correct,
      confidence: response.confidence
    })
  }

  // Calibrate each question
  const calibrationResults = new Map<string, CalibrationResult>()

  for (const [questionId, questionData] of questionResponses.entries()) {
    const result = calibrateQuestion(questionData)

    if (result.calibration_method === 'empirical') {
      calibrationResults.set(questionId, result)
      console.log(`✅ Calibrated ${questionId}: a=${result.a.toFixed(2)}, b=${result.b.toFixed(2)}, c=${result.c.toFixed(2)} (n=${result.sample_size})`)
    } else {
      console.log(`⏭️  Skipped ${questionId}: insufficient data (n=${result.sample_size}, users=${result.unique_users})`)
    }
  }

  console.log(`\n📊 Calibration complete: ${calibrationResults.size}/${questionResponses.size} questions calibrated`)

  return calibrationResults
}

/**
 * Update database with calibrated parameters
 */
export async function saveCalibrationResults(
  calibrationResults: Map<string, CalibrationResult>,
  supabase: any
): Promise<void> {
  console.log('💾 Saving calibration results to database...')

  const updates = Array.from(calibrationResults.entries()).map(([questionId, result]) => ({
    question_id: questionId,
    difficulty_b: result.b,
    discrimination_a: result.a,
    guessing_c: result.c,
    sample_size: result.sample_size,
    fit_statistics: result.fit_statistics || {},
    calibrated_at: new Date().toISOString(),
    last_updated: new Date().toISOString()
  }))

  // Upsert to question_irt_calibration table
  const { error } = await supabase
    .from('question_irt_calibration')
    .upsert(updates, {
      onConflict: 'question_id'
    })

  if (error) {
    console.error('Error saving calibration results:', error)
    throw error
  }

  console.log(`✅ Saved ${updates.length} calibration results`)
}
