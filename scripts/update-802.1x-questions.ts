/**
 * Update 802.1X Questions in Database
 * Replaces existing questions with the corrected, vetted question set
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
    options: string[] | null
    correct_answer: string | string[]
    explanation: string
    bloom_level: number
}

const correctedQuestions: Question[] = [
    // LEVEL 1: REMEMBER
    {
        bloom_level: 1,
        question_type: 'mcq_single',
        question_text: 'Which term in the 802.1X architecture describes the device, such as a user\'s PC, that is requesting network access?',
        options: ['Authenticator', 'Supplicant', 'RADIUS Server', 'Access Point'],
        correct_answer: 'Supplicant',
        explanation: JSON.stringify({
            'Authenticator': 'INCORRECT: This is the switching device or network appliance that acts as a conduit, not the requester.',
            'Supplicant': 'CORRECT: The Supplicant is defined as the device requesting access to the network (e.g., a laptop or PC).',
            'RADIUS Server': 'INCORRECT: This is the backend server component that validates authentication requests.',
            'Access Point': 'INCORRECT: An access point can act as an Authenticator for wireless networks, but it is not the term for the requesting device.'
        })
    },
    {
        bloom_level: 1,
        question_type: 'fill_blank',
        question_text: 'Usually, the ________ acts as the Authenticator in an 802.1X implementation for wired networks.',
        options: ['Directory Server', 'Network Switch', 'User Laptop', 'Certification Authority'],
        correct_answer: 'Network Switch',
        explanation: JSON.stringify({
            'Directory Server': 'INCORRECT: This holds user accounts, usually on the backend.',
            'Network Switch': 'CORRECT: The switching device (PNAC switch) is identified as the Authenticator.',
            'User Laptop': 'INCORRECT: This acts as the Supplicant.',
            'Certification Authority': 'INCORRECT: This issues certificates but does not act as the port-level Authenticator.'
        })
    },
    {
        bloom_level: 1,
        question_type: 'mcq_single',
        question_text: 'Which protocol pair is specified in the 802.1X standard for implementing port-based authentication?',
        options: ['EAP and RADIUS', 'DHCP and DNS', 'IPsec and TLS', 'TACACS+ and Kerberos'],
        correct_answer: 'EAP and RADIUS',
        explanation: JSON.stringify({
            'EAP and RADIUS': 'CORRECT: EAP provides the authentication framework, and RADIUS handles communication between the authenticator and server.',
            'DHCP and DNS': 'INCORRECT: These manage IP addressing and name resolution, not 802.1X authentication.',
            'IPsec and TLS': 'INCORRECT: These are encryption/tunneling protocols, not the primary implementation pair for 802.1X.',
            'TACACS+ and Kerberos': 'INCORRECT: While these are authentication protocols, the standard specifically designates EAP and RADIUS for 802.1X.'
        })
    },
    {
        bloom_level: 1,
        question_type: 'true_false',
        question_text: 'The Authenticator validates user credentials directly against its local directory.',
        options: null,
        correct_answer: 'False',
        explanation: 'The Authenticator does not validate credentials directly. It acts as a conduit that forwards authentication data to the Authentication Server, which holds or contacts the directory of network objects for validation.'
    },

    // LEVEL 2: UNDERSTAND
    {
        bloom_level: 2,
        question_type: 'mcq_single',
        question_text: 'Why is 802.1X considered superior to simple MAC address filtering for restricting network access?',
        options: ['MAC addresses require complex routing tables to manage', 'MAC addresses are susceptible to spoofing attacks', 'MAC addresses consume excessive bandwidth during handshakes', 'MAC addresses require frequent encryption key updates'],
        correct_answer: 'MAC addresses are susceptible to spoofing attacks',
        explanation: JSON.stringify({
            'MAC addresses require complex routing tables to manage': 'INCORRECT: MAC filtering is a Layer 2 function and doesn\'t involve complex routing tables.',
            'MAC addresses are susceptible to spoofing attacks': 'CORRECT: Restricting access by MAC address is difficult to manage and prone to spoofing.',
            'MAC addresses consume excessive bandwidth during handshakes': 'INCORRECT: MAC overhead is negligible.',
            'MAC addresses require frequent encryption key updates': 'INCORRECT: MAC addresses are hardware IDs and do not involve encryption keys themselves.'
        })
    },
    {
        bloom_level: 2,
        question_type: 'mcq_single',
        question_text: 'What is the functional relationship between the Authenticator and the Authentication Server regarding the RADIUS protocol?',
        options: ['The Authenticator acts as the RADIUS Server', 'The Authenticator acts as the RADIUS Client', 'They both act as RADIUS Servers', 'They do not use RADIUS for communication'],
        correct_answer: 'The Authenticator acts as the RADIUS Client',
        explanation: JSON.stringify({
            'The Authenticator acts as the RADIUS Server': 'INCORRECT: The Server role is held by the Authentication Server.',
            'The Authenticator acts as the RADIUS Client': 'CORRECT: The authenticator is a RADIUS client; the authentication server is a RADIUS server.',
            'They both act as RADIUS Servers': 'INCORRECT: One must be the client to initiate requests to the server.',
            'They do not use RADIUS for communication': 'INCORRECT: RADIUS is the specific protocol mentioned for their communication.'
        })
    },
    {
        bloom_level: 2,
        question_type: 'mcq_multi',
        question_text: 'Which of the following functions are performed by the Authentication Server in the AAA architecture? (Select three)',
        options: ['Validating authentication requests', 'Forwarding EAP packets to the switch', 'Issuing authorizations', 'Performing accounting of security events'],
        correct_answer: JSON.stringify(['Validating authentication requests', 'Issuing authorizations', 'Performing accounting of security events']),
        explanation: JSON.stringify({
            'Validating authentication requests': 'CORRECT: The server checks credentials against the directory.',
            'Forwarding EAP packets to the switch': 'INCORRECT: Forwarding is primarily the Authenticator\'s conduit role.',
            'Issuing authorizations': 'CORRECT: It determines if access should be granted.',
            'Performing accounting of security events': 'CORRECT: Accounting is the third A in AAA and is a server function.'
        })
    },
    {
        bloom_level: 2,
        question_type: 'fill_blank',
        question_text: 'On a wired LAN, the encapsulation of EAP communications between the supplicant and the authenticator is handled by the ________ protocol.',
        options: ['EAPoL', 'EAPoW', 'HTTPS', 'L2TP'],
        correct_answer: 'EAPoL',
        explanation: JSON.stringify({
            'EAPoL': 'CORRECT: EAPoL (EAP over LAN) is the standard for encapsulating EAP on wired networks.',
            'EAPoW': 'INCORRECT: This refers to EAP over Wireless.',
            'HTTPS': 'INCORRECT: This is a web protocol, not used for Layer 2 EAP encapsulation.',
            'L2TP': 'INCORRECT: This is a VPN tunneling protocol.'
        })
    },

    // LEVEL 3: APPLY
    {
        bloom_level: 3,
        question_type: 'mcq_single',
        question_text: 'A network administrator wants to implement a login method using smart cards without requiring passwords. Which component provides the framework to deploy this specific authentication type?',
        options: ['Extensible Authentication Protocol (EAP)', 'Remote Authentication Dial-In User Service (RADIUS)', 'Port-based Network Access Control (PNAC)', 'Challenge Handshake Authentication Protocol (CHAP)'],
        correct_answer: 'Extensible Authentication Protocol (EAP)',
        explanation: JSON.stringify({
            'Extensible Authentication Protocol (EAP)': 'CORRECT: EAP is the framework that allows for multiple authentication types, including smart cards and digital certificates.',
            'Remote Authentication Dial-In User Service (RADIUS)': 'INCORRECT: RADIUS transports the data, but EAP defines the authentication method itself.',
            'Port-based Network Access Control (PNAC)': 'INCORRECT: PNAC is the general standard (802.1X), not the specific protocol framework for smart cards.',
            'Challenge Handshake Authentication Protocol (CHAP)': 'INCORRECT: CHAP is an older authentication protocol, not the framework for smart card authentication.'
        })
    },
    {
        bloom_level: 3,
        question_type: 'mcq_multi',
        question_text: 'When a host first connects to an 802.1X-enabled switch port, which behavior is observed before authentication completes? (Select two)',
        options: ['The port is fully open to all network traffic', 'The switch opens the port for EAPoL traffic only', 'The switch blocks full data access', 'The switch assigns a permanent IP address immediately'],
        correct_answer: JSON.stringify(['The switch opens the port for EAPoL traffic only', 'The switch blocks full data access']),
        explanation: JSON.stringify({
            'The port is fully open to all network traffic': 'INCORRECT: Full access is only granted after authentication.',
            'The switch opens the port for EAPoL traffic only': 'CORRECT: This allows the authentication exchange to occur.',
            'The switch blocks full data access': 'CORRECT: Normal data traffic is restricted until the supplicant is authenticated.',
            'The switch assigns a permanent IP address immediately': 'INCORRECT: IP assignment (DHCP) typically happens after port access is authorized.'
        })
    },
    {
        bloom_level: 3,
        question_type: 'true_false',
        question_text: 'If a company uses 802.1X, an eavesdropper capturing traffic at the switch port can easily read the user\'s password because the switch acts as a transparent conduit.',
        options: null,
        correct_answer: 'False',
        explanation: 'The switch receives an EAP packet with the supplicant\'s credentials, but these are encrypted and cannot be read by the switch. Therefore, they cannot be easily read by an eavesdropper at that point.'
    },
    {
        bloom_level: 3,
        question_type: 'fill_blank',
        question_text: 'In the AAA framework, the ________ function is responsible for logging the duration and data usage of a user\'s session.',
        options: ['Accounting', 'Authorization', 'Authentication', 'Auditing'],
        correct_answer: 'Accounting',
        explanation: JSON.stringify({
            'Accounting': 'CORRECT: Accounting is the third A in AAA and tracks session data, usage, and security events for auditing purposes.',
            'Authorization': 'INCORRECT: Authorization determines what level of access a user is granted, not logging of session data.',
            'Authentication': 'INCORRECT: Authentication verifies user identity but does not log ongoing session activity.',
            'Auditing': 'INCORRECT: While auditing is related, the specific AAA term for logging session data is Accounting.'
        })
    },

    // LEVEL 4: ANALYZE
    {
        bloom_level: 4,
        question_type: 'mcq_multi',
        question_text: 'Which architectural factors prevent the Authenticator from independently validating a user\'s credentials? (Select two)',
        options: ['The switch cannot read the encrypted credentials in the EAP packet', 'The directory of user accounts resides on the Authentication Server', 'The switch lacks the cryptographic keys to decrypt credentials', 'None of the above'],
        correct_answer: JSON.stringify(['The switch cannot read the encrypted credentials in the EAP packet', 'The directory of user accounts resides on the Authentication Server']),
        explanation: JSON.stringify({
            'The switch cannot read the encrypted credentials in the EAP packet': 'CORRECT: Credentials are encrypted end-to-end between supplicant and server.',
            'The directory of user accounts resides on the Authentication Server': 'CORRECT: The switch does not hold the database required for validation.',
            'The switch lacks the cryptographic keys to decrypt credentials': 'INCORRECT: While related, this is not explicitly stated in the architecture. The switch acts as a conduit by design.',
            'None of the above': 'INCORRECT: Two of the options are correct.'
        })
    },
    {
        bloom_level: 4,
        question_type: 'mcq_single',
        question_text: 'If the connection between the Authenticator and the Authentication Server fails, what is the immediate consequence for a new supplicant attempting to connect?',
        options: ['The supplicant is granted limited guest network access', 'The authentication request cannot be validated, and access is denied', 'The Authenticator uses cached credentials to verify the user', 'The Supplicant connects through an alternate port automatically'],
        correct_answer: 'The authentication request cannot be validated, and access is denied',
        explanation: JSON.stringify({
            'The supplicant is granted limited guest network access': 'INCORRECT: The base architecture requires server validation. Without it, validation fails.',
            'The authentication request cannot be validated, and access is denied': 'CORRECT: The Authenticator cannot validate credentials itself; without the server, the authentication process cannot complete.',
            'The Authenticator uses cached credentials to verify the user': 'INCORRECT: The Authenticator does not cache or validate credentials; it only acts as a conduit.',
            'The Supplicant connects through an alternate port automatically': 'INCORRECT: The supplicant is physically connected to the switch and cannot bypass the authentication requirement.'
        })
    },
    {
        bloom_level: 4,
        question_type: 'true_false',
        question_text: 'The 802.1X standard separates the "door lock" mechanism (the switch port) from the "key verification" mechanism (the authentication server) to improve security and manageability.',
        options: null,
        correct_answer: 'True',
        explanation: 'This accurately analyzes the relationship: the switch (Authenticator) controls the physical port ("door lock") but relies on the Server ("key verification") to validate the credentials, separating duties.'
    },

    // LEVEL 5: EVALUATE
    {
        bloom_level: 5,
        question_type: 'mcq_single',
        question_text: 'A security consultant recommends using EAP-TLS (certificate-based) over EAP-MD5 (password hash) for a high-security finance network. Which capability best justifies this choice?',
        options: ['The ability to perform accounting of all user sessions', 'The ability to create a secure tunnel and establish a trust relationship', 'The reduction of CPU load on the Authentication Server', 'The compatibility with legacy switching hardware'],
        correct_answer: 'The ability to create a secure tunnel and establish a trust relationship',
        explanation: JSON.stringify({
            'The ability to perform accounting of all user sessions': 'INCORRECT: Accounting works with most EAP types; it doesn\'t justify choosing certificates specifically.',
            'The ability to create a secure tunnel and establish a trust relationship': 'CORRECT: EAP is often used with digital certificates to establish a trust relationship and create a secure tunnel, offering higher security.',
            'The reduction of CPU load on the Authentication Server': 'INCORRECT: Certificate validation typically involves higher computation than simple hashes.',
            'The compatibility with legacy switching hardware': 'INCORRECT: Hardware compatibility is less of a differentiator than the security features provided.'
        })
    },
    {
        bloom_level: 5,
        question_type: 'mcq_multi',
        question_text: 'When evaluating a network\'s vulnerability to insider threats, which arguments support implementing 802.1X internally rather than just at the perimeter? (Select two)',
        options: ['It forces internal users to authenticate before gaining full network access', 'It prevents unauthorized devices from simply plugging into a wall jack', 'It eliminates the need for internal firewalls', 'It automatically encrypts all data at the Application layer'],
        correct_answer: JSON.stringify(['It forces internal users to authenticate before gaining full network access', 'It prevents unauthorized devices from simply plugging into a wall jack']),
        explanation: JSON.stringify({
            'It forces internal users to authenticate before gaining full network access': 'CORRECT: This ensures only authorized personnel are on the LAN.',
            'It prevents unauthorized devices from simply plugging into a wall jack': 'CORRECT: 802.1X requires authentication when a host connects to one of its ports, preventing casual plug-in access.',
            'It eliminates the need for internal firewalls': 'INCORRECT: Access control does not replace traffic inspection/firewalling.',
            'It automatically encrypts all data at the Application layer': 'INCORRECT: 802.1X secures access, not application data.'
        })
    },
    {
        bloom_level: 5,
        question_type: 'true_false',
        question_text: 'Relying solely on identifying the Supplicant by MAC address is evaluated as a secure method because MAC addresses are hard-coded into the network interface hardware.',
        options: null,
        correct_answer: 'False',
        explanation: 'Restricting access by MAC address is difficult to manage and still prone to spoofing. Just because they are hardware-based doesn\'t mean they can\'t be spoofed in software.'
    },

    // LEVEL 6: CREATE
    {
        bloom_level: 6,
        question_type: 'mcq_multi',
        question_text: 'You are designing a secure 802.1X implementation for a hospital network with strict compliance requirements. Which design elements should you incorporate to ensure credentials are never exposed in transit? (Select two)',
        options: ['Deploy EAP-TLS to establish encrypted tunnels with digital certificates', 'Configure the Authenticator to decrypt and re-encrypt credentials', 'Use certificate-based authentication to eliminate password transmission', 'None of the above'],
        correct_answer: JSON.stringify(['Deploy EAP-TLS to establish encrypted tunnels with digital certificates', 'Use certificate-based authentication to eliminate password transmission']),
        explanation: JSON.stringify({
            'Deploy EAP-TLS to establish encrypted tunnels with digital certificates': 'CORRECT: EAP-TLS creates a secure tunnel, ensuring credentials are protected during transmission.',
            'Configure the Authenticator to decrypt and re-encrypt credentials': 'INCORRECT: The Authenticator cannot decrypt credentials; it acts only as a conduit. This would also be a security risk.',
            'Use certificate-based authentication to eliminate password transmission': 'CORRECT: Certificate-based methods avoid sending passwords entirely, reducing exposure risk.',
            'None of the above': 'INCORRECT: Two of the options are valid design choices.'
        })
    },
    {
        bloom_level: 6,
        question_type: 'mcq_multi',
        question_text: 'You are designing a unified 802.1X solution for an organization with both wired and wireless users. Which components must be configured to participate in the authentication chain? (Select three)',
        options: ['Access Points (as Authenticators)', 'Core Router (as CA Server)', 'Wired Switches (as Authenticators)', 'Centralized RADIUS Server (as Authentication Server)'],
        correct_answer: JSON.stringify(['Access Points (as Authenticators)', 'Wired Switches (as Authenticators)', 'Centralized RADIUS Server (as Authentication Server)']),
        explanation: JSON.stringify({
            'Access Points (as Authenticators)': 'CORRECT: For WLAN (EAPoW), APs act as the authenticator.',
            'Core Router (as CA Server)': 'INCORRECT: Core routers route traffic; the CA server is a distinct role associated with directory/PKI services.',
            'Wired Switches (as Authenticators)': 'CORRECT: For wired (EAPoL), switches act as the authenticator.',
            'Centralized RADIUS Server (as Authentication Server)': 'CORRECT: A single RADIUS server can handle requests from both wired switches and wireless APs.'
        })
    },
    {
        bloom_level: 6,
        question_type: 'fill_blank',
        question_text: 'To design a network where the switch never sees clear-text passwords, the architect must ensure the EAP method creates a secure ________ to transmit credentials between the Supplicant and the Authentication Server.',
        options: ['Tunnel', 'Bridge', 'VLAN', 'Route'],
        correct_answer: 'Tunnel',
        explanation: JSON.stringify({
            'Tunnel': 'CORRECT: Digital certificates can be used to create a secure tunnel for transmitting credentials.',
            'Bridge': 'INCORRECT: Bridging connects network segments, not a cryptographic privacy path.',
            'VLAN': 'INCORRECT: VLANs separate broadcast domains, not encryption for credential privacy.',
            'Route': 'INCORRECT: Routing determines path selection, not data privacy.'
        })
    },
    {
        bloom_level: 6,
        question_type: 'true_false',
        question_text: 'When designing an 802.1X deployment, it is strictly necessary for the Authenticator and the Authentication Server to reside on the same physical hardware device.',
        options: null,
        correct_answer: 'False',
        explanation: 'The architecture explicitly separates these roles: the Authenticator is a network access device (switch), while the Authentication Server is a server that communicates via RADIUS. They are distinct components in the design.'
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
    const { error: deleteError, count } = await supabase
        .from('questions')
        .delete()
        .eq('topic_id', topic.id)

    if (deleteError) {
        console.error('Error deleting existing questions:', deleteError)
        return
    }

    console.log(`Deleted existing questions`)

    // Insert new questions
    const questionsToInsert = correctedQuestions.map(q => ({
        topic_id: topic.id,
        bloom_level: q.bloom_level,
        question_text: q.question_text,
        question_format: q.question_type,  // UI reads from question_format column
        options: q.options,
        correct_answer: typeof q.correct_answer === 'string' ? q.correct_answer : JSON.stringify(q.correct_answer),
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

    correctedQuestions.forEach(q => {
        formats[q.question_type] = (formats[q.question_type] || 0) + 1
        blooms[q.bloom_level] = (blooms[q.bloom_level] || 0) + 1
    })

    console.log('\n📊 Distribution:')
    console.log('Formats:', formats)
    console.log('Bloom Levels:', blooms)
    console.log('\n✅ Done!')
}

updateQuestions().catch(console.error)
