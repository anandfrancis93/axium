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

    // RL selects the optimal topic and Bloom level
    let selection
    try {
      selection = await selectNextTopic(user.id)
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
      .select('name, description, chapter_id, chapters(name, subject_id, subjects(name))')
      .eq('id', selection.topicId)
      .single()

    // Fetch knowledge graph context for the selected topic
    const context = await fetchKnowledgeContext(supabase, selection.topicId, selection.topicName)

    // Analyze format performance to recommend format
    const recommendedFormat = await analyzeFormatPerformance(
      supabase,
      user.id,
      selection.topicId,
      selection.bloomLevel
    )

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
        subject: (topicHierarchy.chapters as any)?.[0]?.subjects?.name || null,
        chapter: (topicHierarchy.chapters as any)?.[0]?.name || null,
        topic: topicHierarchy.name,
        description: topicHierarchy.description || null
      } : null
    }

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
 * Fetch knowledge context from Neo4j knowledge graph or knowledge chunks
 */
async function fetchKnowledgeContext(
  supabase: any,
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

  // If no chunks, use Neo4j knowledge graph context
  // For now, return topic name - the LLM will use general knowledge
  console.log(`[Context] No chunks found for ${topicName}, using general knowledge + Neo4j relationships`)

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

/**
 * Analyze format performance to recommend best format
 */
async function analyzeFormatPerformance(
  supabase: any,
  userId: string,
  topicId: string,
  bloomLevel: number
): Promise<string> {
  // Fetch user responses for this topic/Bloom level
  const { data: responses, error } = await supabase
    .from('user_responses')
    .select('question_format, is_correct, calibration_score, confidence')
    .eq('user_id', userId)
    .eq('topic_id', topicId)
    .eq('bloom_level', bloomLevel)

  if (error || !responses || responses.length === 0) {
    // No history: Use default format based on Bloom level
    return getDefaultFormatForBloomLevel(bloomLevel)
  }

  // Calculate effectiveness for each format
  interface FormatStats {
    attempts: number
    correct: number
    avgCalibration: number
    avgConfidence: number
    effectiveness: number
  }

  const formatStats: Record<string, FormatStats> = {}

  for (const response of responses) {
    const format = response.question_format
    if (!format) continue

    if (!formatStats[format]) {
      formatStats[format] = {
        attempts: 0,
        correct: 0,
        avgCalibration: 0,
        avgConfidence: 0,
        effectiveness: 0
      }
    }

    formatStats[format].attempts++
    if (response.is_correct) formatStats[format].correct++
    formatStats[format].avgCalibration += response.calibration_score || 0
    formatStats[format].avgConfidence += response.confidence || 0
  }

  // Calculate effectiveness score
  for (const format in formatStats) {
    const stats = formatStats[format]
    stats.avgCalibration /= stats.attempts
    stats.avgConfidence /= stats.attempts

    const accuracy = stats.correct / stats.attempts
    const calibrationQuality = (stats.avgCalibration + 1.5) / 3  // Normalize -1.5 to +1.5 → 0 to 1

    // Effectiveness: 70% accuracy + 30% calibration quality
    stats.effectiveness = (accuracy * 0.7) + (calibrationQuality * 0.3)
  }

  // Select format with highest effectiveness
  const sortedFormats = Object.entries(formatStats).sort(
    (a, b) => b[1].effectiveness - a[1].effectiveness
  )

  if (sortedFormats.length > 0) {
    const bestFormat = sortedFormats[0][0]
    console.log('[Format Analysis]', {
      bloomLevel,
      bestFormat,
      effectiveness: sortedFormats[0][1].effectiveness,
      allFormats: formatStats
    })
    return bestFormat
  }

  return getDefaultFormatForBloomLevel(bloomLevel)
}

/**
 * Get default format based on Bloom level
 */
function getDefaultFormatForBloomLevel(bloomLevel: number): string {
  if (bloomLevel <= 2) return 'mcq_single'
  if (bloomLevel <= 4) return 'mcq_multi'
  return 'open_ended'
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
    mcq_single: 'Generate a multiple-choice question with 4 options and ONE correct answer. Format: {"question": "...", "options": ["A", "B", "C", "D"], "correct_answer": "A", "explanation": "..."}',
    mcq_multi: 'Generate a multiple-choice question with 4-6 options and MULTIPLE correct answers. Format: {"question": "Select all that apply...", "options": ["A", "B", "C", "D"], "correct_answer": ["A", "C"], "explanation": "..."}',
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

Generate the question now:`

  try {
    const completion = await xai.chat.completions.create({
      model: 'grok-2-1212',
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
      max_tokens: 1000
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
