import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
    const topicNames = [
        '802.1X / Port-based Network Access Control (PNAC)',
        'Acceptable Use Policy (AUP)',
        'Access Badges'
    ]

    let output = ''

    for (const topicName of topicNames) {
        const { data: topic } = await supabase
            .from('topics')
            .select('id, name')
            .eq('name', topicName)
            .single()

        if (!topic) continue

        output += `\n${'='.repeat(60)}\n`
        output += `${topic.name}\n`
        output += `${'='.repeat(60)}\n`

        const { data: questions } = await supabase
            .from('questions')
            .select('*')
            .eq('topic_id', topic.id)
            .order('bloom_level', { ascending: true })

        if (!questions) continue

        questions.forEach((q, i) => {
            output += `\n${i + 1}. [${q.question_type}] [Bloom ${q.bloom_level}]\n`
            output += `   Q: ${q.question_text}\n`
            if (q.options) {
                output += `   Options: ${q.options.join(' | ')}\n`
            }
            output += `   Answer: ${q.correct_answer}\n`
        })
    }

    fs.writeFileSync('generated-questions.txt', output, 'utf-8')
    console.log('Written to generated-questions.txt')
}

main().catch(console.error)
