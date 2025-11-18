/**
 * Spaced Repetition Question Selection
 *
 * Functions for retrieving questions that are due for review
 */

import { CognitiveDimension } from './cognitive-dimensions'

/**
 * Fetch spaced repetition questions that are due for review
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
  let query = supabase
    .from('questions')
    .select(`
      id,
      topic_id,
      bloom_level,
      question_format,
      cognitive_dimension,
      question_text,
      options,
      correct_answer,
      explanation,
      next_review_date,
      topics!inner(
        id,
        name,
        description,
        hierarchy_level,
        parent_topic_id,
        subject_id,
        subjects(name)
      )
    `)
    .not('next_review_date', 'is', null)
    .lte('next_review_date', new Date().toISOString())
    .order('next_review_date', { ascending: true })
    .limit(limit)

  // Filter by subject if provided
  if (subject) {
    query = query.eq('topics.subjects.name', subject)
  }

  const { data, error } = await query

  if (error) {
    console.error('[Spaced Repetition] Error fetching due questions:', error)
    return []
  }

  console.log(`[Spaced Repetition] Found ${data?.length || 0} questions due for review`)
  return data || []
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
  const topicsWithUncovered = data.filter((progress: any) => {
    const currentLevel = progress.current_bloom_level
    const coverage = progress.dimension_coverage || {}
    const coveredDimensions = coverage[currentLevel] || []

    // If less than 6 dimensions covered, this topic has uncovered dimensions
    return coveredDimensions.length < 6
  })

  console.log(`[Dimension Practice] Found ${topicsWithUncovered.length} topics with uncovered dimensions`)
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
