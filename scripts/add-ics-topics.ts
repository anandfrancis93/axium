import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

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

async function addICSTopics() {
  console.log('Adding Industrial Control Systems (ICS) topics...\n')

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

    // Add Industrial control systems (ICS) (Level 1)
    const { data: ics, error: icsError } = await supabase
      .from('topics')
      .insert({
        subject_id: subjectId,
        parent_topic_id: null,
        name: 'Industrial control systems (ICS)',
        description: 'Network managing embedded devices (computer systems that are designed to perform a specific, dedicated function). Industrial control systems (ICSs) provide mechanisms for workflow and process automation. These systems control machinery used in critical infrastructure, like power suppliers, water suppliers, health services, telecommunications, and national security services. An ICS that manages process automation within a single site is usually referred to as a distributed control system (DCS). An ICS comprises plant devices and equipment with embedded programmable logic controllers (PLCs). The PLCs are linked either by an operational technology (OT) fieldbus serial network or by industrial Ethernet to actuators that operate valves, motors, circuit breakers, and other mechanical components, plus sensors that monitor some local state, such as temperature. Output and configuration of a PLC are performed by one or more human-machine interfaces (HMIs). An HMI might be a local control panel or software running on a computing host. PLCs are connected within a control loop, and the whole process automation system can be governed by a control server. Another important concept is the data historian or a database of all the information the control loop generated.',
        hierarchy_level: 1
      })
      .select()
      .single()

    if (icsError) {
      console.error('❌ Error creating ICS topic:', icsError)
      return
    }

    console.log('✅ Created: Industrial control systems (ICS) (Level 1)')

    // Add Level 2 core components
    const level2Topics = [
      {
        name: 'Operational Technology (OT)',
        description: 'A communications network designed to implement an industrial control system rather than data networking.'
      },
      {
        name: 'Human-machine Interfaces (HMIs)',
        description: 'Input and output controls on a PLC to allow a user to configure and monitor the system.'
      },
      {
        name: 'Supervisory Control and Data Acquisition (SCADA)',
        description: 'A type of industrial control system that manages large-scale, multiple-site devices and equipment spread over geographically large areas from a host computer. A supervisory control and data acquisition (SCADA) system takes the place of a control server in large-scale, multiple-site ICSs. SCADA typically run as software on ordinary computers, gathering data from and managing plant devices and equipment with embedded PLCs, referred to as field devices. SCADA typically use WAN communications, such as cellular or satellite, to link the SCADA server to field devices.'
      }
    ]

    for (const topic of level2Topics) {
      const { error } = await supabase
        .from('topics')
        .insert({
          subject_id: subjectId,
          parent_topic_id: ics.id,
          name: topic.name,
          description: topic.description,
          hierarchy_level: 2
        })

      if (error) {
        console.error(`❌ Error creating "${topic.name}":`, error)
      } else {
        console.log(`✅ Created: ${topic.name} (Level 2)`)
      }
    }

    // Add ICS/SCADA Applications (Level 2 - parent for applications)
    const { data: icsApps, error: icsAppsError } = await supabase
      .from('topics')
      .insert({
        subject_id: subjectId,
        parent_topic_id: ics.id,
        name: 'ICS/SCADA Applications',
        description: 'Industrial control systems and SCADA are used across various critical sectors including energy, industrial operations, manufacturing, logistics, and facility management.',
        hierarchy_level: 2
      })
      .select()
      .single()

    if (icsAppsError) {
      console.error('❌ Error creating ICS/SCADA Applications topic:', icsAppsError)
      return
    }

    console.log('✅ Created: ICS/SCADA Applications (Level 2)')

    // Add Level 3 application areas
    const level3Applications = [
      {
        name: 'Energy',
        description: 'It refers to power generation and distribution. More widely, utilities include water/sewage and transportation networks.'
      },
      {
        name: 'Industrial',
        description: 'It can refer specifically to mining and refining raw materials, involving hazardous high heat and pressure furnaces, presses, centrifuges, pumps, and so on.'
      },
      {
        name: 'Fabrication and Manufacturing',
        description: 'It can refer to creating components and assembling them into products. Embedded systems are used to control automated production systems, such as forges, mills, and assembly lines. These systems must work to extremely high precision.'
      },
      {
        name: 'Logistics',
        description: 'It refers to moving things from where they were made or assembled to where they need to be, either within a factory or for distribution to customers. Embedded technology is used in control of automated transport and lift systems plus sensors for component tracking.'
      },
      {
        name: 'Facilities',
        description: 'It can refer to site and building management systems, typically operating automated heating, ventilation, and air conditioning (HVAC), lighting, and security systems.'
      }
    ]

    for (const app of level3Applications) {
      const { error } = await supabase
        .from('topics')
        .insert({
          subject_id: subjectId,
          parent_topic_id: icsApps.id,
          name: app.name,
          description: app.description,
          hierarchy_level: 3
        })

      if (error) {
        console.error(`❌ Error creating "${app.name}":`, error)
      } else {
        console.log(`✅ Created: ${app.name} (Level 3)`)
      }
    }

    console.log('\n✨ Done! Added 10 new topics (1 Level 1, 4 Level 2, 5 Level 3)')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

addICSTopics().catch(console.error)
