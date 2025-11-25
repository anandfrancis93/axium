// Question Format utilities and constants

export type QuestionFormat =
  | 'mcq_single'
  | 'mcq_multi'
  | 'open_ended'
  | 'fill_blank'
  | 'matching'

export interface QuestionFormatInfo {
  key: QuestionFormat
  name: string
  description: string
  color: string
  icon: string
  idealBloomLevels: number[]  // Which Bloom levels this format works best for
  complexity: 'low' | 'medium' | 'high'
}

export const QUESTION_FORMATS: Record<QuestionFormat, QuestionFormatInfo> = {
  mcq_single: {
    key: 'mcq_single',
    name: 'MCQ - Single Select',
    description: 'Multiple choice with one correct answer',
    color: 'text-blue-400',
    icon: '◻',
    idealBloomLevels: [1, 2],  // Remember, Understand
    complexity: 'low'
  },
  mcq_multi: {
    key: 'mcq_multi',
    name: 'MCQ - Multi Select',
    description: 'Multiple choice with multiple correct answers (select all that apply)',
    color: 'text-indigo-400',
    icon: '☑',
    idealBloomLevels: [2, 3, 4],  // Understand, Apply, Analyze - requires deeper understanding
    complexity: 'medium'
  },
  fill_blank: {
    key: 'fill_blank',
    name: 'Fill in the Blank',
    description: 'Complete the missing part of a statement',
    color: 'text-cyan-400',
    icon: '▭',
    idealBloomLevels: [1, 2, 3],  // Remember, Understand, Apply
    complexity: 'low'
  },
  matching: {
    key: 'matching',
    name: 'Matching',
    description: 'Match related concepts or terms',
    color: 'text-green-400',
    icon: '⋈',
    idealBloomLevels: [2, 3],  // Understand, Apply
    complexity: 'medium'
  },
  open_ended: {
    key: 'open_ended',
    name: 'Open Ended',
    description: 'Essay or explanation requiring written response',
    color: 'text-orange-400',
    icon: '≡',
    idealBloomLevels: [4, 5, 6],  // Analyze, Evaluate, Create
    complexity: 'high'
  }
}

export function getQuestionFormatInfo(format: QuestionFormat | string | null | undefined): QuestionFormatInfo {
  if (!format || !(format in QUESTION_FORMATS)) {
    return QUESTION_FORMATS.mcq_single
  }
  return QUESTION_FORMATS[format as QuestionFormat]
}

export function getFormatsByBloomLevel(bloomLevel: number): QuestionFormat[] {
  return Object.values(QUESTION_FORMATS)
    .filter(format => format.idealBloomLevels.includes(bloomLevel))
    .map(format => format.key)
}

export function getFormatComplexity(format: QuestionFormat | string | null | undefined): 'low' | 'medium' | 'high' {
  const formatInfo = getQuestionFormatInfo(format as QuestionFormat)
  return formatInfo.complexity
}

export function isFormatIdealForBloomLevel(format: QuestionFormat, bloomLevel: number): boolean {
  const formatInfo = QUESTION_FORMATS[format]
  return formatInfo.idealBloomLevels.includes(bloomLevel)
}

// Get recommended formats for a Bloom level, sorted by complexity
export function getRecommendedFormats(bloomLevel: number): QuestionFormatInfo[] {
  return Object.values(QUESTION_FORMATS)
    .filter(format => format.idealBloomLevels.includes(bloomLevel))
    .sort((a, b) => {
      const complexityOrder = { low: 1, medium: 2, high: 3 }
      return complexityOrder[a.complexity] - complexityOrder[b.complexity]
    })
}
