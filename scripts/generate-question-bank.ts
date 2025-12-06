/**
 * Question Bank Generator
 * 
 * Generates holistic questions for all topics based on their descriptions.
 * Questions scale with description length (fewer words = fewer questions).
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

interface Topic {
    id: string
    name: string
    description: string | null
}

interface GeneratedQuestion {
    question_text: string
    question_format: 'mcq_single' | 'true_false' | 'fill_blank'
    options?: string[]
    correct_answer: string
    explanation: string
    bloom_level: number
}

// Estimate question count based on description length
function estimateQuestionCount(description: string | null): number {
    if (!description) return 2

    const wordCount = description.split(/\s+/).length

    if (wordCount < 50) return 2
    if (wordCount < 100) return 4
    if (wordCount < 200) return 8
    if (wordCount < 400) return 15
    if (wordCount < 600) return 20
    return 30
}

// Generate questions for a single topic
async function generateQuestionsForTopic(topic: Topic): Promise<GeneratedQuestion[]> {
    const targetCount = estimateQuestionCount(topic.description)

    const prompt = `You are a cybersecurity education expert. Generate ${targetCount} comprehensive questions for the following topic.

TOPIC: ${topic.name}

DESCRIPTION:
${topic.description || 'No description available. Generate basic definition and concept questions.'}

REQUIREMENTS:
1. Generate exactly ${targetCount} questions
2. Questions should cover ALL distinct concepts in the description
3. Question format mix:
   - 60% multiple choice (mcq_single) - MUST have exactly 4 options
   - 25% true/false - correct_answer must be exactly "True" or "False"
   - 15% fill in the blank (fill_blank) - MUST have exactly 4 options
4. Bloom's taxonomy levels:
   - Level 1-2 (Remember/Understand): ~40%
   - Level 3-4 (Apply/Analyze): ~40%
   - Level 5-6 (Evaluate/Create): ~20%
5. All answers must be derivable from the description
6. Each question should test a DIFFERENT concept
7. For true/false: aim for 50% true, 50% false distribution
8. AVOID LENGTH BIAS: Correct answer must NOT be significantly longer than distractors. All options should be of similar length and grammatical structure.
9. Distractors must be plausible.

CRITICAL: mcq_single and fill_blank MUST have "options" array with exactly 4 choices!

OUTPUT FORMAT (JSON array with examples for each format):
[
  {
    "question_text": "What is the primary purpose of X?",
    "question_format": "mcq_single",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": "Option A",
    "explanation": "Explanation here",
    "bloom_level": 2
  },
  {
    "question_text": "X provides protection against Y attacks.",
    "question_format": "true_false",
    "correct_answer": "True",
    "explanation": "Explanation here",
    "bloom_level": 1
  },
  {
    "question_text": "The _____ protocol is used for authentication.",
    "question_format": "fill_blank",
    "options": ["EAP", "TCP", "UDP", "FTP"],
    "correct_answer": "EAP",
    "explanation": "Explanation here",
    "bloom_level": 1
  }
]

IMPORTANT: Return ONLY valid JSON, no markdown code blocks.`

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
        console.error(`Error generating questions for ${topic.name}:`, error)
        return []
    }
}

// Insert questions into database
async function insertQuestions(topicId: string, questions: GeneratedQuestion[]): Promise<boolean> {
    const questionsToInsert = questions.map(q => ({
        topic_id: topicId,
        question_text: q.question_text,
        question_type: q.question_format, // Schema uses question_type
        options: q.options || null,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        bloom_level: q.bloom_level
    }))

    const { error } = await supabase
        .from('questions')
        .insert(questionsToInsert)

    if (error) {
        console.error(`Error inserting questions:`, error)
        return false
    }

    return true
}

// Main execution
async function main() {
    console.log('🚀 Starting Question Bank Generation...\n')

    const args = process.argv.slice(2)
    const testMode = args.includes('--test')
    const startFrom = args.find(a => a.startsWith('--start='))?.split('=')[1]
    const limit = testMode ? 3 : undefined

    let query = supabase
        .from('topics')
        .select('id, name, description')
        .eq('subject_id', 'c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9')
        .order('name', { ascending: true })
        .limit(5000)

    if (limit) {
        query = query.limit(limit)
    }

    const { data: topics, error } = await query

    if (error) {
        console.error('Error fetching topics:', error)
        return
    }

    console.log(`📚 Found ${topics?.length || 0} topics to process\n`)

    if (!topics || topics.length === 0) return

    let totalQuestions = 0
    let processedTopics = 0
    let skippedTopics = 0

    let startIndex = 0
    if (startFrom) {
        startIndex = topics.findIndex(t => t.name === startFrom)
        if (startIndex === -1) startIndex = 0
        console.log(`📍 Starting from: ${startFrom} (index ${startIndex})\n`)
    }

    for (let i = startIndex; i < topics.length; i++) {
        const topic = topics[i]
        const wordCount = topic.description?.split(/\s+/).length || 0
        const targetQuestions = estimateQuestionCount(topic.description)

        console.log(`[${i + 1}/${topics.length}] ${topic.name}`)
        console.log(`   📝 ${wordCount} words → ${targetQuestions} questions`)

        const questions = await generateQuestionsForTopic(topic)

        if (questions.length === 0) {
            console.log(`   ⚠️ No questions generated, skipping`)
            skippedTopics++
            continue
        }

        const success = await insertQuestions(topic.id, questions)

        if (success) {
            console.log(`   ✅ Inserted ${questions.length} questions`)
            totalQuestions += questions.length
            processedTopics++
        } else {
            console.log(`   ❌ Failed to insert questions`)
            skippedTopics++
        }

        await new Promise(resolve => setTimeout(resolve, 1000))
    }

    console.log('\n📊 Summary:')
    console.log(`   Topics processed: ${processedTopics}`)
    console.log(`   Topics skipped: ${skippedTopics}`)
    console.log(`   Total questions: ${totalQuestions}`)
    console.log('\n✅ Done!')
}

main().catch(console.error)
