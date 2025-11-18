import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
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

// 5W1H Cognitive Dimensions - Universal framework for comprehensive topic coverage
const COGNITIVE_DIMENSIONS: Record<string, string> = {
  WHAT: `COGNITIVE DIMENSION: WHAT (Definition, Identification, Components)
- Focus on "What is it?", "What are its parts?", "What defines it?"
- Test understanding of definitions, core concepts, components, and classifications
- Applies to ALL Bloom levels (complexity adjusts by level)
- Examples:
  * Bloom 1: "What is [topic]?"
  * Bloom 3: "What components make up [topic]?"
  * Bloom 5: "What criteria define an effective [topic]?"`,

  WHY: `COGNITIVE DIMENSION: WHY (Purpose, Rationale, Motivation)
- Focus on "Why is it used?", "Why does it matter?", "What problem does it solve?"
- Test understanding of purpose, rationale, significance, and value
- Applies to ALL Bloom levels (complexity adjusts by level)
- Examples:
  * Bloom 1: "Why is [topic] important?"
  * Bloom 3: "Why would you choose [topic] over alternatives?"
  * Bloom 5: "Why might [topic] fail to achieve its purpose?"`,

  WHEN: `COGNITIVE DIMENSION: WHEN (Context, Timing, Lifecycle)
- Focus on "When is it used?", "When does it occur?", "What is its lifecycle?"
- Test understanding of temporal context, appropriate timing, and lifecycle stages
- Applies to ALL Bloom levels (complexity adjusts by level)
- Examples:
  * Bloom 1: "When is [topic] typically used?"
  * Bloom 3: "When should [topic] be applied in this scenario?"
  * Bloom 5: "When would [topic] be inappropriate?"`,

  WHERE: `COGNITIVE DIMENSION: WHERE (Location, Scope, Boundaries)
- Focus on "Where is it applied?", "Where does it fit?", "What is its scope?"
- Test understanding of context, placement, boundaries, and applicability
- Applies to ALL Bloom levels (complexity adjusts by level)
- Examples:
  * Bloom 1: "Where in the system is [topic] implemented?"
  * Bloom 3: "Where would [topic] provide the most value?"
  * Bloom 5: "Where are the boundaries of [topic]'s effectiveness?"`,

  HOW: `COGNITIVE DIMENSION: HOW (Mechanism, Process, Methodology)
- Focus on "How does it work?", "How is it implemented?", "What are the steps?"
- Test understanding of mechanisms, processes, procedures, and implementation
- Applies to ALL Bloom levels (complexity adjusts by level)
- Examples:
  * Bloom 1: "How does [topic] function?"
  * Bloom 3: "How would you implement [topic]?"
  * Bloom 6: "How would you design a better [topic]?"`,

  CHARACTERISTICS: `COGNITIVE DIMENSION: CHARACTERISTICS (Properties, Attributes, Relationships)
- Focus on "What are its properties?", "How does it relate to others?", "What are its attributes?"
- Test understanding of features, traits, relationships, and distinguishing factors
- Applies to ALL Bloom levels (complexity adjusts by level)
- Examples:
  * Bloom 1: "What are the key characteristics of [topic]?"
  * Bloom 4: "How do the characteristics of [topic] compare to alternatives?"
  * Bloom 5: "Which characteristic of [topic] is most critical?"`,
}

// Question format instructions
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
- Provide exactly 2 options: "True" and "False"
- The statement should be clearly true or false based on the context
- Avoid ambiguous wording

CRITICAL BALANCE REQUIREMENT:
- RANDOMLY decide if the answer should be True or False - DO NOT default to True
- If generating multiple questions, ensure roughly 50/50 split between True and False answers
- Track your answers: aim for equal distribution (e.g., if you've generated 3 True, next should be False)

HOW TO CREATE FALSE STATEMENTS:
- Take a true fact from the context and subtly alter ONE key element (e.g., swap a term, reverse a relationship, change a number)
- Make it plausible but incorrect (not obviously absurd)
- Examples of good alterations:
  * "Encryption ensures availability" (changed CIA triad component)
  * "Firewalls operate at Layer 2" (changed OSI layer)
  * "AES uses asymmetric encryption" (changed encryption type)
- Avoid: completely made-up terms, nonsensical statements, or mixing unrelated domains`,

  fill_blank: `QUESTION FORMAT: Fill in the Blank
- Create a statement with a missing key term or concept (use _____)
- Provide 4 possible answers to complete the blank
- The correct answer should fit naturally in the sentence`,

  matching: `QUESTION FORMAT: Matching
- Present the question as "Match the following:"
- Provide 4 items that need to be matched
- Options should be the correct matches labeled A, B, C, D
- Indicate all correct pairings in the explanation`,

  code: `QUESTION FORMAT: Code Writing
- Ask student to write or complete code
- Provide 4 different code solutions (some correct, some with subtle bugs)
- Test understanding of implementation, not just theory
- Include working code as the correct answer`,

  code_trace: `QUESTION FORMAT: Code Trace
- Provide a code snippet
- Ask what the output or result will be
- Provide 4 possible outputs/results
- Test ability to trace execution mentally`,

  code_debug: `QUESTION FORMAT: Code Debug
- Provide code with a bug or error
- Ask what the bug is or how to fix it
- Provide 4 possible fixes (one correct, three that seem plausible but wrong)
- Test ability to identify and fix issues`,

  diagram: `QUESTION FORMAT: Diagram-based
- Describe a scenario that would typically be shown as a diagram
- Ask about relationships, flow, or structure
- Provide 4 possible answers about the diagram/visual concept
- Test visual-spatial understanding`,

  open_ended: `QUESTION FORMAT: Open-ended (with rubric)
- Ask for explanation, analysis, or opinion
- Don't provide multiple choice options
- Instead, provide a detailed rubric with key points that should be included
- Explain what makes a good vs. excellent answer
- Format as: {"question_text": "...", "rubric": {...}, "sample_answer": "...", "key_points": [...]}`
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
    const {
      chapter_id,
      topic,
      topic_id,
      bloom_level,
      question_format = 'mcq_single',
      cognitive_dimension = 'WHAT',  // Default to WHAT dimension
      num_questions = 1,
      useGraphRAG = false  // Flag to use GraphRAG instead of vector search
    } = body

    // Validate inputs
    if (!chapter_id || (!topic && !topic_id)) {
      return NextResponse.json(
        { error: 'chapter_id and either topic or topic_id are required' },
        { status: 400 }
      )
    }

    // Validate cognitive dimension
    if (cognitive_dimension && !COGNITIVE_DIMENSIONS[cognitive_dimension]) {
      return NextResponse.json(
        { error: `Invalid cognitive_dimension. Must be one of: ${Object.keys(COGNITIVE_DIMENSIONS).join(', ')}` },
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

    // If topic_id is provided, get the full hierarchical path
    let topicName = topic
    let topicFullName = topic

    if (topic_id) {
      const { data: topicData, error: topicError } = await supabase
        .from('topics')
        .select('name, full_name')
        .eq('id', topic_id)
        .single()

      if (topicError || !topicData) {
        return NextResponse.json(
          { error: 'Topic not found' },
          { status: 404 }
        )
      }

      topicName = topicData.name
      topicFullName = topicData.full_name
    }

    const formatInstructions = FORMAT_INSTRUCTIONS[question_format] || FORMAT_INSTRUCTIONS.mcq_single



    // Step 1 & 2: Context Retrieval (Vector RAG or GraphRAG)
    let context = ''
    let chunksUsed = 0

    if (useGraphRAG) {
      // GraphRAG: Query knowledge graph for entities and relationships

      const { getGraphContextForQuestions } = await import('@/lib/graphrag/question-context')

      try {
        const graphContext = await getGraphContextForQuestions(chapter_id, 30)
        context = graphContext.contextText
        chunksUsed = graphContext.entities.length + graphContext.relationships.length

      } catch (error) {
        console.error('Error querying knowledge graph:', error)
        return NextResponse.json(
          { error: 'Failed to query knowledge graph: ' + (error as Error).message },
          { status: 500 }
        )
      }

      if (!context || chunksUsed === 0) {
        return NextResponse.json(
          { error: `No graph data found for this chapter. Make sure you've run indexing first.` },
          { status: 404 }
        )
      }
    } else {
      // Vector RAG: Generate embedding and search chunks

      const embeddingStartTime = Date.now()
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: topicFullName,
      })
      const topicEmbedding = embeddingResponse.data[0].embedding


      const embeddingString = `[${topicEmbedding.join(',')}]`

      const { data: chunks, error: searchError } = await supabase.rpc(
        'match_knowledge_chunks',
        {
          query_embedding: embeddingString,
          match_threshold: 0.1,
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
        const { count } = await supabase
          .from('knowledge_chunks')
          .select('*', { count: 'exact', head: true })
          .eq('chapter_id', chapter_id)

        return NextResponse.json(
          {
            error: `No relevant content found for topic "${topicFullName}". Found ${count || 0} total chunks in this chapter.`,
            debug: { chapter_id, topic: topicFullName, total_chunks: count }
          },
          { status: 404 }
        )
      }



      // Build context from chunks
      context = chunks.map((chunk: any) => chunk.content).join('\n\n---\n\n')
      chunksUsed = chunks.length
    }

    // Step 3: Generate questions using AI

    const bloomDescription = BLOOM_LEVELS[bloomLevelNum as keyof typeof BLOOM_LEVELS]

    const dimensionInstructions = COGNITIVE_DIMENSIONS[cognitive_dimension]

    const prompt = `You are an expert educator creating assessment questions for students studying cybersecurity.

BLOOM'S TAXONOMY LEVEL: ${bloomLevelNum} - ${bloomDescription}

TOPIC: ${topicName}
FULL CONTEXT PATH: ${topicFullName}

${formatInstructions}

${dimensionInstructions}

CONTEXT (from course materials):
${context}

TASK: Generate ${num_questions} question(s) at Bloom's level ${bloomLevelNum} about "${topicName}" focusing on the ${cognitive_dimension} cognitive dimension.

REQUIREMENTS:
1. Base questions ONLY on the provided context
2. Match the cognitive level of Bloom's ${bloomLevelNum} (${bloomDescription})
3. Focus on the ${cognitive_dimension} cognitive dimension as specified above
4. Follow the question format instructions exactly
5. Clearly indicate the correct answer
6. Include a brief, educational explanation for the correct answer

EXPLANATION REQUIREMENTS:
- Write explanations as a subject matter expert teaching the concept
- NEVER mention "context chunks", "provided context", "course materials", or similar meta-references
- Explain WHY the answer is correct using cybersecurity principles and real-world relevance
- Keep explanations concise (1-3 sentences) but informative
- Use authoritative, educational tone
- Example: "Physical security protects tangible assets like hardware and facilities from unauthorized access, theft, and environmental threats, which is essential since physical breaches can lead to data compromise."

ANTI-TELLTALE QUALITY CONTROLS (CRITICAL):
These measures prevent obvious answer giveaways and test-taking tricks:

a) Length Variation: All 4 options must have similar length (within 15 characters max difference)
   ❌ BAD: One option is a long, detailed sentence while others are short phrases
   ❌ BAD: A) "Selecting a technology that meets requirements for confidentiality..." B) "Passwords" C) "Firewalls" D) "Hardware"
   ✅ GOOD: All options are roughly equal length. If one is a full sentence, ALL must be full sentences.
   CRITICAL: If the correct answer is long, you MUST write equally long, detailed distractors.

b) Plausible Distractors: Wrong answers must be from the same domain and sound believable
   ❌ BAD: If correct answer is "Preventive (control type)", wrong answers shouldn't be "Apple" or "Database"
   ✅ GOOD: Wrong answers should be other control types like "Detective", "Corrective", "Compensating"

c) Keyword Avoidance: Don't repeat exact keywords from question in only the correct answer
   ❌ BAD: Q: "Which control TYPE prevents incidents?" A: "Preventive control TYPE"
   ✅ GOOD: Q: "Which control prevents incidents?" A: "Preventive"

d) Balanced Technical Depth: All options must be equally professional and technical
   ❌ BAD: A) "Hardware security module providing cryptographic key management" B) "A thing" C) "Something" D) "IDK"
   ✅ GOOD: All options are specific, technical terms from the same category

e) Subtle Incorrectness & Concept Proximity: Wrong answers must be related concepts that are easily confused, not just random terms from the same field.
   ❌ BAD (Too easy): Q: "What is Phishing?" Distractors: "Firewall", "Encryption", "Backup" (All security terms, but clearly not social engineering)
   ✅ GOOD (Subtly wrong): Q: "What is Phishing?" Distractors: "Vishing" (Voice phishing), "Whaling" (Targeted phishing), "Spam" (Unsolicited mail) - These are all related to social engineering/email attacks, requiring precise knowledge to distinguish.
   CRITICAL: Distractors should represent common misconceptions or related but distinct concepts (e.g., confusing Authentication with Authorization).

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

    const claudeStartTime = Date.now()
    const completion = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2000,
      temperature: 0.7,
      system: 'You are an expert educator. Always respond with valid JSON only, no markdown or other formatting.',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    // Extract JSON from Claude's response
    const responseText = completion.content[0]?.type === 'text' ? completion.content[0].text : ''
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

    // Step 5: Return questions for preview (NOT stored in database)


    // Format questions for preview (add IDs for frontend display)
    const previewQuestions = questionsData.questions.map((q: any, idx: number) => ({
      id: `preview-${Date.now()}-${idx}`,
      chapter_id,
      question_text: q.question_text,
      question_type: 'mcq',
      question_format,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      bloom_level: bloomLevelNum,
      cognitive_dimension: cognitive_dimension,
      topic: topicName,
      topic_full_name: topicFullName,
      difficulty_estimated: bloomLevelNum >= 4 ? 'hard' : bloomLevelNum >= 3 ? 'medium' : 'easy',
      source_type: 'ai_generated',
    }))

    return NextResponse.json({
      success: true,
      questions: previewQuestions,
      chunks_used: chunksUsed,
      cognitive_dimension_used: cognitive_dimension,
      note: 'Questions are for preview/testing only - not stored in database',
    })
  } catch (error) {
    console.error('Error generating questions:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
