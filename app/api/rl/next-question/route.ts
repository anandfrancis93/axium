import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { selectArmThompsonSampling } from '@/lib/rl/thompson-sampling'
import { getFormatsByBloomLevel, type QuestionFormat } from '@/lib/utils/question-format'
import { logArmSelection } from '@/lib/rl/decision-logger'
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

// Knowledge Dimensions - Different perspectives on learning the same concept
const KNOWLEDGE_DIMENSIONS: { [key: string]: string } = {
  'definition': 'DIMENSION: Definition/Conceptual Understanding - Focus on "what is it?" and core terminology. Test understanding of fundamental concepts, definitions, and classifications. Appropriate for Bloom levels 1-2 (Remember, Understand).',

  'example': 'DIMENSION: Examples and Applications - Focus on "how is it used?" and practical instances. Test ability to recognize or provide real-world examples. Appropriate for Bloom levels 2-3 (Understand, Apply).',

  'comparison': 'DIMENSION: Comparison and Contrast - Focus on "how are these different/similar?" and relationships. Test ability to distinguish between related concepts. Appropriate for Bloom levels 2-4 (Understand, Apply, Analyze).',

  'scenario': 'DIMENSION: Scenario-Based Problem Solving - Focus on "what should you do?" in realistic situations. Test ability to apply knowledge to novel contexts and make decisions. Appropriate for Bloom levels 3-5 (Apply, Analyze, Evaluate).',

  'implementation': 'DIMENSION: Implementation and Procedures - Focus on "how do you implement/configure it?" and step-by-step processes. Test knowledge of setup, configuration, and operational procedures. Appropriate for Bloom levels 3-6 (Apply, Analyze, Evaluate, Create).',

  'troubleshooting': 'DIMENSION: Troubleshooting and Analysis - Focus on "why isn\'t it working?" and diagnostic reasoning. Test ability to identify problems, analyze symptoms, and propose solutions. Appropriate for Bloom levels 4-6 (Analyze, Evaluate, Create).'
}

/**
 * Get dimension-specific guidance for question generation
 */
function getDimensionGuidance(dimension: string, bloomLevel: number): string {
  const guidance: { [key: string]: string } = {
    'definition': 'Ask "What is...", "Define...", "Which statement best describes...", "What does X mean?". Focus on terminology and core concepts.',

    'example': 'Ask "Which is an example of...", "Which scenario demonstrates...", "Identify the real-world application of...". Provide concrete instances.',

    'comparison': 'Ask "How does X differ from Y?", "What distinguishes X from Y?", "Compare X and Y in terms of...". Highlight similarities and differences.',

    'scenario': 'Present a realistic situation and ask "What should you do?", "Which action is most appropriate?", "How would you address this?". Require application of knowledge.',

    'implementation': 'Ask "What steps are required to...?", "How do you configure...?", "What is the correct procedure for...?". Focus on setup and operational steps.',

    'troubleshooting': 'Present a problem and ask "What could be the cause?", "Why is this failing?", "How would you diagnose...?". Require analytical reasoning.'
  }

  return guidance[dimension] || 'Generate a question focused on this aspect of the topic.'
}

/**
 * Generate a question on-demand using RAG + Grok
 */
async function generateQuestionOnDemand(
  supabase: any,
  userId: string,
  chapterId: string,
  topicId: string,
  topicName: string,
  topicFullName: string,
  bloomLevel: number,
  dimension: string,
  questionFormat: QuestionFormat,
  dimensionDescriptionMap?: { [key: string]: string }
): Promise<any> {
  console.log(`Generating question for: ${topicFullName} (${topicId}) at Bloom ${bloomLevel}, dimension: ${dimension}, format: ${questionFormat}`)

  // Use provided map or fall back to defaults
  const dimDescriptions = dimensionDescriptionMap || KNOWLEDGE_DIMENSIONS

  // Step 1: Generate embedding for the FULL hierarchical topic name
  // This provides better context for RAG search
  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: topicFullName,  // Use full hierarchical name for better context
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
    throw new Error(`No content found for topic "${topicName}". Please upload learning materials first.`)
  }

  // Step 3: Prepare context
  const context = chunks.map((chunk: any, idx: number) =>
    `[Chunk ${idx + 1}]\n${chunk.content}`
  ).join('\n\n---\n\n')

  // Step 4: Generate question with Grok
  const bloomDescription = BLOOM_LEVELS[bloomLevel]
  const dimensionDescription = dimDescriptions[dimension] || dimension

  // Format-specific instructions (same as in /api/questions/generate)
  const FORMAT_INSTRUCTIONS: Record<string, string> = {
    mcq_single: `QUESTION FORMAT: Multiple Choice Question (Single Select)
- Provide 4 answer options (A, B, C, D)
- EXACTLY ONE correct answer
- Three plausible distractors`,

    mcq_multi: `QUESTION FORMAT: Multiple Choice Question (Multi Select)
- Provide 4-6 answer options (A, B, C, D, E, F)
- MULTIPLE correct answers (typically 2-3)
- Remaining options are plausible distractors
- Indicate in correct_answer field as array: ["B", "D"] or comma-separated: "B,D"
- This tests deeper understanding - students must identify ALL correct options`,

    true_false: `QUESTION FORMAT: True/False
- Provide exactly 2 options: {"A": "True", "B": "False"}
- The statement should be clearly true or false based on the context
- Avoid ambiguous wording`,

    fill_blank: `QUESTION FORMAT: Fill in the Blank
- Create a statement with a missing key term or concept (use _____)
- Provide 4 possible answers to complete the blank
- The correct answer should fit naturally in the sentence`,

    matching: `QUESTION FORMAT: Matching
- Present the question as "Match the following:"
- Provide 4 items that need to be matched
- Options should be the correct matches labeled A, B, C, D
- Indicate all correct pairings in the explanation`,

    open_ended: `QUESTION FORMAT: Open-ended (with rubric)
- Ask for explanation, analysis, or opinion
- Don't provide multiple choice options
- Instead, provide a detailed rubric with key points that should be included
- Explain what makes a good vs. excellent answer
- Format as: {"question_text": "...", "rubric": {...}, "sample_answer": "...", "key_points": [...]}`
  }

  const formatInstructions = FORMAT_INSTRUCTIONS[questionFormat] || FORMAT_INSTRUCTIONS.mcq_single

  const prompt = `You are an expert educator creating comprehensive assessment questions.

BLOOM'S TAXONOMY LEVEL: ${bloomLevel} - ${bloomDescription}
TOPIC: ${topicFullName}
KNOWLEDGE DIMENSION: ${dimension}
DIMENSION FOCUS: ${dimensionDescription}

${formatInstructions}

CONTEXT (from course materials):
${context}

TASK: Generate 1 question at Bloom's level ${bloomLevel} about "${topicFullName}", specifically focusing on the "${dimension}" dimension, using the ${questionFormat} format.

REQUIREMENTS:
1. Base question ONLY on the provided context
2. Match the cognitive level of Bloom's ${bloomLevel}
3. **CRITICALLY IMPORTANT**: The question MUST focus on the ${dimension} dimension - ${dimensionDescription}
4. Follow the ${questionFormat} format instructions exactly
5. Clearly indicate the correct answer
6. Include a brief, educational explanation

DIMENSION-SPECIFIC GUIDANCE:
${getDimensionGuidance(dimension, bloomLevel)}

EXPLANATION REQUIREMENTS - FIRST PRINCIPLES APPROACH:

**CRITICAL: Format the explanation as PLAIN TEXT with line breaks, NOT as a continuous paragraph.**

**YOU MUST INSERT BLANK LINES (\\n\\n) BETWEEN EACH SECTION. DO NOT PUT ALL TEXT IN ONE PARAGRAPH.**

Use this EXACT structure with proper line breaks (note the blank lines):

Fundamental Question: [Core "why" question]
• [First basic fact]
• [Second basic fact]
• [Third basic fact]

Core characteristics:
• [Key property 1]
• [Key property 2]
• [Key property 3]

What happens if [concept fails/succeeds]:
• [Consequence 1]
• [Consequence 2]

How it works:
• [Mechanism 1]
• [Mechanism 2]

Comparison to related concepts:
• [Difference from concept A]
• [Difference from concept B]

Ultimate goal:
• [End objective]
• [How it serves the larger system]

**EXAMPLE (Use this EXACT formatting):**

Fundamental Question: Why classify data at all?
• Organizations possess different types of information
• Not all information has equal value or risk
• Different information requires different protection levels

Core characteristics of Confidential data:
• Contains sensitive content like strategies and client details
• Disclosure would cause significant organizational harm
• Limited to specific roles on a need-to-know basis

What happens if exposed:
• Financial loss through competitive disadvantage
• Reputation damage affecting client trust
• Operational disruption from leaked strategies

How it's protected:
• Access controls limit who can view it
• Encryption hides content from unauthorized viewers
• Need-to-know principle restricts distribution

Comparison to other classifications:
• More sensitive than Internal data (higher harm if leaked)
• Less critical than Restricted data (not catastrophic)
• Far more protected than Public data (no harm tolerance)

Ultimate goal:
• Preserve confidentiality (CIA triad pillar)
• Balance security controls with operational efficiency

**FORMATTING RULES (CRITICAL):**
1. Insert \\n\\n (double newline) between each section header and the next section
2. Insert \\n (single newline) between each bullet point
3. Use bullet symbol • not dashes or asterisks
4. Keep each bullet point to ONE line
5. NO markdown bold/italic within the text
6. Each section header ends with a colon
7. Maximum 3-4 bullet points per section
8. Keep total explanation under 200 words
9. NEVER use periods inside abbreviated words (write "e.g." as "for example")

**EXACT TEXT FORMAT IN JSON:**
The explanation field should contain literal \\n characters for line breaks:
"explanation": "Fundamental Question: Why...\\n• Bullet 1\\n• Bullet 2\\n\\nCore characteristics:\\n• Bullet 3\\n• Bullet 4"

**BANNED:**
- "e.g." or "i.e." - spell these out
- Parenthetical clauses - use separate bullets instead
- Run-on sentences - break into multiple bullets
- Markdown formatting inside text - plain text only

ANTI-TELLTALE QUALITY CONTROLS (CRITICAL - MUST FOLLOW):
1. **Length Requirement**: All 4 options MUST be within 10 words of each other
   - Count words in each option and ensure variance is minimal
   - If correct answer is 12 words, all options must be 10-14 words

2. **Plausibility Requirement**: Wrong answers must be:
   - From the SAME security domain as the correct answer
   - Technically accurate statements that are "close but not quite right" for THIS specific question
   - Things that could reasonably confuse someone who partially understands the topic

3. **Keyword Distribution**:
   - If question mentions "alerting", ALL options should relate to alerting/detection/monitoring
   - Don't make only the correct answer use action words (automated, real-time, etc.)
   - Distribute technical terms evenly across all options

4. **Difficulty Balance**:
   - Correct answer should NOT be the only option that directly addresses the question
   - Wrong answers should address the question but be subtly incorrect (wrong scope, wrong timing, wrong mechanism)
   - Avoid "obviously wrong" distractors like completely unrelated concepts

5. **Format Consistency**:
   - All options must use similar grammatical structure
   - All should start with similar parts of speech (all nouns, all verbs, etc.)
   - Avoid making correct answer the only complete/detailed one

EXAMPLE OF GOOD VS BAD OPTIONS:

❌ BAD (too easy to identify correct answer):
Q: What best describes alerting in security operations?
A. The passive collection of logs from network devices and endpoints [different domain, obviously wrong]
B. Automated detection of anomalies with real-time notifications to teams [ONLY ONE with action words, obviously correct]
C. Manual auditing of compliance standards across applications [different domain]
D. Storage and retention of historical event data for investigations [different domain]

✅ GOOD (all plausible, similar structure, same domain):
Q: What best describes alerting in security operations?
A. Continuous monitoring with threshold-based notifications triggered by predefined rules [similar length, same domain]
B. Real-time correlation of security events with automated escalation to response teams [CORRECT - but not obvious]
C. Periodic scanning of system logs with batch notifications sent to security analysts [plausible but wrong timing]
D. Event-driven detection with manual review before notifying incident response personnel [plausible but wrong automation level]

All options now:
- Have similar length (12-15 words each)
- Use similar structure (adjective + noun + with + details)
- Relate to detection/monitoring/alerting
- Include technical terms evenly distributed
- Require actual knowledge to distinguish

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

  // Store question for spaced repetition with topic_id
  // We already have the correct topic_id from the RL arm selection (handles hierarchy correctly)
  console.log(`Storing question for topic_id: ${topicId}`)

  // Find related topics using hybrid embeddings + hierarchy approach
  const { findRelatedTopics, getRelatedTopicIds } = await import('@/lib/rl/related-topics')
  const relatedTopics = await findRelatedTopics(topicId, 4) // Get top 4 related topics
  const relatedTopicIds = getRelatedTopicIds(relatedTopics)

  console.log(`Found ${relatedTopics.length} related topics:`, relatedTopics.map(t => t.name).join(', '))

  const questionToInsert = {
    user_id: userId,  // Track which user generated this question
    question_text: q.question_text,
    question_type: 'mcq',
    question_format: questionFormat,  // Track which format was used
    options: q.options,
    correct_answer: q.correct_answer,
    explanation: q.explanation,
    bloom_level: bloomLevel,
    topic: topicName,  // Store topic name for reference
    topic_id: topicId,  // ✅ Use topic_id from RL arm selection (handles hierarchy correctly)
    core_topics: [topicId],  // ✅ New: Primary topic in array format
    related_topics: relatedTopicIds,  // ✅ New: Auto-discovered related topics
    dimension,  // Track which knowledge dimension this question tests
    difficulty_estimated: bloomLevel >= 4 ? 'hard' : bloomLevel >= 3 ? 'medium' : 'easy',
    source_type: 'ai_generated_realtime',
  }

  const { data: insertedQuestion, error: insertError } = await supabase
    .from('questions')
    .insert([questionToInsert])
    .select()
    .single()

  if (insertError) {
    console.error('Error storing question for spaced repetition:', insertError)
    console.error('Question data that failed to insert:', JSON.stringify(questionToInsert, null, 2))
    // Throw error instead of returning ephemeral - helps identify storage issues
    throw new Error(`Failed to store question: ${insertError.message} (code: ${insertError.code})`)
  }

  console.log(`Successfully generated and stored question for spaced repetition`)
  return insertedQuestion
}

/**
 * POST /api/rl/next-question
 *
 * Get next question using Thompson Sampling RL with Spaced Repetition
 *
 * Algorithm:
 * 1. RL agent selects optimal (topic, bloom_level)
 * 2. Check for existing questions ready for spaced repetition review
 * 3. 30% chance to review an existing question (memory consolidation)
 * 4. 70% chance to generate a new question (learning breadth)
 * 5. Store new questions for future spaced repetition
 *
 * Spaced repetition intervals: 1 day, 3 days, 7 days, 14 days, 30 days
 *
 * Body:
 * - session_id: UUID of the learning session
 *
 * Returns:
 * - question: Question object (review or newly generated)
 * - question_metadata: Correct answer and explanation
 * - session_progress: Current progress in session
 * - arm_selected: Which (topic, bloom_level) was chosen by RL agent
 * - is_review: Boolean indicating if this is a review question
 * - spaced_repetition: Boolean indicating if spaced repetition was applied
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

    // ==============================================================
    // ADAPTIVE SPACED REPETITION: 80-20 SPLIT
    // ==============================================================
    // 80% of questions: Thompson Sampling decides (optimal learning)
    // 20% of questions: Force review of overdue topics (safety net)
    // Intervals adapt based on CURRENT mastery (not snapshot)
    // ==============================================================

    let selectedArm: any = null
    let selectionMethod: 'thompson_sampling' | 'forced_spacing' = 'thompson_sampling'
    let spacingReason: string | null = null

    // Step 1: Check for overdue topics based on CURRENT mastery
    const { data: masteryData } = await supabase
      .from('user_topic_mastery')
      .select('topic_id, bloom_level, mastery_score, last_practiced_at, topics(name, full_name)')
      .eq('user_id', user.id)
      .not('last_practiced_at', 'is', null)

    const now = new Date()
    const overdueTopics: Array<{
      topicId: string
      topicName: string
      topicFullName: string
      bloomLevel: number
      daysSince: number
      optimalInterval: number
      mastery: number
    }> = []

    if (masteryData && masteryData.length > 0) {
      for (const m of masteryData) {
        const lastPracticed = new Date(m.last_practiced_at)
        const daysSince = Math.floor((now.getTime() - lastPracticed.getTime()) / (1000 * 60 * 60 * 24))

        // Calculate optimal interval based on CURRENT mastery
        let optimalInterval = 1
        if (m.mastery_score >= 80) optimalInterval = 14
        else if (m.mastery_score >= 60) optimalInterval = 7
        else if (m.mastery_score >= 40) optimalInterval = 3
        else optimalInterval = 1

        // Check if overdue
        if (daysSince >= optimalInterval) {
          // Handle topics relation (array or single object)
          const topic = Array.isArray(m.topics) ? m.topics[0] : m.topics
          overdueTopics.push({
            topicId: m.topic_id,
            topicName: topic?.name || 'Unknown',
            topicFullName: topic?.full_name || topic?.name || 'Unknown',
            bloomLevel: m.bloom_level,
            daysSince,
            optimalInterval,
            mastery: m.mastery_score
          })
        }
      }
    }

    console.log(`[SPACED REPETITION] Found ${overdueTopics.length} overdue topics`)

    // Step 2: 80-20 decision
    const forceSpacedRepetition = Math.random() < 0.20

    if (forceSpacedRepetition && overdueTopics.length > 0) {
      // Force spaced repetition: Select most overdue topic
      selectionMethod = 'forced_spacing'

      // Sort by days overdue (daysSince - optimalInterval)
      overdueTopics.sort((a, b) => {
        const aOverdue = a.daysSince - a.optimalInterval
        const bOverdue = b.daysSince - b.optimalInterval
        return bOverdue - aOverdue // Most overdue first
      })

      const mostOverdue = overdueTopics[0]
      selectedArm = {
        topicId: mostOverdue.topicId,
        topicName: mostOverdue.topicName,
        topicFullName: mostOverdue.topicFullName,
        bloomLevel: mostOverdue.bloomLevel
      }

      spacingReason = `Overdue by ${mostOverdue.daysSince - mostOverdue.optimalInterval} days (${mostOverdue.daysSince} days since last practice, optimal interval: ${mostOverdue.optimalInterval} days based on ${mostOverdue.mastery}% mastery)`

      console.log('[FORCED SPACING]', {
        topicName: selectedArm.topicName,
        bloomLevel: selectedArm.bloomLevel,
        reason: spacingReason
      })
    } else {
      // Use Thompson Sampling to select next arm (topic, bloom_level)
      selectedArm = await selectArmThompsonSampling(user.id, session.chapter_id)
      selectionMethod = 'thompson_sampling'

      if (forceSpacedRepetition && overdueTopics.length === 0) {
        spacingReason = 'Forced spacing triggered but no overdue topics found, falling back to Thompson Sampling'
      }
    }

    if (!selectedArm) {
      return NextResponse.json(
        { error: 'No available questions for this chapter. Upload content and generate questions first.' },
        { status: 404 }
      )
    }

    console.log(`[${selectionMethod === 'forced_spacing' ? 'FORCED SPACING' : 'THOMPSON SAMPLING'}] Selected arm:`, {
      topicId: selectedArm.topicId,
      topicName: selectedArm.topicName,
      bloomLevel: selectedArm.bloomLevel,
      selectionMethod,
      spacingReason
    })

    // Step 1: Check for existing questions for spaced repetition
    const { data: existingQuestions } = await supabase
      .from('questions')
      .select('*')
      .eq('topic_id', selectedArm.topicId)
      .eq('bloom_level', selectedArm.bloomLevel)

    // Step 2: Check which questions user has answered and when
    const { data: userResponses } = await supabase
      .from('user_responses')
      .select('question_id, answered_at')
      .eq('user_id', user.id)
      .in('question_id', existingQuestions?.map(q => q.id) || [])
      .order('answered_at', { ascending: false })

    // Build map of question_id -> last answered time and count
    const responseMap = new Map<string, { lastAnswered: Date, count: number }>()
    userResponses?.forEach(r => {
      if (!responseMap.has(r.question_id)) {
        const count = userResponses.filter(ur => ur.question_id === r.question_id).length
        responseMap.set(r.question_id, {
          lastAnswered: new Date(r.answered_at),
          count
        })
      }
    })

    // Step 3: Find questions ready for spaced repetition
    // (Reusing 'now' from adaptive spaced repetition check above)
    const readyForReview = existingQuestions?.filter(q => {
      const response = responseMap.get(q.id)
      if (!response) return true // Never answered - ready to ask

      // Spaced repetition intervals (in days): 1, 3, 7, 14, 30
      const intervals = [1, 3, 7, 14, 30]
      const repetitionNumber = Math.min(response.count, intervals.length) - 1
      const interval = intervals[repetitionNumber] || 30

      const daysSinceLastAnswer = (now.getTime() - response.lastAnswered.getTime()) / (1000 * 60 * 60 * 24)
      return daysSinceLastAnswer >= interval
    }) || []

    let selectedQuestion: any = null
    let isReview = false

    // Step 4: Decide whether to review or generate new
    if (readyForReview.length > 0 && Math.random() < 0.3) {
      // 30% chance to review an existing question (spaced repetition)
      selectedQuestion = readyForReview[Math.floor(Math.random() * readyForReview.length)]
      isReview = true
      console.log(`Selected existing question for spaced repetition review`)
    } else {
      // 70% chance to generate a new question (or if no questions ready for review)
      console.log(`Generating new question for ${selectedArm.topicName} at Bloom ${selectedArm.bloomLevel}`)

      // Get subject ID from chapter
      const { data: chapterData } = await supabase
        .from('chapters')
        .select('subject_id')
        .eq('id', session.chapter_id)
        .single()

      // Get available dimensions for this subject
      const { data: subjectDimensions } = await supabase.rpc('get_subject_dimensions', {
        p_subject_id: chapterData?.subject_id
      })

      // Build dimension descriptions map from subject config
      const subjectDimensionMap: { [key: string]: string } = {}
      if (subjectDimensions && subjectDimensions.length > 0) {
        subjectDimensions.forEach((d: any) => {
          subjectDimensionMap[d.dimension_key] = d.dimension_description
        })
      } else {
        // Fallback to hardcoded defaults if subject has no custom dimensions
        Object.assign(subjectDimensionMap, KNOWLEDGE_DIMENSIONS)
      }

      // Determine which knowledge dimension to focus on for comprehensive mastery
      // Note: Using topicId for lookup now
      const { data: dimensionResult } = await supabase.rpc('get_least_tested_dimension_by_id', {
        p_user_id: user.id,
        p_chapter_id: session.chapter_id,
        p_topic_id: selectedArm.topicId,
        p_bloom_level: selectedArm.bloomLevel
      })

      const targetDimension = dimensionResult || 'definition'  // Default to definition dimension
      console.log(`Target dimension: ${targetDimension}`)

      // Select question format based on Bloom level
      const availableFormats = getFormatsByBloomLevel(selectedArm.bloomLevel)
      const selectedFormat = availableFormats[Math.floor(Math.random() * availableFormats.length)] as QuestionFormat
      console.log(`Selected format: ${selectedFormat} (available for Bloom ${selectedArm.bloomLevel}: ${availableFormats.join(', ')})`)

      try {
        selectedQuestion = await generateQuestionOnDemand(
          supabase,
          user.id,  // Pass user ID for question ownership
          session.chapter_id,
          selectedArm.topicId,  // Pass topic ID (handles hierarchy correctly)
          selectedArm.topicName,  // Leaf topic name for storage
          selectedArm.topicFullName,  // Full hierarchical name for RAG and context
          selectedArm.bloomLevel,
          targetDimension,
          selectedFormat,  // Pass selected format
          subjectDimensionMap
        )

        if (!selectedQuestion) {
          return NextResponse.json(
            { error: `Failed to generate question for topic "${selectedArm.topicName}" at Bloom level ${selectedArm.bloomLevel}` },
            { status: 500 }
          )
        }
      } catch (genError) {
        console.error('Error generating question:', genError)
        return NextResponse.json(
          { error: `Failed to generate question: ${genError instanceof Error ? genError.message : 'Unknown error'}` },
          { status: 500 }
        )
      }
    }

    // Return the question (without correct answer for display)
    const { correct_answer, explanation, ...questionWithoutAnswer } = selectedQuestion

    // Log arm selection decision for transparency
    const decisionContext = (selectedArm as any)._decisionContext

    // Build reasoning string
    let finalReasoning = ''
    if (selectionMethod === 'forced_spacing') {
      finalReasoning = `[FORCED SPACING] ${spacingReason}`
    } else if (decisionContext) {
      finalReasoning = decisionContext.reasoning
    }

    // Always log the selection (even for forced spacing)
    await logArmSelection({
      userId: user.id,
      sessionId: session.id,
      chapterId: session.chapter_id,
      allArms: decisionContext?.allSamples || [],
      selectedArm: decisionContext?.selectedSample || {
        topicId: selectedArm.topicId,
        topicName: selectedArm.topicName,
        bloomLevel: selectedArm.bloomLevel,
        sample: null
      },
      reasoning: finalReasoning,
      questionId: selectedQuestion.id,
      topicId: selectedArm.topicId,
      bloomLevel: selectedArm.bloomLevel,
      selectionMethod
    })

    return NextResponse.json({
      question: questionWithoutAnswer,
      question_metadata: {
        correct_answer,
        explanation,
        question_id: selectedQuestion.id,
        bloom_level: selectedQuestion.bloom_level,
        topic: selectedQuestion.topic
      },
      session_progress: {
        session_id: session.id,
        questions_answered: session.questions_answered,
        total_questions: session.total_questions,
        current_score: session.score
      },
      arm_selected: {
        topic_id: selectedArm.topicId,
        topic_name: selectedArm.topicName,
        bloom_level: selectedArm.bloomLevel
      },
      is_review: isReview,
      spaced_repetition: isReview,
      // TRANSPARENCY: Show how question was selected
      selection_method: selectionMethod,
      spacing_reason: spacingReason,
      // Include decision context in response for frontend display
      decision_context: decisionContext ? {
        reasoning: finalReasoning,
        alternatives_count: decisionContext.allSamples.length
      } : (selectionMethod === 'forced_spacing' ? {
        reasoning: finalReasoning,
        alternatives_count: 0
      } : null)
    })
  } catch (error) {
    console.error('Error in POST /api/rl/next-question:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
