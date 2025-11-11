import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAPICall } from '@/lib/utils/api-logger'
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

// Knowledge Dimensions - Different perspectives on learning the same concept
const KNOWLEDGE_DIMENSIONS: Record<string, string> = {
  definition: `DIMENSION: Definition/Conceptual Understanding
- Focus on "what is it?" and core terminology
- Test understanding of fundamental concepts, definitions, and classifications
- Appropriate for Bloom levels 1-2 (Remember, Understand)
- Example: "What is a firewall?" or "Define defense in depth"`,

  example: `DIMENSION: Examples and Applications
- Focus on "how is it used?" and practical instances
- Test ability to recognize or provide real-world examples
- Appropriate for Bloom levels 2-3 (Understand, Apply)
- Example: "Which scenario demonstrates a man-in-the-middle attack?" or "Give an example of physical security"`,

  comparison: `DIMENSION: Comparison and Contrast
- Focus on "how are these different/similar?" and relationships
- Test ability to distinguish between related concepts
- Appropriate for Bloom levels 2-4 (Understand, Apply, Analyze)
- Example: "How does symmetric encryption differ from asymmetric?" or "Compare preventive vs detective controls"`,

  scenario: `DIMENSION: Scenario-Based Problem Solving
- Focus on "what should you do?" in realistic situations
- Test ability to apply knowledge to novel contexts and make decisions
- Appropriate for Bloom levels 3-5 (Apply, Analyze, Evaluate)
- Example: "Your network is under DDoS attack. What steps should you take?" or "Which control best addresses this risk?"`,

  implementation: `DIMENSION: Implementation and Procedures
- Focus on "how do you implement/configure it?" and step-by-step processes
- Test knowledge of setup, configuration, and operational procedures
- Appropriate for Bloom levels 3-6 (Apply, Analyze, Evaluate, Create)
- Example: "What steps are required to configure MFA?" or "Design a secure network architecture"`,

  troubleshooting: `DIMENSION: Troubleshooting and Analysis
- Focus on "why isn't it working?" and diagnostic reasoning
- Test ability to identify problems, analyze symptoms, and propose solutions
- Appropriate for Bloom levels 4-6 (Analyze, Evaluate, Create)
- Example: "Authentication is failing. What could be the cause?" or "Diagnose this security incident"`
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
      dimension = 'definition',  // Default to definition dimension
      num_questions = 1
    } = body

    // Validate inputs
    if (!chapter_id || (!topic && !topic_id)) {
      return NextResponse.json(
        { error: 'chapter_id and either topic or topic_id are required' },
        { status: 400 }
      )
    }

    // Validate dimension
    if (dimension && !KNOWLEDGE_DIMENSIONS[dimension]) {
      return NextResponse.json(
        { error: `Invalid dimension. Must be one of: ${Object.keys(KNOWLEDGE_DIMENSIONS).join(', ')}` },
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

    console.log(`Generating ${num_questions} ${question_format} question(s) for topic: "${topicFullName}" at Bloom level ${bloomLevelNum}, dimension: ${dimension}`)

    // Step 1: Generate embedding for the topic using full hierarchical path
    console.log('Generating topic embedding using full path...')
    const embeddingStartTime = Date.now()
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: topicFullName,  // Use full hierarchical path for better matching
    })
    const topicEmbedding = embeddingResponse.data[0].embedding

    // Log embedding API call
    await logAPICall({
      userId: user.id,
      provider: 'openai',
      model: 'text-embedding-3-small',
      endpoint: '/api/questions/generate',
      inputTokens: embeddingResponse.usage?.prompt_tokens || 0,
      outputTokens: 0,
      latencyMs: Date.now() - embeddingStartTime,
      purpose: 'rag_embedding',
      metadata: { topic_id, topic, bloom_level: bloomLevelNum, dimension, question_format }
    })

    // Step 2: Vector similarity search to find relevant chunks
    console.log('Searching for relevant chunks...')

    // Format embedding as PostgreSQL vector string
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

    // Debug: Check what we got back
    console.log('Search results:', { chunks, chunksLength: chunks?.length })

    if (!chunks || chunks.length === 0) {
      // Try to get total count of chunks for this chapter
      const { count } = await supabase
        .from('knowledge_chunks')
        .select('*', { count: 'exact', head: true })
        .eq('chapter_id', chapter_id)

      return NextResponse.json(
        {
          error: `No relevant content found for topic "${topicFullName}". Found ${count || 0} total chunks in this chapter. Try a broader topic or check if embeddings are stored correctly.`,
          debug: { chapter_id, topic: topicFullName, total_chunks: count }
        },
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

    const dimensionInstructions = KNOWLEDGE_DIMENSIONS[dimension]

    const prompt = `You are an expert educator creating assessment questions for students studying cybersecurity.

BLOOM'S TAXONOMY LEVEL: ${bloomLevelNum} - ${bloomDescription}

TOPIC: ${topicName}
FULL CONTEXT PATH: ${topicFullName}

${formatInstructions}

${dimensionInstructions}

CONTEXT (from course materials):
${context}

TASK: Generate ${num_questions} question(s) at Bloom's level ${bloomLevelNum} about "${topicName}" focusing on the ${dimension} dimension.

REQUIREMENTS:
1. Base questions ONLY on the provided context
2. Match the cognitive level of Bloom's ${bloomLevelNum} (${bloomDescription})
3. Focus on the ${dimension} dimension as specified above
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

a) Length Variation: All 4 options must have similar length (within 10-20 characters of each other)
   ❌ BAD: A) "CIA" B) "Confidentiality, Integrity, and Availability ensuring data protection" C) "Security" D) "Info"
   ✅ GOOD: All options are 40-60 characters, similarly detailed

b) Plausible Distractors: Wrong answers must be from the same domain and sound believable
   ❌ BAD: If correct answer is "Preventive (control type)", wrong answers shouldn't be "Apple" or "Database"
   ✅ GOOD: Wrong answers should be other control types like "Detective", "Corrective", "Compensating"

c) Keyword Avoidance: Don't repeat exact keywords from question in only the correct answer
   ❌ BAD: Q: "Which control TYPE prevents incidents?" A: "Preventive control TYPE"
   ✅ GOOD: Q: "Which control prevents incidents?" A: "Preventive"

d) Balanced Technical Depth: All options must be equally professional and technical
   ❌ BAD: A) "Hardware security module providing cryptographic key management" B) "A thing" C) "Something" D) "IDK"
   ✅ GOOD: All options are specific, technical terms from the same category

e) Subtle Incorrectness: Wrong answers should be "close but not quite right" - not obviously absurd
   ❌ BAD: Mixing malware types with food items as distractors
   ✅ GOOD: All distractors are real security terms, just not the correct answer for this specific question

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

    const grokStartTime = Date.now()
    const completion = await grok.chat.completions.create({
      model: 'grok-4-fast-reasoning',
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

    // Log Grok API call
    await logAPICall({
      userId: user.id,
      provider: 'openai',
      model: 'grok-4-fast-reasoning',
      endpoint: '/api/questions/generate',
      inputTokens: completion.usage?.prompt_tokens || 0,
      outputTokens: completion.usage?.completion_tokens || 0,
      latencyMs: Date.now() - grokStartTime,
      purpose: 'question_generation',
      metadata: { topic_id, topic, bloom_level: bloomLevelNum, dimension, question_format, num_questions }
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

    // Step 5: Return questions for preview (NOT stored in database)
    console.log(`Successfully generated ${questionsData.questions.length} question(s) for preview (Bloom: ${bloomLevelNum}, Dimension: ${dimension})`)

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
      knowledge_dimension: dimension,
      topic: topicName,
      topic_full_name: topicFullName,
      difficulty_estimated: bloomLevelNum >= 4 ? 'hard' : bloomLevelNum >= 3 ? 'medium' : 'easy',
      source_type: 'ai_generated',
    }))

    return NextResponse.json({
      success: true,
      questions: previewQuestions,
      chunks_used: chunks.length,
      dimension_used: dimension,
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
