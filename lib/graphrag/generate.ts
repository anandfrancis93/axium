import Anthropic from '@anthropic-ai/sdk'
import { GraphRAGContext } from './context'
import { generateQuestionPrompt, QuestionFormat, QUESTION_FORMATS } from './prompts'

/**
 * Question Generation Result
 */
export interface GeneratedQuestion {
  // Question data
  question: string
  format: QuestionFormat
  bloomLevel: number

  // Format-specific fields
  options?: string[]              // For MCQ
  correctAnswer?: string          // For MCQ single, True/False, Fill blank
  correctAnswers?: string[]       // For MCQ multi
  acceptableAnswers?: string[]    // For Fill blank
  modelAnswer?: string            // For Open-ended
  keyPoints?: string[]            // For Open-ended
  rubric?: string                 // For Open-ended

  // Metadata
  explanation: string
  entityId: string
  entityName: string
  domain: string
  fullPath: string

  // Generation metadata
  generatedAt: Date
  model: string
  tokensUsed: {
    input: number
    output: number
    total: number
  }
}

/**
 * Generation Error
 */
export class QuestionGenerationError extends Error {
  constructor(
    message: string,
    public cause?: any,
    public retryable: boolean = false
  ) {
    super(message)
    this.name = 'QuestionGenerationError'
  }
}

/**
 * Create Anthropic client
 */
function createAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    throw new QuestionGenerationError('Missing ANTHROPIC_API_KEY environment variable', null, false)
  }

  return new Anthropic({ apiKey })
}

/**
 * Parse Claude response JSON
 *
 * Handles potential issues with Claude's response format:
 * - Removes markdown code blocks if present
 * - Parses JSON
 * - Validates required fields
 */
function parseClaudeResponse(responseText: string, format: QuestionFormat, context: GraphRAGContext): any {
  // Remove markdown code blocks if present
  let cleanedText = responseText.trim()

  if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.replace(/^```(?:json)?\s*\n/, '').replace(/\n```\s*$/, '')
  }

  // Parse JSON
  let parsed: any
  try {
    parsed = JSON.parse(cleanedText)
  } catch (error) {
    throw new QuestionGenerationError(
      'Failed to parse Claude response as JSON',
      error,
      true // Retryable - Claude might fix it on retry
    )
  }

  // Validate required fields based on format
  if (!parsed.question || typeof parsed.question !== 'string') {
    throw new QuestionGenerationError('Missing or invalid "question" field', null, true)
  }

  // Explanation is required for all formats EXCEPT open-ended
  if (format !== 'open_ended') {
    if (!parsed.explanation || typeof parsed.explanation !== 'string') {
      throw new QuestionGenerationError('Missing or invalid "explanation" field', null, true)
    }
  }

  // Format-specific validation
  switch (format) {
    case 'mcq_single':
      if (!Array.isArray(parsed.options) || parsed.options.length !== 4) {
        throw new QuestionGenerationError('MCQ single must have exactly 4 options', null, true)
      }
      if (!parsed.correctAnswer || !['A', 'B', 'C', 'D'].includes(parsed.correctAnswer)) {
        throw new QuestionGenerationError('Invalid correctAnswer for MCQ single', null, true)
      }
      break

    case 'mcq_multi':
      if (!Array.isArray(parsed.options) || parsed.options.length < 4) {
        throw new QuestionGenerationError('MCQ multi must have at least 4 options', null, true)
      }
      if (!Array.isArray(parsed.correctAnswers) || parsed.correctAnswers.length === 0) {
        throw new QuestionGenerationError('MCQ multi must have correctAnswers array', null, true)
      }
      break

    case 'fill_blank':
      if (!parsed.correctAnswer || typeof parsed.correctAnswer !== 'string') {
        throw new QuestionGenerationError('Fill blank must have correctAnswer string', null, true)
      }

      // CRITICAL VALIDATION: Ensure topic name is NOT in question stem for fill-blank
      // The blank should BE the topic name, not a generic term
      if (parsed.question && parsed.question.toLowerCase().includes(context.name.toLowerCase())) {
        throw new QuestionGenerationError(
          `Fill-blank violation: Topic name "${context.name}" appears in question stem. ` +
          `The blank should BE the topic name, not a generic term. ` +
          `Question: "${parsed.question}"`,
          null,
          true // Retryable
        )
      }

      // Validate that correct answer is the topic name (or close variant)
      const answerLower = parsed.correctAnswer.toLowerCase().trim()
      const topicLower = context.name.toLowerCase().trim()
      const isTopicNameOrVariant = answerLower === topicLower ||
        answerLower.includes(topicLower) ||
        topicLower.includes(answerLower)

      if (!isTopicNameOrVariant) {
        throw new QuestionGenerationError(
          `Fill-blank violation: Correct answer "${parsed.correctAnswer}" is not the topic name "${context.name}". ` +
          `The correct answer MUST be the topic name or a direct variant.`,
          null,
          true // Retryable
        )
      }
      break

    case 'open_ended':
      if (!parsed.modelAnswer || typeof parsed.modelAnswer !== 'string') {
        throw new QuestionGenerationError('Open-ended must have modelAnswer', null, true)
      }
      if (!Array.isArray(parsed.keyPoints)) {
        throw new QuestionGenerationError('Open-ended must have keyPoints array', null, true)
      }
      break
  }

  // QUALITY CONTROL: Validate option length balance for MCQ questions
  if ((format === 'mcq_single' || format === 'mcq_multi') && Array.isArray(parsed.options)) {
    const optionLengths = parsed.options.map((opt: string) => {
      // Remove "A) ", "B) ", etc. prefixes if present
      const cleaned = opt.replace(/^[A-F]\)\s*/, '')
      return cleaned.length
    })

    const minLength = Math.min(...optionLengths)
    const maxLength = Math.max(...optionLengths)
    const lengthRatio = (maxLength - minLength) / minLength

    // Enforce ±30% length constraint
    if (lengthRatio > 0.30) {
      const details = parsed.options.map((opt: string, idx: number) =>
        `${String.fromCharCode(65 + idx)}) ${optionLengths[idx]} chars: "${opt}"`
      ).join('\n')

      throw new QuestionGenerationError(
        `Option length imbalance detected (${Math.round(lengthRatio * 100)}% difference, max 30% allowed):\n${details}`,
        null,
        true // Retryable - AI should fix on retry
      )
    }

    // Check for overly short options (likely too vague/generic)
    const shortOptions = parsed.options
      .map((opt: string, idx: number) => ({ opt, idx, len: optionLengths[idx] }))
      .filter(({ len }: { opt: string; idx: number; len: number }) => len < 30)

    if (shortOptions.length > 0) {
      const details = shortOptions.map(({ opt, idx, len }: { opt: string; idx: number; len: number }) =>
        `${String.fromCharCode(65 + idx)}) ${len} chars: "${opt}"`
      ).join('\n')

      throw new QuestionGenerationError(
        `Options too short/vague detected (< 30 chars). Use specific definitions from related topics:\n${details}`,
        null,
        true // Retryable
      )
    }
  }

  return parsed
}

/**
 * Generate a single question using Claude Haiku 4.5
 *
 * @param context - GraphRAG context for the topic
 * @param bloomLevel - Bloom taxonomy level (1-6)
 * @param format - Question format
 * @param model - Claude model to use (default: claude-opus-4-5-20251101)
 * @returns Generated question
 */
export async function generateQuestion(
  context: GraphRAGContext,
  bloomLevel: number,
  format: QuestionFormat,
  model: string = 'claude-opus-4-5-20251101'
): Promise<GeneratedQuestion> {
  const client = createAnthropicClient()

  // Generate prompt
  const prompt = generateQuestionPrompt(context, bloomLevel, format)

  // Call Claude API
  try {
    const message = await client.messages.create({
      model,
      max_tokens: 2048,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    // Extract text from response
    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    if (!responseText) {
      throw new QuestionGenerationError('Empty response from Claude', null, true)
    }

    // Parse response
    const parsed = parseClaudeResponse(responseText, format, context)

    // Get actual token usage from Claude API
    const tokensUsed = {
      input: message.usage.input_tokens,
      output: message.usage.output_tokens,
      total: message.usage.input_tokens + message.usage.output_tokens
    }

    // Build result
    const questionResult: GeneratedQuestion = {
      question: parsed.question,
      format,
      bloomLevel,
      explanation: parsed.explanation || parsed.rubric || '',
      entityId: context.id,
      entityName: context.name,
      domain: context.domain,
      fullPath: context.fullPath,
      generatedAt: new Date(),
      model,
      tokensUsed
    }

    // Add format-specific fields
    if (format === 'mcq_single') {
      questionResult.options = parsed.options
      questionResult.correctAnswer = parsed.correctAnswer
    } else if (format === 'mcq_multi') {
      questionResult.options = parsed.options
      questionResult.correctAnswers = parsed.correctAnswers
    } else if (format === 'fill_blank') {
      questionResult.correctAnswer = parsed.correctAnswer
      questionResult.acceptableAnswers = parsed.acceptableAnswers || [parsed.correctAnswer]
    } else if (format === 'open_ended') {
      questionResult.modelAnswer = parsed.modelAnswer
      questionResult.keyPoints = parsed.keyPoints
      questionResult.rubric = parsed.rubric
    }

    return questionResult

  } catch (error: any) {
    // Handle Claude API errors
    if (error.message?.includes('API key') || error.status === 401) {
      throw new QuestionGenerationError('Invalid Anthropic API key', error, false)
    } else if (error.message?.includes('quota') || error.message?.includes('rate limit') || error.status === 429) {
      throw new QuestionGenerationError('Rate limit exceeded', error, true)
    } else if (error.status === 500 || error.status === 503) {
      throw new QuestionGenerationError('Claude API server error', error, true)
    }

    // If already a QuestionGenerationError, re-throw
    if (error instanceof QuestionGenerationError) {
      throw error
    }

    // Unknown error
    throw new QuestionGenerationError('Unknown error during question generation', error, false)
  }
}

/**
 * Generate question with retry logic
 *
 * @param context - GraphRAG context
 * @param bloomLevel - Bloom level
 * @param format - Question format
 * @param maxRetries - Maximum retry attempts (default: 3)
 * @param model - Claude model
 * @returns Generated question
 */
export async function generateQuestionWithRetry(
  context: GraphRAGContext,
  bloomLevel: number,
  format: QuestionFormat,
  maxRetries: number = 3,
  model?: string
): Promise<GeneratedQuestion> {
  let lastError: QuestionGenerationError | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await generateQuestion(context, bloomLevel, format, model)
    } catch (error) {
      if (error instanceof QuestionGenerationError) {
        lastError = error

        // Don't retry if error is not retryable
        if (!error.retryable) {
          throw error
        }

        // Log retry attempt
        // Log removed

        // Exponential backoff for rate limits
        if (error.message.includes('Rate limit')) {
          const delay = Math.pow(2, attempt) * 1000
          // Log removed
          await new Promise(resolve => setTimeout(resolve, delay))
        } else {
          // Short delay for other retryable errors
          await new Promise(resolve => setTimeout(resolve, 1000))
        }

        // Continue to next attempt
        continue
      } else {
        // Unknown error - wrap and throw
        throw new QuestionGenerationError('Unexpected error', error, false)
      }
    }
  }

  // All retries exhausted
  throw new QuestionGenerationError(
    `Failed after ${maxRetries} attempts: ${lastError?.message}`,
    lastError,
    false
  )
}

/**
 * Batch generate questions for a topic
 *
 * Generates multiple questions with different Bloom levels and formats.
 *
 * @param context - GraphRAG context
 * @param bloomLevels - Array of Bloom levels to generate
 * @param format - Question format (or 'auto' to use recommended formats)
 * @param maxConcurrent - Maximum concurrent API calls (default: 3)
 * @returns Array of generated questions
 */
export async function batchGenerateQuestions(
  context: GraphRAGContext,
  bloomLevels: number[],
  format: QuestionFormat | 'auto' = 'auto',
  maxConcurrent: number = 3
): Promise<GeneratedQuestion[]> {
  const tasks: Array<{ bloomLevel: number; format: QuestionFormat }> = []

  // Build task list
  for (const bloomLevel of bloomLevels) {
    if (format === 'auto') {
      // Use first recommended format for this Bloom level
      const recommendedFormats = getRecommendedFormatsForBloom(bloomLevel)
      tasks.push({ bloomLevel, format: recommendedFormats[0] })
    } else {
      tasks.push({ bloomLevel, format })
    }
  }

  // Execute with concurrency limit
  const results: GeneratedQuestion[] = []
  const errors: Array<{ task: any; error: Error }> = []

  for (let i = 0; i < tasks.length; i += maxConcurrent) {
    const batch = tasks.slice(i, i + maxConcurrent)

    const batchPromises = batch.map(task =>
      generateQuestionWithRetry(context, task.bloomLevel, task.format)
        .catch(error => ({ error, task }))
    )

    const batchResults = await Promise.all(batchPromises)

    for (const result of batchResults) {
      if ('error' in result) {
        errors.push(result as any)
      } else {
        results.push(result as GeneratedQuestion)
      }
    }

    // Rate limiting delay between batches
    if (i + maxConcurrent < tasks.length) {
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }

  if (errors.length > 0) {
    console.warn(`${errors.length} questions failed to generate:`, errors)
  }

  return results
}

/**
 * Get recommended formats for a Bloom level
 */
function getRecommendedFormatsForBloom(bloomLevel: number): QuestionFormat[] {
  const formatMap: Record<number, QuestionFormat[]> = {
    1: ['mcq_single', 'fill_blank'],
    2: ['mcq_single', 'mcq_multi'],
    3: ['mcq_multi', 'fill_blank'],
    4: ['mcq_multi', 'open_ended'],
    5: ['mcq_multi', 'open_ended'],
    6: ['open_ended']
  }

  return formatMap[bloomLevel] || ['mcq_single']
}
