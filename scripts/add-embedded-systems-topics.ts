import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function addEmbeddedSystemsTopics() {
  console.log('Adding Embedded Systems and RTOS topics...\n')

  try {
    // Get Cybersecurity subject ID
    const { data: subject, error: subjectError } = await supabase
      .from('subjects')
      .select('id')
      .eq('name', 'Cybersecurity')
      .single()

    if (subjectError || !subject) {
      console.error('❌ Error finding Cybersecurity subject:', subjectError)
      return
    }

    const subjectId = subject.id

    // Add Embedded Systems (Level 1)
    const { data: embeddedSystems, error: esError } = await supabase
      .from('topics')
      .insert({
        subject_id: subjectId,
        parent_topic_id: null,
        name: 'Embedded Systems',
        description: 'An electronic system that is designed to perform a specific, dedicated function, such as a microcontroller in a medical drip or components in a control system managing a water treatment plant. Embedded systems are used in various specialized applications, including consumer electronics, industrial automation, automotive systems, medical devices, and more.',
        hierarchy_level: 1
      })
      .select()
      .single()

    if (esError) {
      console.error('❌ Error creating Embedded Systems topic:', esError)
      return
    }

    console.log('✅ Created: Embedded Systems (Level 1)')

    // Add Embedded Systems subcategories (Level 2)
    const esSubtopics = [
      {
        name: 'Home appliances',
        description: 'Such as refrigerators, washing machines, and coffee makers, contain embedded systems that control their functions and operations.'
      },
      {
        name: 'Smartphones and tablets',
        description: 'Contain a variety of embedded systems, including processors, sensors, and communication modules.'
      },
      {
        name: 'Automotive systems',
        description: 'Like modern cars contain embedded systems including engine control units, entertainment systems, and safety systems like airbags and anti-lock brakes.'
      },
      {
        name: 'Industrial automation',
        description: 'Embedded systems exist in control systems and machinery, such as robots, assembly lines, and sensors.'
      },
      {
        name: 'Medical devices',
        description: 'Such as pacemakers, insulin pumps, and blood glucose monitors, contain embedded systems that control their functions and provide data to healthcare providers.'
      },
      {
        name: 'Aerospace and defense',
        description: 'Like aircraft, satellites, and military equipment use embedded systems for navigation, communication, and control.'
      }
    ]

    for (const subtopic of esSubtopics) {
      const { error } = await supabase
        .from('topics')
        .insert({
          subject_id: subjectId,
          parent_topic_id: embeddedSystems.id,
          name: subtopic.name,
          description: subtopic.description,
          hierarchy_level: 2
        })

      if (error) {
        console.error(`❌ Error creating "${subtopic.name}":`, error)
      } else {
        console.log(`✅ Created: ${subtopic.name} (Level 2)`)
      }
    }

    // Add Real-Time Operating Systems (RTOS) (Level 1)
    const { data: rtos, error: rtosError } = await supabase
      .from('topics')
      .insert({
        subject_id: subjectId,
        parent_topic_id: null,
        name: 'Real-Time Operating Systems (RTOS)',
        description: 'A type of OS that prioritizes deterministic execution of operations to ensure consistent response for time-critical tasks. A Real-Time Operating Systems (RTOS) is a type of operating system designed for use in applications that require real-time processing and response. They are purpose-specific operating systems designed for high levels of stability and processing speed.',
        hierarchy_level: 1
      })
      .select()
      .single()

    if (rtosError) {
      console.error('❌ Error creating RTOS topic:', rtosError)
      return
    }

    console.log('✅ Created: Real-Time Operating Systems (RTOS) (Level 1)')

    // Add RTOS subcategories (Level 2)
    const rtosSubtopics = [
      {
        name: 'Examples of RTOS',
        description: 'The VxWorks operating system is commonly used in aerospace and defense systems. VxWorks provides real-time performance and reliability and is therefore well suited for use in aircraft control systems, missile guidance systems, and other critical defense systems. Another example of an RTOS is FreeRTOS, an open-source operating system used in many embedded systems, such as robotics, industrial automation, and consumer electronics. In the automotive industry, RTOS is used in engine control, transmission control, and active safety systems applications. For example, the AUTOSAR (Automotive Open System Architecture) standard defines a framework for developing automotive software, including using RTOS for certain applications. In medical devices, RTOS is used for applications such as patient monitoring systems, medical imaging, and automated drug delivery systems. In industrial control systems, RTOS is used for process control and factory automation applications. For example, the Siemens SIMATIC WinCC Open Architecture system uses an RTOS to provide real-time performance and reliability for industrial automation applications.'
      },
      {
        name: 'Risks Associated with RTOS',
        description: 'A security breach involving RTOS can have serious consequences. RTOS software can be complex and difficult to secure, which makes it challenging to identify and address vulnerabilities that could be exploited by attackers. Another security risk associated with RTOS is the potential for system-level attacks. An attacker who gains access to an RTOS-based system could potentially disrupt critical processes or gain control over the system it is designed to control. This can lead to serious consequences considering the types of applications that rely on RTOS, such as medical devices and industrial control systems. A security breach could result in harm to people or damage to equipment.'
      }
    ]

    for (const subtopic of rtosSubtopics) {
      const { error } = await supabase
        .from('topics')
        .insert({
          subject_id: subjectId,
          parent_topic_id: rtos.id,
          name: subtopic.name,
          description: subtopic.description,
          hierarchy_level: 2
        })

      if (error) {
        console.error(`❌ Error creating "${subtopic.name}":`, error)
      } else {
        console.log(`✅ Created: ${subtopic.name} (Level 2)`)
      }
    }

    console.log('\n✨ Done! Added 10 new topics (2 Level 1, 8 Level 2)')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

addEmbeddedSystemsTopics().catch(console.error)
