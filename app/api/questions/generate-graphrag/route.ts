import { NextRequest, NextResponse } from 'next/server'
import { getContextById, findEntitiesByName } from '@/lib/graphrag/context'
import { generateQuestionWithRetry, batchGenerateQuestions } from '@/lib/graphrag/generate'
import { storeGeneratedQuestion, batchStoreQuestions } from '@/lib/graphrag/storage'
import { QuestionFormat } from '@/lib/graphrag/prompts'

/**
 * POST /api/questions/generate-graphrag
 *
 * Generate questions using GraphRAG + Claude AI
 *
 * Request body:
 * {
 *   entityId?: string,           // UUID of curriculum entity
 *   entityName?: string,          // Name to search for (returns first match)
 *   bloomLevel: number,           // 1-6
 *   format: QuestionFormat,       // mcq_single, mcq_multi, true_false, fill_blank, open_ended
 *   count?: number,               // Number of questions to generate (default: 1)
 *   store?: boolean,              // Store in database (default: true)
 *   topicId?: string,             // Optional Supabase topic ID
 *   model?: string                // Optional Claude model override
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   questions: GeneratedQuestion[],
 *   stored?: string[],            // IDs of stored questions
 *   totalCost: number,
 *   errors?: string[]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.entityId && !body.entityName) {
      return NextResponse.json(
        { error: 'Either entityId or entityName is required' },
        { status: 400 }
      )
    }

    if (!body.bloomLevel || body.bloomLevel < 1 || body.bloomLevel > 6) {
      return NextResponse.json(
        { error: 'bloomLevel must be between 1 and 6' },
        { status: 400 }
      )
    }

    if (!body.format) {
      return NextResponse.json(
        { error: 'format is required (mcq_single, mcq_multi, true_false, fill_blank, open_ended, matching)' },
        { status: 400 }
      )
    }

    const count = body.count || 1
    const store = body.store !== false // Default true
    const bloomLevel: number = body.bloomLevel
    const format: QuestionFormat = body.format

    // Get context
    let context

    if (body.entityId) {
      context = await getContextById(body.entityId)
      if (!context) {
        return NextResponse.json(
          { error: 'Entity not found' },
          { status: 404 }
        )
      }
    } else {
      const entities = await findEntitiesByName(body.entityName)
      if (entities.length === 0) {
        return NextResponse.json(
          { error: `No entity found with name "${body.entityName}"` },
          { status: 404 }
        )
      }
      context = entities[0] // Use first match
    }

    console.log(`Generating ${count} question(s) for: ${context.name} (Bloom ${bloomLevel}, ${format})`)

    // Generate questions
    let questions

    if (count === 1) {
      // Single question
      const question = await generateQuestionWithRetry(context, bloomLevel, format, 3, body.model)
      questions = [question]
    } else {
      // Multiple questions (same Bloom level and format)
      const bloomLevels = Array(count).fill(bloomLevel)
      questions = await batchGenerateQuestions(context, bloomLevels, format, 3)
    }

    console.log(`Generated ${questions.length} question(s)`)

    // Store questions if requested
    let storedIds: string[] = []

    if (store) {
      console.log('Storing questions in database...')
      const results = await batchStoreQuestions(questions, body.topicId)

      storedIds = results
        .filter(r => r.success && !r.isDuplicate && r.questionId)
        .map(r => r.questionId!)

      const duplicateCount = results.filter(r => r.isDuplicate).length
      const errorCount = results.filter(r => !r.success).length

      console.log(`Stored: ${storedIds.length}, Duplicates: ${duplicateCount}, Errors: ${errorCount}`)
    }

    return NextResponse.json({
      success: true,
      count: questions.length,
      questions,
      stored: store ? storedIds : undefined,
      totalCost: questions.reduce((sum, q) => {
        const cost = (q.tokensUsed.input * 3 / 1000000) + (q.tokensUsed.output * 15 / 1000000)
        return sum + cost
      }, 0)
    })

  } catch (error: any) {
    console.error('GraphRAG question generation error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate question',
        message: error.message
      },
      { status: 500 }
    )
  }
}
