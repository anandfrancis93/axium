/**
 * Generate Comprehensive Questions for a Single Topic
 * 
 * Generates questions that naturally cover ALL aspects of a topic description
 * without any artificial limit on question count.
 * 
 * WORKFLOW:
 * 1. Run without --import to generate and save to generated-questions.txt
 * 2. Review the questions in the txt file
 * 3. Use import-questions-from-txt.ts to import approved questions to database
 * 
 * Usage: npx tsx scripts/generate-topic-questions.ts "Topic Name"
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

interface GeneratedQuestion {
    question_text: string
    question_format: 'mcq_single' | 'true_false' | 'fill_blank'
    options?: string[]
    correct_answer: string
    explanation: string | Record<string, string>
    bloom_level: number
    cognitive_dimension?: string
}

async function generateQuestionsForTopic(topicName: string, description: string): Promise<GeneratedQuestion[]> {
    const prompt = `You are a cybersecurity education expert. Generate COMPREHENSIVE questions for the following topic.

TOPIC: ${topicName}

DESCRIPTION:
${description}

CRITICAL INSTRUCTIONS:
1. Generate questions that COMPREHENSIVELY cover EVERY concept, term, relationship, and nuance in the description
2. DO NOT limit yourself - generate as many questions as needed to fully cover the topic
3. Each unique concept, relationship, or fact should have at least one question
4. Cover the topic from MULTIPLE ANGLES:
   - Definitions and terminology
   - Relationships between components
   - How things work (processes/flows)
   - Why things are done a certain way
   - Comparisons and contrasts
   - Real-world applications and scenarios
   - Edge cases and exceptions
   - Security implications

QUESTION FORMAT MIX:
- 50% multiple choice (mcq_single) - MUST have exactly 4 options
- 30% true/false - correct_answer must be exactly "True" or "False"
- 20% fill in the blank (fill_blank) - MUST have exactly 4 options

BLOOM'S TAXONOMY DISTRIBUTION:
- Level 1 (Remember): ~20% - Recall basic facts and definitions
- Level 2 (Understand): ~25% - Explain concepts and relationships
- Level 3 (Apply): ~20% - Use knowledge in new situations
- Level 4 (Analyze): ~20% - Break down and examine relationships
- Level 5 (Evaluate): ~10% - Make judgments and assess
- Level 6 (Create): ~5% - Synthesize and design solutions

COGNITIVE DIMENSIONS (include one per question):
- factual: Basic facts and terminology
- conceptual: Understanding of categories, principles, relationships
- procedural: How-to knowledge, processes, methods
- metacognitive: Strategic knowledge, self-awareness

FOR TRUE/FALSE:
- Aim for 50% True, 50% False distribution
- Make statements specific and unambiguous
- False statements should contain subtle but clear errors

FOR EXPLANATIONS:
- For mcq_single and fill_blank: Provide explanations as an object where each key is the option letter (A, B, C, D) and value explains why that option is correct/incorrect
- For true_false: Provide a simple string explanation

OUTPUT FORMAT (JSON array):
[
  {
    "question_text": "What is the primary purpose of X?",
    "question_format": "mcq_single",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": "Option A",
    "explanation": {
      "A": "Correct. Explanation of why A is correct...",
      "B": "Incorrect. Explanation of why B is wrong...",
      "C": "Incorrect. Explanation of why C is wrong...",
      "D": "Incorrect. Explanation of why D is wrong..."
    },
    "bloom_level": 2,
    "cognitive_dimension": "conceptual"
  },
  {
    "question_text": "The supplicant is the device requesting access to the network.",
    "question_format": "true_false",
    "correct_answer": "True",
    "explanation": "The supplicant is indeed the device (or software on the device) that requests access...",
    "bloom_level": 1,
    "cognitive_dimension": "factual"
  }
]

IMPORTANT: 
- Return ONLY valid JSON, no markdown code blocks
- Generate AT LEAST 25-40 questions to thoroughly cover the topic
- Quality over quantity, but don't skip any important concepts`

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
        const result = await model.generateContent(prompt)
        const responseText = result.response.text()

        let cleanJson = responseText
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim()

        const questions: GeneratedQuestion[] = JSON.parse(cleanJson)
        return questions
    } catch (error) {
        console.error(`Error generating questions:`, error)
        return []
    }
}

async function main() {
    const args = process.argv.slice(2)
    const topicName = args.find(a => !a.startsWith('--'))

    if (!topicName) {
        console.error('Usage: npx tsx scripts/generate-topic-questions.ts "Topic Name"')
        console.error('')
        console.error('This script generates questions and saves them to generated-questions.txt.')
        console.error('Review the questions, then use import-questions-from-txt.ts to import to database.')
        process.exit(1)
    }

    console.log(`\n🔍 Fetching topic: ${topicName}\n`)

    // Get topic from database
    const { data: topic, error } = await supabase
        .from('topics')
        .select('id, name, description')
        .eq('name', topicName)
        .single()

    if (error || !topic) {
        console.error('❌ Topic not found:', topicName)
        process.exit(1)
    }

    const wordCount = topic.description?.split(/\s+/).length || 0
    console.log(`📝 Description: ${wordCount} words`)
    console.log(`\n--- Description Preview ---`)
    console.log(topic.description?.substring(0, 500) + '...')
    console.log(`---\n`)

    console.log('🤖 Generating comprehensive questions (this may take a moment)...\n')

    const questions = await generateQuestionsForTopic(topic.name, topic.description || '')

    if (questions.length === 0) {
        console.error('❌ No questions generated')
        process.exit(1)
    }

    console.log(`✅ Generated ${questions.length} questions\n`)

    // Show distribution
    const formats: Record<string, number> = {}
    const bloomLevels: Record<number, number> = {}

    questions.forEach(q => {
        formats[q.question_format] = (formats[q.question_format] || 0) + 1
        bloomLevels[q.bloom_level] = (bloomLevels[q.bloom_level] || 0) + 1
    })

    console.log('📊 Question Distribution:')
    console.log('   Formats:', formats)
    console.log('   Bloom Levels:', bloomLevels)

    // Build output for text file
    const outputLines: string[] = [
        '',
        '============================================================',
        topic.name,
        '============================================================',
        ''
    ]

    questions.forEach((q, i) => {
        outputLines.push(`${i + 1}. [${q.question_format}] [Bloom ${q.bloom_level}]`)
        outputLines.push(`   Q: ${q.question_text}`)
        if (q.options) {
            outputLines.push(`   Options: ${q.options.join(' | ')}`)
        }
        outputLines.push(`   Answer: ${q.correct_answer}`)
        outputLines.push('')
    })

    // Overwrite the file with just this topic (one topic at a time for review)
    const filePath = path.resolve(process.cwd(), 'generated-questions.txt')
    fs.writeFileSync(filePath, outputLines.join('\n'), 'utf-8')
    console.log(`\n📄 Saved to generated-questions.txt (overwrites previous content)`)

    console.log(`\n✅ Done! ${questions.length} questions generated for "${topic.name}"`)
    console.log(`\n📋 Next steps:`)
    console.log(`   1. Review the questions in generated-questions.txt`)
    console.log(`   2. Make any necessary edits`)
    console.log(`   3. Run: npx tsx scripts/import-questions-from-txt.ts --topic="${topic.name}" --force`)
}

main().catch(console.error)
