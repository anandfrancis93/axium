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
import Anthropic from '@anthropic-ai/sdk'
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

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

/**
 * Validate MCQ option length balance
 * Returns true if options are within 30% length of each other
 */
function validateMCQOptionBalance(options: string[]): { valid: boolean; ratio: number } {
  if (!options || options.length < 2) return { valid: true, ratio: 0 }

  const lengths = options.map((opt: string) => opt.length)
  const minLen = Math.min(...lengths)
  const maxLen = Math.max(...lengths)

  if (minLen === 0) return { valid: false, ratio: Infinity }

  const ratio = (maxLen - minLen) / minLen
  return { valid: ratio <= 0.30, ratio }
}

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

// ... (existing imports)

/**
 * Helper to get ripple context string for Bloom 5-6
 */
async function getRippleContextString(
  supabase: any,
  userId: string,
  topicId: string,
  topicName: string,
  bloomLevel: number
): Promise<string> {
  if (bloomLevel < 5) return ''

  try {
    const { getRippleEffectContext, generateRippleScenarioInstructions } = await import('@/lib/graphrag/ripple-effects')

    // Fetch user progress to build mastery map
    const { data: progressData } = await supabase
      .from('user_progress')
      .select('topic_id, mastery_scores')
      .eq('user_id', userId)

    const masteredTopicIds: string[] = []
    const userMasteryMap = new Map<string, number>()

    if (progressData) {
      progressData.forEach((p: any) => {
        // Calculate average mastery
        let total = 0
        let count = 0
        const scores = p.mastery_scores || {}
        
        Object.values(scores).forEach((val: any) => {
            if (typeof val === 'number') {
                total += val
                count++
            } else if (typeof val === 'object') {
                // Handle nested object (bloom level scores)
                Object.values(val).forEach((v: any) => {
                    if (typeof v === 'number') {
                        total += v
                        count++
                    }
                })
            }
        })

        const avg = count > 0 ? total / count : 0
        userMasteryMap.set(p.topic_id, avg)
        
        if (avg >= 70) {
            masteredTopicIds.push(p.topic_id)
        }
      })
    }

    const rippleContext = await getRippleEffectContext(
      topicId,
      masteredTopicIds,
      userMasteryMap
    )

    return generateRippleScenarioInstructions(rippleContext.dependencyChains, topicName)
  } catch (error) {
    console.error('Error fetching ripple context:', error)
    return ''
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


  // Fetch questions due for review
  const dueQuestions = await fetchDueSpacedRepetitionQuestions(
    supabase,
    user.id,
    subject,
    10
  )

  if (dueQuestions.length === 0) {

    return await handleNewTopicQuestion(supabase, user, subject)
  }

  // Filter out questions with option length imbalance and delete bad ones
  let question = null
  for (const q of dueQuestions) {
    // Only validate MCQ questions
    if (!q.question_format?.startsWith('mcq') || !q.options) {
      question = q
      break
    }

    const options = Array.isArray(q.options) ? q.options : Object.values(q.options)
    const validation = validateMCQOptionBalance(options as string[])

    if (validation.valid) {
      question = q
      break
    } else {
      // Delete question with bad quality from database
      console.log(`[Quality Control] Deleting question ${q.id} due to option length imbalance (${Math.round(validation.ratio * 100)}%)`)
      await supabase.from('questions').delete().eq('id', q.id)
    }
  }

  // If all due questions failed validation, fall back to new topic
  if (!question) {
    console.log('[Spaced Repetition] All due questions failed quality validation, falling back to new topic')
    return await handleNewTopicQuestion(supabase, user, subject)
  }



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


  // Find topics with uncovered dimensions
  const topicsWithUncovered = await findTopicsWithUncoveredDimensions(
    supabase,
    user.id,
    subject
  )

  if (topicsWithUncovered.length === 0) {

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



  // Fetch context and generate question
  let context = await fetchKnowledgeContext(supabase, user.id, topicId, topic.name)
  
  // Add ripple context for Bloom 5-6
  const rippleContext = await getRippleContextString(supabase, user.id, topicId, topic.name, bloomLevel)
  if (rippleContext) {
    context += `\n\n${rippleContext}`
  }

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
  let context = await fetchKnowledgeContext(supabase, user.id, selection.topicId, selection.topicName)

  // Add ripple context for Bloom 5-6
  const rippleContext = await getRippleContextString(supabase, user.id, selection.topicId, selection.topicName, selection.bloomLevel)
  if (rippleContext) {
    context += `\n\n${rippleContext}`
  }

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



  // Generate question using Claude
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

    const contextParts = chunks.map((chunk: any) => chunk.content)
    return contextParts.join('\n\n')
  }

  // If no chunks, use mastery-aware multi-hop graph traversal


  try {
    const { getMasteryAwareContext } = await import('@/lib/graphrag/multi-hop-context')
    const graphContext = await getMasteryAwareContext(
      userId,
      topicId,
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      3
    )

    return graphContext.contextText
  } catch (graphError) {
    console.error('[Context] Error fetching mastery-aware context:', graphError)
    // Fallback to basic topic info


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

  // NOTE: We do NOT update the database here anymore.
  // The rotation counter is now updated in /api/quiz/submit ONLY after a successful submission.
  // This prevents "consuming" a format if the user backs out of the quiz.

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
 * Generate question using Claude with quality validation
 * Retries up to 3 times if MCQ option length is imbalanced
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
    mcq_single: `Generate a multiple-choice question with 4 options and ONE correct answer.

⚠️ **ANTI-TELL-TALE RULES (CRITICAL - questions will be rejected if violated):**

**1. LENGTH BALANCE:**
ALL 4 options MUST be within ±30% length of each other (in characters).
- If one option is 50 chars, ALL others must be 35-65 chars
- The correct answer must NOT be noticeably longer or shorter than distractors

**2. SPECIFICITY BALANCE:**
- ALL options must have EQUAL levels of detail and specificity
- ❌ BAD: Correct answer has technical details while distractors are vague
- ✅ GOOD: All options include specific technical terms or examples

**3. NO ABSOLUTE QUALIFIER PATTERNS:**
- ❌ NEVER put "always", "never", "all", "none", "only", "every" exclusively in wrong answers
- If using absolutes, distribute them across correct AND incorrect options
- Test-takers know "always/never" options are usually wrong

**4. GRAMMATICAL CONSISTENCY:**
- ALL options must have identical grammatical structure
- If correct answer starts with a verb, ALL options start with verbs
- If correct answer is a noun phrase, ALL options are noun phrases
- ❌ BAD: A) "Encrypting data" B) "Data encryption" C) "To encrypt" D) "Encrypted"

**5. NO HEDGING LANGUAGE BIAS:**
- ❌ NEVER put hedging words ("typically", "generally", "often", "may") only in correct answer
- Test-takers know hedged answers are often correct
- Either use hedging in ALL options or NONE

**6. RANDOMIZE CORRECT ANSWER POSITION:**
- Vary the correct answer position (A, B, C, or D) randomly
- Do NOT default to B or C

**7. FORBIDDEN PATTERNS:**
- ❌ NO "All of the above" or "None of the above"
- ❌ NO "Both A and B" type options
- ❌ NO obviously joke/absurd distractors

**8. SIBLING TOPIC DISTRACTORS (CRITICAL):**
- Incorrect options MUST be related concepts from the SAME domain/category
- Use sibling topics, similar techniques, or closely related concepts as distractors
- ❌ BAD: Question about "AES encryption" with distractors like "HTTP", "RAM", "Linux"
- ✅ GOOD: Question about "AES encryption" with distractors like "RSA encryption", "DES encryption", "Blowfish cipher"
- Distractors should be plausible to someone with partial knowledge
- The goal is to test DISCRIMINATION between similar concepts, not random guessing

**BAD EXAMPLE (will be rejected):**
- A: "Using the same key for encryption and decryption" (47 chars)
- B: "Uses public key" (15 chars) ❌ TOO SHORT
- C: "Requires key exchange" (21 chars) ❌ TOO SHORT
- D: "Symmetric method" (16 chars) ❌ TOO SHORT

**GOOD EXAMPLE:**
- A: "Using the same key for both encryption and decryption processes" (63 chars)
- B: "Using different keys, one public and one private for security" (61 chars) ✓
- C: "Requiring manual key exchange between all communicating parties" (64 chars) ✓
- D: "Employing a symmetric method with periodic key rotation cycles" (63 chars) ✓

Format: {"question": "What is X?", "options": ["First option text", "Second option text", "Third option text", "Fourth option text"], "correct_answer": "A", "explanation": "..."}
IMPORTANT: options array should contain ONLY the option text without any letter prefixes (A, B, C, D). The correct_answer should be just the letter (A, B, C, or D).`,
    mcq_multi: `Generate a multiple-choice question with 4-6 options and MULTIPLE correct answers.

⚠️ **ANTI-TELL-TALE RULES (CRITICAL):**
1. ALL options MUST be within ±30% length of each other
2. ALL options must have EQUAL specificity and detail level
3. NO absolute qualifiers ("always", "never") only in wrong answers
4. ALL options must have identical grammatical structure
5. NO hedging language ("typically", "often") only in correct answers
6. NO "All of the above" or "None of the above"
7. SIBLING DISTRACTORS: Incorrect options must be related concepts from the same domain (e.g., similar techniques, sibling topics) - NOT random unrelated terms

Format: {"question": "Select all that apply: Which are X?", "options": ["First option text", "Second option text", "Third option text", "Fourth option text"], "correct_answer": ["A", "C"], "explanation": "..."}
IMPORTANT: options array should contain ONLY the option text without any letter prefixes. The correct_answer should be an array of letters.`,
    fill_blank: `Generate a fill-in-the-blank question with 4 options.

⚠️ **SIBLING DISTRACTORS:** All options must be related concepts from the same category.
- ❌ BAD: "encryption" with options like "keyboard", "monitor", "cable"
- ✅ GOOD: "encryption" with options like "hashing", "encoding", "obfuscation"

Format: {"question": "The process of _____ is...", "options": ["photosynthesis", "respiration", "osmosis", "diffusion"], "correct_answer": "photosynthesis", "explanation": "..."}`,
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

  const maxRetries = 3
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const message = await anthropic.messages.create({
        model: 'claude-opus-4-5-20251101',
        max_tokens: 2048,
        temperature: 0.7,
        system: 'You are an expert educator. Always respond with valid JSON only, no additional text or markdown.',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })

      const responseText = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
      if (!responseText) {
        throw new Error('Empty response from Claude')
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
        console.error(`[Attempt ${attempt}] Failed to parse Claude response:`, responseText)
        throw new Error('Invalid JSON response from Claude')
      }

      // QUALITY VALIDATION: Check MCQ option length balance
      if ((questionFormat === 'mcq_single' || questionFormat === 'mcq_multi') && questionData.options) {
        const validation = validateMCQOptionBalance(questionData.options)
        if (!validation.valid) {
          const details = questionData.options.map((opt: string, i: number) =>
            `${String.fromCharCode(65 + i)}) ${opt.length} chars`
          ).join(', ')
          console.error(`[Attempt ${attempt}] Option length imbalance (${Math.round(validation.ratio * 100)}%): ${details}`)

          if (attempt < maxRetries) {
            console.log(`Retrying question generation (attempt ${attempt + 1}/${maxRetries})...`)
            continue // Retry
          }
          throw new Error(`Option length imbalance after ${maxRetries} attempts`)
        }
      }

      return questionData

    } catch (error) {
      lastError = error as Error
      console.error(`[Attempt ${attempt}] Error generating question:`, error)

      if (attempt === maxRetries) {
        throw new Error(`Failed to generate question after ${maxRetries} attempts: ${lastError.message}`)
      }
    }
  }

  throw lastError || new Error('Failed to generate question')
}
