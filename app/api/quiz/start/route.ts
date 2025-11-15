/**
 * Quiz Start API Endpoint
 *
 * POST /api/quiz/start
 *
 * Generates questions on-the-fly using GraphRAG context and xAI Grok
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { QuizStartParams, QuizQuestion } from '@/lib/types/quiz'
import OpenAI from 'openai'

// Initialize xAI Grok client
const grok = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1'
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body: QuizStartParams = await request.json()
    const {
      topicId,
      bloomLevel = 1,
      questionCount = 5, // Reduced default since we're generating on-the-fly
      useRecommendations = false
    } = body

    // Get recommended topic if not specified
    let selectedTopicId = topicId
    if (useRecommendations && !topicId) {
      // TODO: Call RL recommendation engine
      // For now, select a random topic the user has progress on
      const { data: progressTopics } = await supabase
        .from('user_progress')
        .select('topic_id')
        .eq('user_id', user.id)
        .limit(1)
        .single()

      if (progressTopics) {
        selectedTopicId = progressTopics.topic_id
      }
    }

    if (!selectedTopicId) {
      return NextResponse.json(
        { error: 'Topic ID is required or no progress found for recommendations' },
        { status: 400 }
      )
    }

    // Get topic info with full path for context
    const { data: topic } = await supabase
      .from('topics')
      .select(`
        id,
        name,
        chapters (
          name,
          subjects (
            name
          )
        )
      `)
      .eq('id', selectedTopicId)
      .single()

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      )
    }

    const topicName = topic.name
    // chapters is an array from the join, get first element
    const chapter = Array.isArray(topic.chapters) ? topic.chapters[0] : topic.chapters
    const chapterName = chapter?.name || ''
    const subject = Array.isArray(chapter?.subjects) ? chapter.subjects[0] : chapter?.subjects
    const subjectName = subject?.name || ''

    // Retrieve GraphRAG context from knowledge graph
    const graphContext = await getGraphRAGContext(supabase, selectedTopicId, topicName)

    // Generate questions on-the-fly using Grok
    console.log(`Generating ${questionCount} questions for ${topicName} at Bloom level ${bloomLevel}`)
    const questions = await generateQuestions(
      topicName,
      chapterName,
      subjectName,
      bloomLevel,
      questionCount,
      graphContext
    )

    // Create session
    const session = {
      id: crypto.randomUUID(),
      userId: user.id,
      topicId: selectedTopicId,
      topicName: topicName,
      bloomLevel,
      startedAt: new Date().toISOString(),
      questions: questions.map(q => ({
        ...q,
        startedAt: new Date()
      })),
      currentQuestionIndex: 0,
      score: 0,
      totalQuestions: questions.length,
      isComplete: false
    }

    return NextResponse.json({
      success: true,
      session,
      firstQuestion: session.questions[0],
      contextUsed: graphContext.length > 0
    })

  } catch (error) {
    console.error('Error in quiz start:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Retrieve GraphRAG context for a topic using the knowledge graph
 */
async function getGraphRAGContext(
  supabase: any,
  topicId: string,
  topicName: string
): Promise<string> {
  try {
    // Option 1: Get from graphrag_entities (if topic exists in knowledge graph)
    const { data: entity } = await supabase
      .from('graphrag_entities')
      .select('name, type, description, summary, full_path')
      .eq('name', topicName)
      .limit(1)
      .single()

    if (entity && entity.summary) {
      console.log('Using GraphRAG entity summary for context')
      return entity.summary
    }

    // Option 2: Get from prerequisite paths (related topics)
    const { data: prerequisites } = await supabase
      .from('graphrag_prerequisite_paths')
      .select('path_names, path_summaries')
      .eq('target_entity_id', topicId)
      .limit(3)

    if (prerequisites && prerequisites.length > 0) {
      console.log('Using prerequisite paths for context')
      const context = prerequisites
        .map((p: any) => p.path_summaries?.join(' → '))
        .filter(Boolean)
        .join('\n\n')
      if (context) return context
    }

    // Option 3: Get from knowledge_chunks (vector similarity - fallback)
    const { data: chunks } = await supabase
      .from('knowledge_chunks')
      .select('content')
      .ilike('content', `%${topicName}%`)
      .limit(3)

    if (chunks && chunks.length > 0) {
      console.log('Using knowledge chunks for context')
      return chunks.map((c: any) => c.content).join('\n\n')
    }

    console.log('No GraphRAG context found, using topic name only')
    return ''
  } catch (error) {
    console.error('Error retrieving GraphRAG context:', error)
    return ''
  }
}

/**
 * Generate questions using xAI Grok with GraphRAG context
 */
async function generateQuestions(
  topicName: string,
  chapterName: string,
  subjectName: string,
  bloomLevel: number,
  count: number,
  graphContext: string
): Promise<QuizQuestion[]> {
  const bloomLevels = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create']
  const bloomName = bloomLevels[bloomLevel - 1]

  const contextSection = graphContext
    ? `\n\nContext from knowledge graph:\n${graphContext}\n\nUse this context to create relevant, specific questions.`
    : '\n\nNo additional context available. Use your knowledge of the topic.'

  const systemPrompt = `You are an expert educator creating quiz questions based on Bloom's Taxonomy.

Subject: ${subjectName}
Chapter: ${chapterName}
Topic: ${topicName}
Bloom Level: ${bloomLevel} - ${bloomName}${contextSection}

Generate ${count} questions at Bloom level ${bloomLevel} (${bloomName}).

For each question, provide:
1. question_format: One of [mcq_single, mcq_multi, true_false, fill_blank, open_ended]
2. question_text: The question itself
3. options: Array of 4 options (for MCQ), or empty array for other formats
4. correct_answer: String or array of strings (for mcq_multi)
5. explanation: Why the answer is correct (2-3 sentences)

Return ONLY valid JSON array with no markdown formatting:
[
  {
    "question_format": "mcq_single",
    "question_text": "...",
    "options": ["A", "B", "C", "D"],
    "correct_answer": "A",
    "explanation": "..."
  }
]`

  try {
    const completion = await grok.chat.completions.create({
      model: 'grok-beta',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate ${count} diverse questions for "${topicName}".` }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })

    const responseText = completion.choices[0]?.message?.content || '[]'

    // Parse JSON response
    const cleanedResponse = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    const generatedQuestions = JSON.parse(cleanedResponse)

    // Transform to QuizQuestion format
    return generatedQuestions.map((q: any, idx: number) => ({
      id: `generated-${Date.now()}-${idx}`,
      topic_id: '', // Will be set by session
      bloom_level: bloomLevel,
      question_format: q.question_format,
      question_text: q.question_text,
      options: q.options || [],
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      metadata: {
        generated_at: new Date().toISOString(),
        source: 'grok-on-the-fly',
        context_used: graphContext.length > 0
      }
    }))

  } catch (error) {
    console.error('Error generating questions with Grok:', error)
    throw new Error(`Question generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
