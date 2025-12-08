/**
 * Update 802.1X Questions in Database
 * Replaces existing questions with the new vetted question set
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface Question {
    question_text: string
    question_type: 'mcq_single' | 'mcq_multi' | 'fill_blank' | 'true_false'
    options: string[]
    correct_answer: string | string[]
    explanation: string
    bloom_level: number
}

const questions: Question[] = [
    // Q1 - mcq_single, Bloom 1
    {
        bloom_level: 1,
        question_type: 'mcq_single',
        question_text: 'The IEEE 802.1X standard implements Port-based Network Access Control (PNAC) by encapsulating EAP communications over a wired LAN, a process known as ____________.',
        options: ['EAPoL', 'EAPoW', 'RADIUS', 'WLAN'],
        correct_answer: 'EAPoL',
        explanation: JSON.stringify({
            'EAPoL': 'CORRECT: The text explicitly identifies "encapsulating EAP communications over a LAN" as EAPoL.',
            'EAPoW': 'INCORRECT: EAPoW refers to EAP over WLAN (Wireless), not a wired LAN.',
            'RADIUS': 'INCORRECT: RADIUS is the communication protocol between the authenticator and server, not the encapsulation method over the LAN.',
            'WLAN': 'INCORRECT: WLAN is a network type (Wireless LAN), not the specific encapsulation protocol name.'
        })
    },
    // Q2 - mcq_single, Bloom 2
    {
        bloom_level: 2,
        question_type: 'mcq_single',
        question_text: 'Which statement accurately describes the function of the Authenticator within the 802.1X architecture?',
        options: ['It validates the user credentials directly against a specific local directory.', 'It acts as a conduit to pass authentication data to the server.', 'It serves as the primary device requesting access to the network.', 'It issues digital certificates to establish a secure trust relationship.'],
        correct_answer: 'It acts as a conduit to pass authentication data to the server.',
        explanation: JSON.stringify({
            'It validates the user credentials directly against a specific local directory.': 'INCORRECT: This describes the Authentication Server, which validates requests; the text states the authenticator does not validate directly.',
            'It acts as a conduit to pass authentication data to the server.': 'CORRECT: The text defines the Authenticator (switching device) as a device that "does not validate authentication requests directly but acts as a conduit for authentication data."',
            'It serves as the primary device requesting access to the network.': 'INCORRECT: This describes the Supplicant, which is the device requesting access.',
            'It issues digital certificates to establish a secure trust relationship.': 'INCORRECT: Issuing certificates is associated with the authentication framework/server side, not the switch\'s role as a conduit.'
        })
    },
    // Q3 - mcq_multi, Bloom 4
    {
        bloom_level: 4,
        question_type: 'mcq_multi',
        question_text: 'According to the text, what are the primary security drawbacks of restricting network access solely by MAC address?',
        options: ['Logic is prone to spoofing', 'Management is difficult', 'Packet encryption is weak', 'Port speed is reduced'],
        correct_answer: JSON.stringify(['Logic is prone to spoofing', 'Management is difficult']),
        explanation: JSON.stringify({
            'Logic is prone to spoofing': 'CORRECT: Spoofing is explicitly cited as a vulnerability of MAC address restriction.',
            'Management is difficult': 'CORRECT: Management difficulty is explicitly cited as a drawback.',
            'Packet encryption is weak': 'INCORRECT: Weak packet encryption is not mentioned as a drawback of MAC restriction in the text.',
            'Port speed is reduced': 'INCORRECT: Reduced port speed is not mentioned as a drawback of MAC restriction.'
        })
    },
    // Q4 - fill_blank, Bloom 1
    {
        bloom_level: 1,
        question_type: 'fill_blank',
        question_text: 'In the AAA architecture used by 802.1X, the device requesting network access, such as a user\'s laptop, is defined as the ____________.',
        options: ['Supplicant', 'Authenticator', 'Proxy', 'Controller'],
        correct_answer: 'Supplicant',
        explanation: JSON.stringify({
            'Supplicant': 'CORRECT: The text defines the Supplicant as "It is the device requesting access such as a user\'s PC or laptop."',
            'Authenticator': 'INCORRECT: The Authenticator is the switching device, not the requesting device.',
            'Proxy': 'INCORRECT: Proxy is not defined as a role in the provided text.',
            'Controller': 'INCORRECT: Controller is not defined as a role in the provided text.'
        })
    },
    // Q5 - true_false, Bloom 2
    {
        bloom_level: 2,
        question_type: 'true_false',
        question_text: 'When a host connects to an 802.1X-enabled switch port, the switch immediately decrypts the supplicant\'s credentials to verify them before contacting the server.',
        options: ['True', 'False'],
        correct_answer: 'False',
        explanation: 'The text strictly states regarding the supplicant\'s credentials: "These are encrypted and cannot be read by the switch." Validation is done by the Authentication Server, not the switch.'
    },
    // Q6 - mcq_single, Bloom 5
    {
        bloom_level: 5,
        question_type: 'mcq_single',
        question_text: 'An administrator needs to implement a solution using digital certificates to create a secure tunnel. Which 802.1X protocol component provides the necessary framework for this configuration?',
        options: ['EAP', 'MAC', 'PNAC', 'AAA'],
        correct_answer: 'EAP',
        explanation: JSON.stringify({
            'EAP': 'CORRECT: The text states, regarding EAP: "It provides a framework... It is often used with digital certificates to establish a trust relationship and create a secure tunnel..."',
            'MAC': 'INCORRECT: MAC refers to the address/filtering method or distinct layer, not the validation framework.',
            'PNAC': 'INCORRECT: PNAC is the name of the standard (802.1X) or the switch type, but EAP is the protocol framework used within it.',
            'AAA': 'INCORRECT: AAA is the architecture type, not the specific protocol framework handling the certificates.'
        })
    },
    // Q7 - mcq_single, Bloom 3
    {
        bloom_level: 3,
        question_type: 'mcq_single',
        question_text: 'When a host connects to an 802.1X switch port, what is the specific state of that port prior to successful authentication?',
        options: ['Open for EAPoL traffic only', 'Open for all standard data', 'Closed to all traffic types', 'Open for Web traffic only'],
        correct_answer: 'Open for EAPoL traffic only',
        explanation: JSON.stringify({
            'Open for EAPoL traffic only': 'CORRECT: The text states: "When a host connects... the switch opens the port for the EAP over LAN (EAPoL) protocol only."',
            'Open for all standard data': 'INCORRECT: The port only allows full data access after authentication.',
            'Closed to all traffic types': 'INCORRECT: The port must be open to EAPoL traffic to allow the authentication exchange to occur.',
            'Open for Web traffic only': 'INCORRECT: Web traffic (HTTP) is "full data access," which is blocked until authentication is complete.'
        })
    },
    // Q8 - mcq_multi, Bloom 2
    {
        bloom_level: 2,
        question_type: 'mcq_multi',
        question_text: 'Which specific functions are performed by the Authentication Server in an 802.1X deployment?',
        options: ['Validating authentication requests', 'Performing accounting of events', 'Opening the EAPoL port', 'Issuing access authorizations'],
        correct_answer: JSON.stringify(['Validating authentication requests', 'Performing accounting of events', 'Issuing access authorizations']),
        explanation: JSON.stringify({
            'Validating authentication requests': 'CORRECT: Explicitly listed as a server function.',
            'Performing accounting of events': 'CORRECT: Explicitly listed as a server function.',
            'Opening the EAPoL port': 'INCORRECT: The switch (Authenticator) opens the port for EAPoL when the host connects, not the server.',
            'Issuing access authorizations': 'CORRECT: Explicitly listed as a server function.'
        })
    },
    // Q9 - mcq_single, Bloom 4
    {
        bloom_level: 4,
        question_type: 'mcq_single',
        question_text: 'During the 802.1X authentication process, the switch functions as which client type when communicating with the directory-holding server?',
        options: ['RADIUS Client', 'EAPoL Client', 'Access Client', 'Tunnel Client'],
        correct_answer: 'RADIUS Client',
        explanation: JSON.stringify({
            'RADIUS Client': 'CORRECT: The text explicitly states: "The authenticator is a RADIUS client; the authentication server is a RADIUS server."',
            'EAPoL Client': 'INCORRECT: EAPoL is the protocol used on the LAN side (Supplicant to Switch); the switch isn\'t an "EAPoL client" to the server.',
            'Access Client': 'INCORRECT: Generic filler term not used in the text.',
            'Tunnel Client': 'INCORRECT: Use of tunnels is associated with EAP/Methods, not the role of the switch itself.'
        })
    },
    // Q10 - mcq_single, Bloom 6
    {
        bloom_level: 6,
        question_type: 'mcq_single',
        question_text: 'You are designing a secure network access solution. Based on the text, which method should you select to best ensure a trust relationship and eliminate the need for passwords?',
        options: ['EAP with Smart Cards', 'Standard EAP with passwords', 'MAC address filtering', 'Port-based open access'],
        correct_answer: 'EAP with Smart Cards',
        explanation: JSON.stringify({
            'EAP with Smart Cards': 'CORRECT: The text mentions EAP is used to "perform smart-card authentication without a password" and establish trust.',
            'Standard EAP with passwords': 'INCORRECT: The text discusses eliminating passwords using smart cards/certs; standard passwords don\'t meet the "eliminate" criteria.',
            'MAC address filtering': 'INCORRECT: MAC filtering is described as prone to spoofing and difficult to manage.',
            'Port-based open access': 'INCORRECT: Open access contradicts the goal of "secure network access."'
        })
    },
    // Q11 - fill_blank, Bloom 1
    {
        bloom_level: 1,
        question_type: 'fill_blank',
        question_text: 'The protocol that allows the authenticator and authentication server to communicate authentication and authorization decisions is known as ____________.',
        options: ['RADIUS', 'EAPoL', 'EAPoW', 'PNAC'],
        correct_answer: 'RADIUS',
        explanation: JSON.stringify({
            'RADIUS': 'CORRECT: The text defines RADIUS as: "It allows the authenticator and authentication server to communicate authentication and authorization decisions."',
            'EAPoL': 'INCORRECT: EAPoL is for encapsulation over LAN between Supplicant and Switch.',
            'EAPoW': 'INCORRECT: EAPoW is for encapsulation over WLAN.',
            'PNAC': 'INCORRECT: PNAC is the type of access control, not the communication protocol between the switch and server.'
        })
    },
    // Q12 - true_false, Bloom 3
    {
        bloom_level: 3,
        question_type: 'true_false',
        question_text: 'In an 802.1X exchange, the Supplicant sends credentials directly to the Authentication Server without passing them through the Authenticator (Switch).',
        options: ['True', 'False'],
        correct_answer: 'False',
        explanation: 'The text states the Authenticator (Switch) "acts as a conduit for authentication data" and "passes a supplicant\'s authentication data to an authenticating server." The data must pass through the switch.'
    },
    // Q13 - mcq_multi, Bloom 2
    {
        bloom_level: 2,
        question_type: 'mcq_multi',
        question_text: 'Which of the following components are explicitly part of the 802.1X AAA architecture described in the text?',
        options: ['Authenticator', 'Supplicant', 'Internet Router', 'Authentication Server'],
        correct_answer: JSON.stringify(['Authenticator', 'Supplicant', 'Authentication Server']),
        explanation: JSON.stringify({
            'Authenticator': 'CORRECT: Explicitly listed as part of the AAA architecture.',
            'Supplicant': 'CORRECT: Explicitly listed as part of the AAA architecture.',
            'Internet Router': 'INCORRECT: An "Internet Router" is not listed as a specific role in the 802.1X AAA architecture text.',
            'Authentication Server': 'CORRECT: Explicitly listed as part of the AAA architecture.'
        })
    },
    // Q14 - mcq_single, Bloom 3
    {
        bloom_level: 3,
        question_type: 'mcq_single',
        question_text: 'A switch receives an EAP packet containing a user\'s credentials. According to the text, what prevents the switch from reading these credentials?',
        options: ['They are encrypted', 'They are encoded', 'They are hashed', 'They are compressed'],
        correct_answer: 'They are encrypted',
        explanation: JSON.stringify({
            'They are encrypted': 'CORRECT: The text states: "The switch receives an EAP packet with the supplicant\'s credentials. These are encrypted and cannot be read by the switch."',
            'They are encoded': 'INCORRECT: "Encoded" implies they could be decoded easily; text specifies "encrypted."',
            'They are hashed': 'INCORRECT: Hashing is not mentioned; text specifies "encrypted."',
            'They are compressed': 'INCORRECT: Compression is not mentioned; text specifies "encrypted."'
        })
    },
    // Q15 - mcq_single, Bloom 1
    {
        bloom_level: 1,
        question_type: 'mcq_single',
        question_text: 'Determining whether "encapsulating EAP communications over a WLAN" is occurring corresponds to which acronym?',
        options: ['EAPoW', 'EAPoL', 'RADIUS', 'PNAC'],
        correct_answer: 'EAPoW',
        explanation: JSON.stringify({
            'EAPoW': 'CORRECT: The text explicitly mentions "encapsulating EAP communications over a... WLAN (EAPoW)."',
            'EAPoL': 'INCORRECT: EAPoL is for wired networks.',
            'RADIUS': 'INCORRECT: RADIUS is the backend protocol.',
            'PNAC': 'INCORRECT: PNAC is the access control standard.'
        })
    }
]

async function updateQuestions() {
    // Get 802.1X topic
    const { data: topic, error: topicError } = await supabase
        .from('topics')
        .select('id, name')
        .eq('name', '802.1X / Port-based Network Access Control (PNAC)')
        .single()

    if (topicError || !topic) {
        console.error('Topic not found:', topicError)
        return
    }

    console.log(`Found topic: ${topic.name} (${topic.id})`)

    // Delete existing questions for this topic
    const { error: deleteError } = await supabase
        .from('questions')
        .delete()
        .eq('topic_id', topic.id)

    if (deleteError) {
        console.error('Error deleting existing questions:', deleteError)
        return
    }

    console.log(`Deleted existing questions`)

    // Insert new questions
    const questionsToInsert = questions.map(q => ({
        topic_id: topic.id,
        bloom_level: q.bloom_level,
        question_text: q.question_text,
        question_format: q.question_type,  // UI reads from question_format column
        options: q.options,
        correct_answer: typeof q.correct_answer === 'string' ? q.correct_answer : q.correct_answer,
        explanation: q.explanation
    }))

    const { error: insertError, data: inserted } = await supabase
        .from('questions')
        .insert(questionsToInsert)
        .select('id')

    if (insertError) {
        console.error('Error inserting questions:', insertError)
        return
    }

    console.log(`Successfully inserted ${inserted?.length || 0} questions`)

    // Show distribution
    const formats: Record<string, number> = {}
    const blooms: Record<number, number> = {}

    questions.forEach(q => {
        formats[q.question_type] = (formats[q.question_type] || 0) + 1
        blooms[q.bloom_level] = (blooms[q.bloom_level] || 0) + 1
    })

    console.log('\n📊 Distribution:')
    console.log('Formats:', formats)
    console.log('Bloom Levels:', blooms)
    console.log('\n✅ Done!')
}

updateQuestions().catch(console.error)
