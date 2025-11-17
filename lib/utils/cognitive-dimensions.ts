/**
 * 5W1H Cognitive Dimensions Framework
 *
 * Universal framework for ensuring comprehensive topic coverage across
 * multiple cognitive dimensions before Bloom level advancement.
 *
 * Applies to ANY topic - concepts, processes, tools, or attacks.
 */

export enum CognitiveDimension {
  WHAT = 'WHAT',
  WHY = 'WHY',
  WHEN = 'WHEN',
  WHERE = 'WHERE',
  HOW = 'HOW',
  CHARACTERISTICS = 'CHARACTERISTICS'
}

export interface DimensionInfo {
  dimension: CognitiveDimension
  name: string
  description: string
  questionPrompts: string[]
  icon: string
}

export const COGNITIVE_DIMENSIONS: Record<CognitiveDimension, DimensionInfo> = {
  [CognitiveDimension.WHAT]: {
    dimension: CognitiveDimension.WHAT,
    name: 'What',
    description: 'Definition, identification, components',
    questionPrompts: [
      'What is [topic]?',
      'What are the components of [topic]?',
      'What defines [topic]?',
      'What constitutes [topic]?'
    ],
    icon: '❓'
  },
  [CognitiveDimension.WHY]: {
    dimension: CognitiveDimension.WHY,
    name: 'Why',
    description: 'Purpose, rationale, motivation',
    questionPrompts: [
      'Why is [topic] used?',
      'Why does [topic] matter?',
      'What is the purpose of [topic]?',
      'What problem does [topic] solve?'
    ],
    icon: '🎯'
  },
  [CognitiveDimension.WHEN]: {
    dimension: CognitiveDimension.WHEN,
    name: 'When',
    description: 'Context, timing, lifecycle',
    questionPrompts: [
      'When is [topic] used?',
      'When does [topic] occur?',
      'What is the lifecycle of [topic]?',
      'At what stage does [topic] apply?'
    ],
    icon: '⏰'
  },
  [CognitiveDimension.WHERE]: {
    dimension: CognitiveDimension.WHERE,
    name: 'Where',
    description: 'Location, scope, boundaries',
    questionPrompts: [
      'Where is [topic] applied?',
      'Where does [topic] fit in the system?',
      'What is the scope of [topic]?',
      'In what context is [topic] relevant?'
    ],
    icon: '📍'
  },
  [CognitiveDimension.HOW]: {
    dimension: CognitiveDimension.HOW,
    name: 'How',
    description: 'Mechanism, process, methodology',
    questionPrompts: [
      'How does [topic] work?',
      'How is [topic] implemented?',
      'What is the mechanism of [topic]?',
      'What are the steps in [topic]?'
    ],
    icon: '⚙️'
  },
  [CognitiveDimension.CHARACTERISTICS]: {
    dimension: CognitiveDimension.CHARACTERISTICS,
    name: 'Characteristics',
    description: 'Properties, attributes, relationships',
    questionPrompts: [
      'What are the key characteristics of [topic]?',
      'What properties does [topic] have?',
      'How does [topic] relate to other concepts?',
      'What attributes define [topic]?'
    ],
    icon: '🔍'
  }
}

export interface DimensionCoverage {
  covered_dimensions: CognitiveDimension[]
  coverage_count: number
  total_dimensions: number
  coverage_percentage: number
}

export interface DimensionCoverageByLevel {
  [bloomLevel: string]: CognitiveDimension[]
}

/**
 * Default requirements for Bloom level unlock
 */
export const DIMENSION_REQUIREMENTS = {
  MIN_DIMENSIONS: 4,        // Must cover at least 4 of 6 dimensions
  MIN_ATTEMPTS: 5,          // Minimum total attempts at the level
  MASTERY_THRESHOLD: 100    // Must achieve 100% mastery (all correct)
}

/**
 * Get information about a specific cognitive dimension
 */
export function getDimensionInfo(dimension: CognitiveDimension): DimensionInfo {
  return COGNITIVE_DIMENSIONS[dimension]
}

/**
 * Get all dimensions as array
 */
export function getAllDimensions(): CognitiveDimension[] {
  return Object.values(CognitiveDimension)
}

/**
 * Calculate which dimensions are still needed for unlock
 */
export function getUncoveredDimensions(
  coveredDimensions: CognitiveDimension[]
): CognitiveDimension[] {
  const allDimensions = getAllDimensions()
  return allDimensions.filter(dim => !coveredDimensions.includes(dim))
}

/**
 * Check if dimension coverage requirement is met
 */
export function isDimensionCoverageMet(
  coveredDimensions: CognitiveDimension[],
  minRequired: number = DIMENSION_REQUIREMENTS.MIN_DIMENSIONS
): boolean {
  return coveredDimensions.length >= minRequired
}

/**
 * Calculate coverage percentage
 */
export function calculateCoveragePercentage(
  coveredDimensions: CognitiveDimension[]
): number {
  return Math.round((coveredDimensions.length / 6) * 100)
}

/**
 * Select a random uncovered dimension for next question
 * Prioritizes uncovered dimensions to ensure breadth
 */
export function selectNextDimension(
  coveredDimensions: CognitiveDimension[]
): CognitiveDimension {
  const uncovered = getUncoveredDimensions(coveredDimensions)

  if (uncovered.length > 0) {
    // Prioritize uncovered dimensions
    return uncovered[Math.floor(Math.random() * uncovered.length)]
  } else {
    // All covered, select randomly for reinforcement
    const allDimensions = getAllDimensions()
    return allDimensions[Math.floor(Math.random() * allDimensions.length)]
  }
}

/**
 * Format dimension for AI prompt
 */
export function formatDimensionForPrompt(
  dimension: CognitiveDimension,
  topicName: string,
  bloomLevel: number
): string {
  const info = getDimensionInfo(dimension)
  const bloomLevelName = getBloomLevelName(bloomLevel)

  return `Generate a question that tests the **${info.name.toUpperCase()}** dimension (${info.description}) of "${topicName}" at Bloom Level ${bloomLevel} (${bloomLevelName}).

Examples of ${info.name} questions:
${info.questionPrompts.map(prompt => `- ${prompt.replace('[topic]', topicName)}`).join('\n')}

Focus on this cognitive dimension while maintaining the appropriate Bloom level complexity.`
}

/**
 * Helper to get Bloom level name
 */
function getBloomLevelName(level: number): string {
  const names = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create']
  return names[level - 1] || 'Unknown'
}

/**
 * Parse dimension coverage from database JSON
 */
export function parseDimensionCoverage(
  coverageJson: Record<string, string[]> | null
): DimensionCoverageByLevel {
  if (!coverageJson) return {}

  const result: DimensionCoverageByLevel = {}

  for (const [level, dimensions] of Object.entries(coverageJson)) {
    result[level] = dimensions as CognitiveDimension[]
  }

  return result
}

/**
 * Get coverage for a specific Bloom level
 */
export function getCoverageForLevel(
  coverageByLevel: DimensionCoverageByLevel,
  bloomLevel: number
): CognitiveDimension[] {
  return coverageByLevel[bloomLevel.toString()] || []
}
