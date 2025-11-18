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
import { getRecommendedFormats } from '@/lib/graphrag/prompts'
import { getNextQuestionPosition, determineQuestionType } from '@/lib/utils/question-selection'
import {
  fetchDueSpacedRepetitionQuestions,
  findTopicsWithUncoveredDimensions,
  selectNextUncoveredDimension
} from '@/lib/utils/spaced-repetition-selection'
import {
  parseDimensionCoverage,
  enforceDimensionRule,
  CognitiveDimension
} from '@/lib/utils/cognitive-dimensions'

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

    // ============================================================
    // 7-2-1 SPLIT PATTERN
    // Position 1-7: New topics (RL selection)
    // Position 8-9: Spaced repetition → fallback to new topic
    // Position 10: Dimension practice → fallback to new topic
    // ============================================================

    // Determine current position in 10-question cycle
    const position = await getNextQuestionPosition(supabase, user.id)
    const questionInfo = determineQuestionType(position)

    console.log(`[7-2-1 Pattern] Position ${position}/10: ${questionInfo.type}`)

    // Route to appropriate handler based on position
    if (questionInfo.type === 'spaced_repetition') {
      // Position 8-9: Try spaced repetition, fallback to new topic
      return await handleSpacedRepetitionQuestion(supabase, user, subject)
    } else if (questionInfo.type === 'dimension_practice') {
      // Position 10: Try dimension practice, fallback to new topic
      return await handleDimensionPracticeQuestion(supabase, user, subject)
    } else {
      // Position 1-7: New topic (RL selection)
      return await handleNewTopicQuestion(supabase, user, subject)
    }

  } catch (error) {
    console.error('Error generating next question:', error)
    return NextResponse.json(
      { error: 'Failed to generate question', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * Position 8-9: Spaced Repetition
 * Returns exact saved question with exact options
 * Fallback: New topic selection if no questions due
 */
async function handleSpacedRepetitionQuestion(
  supabase: any,
  user: any,
  subject?: string
): Promise<NextResponse> {
  console.log('[Spaced Repetition] Fetching due questions...')

  // Fetch questions due for review
  const dueQuestions = await fetchDueSpacedRepetitionQuestions(
    supabase,
    user.id,
    subject,
    10
  )

  if (dueQuestions.length === 0) {
    console.log('[Spaced Repetition] No questions due, falling back to new topic')
    return await handleNewTopicQuestion(supabase, user, subject)
  }

  // Return the first due question (already contains all metadata)
  const question = dueQuestions[0]

  console.log(`[Spaced Repetition] Returning saved question for topic: ${question.topics.name}`)

  return NextResponse.json({
    success: true,
    question: {
      id: question.id,
      topic_id: question.topic_id,
      topic_name: question.topics.name,
      bloom_level: question.bloom_level,
      question_format: question.question_format,
      cognitive_dimension: question.cognitive_dimension,
      question_text: question.question_text,
      options: question.options,
      correct_answer: question.correct_answer,
      explanation: question.explanation,
      selection_reason: 'Spaced repetition review',
      selection_method: 'spaced_repetition'
    },
    metadata: {
      selectionReason: 'Spaced repetition review',
      questionType: 'spaced_repetition'
    }
  })
}

/**
 * Position 10: Dimension Practice
 * Selects topic with uncovered dimensions, generates question for next dimension
 * Fallback: New topic if all dimensions covered
 */
async function handleDimensionPracticeQuestion(
  supabase: any,
  user: any,
  subject?: string
): Promise<NextResponse> {
  console.log('[Dimension Practice] Finding topics with uncovered dimensions...')

  // Find topics with uncovered dimensions
  const topicsWithUncovered = await findTopicsWithUncoveredDimensions(
    supabase,
    user.id,
    subject
  )

  if (topicsWithUncovered.length === 0) {
    console.log('[Dimension Practice] No uncovered dimensions found, falling back to new topic')
    return await handleNewTopicQuestion(supabase, user, subject)
  }

  // Select first topic with uncovered dimensions
  const selectedProgress = topicsWithUncovered[0]
  const topicId = selectedProgress.topic_id
  const bloomLevel = selectedProgress.current_bloom_level
  const topic = selectedProgress.topics

  // Select next uncovered dimension
  const nextDimension = selectNextUncoveredDimension(
    selectedProgress.dimension_coverage || {},
    bloomLevel
  )

  console.log(`[Dimension Practice] Topic: ${topic.name}, Bloom: ${bloomLevel}, Dimension: ${nextDimension}`)

  // Fetch context and generate question
  const context = await fetchKnowledgeContext(supabase, user.id, topicId, topic.name)
  const questionFormat = await getNextFormatRoundRobin(supabase, user.id, topicId, bloomLevel)

  const question = await generateQuestion(
    topic.name,
    topic.description || null,
    bloomLevel,
    context,
    questionFormat,
    nextDimension
  )

  // Build enriched question
  const enrichedQuestion = {
    ...question,
    id: crypto.randomUUID(),
    topic_id: topicId,
    topic_name: topic.name,
    bloom_level: bloomLevel,
    selection_reason: `Dimension practice: ${nextDimension}`,
    selection_method: 'dimension_practice',
    question_format: questionFormat,
    cognitive_dimension: nextDimension,
    question_text: question.question || question.question_text
  }

  return NextResponse.json({
    success: true,
    question: enrichedQuestion,
    metadata: {
      selectionReason: enrichedQuestion.selection_reason,
      questionType: 'dimension_practice'
    }
  })
}

/**
 * Position 1-7: New Topic Selection
 * Uses RL selection with "What first" enforcement
 */
async function handleNewTopicQuestion(
  supabase: any,
  user: any,
  subject?: string
): Promise<NextResponse> {
  // RL selects the optimal topic and Bloom level
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

  // Fetch mastery-aware knowledge graph context
  const context = await fetchKnowledgeContext(supabase, user.id, selection.topicId, selection.topicName)

  // Select format using round robin
  const recommendedFormat = await getNextFormatRoundRobin(supabase, user.id, selection.topicId, selection.bloomLevel)

  // Select cognitive dimension (prioritize uncovered dimensions)
  let selectedDimension = await selectCognitiveDimension(supabase, user.id, selection.topicId, selection.bloomLevel)

  // ============================================================
  // ENFORCE "WHAT FIRST" RULE
  // If user has never practiced this topic at this Bloom level,
  // force first question to be "What" dimension
  // ============================================================
  const { data: progress } = await supabase
    .from('user_progress')
    .select('dimension_coverage')
    .eq('user_id', user.id)
    .eq('topic_id', selection.topicId)
    .single()

  const coverageByLevel = parseDimensionCoverage(progress?.dimension_coverage || {})
  selectedDimension = enforceDimensionRule(
    coverageByLevel,
    selection.bloomLevel,
    selectedDimension as CognitiveDimension
  )

  console.log(`[What First Rule] Final dimension: ${selectedDimension}`)

  // Generate question using xAI Grok
  const question = await generateQuestion(
    selection.topicName,
    topicHierarchy?.description || null,
    selection.bloomLevel,
    context,
    recommendedFormat,
    selectedDimension
  )

  // Add metadata to question
  const enrichedQuestion = {
    ...question,
    id: crypto.randomUUID(),
    topic_id: selection.topicId,
    topic_name: selection.topicName,
    bloom_level: selection.bloomLevel,
    selection_reason: selection.selectionReason,
    selection_priority: selection.priority,
    selection_method: selection.selectionMethod,
    question_format: recommendedFormat,
    cognitive_dimension: selectedDimension,
    question_text: question.question || question.question_text,
    hierarchy: topicHierarchy ? {
      subject: (topicHierarchy.subjects as any)?.name || null,
      chapter: null,
      topic: topicHierarchy.name,
      learningObjective: learningObjective,
      hierarchyLevel: topicHierarchy.hierarchy_level,
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
 * Select next cognitive dimension for this topic/bloom level
 * Prioritizes uncovered dimensions to ensure comprehensive coverage
 */
async function selectCognitiveDimension(
  supabase: any,
  userId: string,
  topicId: string,
  bloomLevel: number
): Promise<string> {
  const { CognitiveDimension, selectNextDimension, getCoverageForLevel, parseDimensionCoverage } = await import('@/lib/utils/cognitive-dimensions')

  // Fetch user's current dimension coverage for this topic
  const { data: progress } = await supabase
    .from('user_progress')
    .select('dimension_coverage')
    .eq('user_id', userId)
    .eq('topic_id', topicId)
    .single()

  // Parse coverage and get covered dimensions for this Bloom level
  const coverageByLevel = parseDimensionCoverage(progress?.dimension_coverage || {})
  const coveredDimensions = getCoverageForLevel(coverageByLevel, bloomLevel)

  // Use smart selection: prioritizes uncovered dimensions
  const nextDimension = selectNextDimension(coveredDimensions)

  console.log(`[Cognitive Dimension] Bloom ${bloomLevel}: Selected ${nextDimension}, covered: ${coveredDimensions.join(', ')}`)

  return nextDimension
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
  topicDescription: string | null,
  bloomLevel: number,
  context: string,
  questionFormat: string,
  cognitiveDimension: string
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

  // Import cognitive dimension info
  const { COGNITIVE_DIMENSIONS } = await import('@/lib/utils/cognitive-dimensions')
  const dimensionInfo = COGNITIVE_DIMENSIONS[cognitiveDimension as keyof typeof COGNITIVE_DIMENSIONS]

  const formatInstructions: Record<string, string> = {
    mcq_single: 'Generate a multiple-choice question with 4 options and ONE correct answer. Format: {"question": "What is X?", "options": ["First option text", "Second option text", "Third option text", "Fourth option text"], "correct_answer": "A", "explanation": "..."}. IMPORTANT: options array should contain ONLY the option text without any letter prefixes (A, B, C, D). The correct_answer should be just the letter (A, B, C, or D).',
    mcq_multi: 'Generate a multiple-choice question with 4-6 options and MULTIPLE correct answers. Format: {"question": "Select all that apply: Which are X?", "options": ["First option text", "Second option text", "Third option text", "Fourth option text"], "correct_answer": ["A", "C"], "explanation": "..."}. IMPORTANT: options array should contain ONLY the option text without any letter prefixes. The correct_answer should be an array of letters.',
    true_false: 'Generate a true/false question. Format: {"question": "...", "options": ["True", "False"], "correct_answer": "True", "explanation": "..."}',
    fill_blank: 'Generate a fill-in-the-blank question with 4 options. Format: {"question": "The process of _____ is...", "options": ["photosynthesis", "respiration", "osmosis", "diffusion"], "correct_answer": "photosynthesis", "explanation": "..."}',
    matching: 'Generate a matching question with 4 pairs. Format: {"question": "Match the following...", "options": ["1-A", "1-B", "2-A", "2-B", "3-A", "3-B", "4-A", "4-B"], "correct_answer": ["1-A", "2-B", "3-C", "4-D"], "explanation": "..."}',
    open_ended: 'Generate an open-ended question requiring a short paragraph answer. Format: {"question": "...", "correct_answer": "Key points: ...", "explanation": "..."}'
  }

  const formatInstruction = formatInstructions[questionFormat] || formatInstructions.mcq_single

  // Detect domain-specific topics (cybersecurity, security, threats, attacks, vulnerabilities)
  const securityKeywords = ['security', 'attack', 'threat', 'vulnerability', 'exploit', 'malware', 'cryptography', 'authentication', 'authorization', 'encryption']
  const isSecurityTopic = securityKeywords.some(keyword =>
    topicName.toLowerCase().includes(keyword) || context.toLowerCase().includes(keyword)
  )

  // Build domain-specific constraints
  let domainConstraints = ''
  if (isSecurityTopic) {
    domainConstraints = `
**🔒 CYBERSECURITY DOMAIN CONSTRAINTS:**
This is a cybersecurity/security topic. Your question MUST:
- Focus on SPECIFIC security concepts, threats, or controls mentioned in the context
- Test understanding of HOW attacks work, WHAT defenses exist, or WHY security measures matter
- Reference SPECIFIC details from the learning context (e.g., attack vectors, threat actors, security controls)
- ❌ AVOID VAGUE/AMBIGUOUS TERMS that could have multiple meanings across domains
- ❌ DO NOT use topic terms without context if they are ambiguous (e.g., "cloud access" could mean access methods, security, network vectors, etc.)
- ✅ "What is X?" questions are GOOD when X is crystal clear and unambiguous (e.g., "What is encryption?", "What is AES?")
- ✅ "What is X?" questions are BAD when X is vague (e.g., "What is cloud access?" - needs disambiguation)
- ✅ For vague terms: Add specificity from context (e.g., "What is the primary security risk of cloud access network vectors?")
- ✅ Ensure questions are anchored to cybersecurity domain, not generic IT concepts

**Example BAD question (vague term):**
"What is cloud access?"
→ Ambiguous - could mean access methods, security, protocols, network vectors, etc.

**Example GOOD question (clear term):**
"What is encryption?"
→ Crystal clear, unambiguous concept

**Example GOOD question (disambiguated vague term):**
"What security risk do cloud access network vectors pose to organizations?"
→ Same topic, but disambiguated with specific context from learning materials
`
  }

  // Build topic definition section
  const topicDefinition = topicDescription
    ? `**Topic Definition:**
${topicDescription}

⚠️ **CRITICAL:** Your question MUST be based on this exact definition. Do NOT assume or infer what "${topicName}" means - use ONLY the definition provided above.`
    : `**Topic:** ${topicName}

⚠️ **WARNING:** No topic description provided. Generate questions based on the learning context below.`

  const prompt = `You are an expert educator creating questions based on Bloom's Taxonomy.

**Topic Name:** ${topicName}
${topicDefinition}

**Bloom Level:** ${bloomLevel} - ${bloom.name}
**Action Verbs:** ${bloom.verbs}
**Question Format:** ${questionFormat}
**Cognitive Dimension:** ${dimensionInfo.name} (${dimensionInfo.description})

**Learning Context:**
${context}
${domainConstraints}

**🎯 COGNITIVE DIMENSION FOCUS:**
This question MUST focus on the **${dimensionInfo.name.toUpperCase()}** dimension.
${dimensionInfo.questionPrompts.map((prompt: string) => `- ${prompt.replace('[topic]', topicName)}`).join('\n')}

Your question should specifically target this cognitive dimension while maintaining Bloom Level ${bloomLevel} complexity.

**Instructions:**
${formatInstruction}

**CRITICAL REQUIREMENTS:**
1. **MANDATORY: Use Topic Definition:** ${topicDescription ? 'Your question MUST test the concept defined in the "Topic Definition" above. Do NOT create questions based on what you think the topic name means.' : 'Use the learning context to understand the topic.'}
2. **Validate Topic Alignment:** Before finalizing, ask yourself: "Does this question test the EXACT concept described in the topic definition?" If NO, revise the question.
3. **Parse the Learning Context:** Extract key concepts, details, and specifics from the context above
4. **Use Specific Details:** Your question MUST reference at least one specific detail from the ${topicDescription ? 'topic definition or' : ''} context
5. **Test at Bloom Level ${bloomLevel} (${bloom.name}):** Use one of these verbs: ${bloom.verbs}
6. **Avoid Vague/Ambiguous Terms:**
   - ✅ "What is X?" is GOOD when X is crystal clear (e.g., "What is encryption?", "What is AES?")
   - ❌ "What is X?" is BAD when X is vague/ambiguous (e.g., "What is cloud access?" could mean many things)
   - ✅ For vague terms: Disambiguate using context (e.g., "What security risk do cloud access network vectors pose?")
7. **Domain Anchoring:** Ensure the question is clearly anchored to the topic's domain (e.g., cybersecurity, physics, biology)
8. **Clear and Unambiguous:** ONE definitive correct answer (or multiple for mcq_multi)
9. **Detailed Explanation:** Explain WHY the correct answer is right using clear reasoning
10. **Return ONLY valid JSON:** No additional text or markdown

**❌ NEVER reference source materials in questions OR explanations:**
- Do NOT include "in the context of [source]" (e.g., "CompTIA Security+ SY0-701")
- Do NOT mention "as covered in [certification]" or "as defined in [curriculum]"
- Do NOT reference textbook names, certification exams, or course codes
- Do NOT mention learning objectives or domains by name
- Write questions AND explanations as if they are standalone educational content
- Focus on the TOPIC and CONCEPTS, not the source they came from

**✅ QUESTION QUALITY CHECKLIST:**
Before finalizing your question, verify:
${topicDescription ? `- [ ] Does this question test the EXACT concept from the Topic Definition (not what I think "${topicName}" means)?` : ''}
- [ ] Does this question reference SPECIFIC details from the ${topicDescription ? 'topic definition or' : ''} learning context?
- [ ] Is this question anchored to the topic's domain (not overly generic)?
- [ ] Does this test Bloom Level ${bloomLevel} (${bloom.name})?
- [ ] Would a student need to understand the topic's SPECIFIC details to answer correctly?
- [ ] Is the correct answer clearly supported by the ${topicDescription ? 'topic definition and' : ''} learning context?
${topicDescription ? `- [ ] If the topic name is vague (like "Local"), did I use the definition to clarify what it means?` : ''}

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
