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
- 40% multiple choice single answer (mcq_single) - MUST have exactly 4 options, 1 correct
- 25% true/false - correct_answer must be exactly "True" or "False"
- 15% fill in the blank (fill_blank) - MUST have exactly 4 options
- 20% multiple choice multi-select (mcq_multi) - MUST have exactly 5 options, can have 2, 3, or 4 correct answers. ALWAYS include "None of the above" as the last option - if all other options are incorrect, "None of the above" is the only correct answer. Use this for Bloom levels 4-6 (Analyze, Evaluate, Create)

BLOOM'S TAXONOMY DISTRIBUTION:
- Level 1 (Remember): ~20% - Recall basic facts and definitions - use mcq_single, true_false, fill_blank
- Level 2 (Understand): ~25% - Explain concepts and relationships - use mcq_single, true_false
- Level 3 (Apply): ~20% - Use knowledge in new situations - use mcq_single, fill_blank
- Level 4 (Analyze): ~15% - Break down and examine relationships - use mcq_multi (select all that apply)
- Level 5 (Evaluate): ~15% - Make judgments and assess - use mcq_multi (select all that apply)
- Level 6 (Create): ~5% - Synthesize and design solutions - use mcq_multi (select all that apply)

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
- For mcq_single and fill_blank: Provide explanations as an object where each key is the option text (not A/B/C/D) and the value MUST start with "CORRECT:" or "INCORRECT:" followed by a clear explanation of why
- For true_false: Provide a string that explains why the statement is true or false

OUTPUT FORMAT (JSON array):
[
  {
    "question_text": "What is the primary purpose of X?",
    "question_format": "mcq_single",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": "Option A",
    "explanation": {
      "Option A": "CORRECT: This is the right answer because...",
      "Option B": "INCORRECT: This is wrong because...",
      "Option C": "INCORRECT: This is wrong because...",
      "Option D": "INCORRECT: This is wrong because..."
    },
    "bloom_level": 2,
    "cognitive_dimension": "conceptual"
  },
  {
    "question_text": "The supplicant is the device requesting access to the network.",
    "question_format": "true_false",
    "correct_answer": "True",
    "explanation": "This is true because the supplicant is indeed the device (or software on the device) that requests network access in an 802.1X implementation.",
    "bloom_level": 1,
    "cognitive_dimension": "factual"
  },
  {
    "question_text": "Which of the following are valid components of a Zero Trust architecture? (Select all that apply)",
    "question_format": "mcq_multi",
    "options": ["Policy Engine", "Policy Administrator", "Firewall only", "Policy Enforcement Point", "None of the above"],
    "correct_answer": ["Policy Engine", "Policy Administrator", "Policy Enforcement Point"],
    "explanation": {
      "Policy Engine": "CORRECT: The Policy Engine makes dynamic authentication and authorization decisions.",
      "Policy Administrator": "CORRECT: The Policy Administrator manages access tokens and sessions.",
      "Firewall only": "INCORRECT: A firewall alone is not a Zero Trust component; it's traditional perimeter security.",
      "Policy Enforcement Point": "CORRECT: The PEP mediates access requests in the data plane.",
      "None of the above": "INCORRECT: Three of the options above are valid components."
    },
    "bloom_level": 4,
    "cognitive_dimension": "conceptual"
  }
]

IMPORTANT: 
- Return ONLY valid JSON, no markdown code blocks
- Generate AT LEAST 25-40 questions to thoroughly cover the topic
- Quality over quantity, but don't skip any important concepts
- For mcq_multi, correct_answer MUST be an array of strings matching the correct options`

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
        // Handle array answers for mcq_multi
        const answerStr = Array.isArray(q.correct_answer)
            ? JSON.stringify(q.correct_answer)
            : q.correct_answer
        outputLines.push(`   Answer: ${answerStr}`)
        // Include explanation
        if (q.explanation) {
            const explanationStr = typeof q.explanation === 'object'
                ? JSON.stringify(q.explanation)
                : q.explanation
            outputLines.push(`   Explanation: ${explanationStr}`)
        }
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
