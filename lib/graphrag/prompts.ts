/**
 * Question Generation Prompt Templates for Claude
 *
 * These prompts are optimized for generating high-quality educational questions
 * aligned with Bloom's Taxonomy levels using GraphRAG context.
 */

import { GraphRAGContext } from './context'

export type QuestionFormat =
  | 'mcq_single'      // Multiple choice - single answer
  | 'mcq_multi'       // Multiple choice - multiple answers ("select all that apply")
  | 'true_false'      // True/False
  | 'fill_blank'      // Fill in the blank
  | 'matching'        // Matching pairs
  | 'open_ended'      // Essay/short answer

export interface QuestionFormatInfo {
  name: string
  description: string
  icon: string
  idealBloomLevels: number[]
  complexity: 'low' | 'medium' | 'high'
}

export const QUESTION_FORMATS: Record<QuestionFormat, QuestionFormatInfo> = {
  mcq_single: {
    name: 'MCQ - Single Select',
    description: 'Multiple choice question with one correct answer',
    icon: '◻',
    idealBloomLevels: [1, 2],
    complexity: 'low'
  },
  mcq_multi: {
    name: 'MCQ - Multi Select',
    description: 'Multiple choice question with multiple correct answers ("select all that apply")',
    icon: '☑',
    idealBloomLevels: [2, 3, 4],
    complexity: 'medium'
  },
  true_false: {
    name: 'True/False',
    description: 'Binary true or false question',
    icon: '◐',
    idealBloomLevels: [1, 2],
    complexity: 'low'
  },
  fill_blank: {
    name: 'Fill in the Blank',
    description: 'Complete the sentence with the correct term',
    icon: '▭',
    idealBloomLevels: [1, 2, 3],
    complexity: 'low'
  },
  matching: {
    name: 'Matching',
    description: 'Match items from two columns',
    icon: '⋈',
    idealBloomLevels: [2, 3],
    complexity: 'medium'
  },
  open_ended: {
    name: 'Open-Ended',
    description: 'Essay or short answer question',
    icon: '≡',
    idealBloomLevels: [4, 5, 6],
    complexity: 'high'
  }
}

/**
 * Bloom Level Information
 */
export interface BloomLevelInfo {
  level: number
  name: string
  description: string
  cognitiveSkills: string[]
  actionVerbs: string[]
  recommendedFormats: QuestionFormat[]
}

export const BLOOM_LEVELS: Record<number, BloomLevelInfo> = {
  1: {
    level: 1,
    name: 'Remember',
    description: 'Recall facts and basic concepts',
    cognitiveSkills: ['Recognize', 'Recall', 'Identify', 'Define', 'List'],
    actionVerbs: ['define', 'identify', 'list', 'name', 'recall', 'recognize', 'state'],
    recommendedFormats: ['mcq_single', 'true_false', 'fill_blank']
  },
  2: {
    level: 2,
    name: 'Understand',
    description: 'Explain ideas or concepts',
    cognitiveSkills: ['Interpret', 'Summarize', 'Paraphrase', 'Classify', 'Explain'],
    actionVerbs: ['describe', 'explain', 'summarize', 'paraphrase', 'classify', 'compare', 'interpret'],
    recommendedFormats: ['mcq_single', 'mcq_multi', 'matching']
  },
  3: {
    level: 3,
    name: 'Apply',
    description: 'Use information in new situations',
    cognitiveSkills: ['Execute', 'Implement', 'Solve', 'Use', 'Demonstrate'],
    actionVerbs: ['apply', 'demonstrate', 'solve', 'use', 'implement', 'execute', 'operate'],
    recommendedFormats: ['mcq_multi', 'matching', 'fill_blank']
  },
  4: {
    level: 4,
    name: 'Analyze',
    description: 'Draw connections among ideas',
    cognitiveSkills: ['Differentiate', 'Organize', 'Attribute', 'Compare', 'Deconstruct'],
    actionVerbs: ['analyze', 'compare', 'contrast', 'differentiate', 'examine', 'categorize'],
    recommendedFormats: ['mcq_multi', 'open_ended']
  },
  5: {
    level: 5,
    name: 'Evaluate',
    description: 'Justify a decision or course of action',
    cognitiveSkills: ['Check', 'Critique', 'Judge', 'Defend', 'Justify'],
    actionVerbs: ['evaluate', 'critique', 'judge', 'defend', 'justify', 'assess', 'prioritize'],
    recommendedFormats: ['mcq_multi', 'open_ended']
  },
  6: {
    level: 6,
    name: 'Create',
    description: 'Produce new or original work',
    cognitiveSkills: ['Generate', 'Plan', 'Produce', 'Design', 'Construct'],
    actionVerbs: ['create', 'design', 'develop', 'construct', 'plan', 'formulate', 'propose'],
    recommendedFormats: ['open_ended']
  }
}

/**
 * Get recommended question formats for a Bloom level
 */
export function getRecommendedFormats(bloomLevel: number): QuestionFormat[] {
  return BLOOM_LEVELS[bloomLevel]?.recommendedFormats || ['mcq_single']
}

/**
 * Format GraphRAG context for prompt
 */
function formatContext(context: GraphRAGContext): string {
  const parts: string[] = []

  parts.push(`Domain: ${context.domain}`)
  if (context.objective) {
    parts.push(`Learning Objective: ${context.objective}`)
  }
  parts.push(`Topic: ${context.name}`)
  parts.push(`Topic Summary: ${context.summary || 'No summary available'}`)

  if (context.parentName) {
    parts.push(`Parent Concept: ${context.parentName}`)
  }

  if (context.children.length > 0) {
    parts.push(`\nSubtopics:`)
    context.children.forEach(child => {
      const summary = child.summary ? `: ${child.summary}` : ''
      parts.push(`- ${child.name}${summary}`)
    })
  }

  const crossDomain = context.relatedConcepts.filter(r => r.crossDomain)
  if (crossDomain.length > 0) {
    parts.push(`\nRelated Concepts (Cross-Domain):`)
    crossDomain.slice(0, 5).forEach(rel => {
      parts.push(`- ${rel.name} (${rel.domain})`)
    })
  }

  if (context.scopeTags.length > 0) {
    parts.push(`\nTechnical Scope: ${context.scopeTags.slice(0, 5).join(', ')}`)
  }

  return parts.join('\n')
}

/**
 * Generate MCQ Single Answer prompt
 */
function generateMCQSinglePrompt(context: GraphRAGContext, bloomLevel: number): string {
  const bloomInfo = BLOOM_LEVELS[bloomLevel]

  return `You are an expert cybersecurity educator creating a multiple-choice question.

CONTEXT:
${formatContext(context)}

REQUIREMENTS:
- Bloom Taxonomy Level: ${bloomLevel} - ${bloomInfo.name} (${bloomInfo.description})
- Question Format: Multiple choice with ONE correct answer
- Cognitive Skills: ${bloomInfo.cognitiveSkills.join(', ')}
- Use action verbs: ${bloomInfo.actionVerbs.slice(0, 5).join(', ')}

INSTRUCTIONS:
1. Create a question that tests ${bloomInfo.name.toLowerCase()} skills for the topic "${context.name}"
2. Write 4 options (A, B, C, D) with exactly ONE correct answer
3. Make distractors (wrong answers) plausible but clearly incorrect
4. Base the question on the provided context and related concepts
5. Provide a detailed explanation of why the correct answer is right and others are wrong

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "question": "The question text here?",
  "options": ["A) First option", "B) Second option", "C) Third option", "D) Fourth option"],
  "correctAnswer": "A",
  "explanation": "Why option A is correct and others are wrong"
}`
}

/**
 * Generate MCQ Multiple Answers prompt
 */
function generateMCQMultiPrompt(context: GraphRAGContext, bloomLevel: number): string {
  const bloomInfo = BLOOM_LEVELS[bloomLevel]

  return `You are an expert cybersecurity educator creating a multiple-choice question.

CONTEXT:
${formatContext(context)}

REQUIREMENTS:
- Bloom Taxonomy Level: ${bloomLevel} - ${bloomInfo.name} (${bloomInfo.description})
- Question Format: Multiple choice with MULTIPLE correct answers ("Select all that apply")
- Cognitive Skills: ${bloomInfo.cognitiveSkills.join(', ')}
- Use action verbs: ${bloomInfo.actionVerbs.slice(0, 5).join(', ')}

INSTRUCTIONS:
1. Create a question that tests ${bloomInfo.name.toLowerCase()} skills for the topic "${context.name}"
2. Write 5-6 options with 2-3 correct answers
3. Make the question require understanding of multiple aspects
4. Use "Select all that apply" or similar phrasing
5. Provide a detailed explanation of why each correct answer is right

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "question": "Which of the following are characteristics of [topic]? (Select all that apply)",
  "options": ["A) First option", "B) Second option", "C) Third option", "D) Fourth option", "E) Fifth option"],
  "correctAnswers": ["A", "C", "E"],
  "explanation": "Options A, C, and E are correct because..."
}`
}

/**
 * Generate True/False prompt
 */
function generateTrueFalsePrompt(context: GraphRAGContext, bloomLevel: number): string {
  const bloomInfo = BLOOM_LEVELS[bloomLevel]

  return `You are an expert cybersecurity educator creating a true/false question.

CONTEXT:
${formatContext(context)}

REQUIREMENTS:
- Bloom Taxonomy Level: ${bloomLevel} - ${bloomInfo.name} (${bloomInfo.description})
- Question Format: True or False
- Cognitive Skills: ${bloomInfo.cognitiveSkills.join(', ')}

INSTRUCTIONS:
1. Create a statement about "${context.name}" that is definitively true OR false
2. The statement should test ${bloomInfo.name.toLowerCase()} skills
3. Avoid ambiguous wording
4. Provide a clear explanation

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "question": "Statement about the topic.",
  "correctAnswer": "True",
  "explanation": "This statement is true/false because..."
}`
}

/**
 * Generate Fill in the Blank prompt
 */
function generateFillBlankPrompt(context: GraphRAGContext, bloomLevel: number): string {
  const bloomInfo = BLOOM_LEVELS[bloomLevel]

  return `You are an expert cybersecurity educator creating a fill-in-the-blank question.

CONTEXT:
${formatContext(context)}

REQUIREMENTS:
- Bloom Taxonomy Level: ${bloomLevel} - ${bloomInfo.name} (${bloomInfo.description})
- Question Format: Fill in the blank
- Cognitive Skills: ${bloomInfo.cognitiveSkills.join(', ')}

INSTRUCTIONS:
1. Create a sentence with one blank (__________) related to "${context.name}"
2. The answer should be a specific term, concept, or short phrase
3. The blank should test ${bloomInfo.name.toLowerCase()} skills
4. Provide acceptable variations of the answer

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "question": "This is a sentence with __________ that needs to be filled.",
  "correctAnswer": "the exact answer",
  "acceptableAnswers": ["the exact answer", "acceptable variation 1", "acceptable variation 2"],
  "explanation": "The correct answer is X because..."
}`
}

/**
 * Generate Open-Ended prompt
 */
function generateOpenEndedPrompt(context: GraphRAGContext, bloomLevel: number): string {
  const bloomInfo = BLOOM_LEVELS[bloomLevel]

  return `You are an expert cybersecurity educator creating an open-ended question.

CONTEXT:
${formatContext(context)}

REQUIREMENTS:
- Bloom Taxonomy Level: ${bloomLevel} - ${bloomInfo.name} (${bloomInfo.description})
- Question Format: Essay or short answer (2-3 paragraphs expected)
- Cognitive Skills: ${bloomInfo.cognitiveSkills.join(', ')}
- Use action verbs: ${bloomInfo.actionVerbs.slice(0, 5).join(', ')}

INSTRUCTIONS:
1. Create a scenario-based question about "${context.name}"
2. The question should require ${bloomInfo.name.toLowerCase()} skills
3. Provide a comprehensive model answer (2-3 paragraphs)
4. Include key points that must be addressed

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "question": "Scenario-based question here?",
  "modelAnswer": "Comprehensive answer covering all key points...",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
  "rubric": "Grading criteria and expectations"
}`
}

/**
 * Main prompt generation function
 */
export function generateQuestionPrompt(
  context: GraphRAGContext,
  bloomLevel: number,
  format: QuestionFormat
): string {
  // Validate Bloom level
  if (bloomLevel < 1 || bloomLevel > 6) {
    throw new Error(`Invalid Bloom level: ${bloomLevel}. Must be between 1 and 6.`)
  }

  // Validate format
  if (!QUESTION_FORMATS[format]) {
    throw new Error(`Invalid question format: ${format}`)
  }

  // Generate appropriate prompt based on format
  switch (format) {
    case 'mcq_single':
      return generateMCQSinglePrompt(context, bloomLevel)
    case 'mcq_multi':
      return generateMCQMultiPrompt(context, bloomLevel)
    case 'true_false':
      return generateTrueFalsePrompt(context, bloomLevel)
    case 'fill_blank':
      return generateFillBlankPrompt(context, bloomLevel)
    case 'open_ended':
      return generateOpenEndedPrompt(context, bloomLevel)
    case 'matching':
      // TODO: Implement matching prompt
      throw new Error('Matching format not yet implemented')
    default:
      throw new Error(`Unsupported format: ${format}`)
  }
}

/**
 * Get format info
 */
export function getQuestionFormatInfo(format: QuestionFormat): QuestionFormatInfo {
  return QUESTION_FORMATS[format]
}

/**
 * Get Bloom level info
 */
export function getBloomLevelInfo(level: number): BloomLevelInfo {
  return BLOOM_LEVELS[level]
}
