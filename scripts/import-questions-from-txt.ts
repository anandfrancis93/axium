/**
 * Import Questions from generated-questions.txt
 * 
 * Parses the text file and imports questions back into the database.
 * This is useful for restoring questions after an accidental deletion.
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface ParsedQuestion {
    questionNumber: number
    questionFormat: 'mcq_single' | 'true_false' | 'fill_blank' | 'mcq_multi'
    bloomLevel: number
    questionText: string
    options?: string[]
    correctAnswer: string | string[]  // Can be array for mcq_multi
    explanation?: string
}

interface TopicQuestions {
    topicName: string
    questions: ParsedQuestion[]
}

function parseGeneratedQuestionsFile(filePath: string): TopicQuestions[] {
    const content = fs.readFileSync(filePath, 'utf-8')
    // Handle both Windows (CRLF) and Unix (LF) line endings
    const lines = content.replace(/\r\n/g, '\n').split('\n')

    const result: TopicQuestions[] = []
    let currentTopic: TopicQuestions | null = null
    let currentQuestion: Partial<ParsedQuestion> | null = null

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()

        // Skip empty lines and separators
        if (!line || line.match(/^=+$/)) continue

        // Check for topic header (line between two separator lines)
        if (i > 0 && i < lines.length - 1) {
            const prevLine = lines[i - 1].trim()
            const nextLine = lines[i + 1]?.trim() || ''

            if (prevLine.match(/^=+$/) && nextLine.match(/^=+$/)) {
                // Save previous question if exists
                if (currentQuestion && currentQuestion.questionText && currentQuestion.correctAnswer && currentTopic) {
                    currentTopic.questions.push(currentQuestion as ParsedQuestion)
                }
                // Save previous topic if exists
                if (currentTopic && currentTopic.questions.length > 0) {
                    result.push(currentTopic)
                }
                // Start new topic
                currentTopic = {
                    topicName: line,
                    questions: []
                }
                currentQuestion = null
                continue
            }
        }

        // Parse question line: "1. [true_false] [Bloom 1]"
        const questionHeaderMatch = line.match(/^(\d+)\.\s+\[(\w+)\]\s+\[Bloom\s+(\d+)\]/)
        if (questionHeaderMatch && currentTopic) {
            // Save previous question if it's complete
            if (currentQuestion && currentQuestion.questionText && currentQuestion.correctAnswer) {
                currentTopic.questions.push(currentQuestion as ParsedQuestion)
            }

            currentQuestion = {
                questionNumber: parseInt(questionHeaderMatch[1]),
                questionFormat: questionHeaderMatch[2] as 'mcq_single' | 'true_false' | 'fill_blank',
                bloomLevel: parseInt(questionHeaderMatch[3])
            }
            continue
        }

        // Parse question text: "Q: ..."
        if (line.startsWith('Q:') && currentQuestion) {
            currentQuestion.questionText = line.substring(2).trim()
            continue
        }

        // Parse options: "Options: A | B | C | D"
        if (line.startsWith('Options:') && currentQuestion) {
            const optionsStr = line.substring(8).trim()
            currentQuestion.options = optionsStr.split(' | ').map(o => o.trim())
            continue
        }

        // Parse answer: "Answer: ..." or "Answer: ["Option1", "Option2"]" for mcq_multi
        if (line.startsWith('Answer:') && currentQuestion) {
            const answerStr = line.substring(7).trim()
            // Check if it's a JSON array (for mcq_multi)
            if (answerStr.startsWith('[')) {
                try {
                    currentQuestion.correctAnswer = JSON.parse(answerStr)
                } catch {
                    currentQuestion.correctAnswer = answerStr
                }
            } else {
                currentQuestion.correctAnswer = answerStr
            }
            continue
        }

        // Parse explanation: "Explanation: ..."
        if (line.startsWith('Explanation:') && currentQuestion) {
            currentQuestion.explanation = line.substring(12).trim()
            continue
        }
    }

    // Save last question and topic
    if (currentQuestion && currentQuestion.questionText && currentQuestion.correctAnswer && currentTopic) {
        currentTopic.questions.push(currentQuestion as ParsedQuestion)
    }
    if (currentTopic && currentTopic.questions.length > 0) {
        result.push(currentTopic)
    }

    return result
}

async function getTopicId(topicName: string): Promise<string | null> {
    const { data, error } = await supabase
        .from('topics')
        .select('id')
        .eq('name', topicName)
        .single()

    if (error || !data) {
        return null
    }
    return data.id
}

async function checkExistingQuestions(topicId: string): Promise<number> {
    const { count, error } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('topic_id', topicId)

    return count || 0
}

async function deleteExistingQuestions(topicId: string): Promise<boolean> {
    const { error } = await supabase
        .from('questions')
        .delete()
        .eq('topic_id', topicId)

    if (error) {
        console.error(`Error deleting existing questions:`, error)
        return false
    }
    return true
}

async function insertQuestions(topicId: string, questions: ParsedQuestion[]): Promise<boolean> {
    const questionsToInsert = questions.map(q => ({
        topic_id: topicId,
        question_text: q.questionText,
        question_format: q.questionFormat,
        options: q.options || null,
        // Store arrays directly for mcq_multi (Supabase handles PostgreSQL array conversion)
        correct_answer: q.correctAnswer,
        explanation: q.explanation || '',
        bloom_level: q.bloomLevel
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

async function main() {
    console.log('🚀 Starting Question Import from generated-questions.txt\n')

    const args = process.argv.slice(2)
    const specificTopic = args.find(a => a.startsWith('--topic='))?.split('=')[1]
    const forceOverwrite = args.includes('--force')
    const dryRun = args.includes('--dry-run')

    const filePath = path.resolve(process.cwd(), 'generated-questions.txt')

    if (!fs.existsSync(filePath)) {
        console.error('❌ generated-questions.txt not found!')
        return
    }

    console.log('📖 Parsing generated-questions.txt...\n')
    const topicQuestions = parseGeneratedQuestionsFile(filePath)

    console.log(`📚 Found ${topicQuestions.length} topics in file\n`)

    let totalImported = 0
    let topicsProcessed = 0
    let topicsSkipped = 0

    for (const topic of topicQuestions) {
        // Skip if not the specific topic we're looking for
        if (specificTopic && topic.topicName !== specificTopic) {
            continue
        }

        console.log(`[${topicsProcessed + topicsSkipped + 1}] ${topic.topicName}`)
        console.log(`   📝 ${topic.questions.length} questions in file`)

        const topicId = await getTopicId(topic.topicName)

        if (!topicId) {
            console.log(`   ⚠️ Topic not found in database, skipping`)
            topicsSkipped++
            continue
        }

        const existingCount = await checkExistingQuestions(topicId)

        if (existingCount > 0 && !forceOverwrite) {
            console.log(`   ⏭️ Already has ${existingCount} questions, skipping (use --force to overwrite)`)
            topicsSkipped++
            continue
        }

        if (dryRun) {
            console.log(`   🔍 [DRY RUN] Would import ${topic.questions.length} questions`)
            topicsProcessed++
            totalImported += topic.questions.length
            continue
        }

        // If force overwrite and there are existing questions, delete them first
        if (existingCount > 0 && forceOverwrite) {
            console.log(`   🗑️ Deleting ${existingCount} existing questions...`)
            await deleteExistingQuestions(topicId)
        }

        const success = await insertQuestions(topicId, topic.questions)

        if (success) {
            console.log(`   ✅ Imported ${topic.questions.length} questions`)
            totalImported += topic.questions.length
            topicsProcessed++
        } else {
            console.log(`   ❌ Failed to import questions`)
            topicsSkipped++
        }
    }

    console.log('\n📊 Summary:')
    console.log(`   Topics processed: ${topicsProcessed}`)
    console.log(`   Topics skipped: ${topicsSkipped}`)
    console.log(`   Total questions imported: ${totalImported}`)

    if (dryRun) {
        console.log('\n⚠️ This was a dry run. No changes were made.')
        console.log('   Remove --dry-run to actually import.')
    }

    console.log('\n✅ Done!')
}

main().catch(console.error)
