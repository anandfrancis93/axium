/**
 * Question Format Selection Based on Performance
 *
 * Selects optimal question format based on:
 * - Bloom level (format alignment)
 * - User performance per format
 * - Learning goals (strengthen weaknesses vs build confidence)
 */

import { FormatSelectionStrategy } from './types'

export type QuestionFormat =
  | 'mcq_single'
  | 'mcq_multi'
  | 'true_false'
  | 'fill_blank'
  | 'matching'
  | 'open_ended'

export interface FormatPerformance {
  format: QuestionFormat
  attempts: number
  correct: number
  accuracy: number // 0-1
  avgConfidence: number // 0-1
  effectiveness: number // Combined score (0-1)
}

/**
 * Format recommendations by Bloom level
 */
const BLOOM_FORMAT_ALIGNMENT: Record<number, QuestionFormat[]> = {
  1: ['true_false', 'mcq_single', 'fill_blank'], // Remember: recall facts
  2: ['mcq_single', 'mcq_multi', 'matching'], // Understand: explain concepts
  3: ['mcq_multi', 'fill_blank', 'matching'], // Apply: use knowledge
  4: ['mcq_multi', 'open_ended', 'matching'], // Analyze: break down
  5: ['mcq_multi', 'open_ended'], // Evaluate: judge/critique
  6: ['open_ended'] // Create: produce new work
}

/**
 * Select best question format based on performance and strategy
 */
export function selectQuestionFormat(
  bloomLevel: number,
  formatPerformance: FormatPerformance[],
  strategy: 'performance_based' | 'rotation' | 'bloom_aligned' | 'weakness_targeting' = 'performance_based'
): FormatSelectionStrategy {
  const alignedFormats = BLOOM_FORMAT_ALIGNMENT[bloomLevel] || ['mcq_single']

  switch (strategy) {
    case 'performance_based':
      return selectByPerformance(bloomLevel, formatPerformance, alignedFormats)

    case 'rotation':
      return selectByRotation(bloomLevel, formatPerformance, alignedFormats)

    case 'bloom_aligned':
      return selectBloomAligned(bloomLevel, alignedFormats)

    case 'weakness_targeting':
      return selectByWeakness(bloomLevel, formatPerformance, alignedFormats)

    default:
      return selectByPerformance(bloomLevel, formatPerformance, alignedFormats)
  }
}

/**
 * Performance-based selection: Use formats where user performs well
 */
function selectByPerformance(
  bloomLevel: number,
  formatPerformance: FormatPerformance[],
  alignedFormats: QuestionFormat[]
): FormatSelectionStrategy {
  // Filter to Bloom-aligned formats
  const relevantFormats = formatPerformance.filter(fp =>
    alignedFormats.includes(fp.format)
  )

  if (relevantFormats.length === 0) {
    // No performance data, use default Bloom-aligned format
    return {
      strategy: 'performance_based',
      selectedFormat: alignedFormats[0],
      reason: 'No performance data yet. Using default format for this Bloom level.',
      alternativeFormats: alignedFormats.slice(1)
    }
  }

  // Sort by effectiveness (accuracy + confidence)
  const sorted = [...relevantFormats].sort((a, b) => b.effectiveness - a.effectiveness)

  // Use top format if it has enough attempts
  const topFormat = sorted[0]

  if (topFormat.attempts >= 3) {
    return {
      strategy: 'performance_based',
      selectedFormat: topFormat.format,
      reason: `You perform best with ${formatName(topFormat.format)} (${(topFormat.effectiveness * 100).toFixed(0)}% effectiveness)`,
      alternativeFormats: sorted.slice(1).map(f => f.format)
    }
  }

  // Not enough data, use rotation
  return selectByRotation(bloomLevel, formatPerformance, alignedFormats)
}

/**
 * Rotation selection: Cycle through aligned formats for balanced practice
 */
function selectByRotation(
  bloomLevel: number,
  formatPerformance: FormatPerformance[],
  alignedFormats: QuestionFormat[]
): FormatSelectionStrategy {
  // Find format with fewest attempts
  const attemptsPerFormat = new Map<QuestionFormat, number>()

  for (const format of alignedFormats) {
    const perf = formatPerformance.find(fp => fp.format === format)
    attemptsPerFormat.set(format, perf?.attempts || 0)
  }

  // Sort by attempts (ascending)
  const sorted = [...attemptsPerFormat.entries()].sort((a, b) => a[1] - b[1])

  const selectedFormat = sorted[0][0]
  const attempts = sorted[0][1]

  return {
    strategy: 'rotation',
    selectedFormat,
    reason: `Rotating formats for balanced practice. ${formatName(selectedFormat)} has ${attempts} attempts.`,
    alternativeFormats: sorted.slice(1).map(f => f[0])
  }
}

/**
 * Bloom-aligned selection: Use recommended format for Bloom level
 */
function selectBloomAligned(
  bloomLevel: number,
  alignedFormats: QuestionFormat[]
): FormatSelectionStrategy {
  return {
    strategy: 'bloom_aligned',
    selectedFormat: alignedFormats[0],
    reason: `${formatName(alignedFormats[0])} is ideal for Bloom Level ${bloomLevel} (${bloomLevelName(bloomLevel)})`,
    alternativeFormats: alignedFormats.slice(1)
  }
}

/**
 * Weakness-targeting selection: Use formats where user struggles
 */
function selectByWeakness(
  bloomLevel: number,
  formatPerformance: FormatPerformance[],
  alignedFormats: QuestionFormat[]
): FormatSelectionStrategy {
  // Filter to Bloom-aligned formats with enough attempts
  const relevantFormats = formatPerformance.filter(fp =>
    alignedFormats.includes(fp.format) && fp.attempts >= 3
  )

  if (relevantFormats.length === 0) {
    // No performance data, use rotation
    return selectByRotation(bloomLevel, formatPerformance, alignedFormats)
  }

  // Sort by effectiveness (ascending - weakest first)
  const sorted = [...relevantFormats].sort((a, b) => a.effectiveness - b.effectiveness)

  const weakestFormat = sorted[0]

  // Only target weakness if effectiveness is below 70%
  if (weakestFormat.effectiveness < 0.7) {
    return {
      strategy: 'weakness_targeting',
      selectedFormat: weakestFormat.format,
      reason: `Targeting ${formatName(weakestFormat.format)} to improve (${(weakestFormat.effectiveness * 100).toFixed(0)}% effectiveness)`,
      alternativeFormats: sorted.slice(1).map(f => f.format)
    }
  }

  // No significant weakness, use performance-based
  return selectByPerformance(bloomLevel, formatPerformance, alignedFormats)
}

/**
 * Calculate effectiveness score for a format
 *
 * Combines accuracy and confidence calibration
 */
export function calculateFormatEffectiveness(
  attempts: number,
  correct: number,
  avgConfidence: number
): number {
  if (attempts === 0) return 0

  const accuracy = correct / attempts

  // Effectiveness = 70% accuracy + 30% confidence
  return accuracy * 0.7 + avgConfidence * 0.3
}

/**
 * Get format performance from user progress metadata
 */
export function getFormatPerformance(
  formatPerformanceData: Record<string, {
    attempts: number
    correct: number
    avgConfidence: number
  }>
): FormatPerformance[] {
  return Object.entries(formatPerformanceData).map(([format, stats]) => ({
    format: format as QuestionFormat,
    attempts: stats.attempts,
    correct: stats.correct,
    accuracy: stats.attempts > 0 ? stats.correct / stats.attempts : 0,
    avgConfidence: stats.avgConfidence,
    effectiveness: calculateFormatEffectiveness(stats.attempts, stats.correct, stats.avgConfidence)
  }))
}

/**
 * Determine if format rotation is recommended
 *
 * Returns true if user should try different formats
 */
export function shouldRotateFormats(
  formatPerformance: FormatPerformance[],
  bloomLevel: number
): boolean {
  const alignedFormats = BLOOM_FORMAT_ALIGNMENT[bloomLevel] || []

  // Count how many aligned formats have been tried
  const triedFormats = formatPerformance.filter(fp =>
    alignedFormats.includes(fp.format) && fp.attempts >= 3
  )

  // Recommend rotation if less than 2 formats tried
  if (triedFormats.length < 2) return true

  // Check if any format has very low effectiveness
  const hasLowEffectiveness = triedFormats.some(fp => fp.effectiveness < 0.5)

  if (hasLowEffectiveness) {
    // Try other formats if struggling with current ones
    return triedFormats.length < alignedFormats.length
  }

  return false
}

/**
 * Get recommended formats for a Bloom level
 */
export function getRecommendedFormatsForBloomLevel(bloomLevel: number): QuestionFormat[] {
  return BLOOM_FORMAT_ALIGNMENT[bloomLevel] || ['mcq_single']
}

/**
 * Check if format is appropriate for Bloom level
 */
export function isFormatAppropriateForBloomLevel(
  format: QuestionFormat,
  bloomLevel: number
): boolean {
  const alignedFormats = BLOOM_FORMAT_ALIGNMENT[bloomLevel] || []
  return alignedFormats.includes(format)
}

// Helper functions

function formatName(format: QuestionFormat): string {
  const names: Record<QuestionFormat, string> = {
    mcq_single: 'Multiple Choice (Single Answer)',
    mcq_multi: 'Multiple Choice (Multiple Answers)',
    true_false: 'True/False',
    fill_blank: 'Fill in the Blank',
    matching: 'Matching',
    open_ended: 'Open-Ended'
  }
  return names[format] || format
}

function bloomLevelName(level: number): string {
  const names: Record<number, string> = {
    1: 'Remember',
    2: 'Understand',
    3: 'Apply',
    4: 'Analyze',
    5: 'Evaluate',
    6: 'Create'
  }
  return names[level] || `Level ${level}`
}

/**
 * Generate format performance summary for user
 */
export function generateFormatPerformanceSummary(
  formatPerformance: FormatPerformance[],
  bloomLevel: number
): {
  strongest: QuestionFormat | null
  weakest: QuestionFormat | null
  recommendations: string[]
} {
  const alignedFormats = BLOOM_FORMAT_ALIGNMENT[bloomLevel] || []

  const relevantFormats = formatPerformance.filter(fp =>
    alignedFormats.includes(fp.format) && fp.attempts >= 3
  )

  if (relevantFormats.length === 0) {
    return {
      strongest: null,
      weakest: null,
      recommendations: ['Try more question formats to identify your strengths and weaknesses.']
    }
  }

  const sorted = [...relevantFormats].sort((a, b) => b.effectiveness - a.effectiveness)

  const strongest = sorted[0]
  const weakest = sorted[sorted.length - 1]

  const recommendations: string[] = []

  if (strongest.effectiveness >= 0.8) {
    recommendations.push(`Excellent performance with ${formatName(strongest.format)}! Consider challenging yourself with more advanced formats.`)
  } else if (strongest.effectiveness >= 0.7) {
    recommendations.push(`Good performance with ${formatName(strongest.format)}. Keep practicing to maintain this strength.`)
  }

  if (weakest.effectiveness < 0.5) {
    recommendations.push(`${formatName(weakest.format)} needs improvement. Consider additional practice with this format.`)
  } else if (weakest.effectiveness < 0.7) {
    recommendations.push(`${formatName(weakest.format)} has room for improvement. Mix in more practice with this format.`)
  }

  if (sorted.length < alignedFormats.length) {
    const untried = alignedFormats.filter(f =>
      !sorted.some(s => s.format === f)
    )
    recommendations.push(`Try these formats for Bloom Level ${bloomLevel}: ${untried.map(formatName).join(', ')}`)
  }

  return {
    strongest: strongest.format,
    weakest: weakest.format,
    recommendations
  }
}
