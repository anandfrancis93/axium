import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function fixQuestions() {
    // Get 802.1X topic
    const { data: topic } = await supabase
        .from('topics')
        .select('id')
        .eq('name', '802.1X / Port-based Network Access Control (PNAC)')
        .single()

    if (!topic) {
        console.log('Topic not found')
        return
    }

    console.log('Found topic:', topic.id)

    // Get all questions for this topic
    const { data: questions } = await supabase
        .from('questions')
        .select('id, question_text, question_type')
        .eq('topic_id', topic.id)

    if (!questions) {
        console.log('No questions found')
        return
    }

    console.log(`Found ${questions.length} questions`)

    // Fix True/False questions - update question_type to true_false
    let tfFixed = 0
    for (const q of questions) {
        if (q.question_text.toLowerCase().includes('true or false:')) {
            const { error } = await supabase
                .from('questions')
                .update({ question_type: 'true_false' })
                .eq('id', q.id)

            if (error) {
                console.log('Error updating:', q.id, error.message)
            } else {
                tfFixed++
                console.log('Fixed T/F:', q.question_text.substring(0, 50) + '...')
            }
        }
    }
    console.log(`Fixed ${tfFixed} True/False questions`)

    // Delete the incorrect EAPoW question
    const eapowQ = questions.find(q =>
        q.question_text.toLowerCase().includes('eap over wireless is also known as')
    )

    if (eapowQ) {
        const { error: delError } = await supabase
            .from('questions')
            .delete()
            .eq('id', eapowQ.id)

        if (delError) {
            console.log('Error deleting Q3:', delError.message)
        } else {
            console.log('Deleted incorrect EAPoW question:', eapowQ.id)
        }
    } else {
        console.log('EAPoW question not found')
    }

    console.log('Done!')
}

fixQuestions().catch(console.error)
