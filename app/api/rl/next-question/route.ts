import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { selectArmThompsonSampling } from '@/lib/rl/thompson-sampling'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const grok = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1',
})

const BLOOM_LEVELS: { [key: number]: string } = {
  1: 'Remember (recall facts and basic concepts)',
  2: 'Understand (explain ideas or concepts)',
  3: 'Apply (use information in new situations)',
  4: 'Analyze (draw connections among ideas)',
  5: 'Evaluate (justify a stand or decision)',
  6: 'Create (produce new or original work)',
}

/**
 * Generate a question on-demand using RAG + Grok
 */
async function generateQuestionOnDemand(
  supabase: any,
  chapterId: string,
  topic: string,
  bloomLevel: number
): Promise<any> {
  console.log(`Generating question for: ${topic} at Bloom ${bloomLevel}`)

  // Step 1: Generate embedding for the topic
  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: topic,
  })
  const topicEmbedding = embeddingResponse.data[0].embedding

  // Step 2: Vector search for relevant chunks
  const embeddingString = `[${topicEmbedding.join(',')}]`
  const { data: chunks } = await supabase.rpc('match_knowledge_chunks', {
    query_embedding: embeddingString,
    match_threshold: 0.1,
    match_count: 5,
    filter_chapter_id: chapterId,
  })

  if (!chunks || chunks.length === 0) {
    throw new Error(`No content found for topic "${topic}". Please upload learning materials first.`)
  }

  // Step 3: Prepare context
  const context = chunks.map((chunk: any, idx: number) =>
    `[Chunk ${idx + 1}]\n${chunk.content}`
  ).join('\n\n---\n\n')

  // Step 4: Generate question with Grok
  const bloomDescription = BLOOM_LEVELS[bloomLevel]
  const prompt = `You are an expert educator creating assessment questions.

BLOOM'S TAXONOMY LEVEL: ${bloomLevel} - ${bloomDescription}
TOPIC: ${topic}

CONTEXT (from course materials):
${context}

TASK: Generate 1 multiple-choice question at Bloom's level ${bloomLevel} about "${topic}".

REQUIREMENTS:
1. Base question ONLY on the provided context
2. Match the cognitive level of Bloom's ${bloomLevel}
3. Provide 4 answer options (A, B, C, D)
4. Clearly indicate the correct answer
5. Include a brief explanation

ANTI-TELLTALE QUALITY CONTROLS:
- All 4 options must have similar length
- Wrong answers must be plausible and from the same domain
- Don't repeat exact keywords from question in only the correct answer
- All options must be equally technical/professional
- Wrong answers should be "close but not quite right"

FORMAT YOUR RESPONSE AS VALID JSON:
{
  "questions": [
    {
      "question_text": "The question text here?",
      "options": {
        "A": "First option",
        "B": "Second option",
        "C": "Third option",
        "D": "Fourth option"
      },
      "correct_answer": "B",
      "explanation": "Brief explanation of why B is correct"
    }
  ]
}

Return ONLY valid JSON, no other text.`

  const completion = await grok.chat.completions.create({
    model: 'grok-4-fast-reasoning',
    messages: [
      { role: 'system', content: 'You are an expert educator. Always respond with valid JSON only.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 2000,
  })

  // Step 5: Parse response
  const responseText = completion.choices[0]?.message?.content || ''
  let questionsData

  try {
    questionsData = JSON.parse(responseText)
  } catch (parseError) {
    const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) || responseText.match(/```\n?([\s\S]*?)\n?```/)
    if (jsonMatch) {
      questionsData = JSON.parse(jsonMatch[1])
    } else {
      throw new Error('Failed to parse AI response')
    }
  }

  if (!questionsData?.questions || questionsData.questions.length === 0) {
    throw new Error('Invalid response format from AI')
  }

  const q = questionsData.questions[0]

  // Return question without storing (ephemeral)
  const ephemeralQuestion = {
    id: `ephemeral-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    chapter_id: chapterId,
    question_text: q.question_text,
    question_type: 'mcq',
    options: q.options,
    correct_answer: q.correct_answer,
    explanation: q.explanation,
    bloom_level: bloomLevel,
    topic,
    difficulty_estimated: bloomLevel >= 4 ? 'hard' : bloomLevel >= 3 ? 'medium' : 'easy',
    source_type: 'ai_generated_realtime',
  }

  console.log(`Successfully generated ephemeral question in real-time`)
  return ephemeralQuestion
}

/**
 * POST /api/rl/next-question
 *
 * Get next question using Thompson Sampling RL
 * Questions are ALWAYS generated in real-time using RAG + Grok AI
 *
 * Body:
 * - session_id: UUID of the learning session
 *
 * Returns:
 * - question: Freshly generated question object (ephemeral, not stored)
 * - session_progress: Current progress in session
 * - arm_selected: Which (topic, bloom_level) was chosen by RL agent
 * - generated_realtime: true (always)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { session_id } = body

    if (!session_id) {
      return NextResponse.json(
        { error: 'session_id is required' },
        { status: 400 }
      )
    }

    // Get session details
    const { data: session, error: sessionError } = await supabase
      .from('learning_sessions')
      .select('*')
      .eq('id', session_id)
      .eq('user_id', user.id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Check if session is complete
    if (session.questions_answered >= session.total_questions) {
      return NextResponse.json({
        session_complete: true,
        final_score: session.score,
        questions_answered: session.questions_answered
      })
    }

    // Use Thompson Sampling to select next arm (topic, bloom_level)
    const selectedArm = await selectArmThompsonSampling(user.id, session.chapter_id)

    if (!selectedArm) {
      return NextResponse.json(
        { error: 'No available questions for this chapter. Upload content and generate questions first.' },
        { status: 404 }
      )
    }

    console.log('Selected arm:', selectedArm)

    // Always generate question in real-time (no database lookup)
    console.log(`Generating real-time question for ${selectedArm.topic} at Bloom ${selectedArm.bloomLevel}`)

    try {
      const generatedQuestion = await generateQuestionOnDemand(
        supabase,
        session.chapter_id,
        selectedArm.topic,
        selectedArm.bloomLevel
      )

      if (!generatedQuestion) {
        return NextResponse.json(
          { error: `Failed to generate question for topic "${selectedArm.topic}" at Bloom level ${selectedArm.bloomLevel}` },
          { status: 500 }
        )
      }

      // Return the generated question (without correct answer for display)
      const { correct_answer, explanation, ...questionWithoutAnswer } = generatedQuestion

      return NextResponse.json({
        question: questionWithoutAnswer,
        // Include answer metadata separately (frontend stores but doesn't display)
        question_metadata: {
          correct_answer,
          explanation,
          question_id: generatedQuestion.id,
          bloom_level: generatedQuestion.bloom_level,
          topic: generatedQuestion.topic
        },
        session_progress: {
          session_id: session.id,
          questions_answered: session.questions_answered,
          total_questions: session.total_questions,
          current_score: session.score
        },
        arm_selected: {
          topic: selectedArm.topic,
          bloom_level: selectedArm.bloomLevel
        },
        generated_realtime: true
      })
    } catch (genError) {
      console.error('Error generating question in real-time:', genError)
      return NextResponse.json(
        { error: `Failed to generate question: ${genError instanceof Error ? genError.message : 'Unknown error'}` },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in POST /api/rl/next-question:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
