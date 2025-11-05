import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// xAI Grok API (OpenAI-compatible)
const grok = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1',
})

// Bloom's Taxonomy levels
const BLOOM_LEVELS = {
  1: 'Remember (recall facts and basic concepts)',
  2: 'Understand (explain ideas or concepts)',
  3: 'Apply (use information in new situations)',
  4: 'Analyze (draw connections among ideas)',
  5: 'Evaluate (justify a stand or decision)',
  6: 'Create (produce new or original work)',
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { chapter_id, topic, bloom_level, num_questions = 1 } = body

    // Validate inputs
    if (!chapter_id || !topic) {
      return NextResponse.json(
        { error: 'chapter_id and topic are required' },
        { status: 400 }
      )
    }

    const bloomLevelNum = parseInt(bloom_level) || 1
    if (bloomLevelNum < 1 || bloomLevelNum > 6) {
      return NextResponse.json(
        { error: 'bloom_level must be between 1 and 6' },
        { status: 400 }
      )
    }

    console.log(`Generating ${num_questions} question(s) for topic: "${topic}" at Bloom level ${bloomLevelNum}`)

    // Step 1: Generate embedding for the topic
    console.log('Generating topic embedding...')
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: topic,
    })
    const topicEmbedding = embeddingResponse.data[0].embedding

    // Step 2: Vector similarity search to find relevant chunks
    console.log('Searching for relevant chunks...')
    const { data: chunks, error: searchError } = await supabase.rpc(
      'match_knowledge_chunks',
      {
        query_embedding: topicEmbedding,
        match_threshold: 0.5,
        match_count: 5,
        filter_chapter_id: chapter_id,
      }
    )

    if (searchError) {
      console.error('Error searching chunks:', searchError)
      return NextResponse.json(
        { error: 'Failed to search knowledge base: ' + searchError.message },
        { status: 500 }
      )
    }

    if (!chunks || chunks.length === 0) {
      return NextResponse.json(
        { error: 'No relevant content found for this topic. Try a different topic or add more content.' },
        { status: 404 }
      )
    }

    console.log(`Found ${chunks.length} relevant chunks`)

    // Step 3: Prepare context from retrieved chunks
    const context = chunks.map((chunk: any, idx: number) =>
      `[Chunk ${idx + 1}]\n${chunk.content}`
    ).join('\n\n---\n\n')

    // Step 4: Generate questions using Grok AI
    console.log('Generating questions with Grok AI...')
    const bloomDescription = BLOOM_LEVELS[bloomLevelNum as keyof typeof BLOOM_LEVELS]

    const prompt = `You are an expert educator creating assessment questions for students studying cybersecurity.

BLOOM'S TAXONOMY LEVEL: ${bloomLevelNum} - ${bloomDescription}

TOPIC: ${topic}

CONTEXT (from course materials):
${context}

TASK: Generate ${num_questions} multiple-choice question(s) at Bloom's level ${bloomLevelNum} about "${topic}".

REQUIREMENTS:
1. Base questions ONLY on the provided context
2. Match the cognitive level of Bloom's ${bloomLevelNum} (${bloomDescription})
3. Provide 4 answer options (A, B, C, D)
4. Clearly indicate the correct answer
5. Include a brief explanation for the correct answer

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

Generate exactly ${num_questions} question(s). Return ONLY valid JSON, no other text.`

    const completion = await grok.chat.completions.create({
      model: 'grok-2-latest',
      messages: [
        {
          role: 'system',
          content: 'You are an expert educator. Always respond with valid JSON only, no markdown or other formatting.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })

    // Extract JSON from Grok's response
    const responseText = completion.choices[0]?.message?.content || ''
    let questionsData

    try {
      // Try to parse the entire response as JSON
      questionsData = JSON.parse(responseText)
    } catch (parseError) {
      // If that fails, try to extract JSON from markdown code blocks
      const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) || responseText.match(/```\n?([\s\S]*?)\n?```/)
      if (jsonMatch) {
        questionsData = JSON.parse(jsonMatch[1])
      } else {
        console.error('Failed to parse Grok response:', responseText)
        return NextResponse.json(
          { error: 'Failed to parse AI response', raw_response: responseText },
          { status: 500 }
        )
      }
    }

    if (!questionsData?.questions || !Array.isArray(questionsData.questions)) {
      return NextResponse.json(
        { error: 'Invalid response format from AI', raw_response: responseText },
        { status: 500 }
      )
    }

    // Step 5: Store questions in database
    console.log('Storing questions in database...')
    const questionsToInsert = questionsData.questions.map((q: any) => ({
      chapter_id,
      question_text: q.question_text,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      bloom_level: bloomLevelNum,
      topic,
      difficulty_estimated: bloomLevelNum >= 4 ? 'hard' : bloomLevelNum >= 3 ? 'medium' : 'easy',
      source_type: 'ai_generated',
    }))

    const { data: insertedQuestions, error: insertError } = await supabase
      .from('questions')
      .insert(questionsToInsert)
      .select()

    if (insertError) {
      console.error('Error inserting questions:', insertError)
      return NextResponse.json(
        { error: 'Failed to store questions: ' + insertError.message },
        { status: 500 }
      )
    }

    console.log(`Successfully generated and stored ${insertedQuestions.length} question(s)`)

    return NextResponse.json({
      success: true,
      questions: insertedQuestions,
      chunks_used: chunks.length,
    })
  } catch (error) {
    console.error('Error generating questions:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
