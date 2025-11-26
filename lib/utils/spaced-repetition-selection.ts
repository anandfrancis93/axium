/**
 * Spaced Repetition Question Selection
 *
 * Functions for retrieving questions that are due for review
 */

import { CognitiveDimension } from './cognitive-dimensions'

/**
 * Fetch spaced repetition questions that are due for review FOR THIS USER
 *
 * Uses user_question_reviews table for per-user review tracking
 *
 * @param supabase - Supabase client
 * @param userId - User ID
 * @param subject - Optional subject filter (e.g., 'cybersecurity')
 * @param limit - Max number of questions to fetch
 * @returns Array of questions due for review
 */
export async function fetchDueSpacedRepetitionQuestions(
  supabase: any,
  userId: string,
  subject?: string,
  limit: number = 10
) {
  // Query user_question_reviews joined with questions
  let query = supabase
    .from('user_question_reviews')
    .select(`
      question_id,
      next_review_date,
      review_count,
      questions!inner(
        id,
        topic_id,
        bloom_level,
        question_format,
        cognitive_dimension,
        question_text,
        options,
        correct_answer,
        explanation,
        topics!inner(
          id,
          name,
          description,
          hierarchy_level,
          parent_topic_id,
          subject_id,
          subjects(name)
        )
      )
    `)
    .eq('user_id', userId)
    .lte('next_review_date', new Date().toISOString())
    .order('next_review_date', { ascending: true })
    .limit(limit)

  const { data, error } = await query

  if (error) {
    console.error('[Spaced Repetition] Error fetching due questions:', error)
    return []
  }

  if (!data || data.length === 0) {
    console.log(`[Spaced Repetition] No questions due for review for user ${userId}`)
    return []
  }

  // Filter by subject if provided (post-query filtering)
  let filteredData = data
  if (subject) {
    filteredData = data.filter((review: any) => {
      const subjectName = review.questions?.topics?.subjects?.name
      return subjectName?.toLowerCase() === subject.toLowerCase()
    })
  }

  // Flatten the structure to match expected format
  const questions = filteredData.map((review: any) => ({
    id: review.questions.id,
    topic_id: review.questions.topic_id,
    bloom_level: review.questions.bloom_level,
    question_format: review.questions.question_format,
    cognitive_dimension: review.questions.cognitive_dimension,
    question_text: review.questions.question_text,
    options: review.questions.options,
    correct_answer: review.questions.correct_answer,
    explanation: review.questions.explanation,
    next_review_date: review.next_review_date,
    review_count: review.review_count,
    topics: review.questions.topics
  }))

  console.log(`[Spaced Repetition] Found ${questions.length} questions due for review for user ${userId}`)
  return questions
}

/**
 * Find topics with uncovered dimensions for dimension practice
 *
 * @param supabase - Supabase client
 * @param userId - User ID
 * @param subject - Optional subject filter
 * @returns Array of topics with uncovered dimensions
 */
export async function findTopicsWithUncoveredDimensions(
  supabase: any,
  userId: string,
  subject?: string
) {
  // Get all user progress where not all dimensions are covered
  let query = supabase
    .from('user_progress')
    .select(`
      topic_id,
      current_bloom_level,
      dimension_coverage,
      mastery_scores,
      topics!inner(
        id,
        name,
        description,
        hierarchy_level,
        subject_id,
        subjects(name)
      )
    `)
    .eq('user_id', userId)

  // Filter by subject if provided
  if (subject) {
    query = query.eq('topics.subjects.name', subject)
  }

  const { data, error } = await query

  if (error) {
    console.error('[Dimension Practice] Error fetching progress:', error)
    return []
  }

  if (!data || data.length === 0) {
    return []
  }

  // Filter topics that have uncovered dimensions at their current Bloom level
  // AND have less than 80% overall mastery (topics with 80%+ are handled by spaced repetition)
  const topicsWithUncovered = data.filter((progress: any) => {
    const currentLevel = progress.current_bloom_level
    const coverage = progress.dimension_coverage || {}
    const coveredDimensions = coverage[currentLevel] || []

    // Check if dimensions are uncovered
    const hasUncoveredDimensions = coveredDimensions.length < 6

    // Calculate overall mastery (average of all Bloom level mastery scores)
    const masteryScores = progress.mastery_scores || {}
    const masteryValues = Object.values(masteryScores).filter((v): v is number => typeof v === 'number' && v > 0)
    const overallMastery = masteryValues.length > 0
      ? masteryValues.reduce((sum: number, val: number) => sum + val, 0) / masteryValues.length
      : 0

    // Exclude topics with 80%+ overall mastery - spaced repetition handles those
    const needsDimensionPractice = overallMastery < 80

    if (!needsDimensionPractice && hasUncoveredDimensions) {
      console.log(`[Dimension Practice] Skipping "${progress.topics?.name}" - mastery ${overallMastery.toFixed(0)}% >= 80%, spaced repetition will handle it`)
    }

    return hasUncoveredDimensions && needsDimensionPractice
  })

  console.log(`[Dimension Practice] Found ${topicsWithUncovered.length} topics with uncovered dimensions (excluding 80%+ mastery)`)
  return topicsWithUncovered
}

/**
 * Select next uncovered dimension for a topic at a specific Bloom level
 * Goes through dimensions in order: What, Why, When, Where, How, Characteristics
 *
 * @param dimensionCoverage - User's dimension coverage object
 * @param bloomLevel - Current Bloom level
 * @returns Next dimension to practice
 */
export function selectNextUncoveredDimension(
  dimensionCoverage: Record<number, string[]>,
  bloomLevel: number
): CognitiveDimension {
  const coveredDimensions = dimensionCoverage[bloomLevel] || []

  // Ordered list of dimensions
  const orderedDimensions: CognitiveDimension[] = [
    CognitiveDimension.WHAT,
    CognitiveDimension.WHY,
    CognitiveDimension.WHEN,
    CognitiveDimension.WHERE,
    CognitiveDimension.HOW,
    CognitiveDimension.CHARACTERISTICS
  ]

  // Find first uncovered dimension
  for (const dimension of orderedDimensions) {
    if (!coveredDimensions.includes(dimension)) {
      return dimension
    }
  }

  // Fallback (shouldn't happen if we filter correctly)
  return CognitiveDimension.WHAT
}
