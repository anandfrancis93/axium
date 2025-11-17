/**
 * RL-Driven Next Question API
 *
 * POST /api/quiz/next-question
 *
 * Automatically selects topic using RL, retrieves context, and generates question
 * User does not know which topic until after answering
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { selectNextTopic } from '@/lib/progression/rl-topic-selector'
import OpenAI from 'openai'
import { saveQuestion } from '@/lib/db/questions'
import { getRecommendedFormats } from '@/lib/graphrag/prompts'

// Initialize xAI client
const xai = new OpenAI({
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

    // Get subject from request body to filter topics (optional)
    const body = await request.json()
    const { subject } = body

    // RL selects the optimal topic and Bloom level
    // Filter by subject if provided (e.g., 'cybersecurity', 'physics')
    let selection
    try {
      selection = await selectNextTopic(user.id, subject)
    } catch (selectionError) {
      console.error('Error in RL selection:', selectionError)
      return NextResponse.json(
        {
          error: 'No topics available',
          details: selectionError instanceof Error ? selectionError.message : 'Please upload learning materials first.',
          action: 'Please go to Admin > GraphRAG to upload learning content for topics.'
        },
        { status: 400 }
      )
    }

    console.log('[RL Selection]', {
      topic: selection.topicName,
      bloomLevel: selection.bloomLevel,
      reason: selection.selectionReason,
      priority: selection.priority
    })

    // Fetch topic hierarchy for display
    const { data: topicHierarchy } = await supabase
      .from('topics')
      .select('name, description, hierarchy_level, parent_topic_id, subject_id, subjects(name)')
      .eq('id', selection.topicId)
      .single()

    // Fetch parent learning objective if this is a topic (level 3+)
    let learningObjective = null
    if (topicHierarchy?.parent_topic_id) {
      const { data: parentData } = await supabase
        .from('topics')
        .select('name, hierarchy_level')
        .eq('id', topicHierarchy.parent_topic_id)
        .single()

      if (parentData && parentData.hierarchy_level === 2) {
        learningObjective = parentData.name
      }
    }

    // Fetch mastery-aware knowledge graph context for the selected topic
    const context = await fetchKnowledgeContext(supabase, user.id, selection.topicId, selection.topicName)

    // Select format using round robin (cycles through recommended formats for this Bloom level)
    const recommendedFormat = await getNextFormatRoundRobin(supabase, user.id, selection.topicId, selection.bloomLevel)

    // Generate question using xAI Grok
    const question = await generateQuestion(
      selection.topicName,
      selection.bloomLevel,
      context,
      recommendedFormat
    )

    // Add metadata to question and map field names
    const enrichedQuestion = {
      ...question,
      id: crypto.randomUUID(), // Generate proper UUID for database compatibility
      topic_id: selection.topicId,
      topic_name: selection.topicName,
      bloom_level: selection.bloomLevel,
      selection_reason: selection.selectionReason,
      selection_priority: selection.priority,
      selection_method: selection.selectionMethod,
      question_format: recommendedFormat,
      // Map 'question' field to 'question_text' for consistency with QuizQuestion type
      question_text: question.question || question.question_text,
      // Add hierarchy for display
      hierarchy: topicHierarchy ? {
        subject: (topicHierarchy.subjects as any)?.name || null,
        chapter: null, // No chapters anymore
        topic: topicHierarchy.name, // Actual topic name (no cleaning needed - it's a real topic now)
        learningObjective: learningObjective, // Parent learning objective (## level)
        hierarchyLevel: topicHierarchy.hierarchy_level,
        description: topicHierarchy.description || null
      } : null
    }

    // Save generated question to database for future spaced repetition
    await saveQuestion({
      id: enrichedQuestion.id,
      topic_id: selection.topicId,
      bloom_level: selection.bloomLevel,
      question_format: recommendedFormat,
      question_text: enrichedQuestion.question_text,
      options: enrichedQuestion.options,
      correct_answer: enrichedQuestion.correct_answer,
      explanation: enrichedQuestion.explanation,
      rag_context: context || undefined,
      source_type: 'ai_generated_realtime',
      model: 'grok-4-fast-reasoning'
    })

    return NextResponse.json({
      success: true,
      question: enrichedQuestion,
      metadata: {
        selectionReason: selection.selectionReason,
        priority: selection.priority
      }
    })

  } catch (error) {
    console.error('Error generating next question:', error)
    return NextResponse.json(
      { error: 'Failed to generate question', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * Fetch mastery-aware knowledge context from Neo4j knowledge graph
 * Ensures questions only reference topics the user has mastered
 */
async function fetchKnowledgeContext(
  supabase: any,
  userId: string,
  topicId: string,
  topicName: string
): Promise<string> {
  // Try to fetch from knowledge_chunks first (if available)
  const { data: chunks, error } = await supabase
    .from('knowledge_chunks')
    .select('content, metadata')
    .eq('topic_id', topicId)
    .order('chunk_index')
    .limit(5)

  if (!error && chunks && chunks.length > 0) {
    console.log(`[Context] Found ${chunks.length} knowledge chunks for ${topicName}`)
    const contextParts = chunks.map((chunk: any) => chunk.content)
    return contextParts.join('\n\n')
  }

  // If no chunks, use mastery-aware multi-hop graph traversal
  console.log(`[Context] No chunks found for ${topicName}, using mastery-aware graph traversal`)

  try {
    const { getMasteryAwareContext } = await import('@/lib/graphrag/multi-hop-context')
    const graphContext = await getMasteryAwareContext(
      userId,
      topicId,
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      3
    )
    console.log(`[Context] Retrieved mastery-aware context: ${graphContext.keystoneScore} dependent topics, ${graphContext.masteredTopicIds.length} mastered, ${graphContext.notStudiedTopicIds.length} not studied`)
    return graphContext.contextText
  } catch (graphError) {
    console.error('[Context] Error fetching mastery-aware context:', graphError)
    // Fallback to basic topic info
    console.log(`[Context] Falling back to basic topic info`)

    // Fetch topic details from database
    const { data: topic } = await supabase
      .from('topics')
      .select('name, description, chapter_id, chapters(name, subject_id, subjects(name))')
      .eq('id', topicId)
      .single()

    if (topic) {
      let context = `Topic: ${topic.name}\n`
      if (topic.description) {
        context += `Description: ${topic.description}\n`
      }
      if (topic.chapters) {
        context += `Chapter: ${topic.chapters.name}\n`
        if (topic.chapters.subjects) {
          context += `Subject: ${topic.chapters.subjects.name}\n`
        }
      }
      return context + '\nNote: Generate questions based on general knowledge of this topic.'
    }

    return `Topic: ${topicName}\nGenerate questions based on general knowledge of this topic.`
  }
}

/**
 * Get next format using round robin for this Bloom level
 * Tracks BOTH global state (across all topics) and per-topic state
 * Uses per-topic cycling for selection to ensure variety when revisiting topics
 */
async function getNextFormatRoundRobin(
  supabase: any,
  userId: string,
  topicId: string,
  bloomLevel: number
): Promise<string> {
  // Get recommended formats for this Bloom level
  const recommendedFormats = getRecommendedFormats(bloomLevel)

  // Fetch BOTH global and per-topic state in parallel
  const [settingsResult, progressResult] = await Promise.all([
    supabase
      .from('user_settings')
      .select('format_round_robin')
      .eq('user_id', userId)
      .single(),
    supabase
      .from('user_progress')
      .select('rl_metadata')
      .eq('user_id', userId)
      .eq('topic_id', topicId)
      .single()
  ])

  const settings = settingsResult.data
  const progress = progressResult.data

  // Calculate GLOBAL next format index
  let globalLastIndex = -1
  if (settings?.format_round_robin) {
    globalLastIndex = settings.format_round_robin[`bloom_${bloomLevel}`] ?? -1
  }
  const globalFormatIndex = (globalLastIndex + 1) % recommendedFormats.length

  // Calculate PER-TOPIC next format index
  let topicLastIndex = -1
  if (progress?.rl_metadata?.format_round_robin) {
    topicLastIndex = progress.rl_metadata.format_round_robin[`bloom_${bloomLevel}`] ?? -1
  }
  const topicFormatIndex = (topicLastIndex + 1) % recommendedFormats.length

  // USE GLOBAL INDEX for selection (ensures variety across all topics)
  const selectedFormat = recommendedFormats[globalFormatIndex]

  console.log('[Round Robin] State:', {
    userId,
    topicId,
    bloomLevel,
    recommendedFormats,
    global: { lastIndex: globalLastIndex, newIndex: globalFormatIndex, format: recommendedFormats[globalFormatIndex] },
    perTopic: { lastIndex: topicLastIndex, newIndex: topicFormatIndex, format: recommendedFormats[topicFormatIndex] },
    selectedFormat: selectedFormat,
    selectionMode: 'GLOBAL'
  })

  // Update BOTH global and per-topic state
  const updatedGlobalRoundRobin = {
    ...(settings?.format_round_robin || {}),
    [`bloom_${bloomLevel}`]: globalFormatIndex
  }

  const updatedTopicMetadata = {
    ...(progress?.rl_metadata || {}),
    format_round_robin: {
      ...(progress?.rl_metadata?.format_round_robin || {}),
      [`bloom_${bloomLevel}`]: topicFormatIndex
    }
  }

  // Execute updates in parallel
  await Promise.all([
    supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        format_round_robin: updatedGlobalRoundRobin
      }, {
        onConflict: 'user_id'
      }),
    supabase
      .from('user_progress')
      .upsert({
        user_id: userId,
        topic_id: topicId,
        rl_metadata: updatedTopicMetadata
      }, {
        onConflict: 'user_id,topic_id'
      })
  ])

  console.log(`[Round Robin] Bloom ${bloomLevel}: Selected format ${selectedFormat} (GLOBAL index ${globalFormatIndex}/${recommendedFormats.length}, per-topic index ${topicFormatIndex}/${recommendedFormats.length})`)

  return selectedFormat
}

/**
 * Get format based on Bloom level (randomly selected from recommended formats)
 * @deprecated Use getNextFormatRoundRobin instead for consistent cycling
 */
function getDefaultFormatForBloomLevel(bloomLevel: number): string {
  // Get recommended formats for this Bloom level
  const recommendedFormats = getRecommendedFormats(bloomLevel)

  // Randomly select one format from the recommended list
  const randomIndex = Math.floor(Math.random() * recommendedFormats.length)
  return recommendedFormats[randomIndex]
}

/**
 * Generate question using xAI Grok
 */
async function generateQuestion(
  topicName: string,
  bloomLevel: number,
  context: string,
  questionFormat: string
): Promise<any> {
  const bloomDescriptions: Record<number, { name: string; verbs: string }> = {
    1: { name: 'Remember', verbs: 'define, list, recall, identify, name' },
    2: { name: 'Understand', verbs: 'explain, describe, summarize, interpret, classify' },
    3: { name: 'Apply', verbs: 'apply, demonstrate, solve, use, execute' },
    4: { name: 'Analyze', verbs: 'analyze, compare, contrast, differentiate, examine' },
    5: { name: 'Evaluate', verbs: 'evaluate, judge, critique, justify, assess' },
    6: { name: 'Create', verbs: 'create, design, construct, develop, formulate' }
  }

  const bloom = bloomDescriptions[bloomLevel] || bloomDescriptions[1]

  const formatInstructions: Record<string, string> = {
    mcq_single: 'Generate a multiple-choice question with 4 options and ONE correct answer. Format: {"question": "What is X?", "options": ["First option text", "Second option text", "Third option text", "Fourth option text"], "correct_answer": "A", "explanation": "..."}. IMPORTANT: options array should contain ONLY the option text without any letter prefixes (A, B, C, D). The correct_answer should be just the letter (A, B, C, or D).',
    mcq_multi: 'Generate a multiple-choice question with 4-6 options and MULTIPLE correct answers. Format: {"question": "Select all that apply: Which are X?", "options": ["First option text", "Second option text", "Third option text", "Fourth option text"], "correct_answer": ["A", "C"], "explanation": "..."}. IMPORTANT: options array should contain ONLY the option text without any letter prefixes. The correct_answer should be an array of letters.',
    true_false: 'Generate a true/false question. Format: {"question": "...", "options": ["True", "False"], "correct_answer": "True", "explanation": "..."}',
    fill_blank: 'Generate a fill-in-the-blank question with 4 options. Format: {"question": "The process of _____ is...", "options": ["photosynthesis", "respiration", "osmosis", "diffusion"], "correct_answer": "photosynthesis", "explanation": "..."}',
    matching: 'Generate a matching question with 4 pairs. Format: {"question": "Match the following...", "options": ["1-A", "1-B", "2-A", "2-B", "3-A", "3-B", "4-A", "4-B"], "correct_answer": ["1-A", "2-B", "3-C", "4-D"], "explanation": "..."}',
    open_ended: 'Generate an open-ended question requiring a short paragraph answer. Format: {"question": "...", "correct_answer": "Key points: ...", "explanation": "..."}'
  }

  const formatInstruction = formatInstructions[questionFormat] || formatInstructions.mcq_single

  const prompt = `You are an expert educator creating questions based on Bloom's Taxonomy.

**Topic:** ${topicName}
**Bloom Level:** ${bloomLevel} - ${bloom.name}
**Action Verbs:** ${bloom.verbs}
**Question Format:** ${questionFormat}

**Learning Context:**
${context}

**Instructions:**
${formatInstruction}

**Requirements:**
1. Question must test at Bloom Level ${bloomLevel} (${bloom.name})
2. Use one of these verbs: ${bloom.verbs}
3. Base the question on the provided learning context
4. Ensure the question is clear, unambiguous, and has ONE definitive correct answer (or multiple for mcq_multi)
5. Provide a detailed explanation that teaches the concept
6. Return ONLY valid JSON, no additional text

**❌ NEVER reference source materials in questions OR explanations:**
- Do NOT include "in the context of [source]" (e.g., "CompTIA Security+ SY0-701")
- Do NOT mention "as covered in [certification]" or "as defined in [curriculum]"
- Do NOT reference textbook names, certification exams, or course codes
- Do NOT mention learning objectives or domains by name
- Write questions AND explanations as if they are standalone educational content
- Focus on the TOPIC and CONCEPTS, not the source they came from

**✅ EXPLANATION QUALITY:**
- Explain WHY the correct answer is right using clear reasoning
- Do NOT cite external sources, curriculums, or certifications
- Use phrases like "This is correct because..." not "According to [source]..."
- Focus on conceptual understanding, not memorization of source material

Generate the question now:`

  try {
    const completion = await xai.chat.completions.create({
      model: 'grok-4-fast-reasoning', // Use Grok 4 Fast reasoning model for better quality
      messages: [
        {
          role: 'system',
          content: 'You are an expert educator. Always respond with valid JSON only, no additional text or markdown.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      stream: false
    })

    const responseText = completion.choices[0]?.message?.content?.trim()
    if (!responseText) {
      throw new Error('Empty response from xAI')
    }

    // Parse JSON response
    let questionData
    try {
      // Remove markdown code blocks if present
      const cleanedResponse = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()

      questionData = JSON.parse(cleanedResponse)
    } catch (parseError) {
      console.error('Failed to parse xAI response:', responseText)
      throw new Error('Invalid JSON response from xAI')
    }

    return questionData

  } catch (error) {
    console.error('Error calling xAI:', error)
    throw new Error('Failed to generate question with xAI')
  }
}
