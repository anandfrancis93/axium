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

async function addConfigManagementTopics() {
  console.log('Adding Configuration Management and Change Control topics...\n')

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

    // Get Asset Management ID
    const { data: assetMgmt, error: assetMgmtError } = await supabase
      .from('topics')
      .select('id')
      .eq('name', 'Asset Management')
      .eq('subject_id', subjectId)
      .single()

    if (assetMgmtError || !assetMgmt) {
      console.error('❌ Error finding Asset Management topic:', assetMgmtError)
      return
    }

    // Add Standard Naming Convention (Level 2)
    const { error: namingError } = await supabase
      .from('topics')
      .insert({
        subject_id: subjectId,
        parent_topic_id: assetMgmt.id,
        name: 'Standard Naming Convention',
        description: 'Applying consistent names and labels to assets and digital resources/identities within a configuration management system. A standard naming convention makes the environment more consistent for hardware assets and for digital assets such as accounts and virtual machines. The naming strategy should allow administrators to identify the type and function of any particular resource or location at any point in the configuration management database (CMDB) or network directory. Each label should conform to rules for host and DNS names (support.microsoft.com/en-us/help/909264/naming-conventions-in-active-directory-for-computers-domains-sites-and). As well as an ID attribute, the location and function of tangible and digital assets can be recorded using attribute tags and fields or DNS CNAME and TXT resource records.',
        hierarchy_level: 2
      })

    if (namingError) {
      console.error('❌ Error creating Standard Naming Convention:', namingError)
    } else {
      console.log('✅ Created: Standard Naming Convention (Level 2)')
    }

    // Add Configuration Management (Level 2)
    const { error: configMgmtError } = await supabase
      .from('topics')
      .insert({
        subject_id: subjectId,
        parent_topic_id: assetMgmt.id,
        name: 'Configuration Management',
        description: 'A process through which an organization\'s information systems components are kept in a controlled state that meets the organization\'s requirements, including those for security and compliance. Configuration management ensures that each configurable element within an asset inventory has not diverged from its approved configuration. Change control and change management reduce the risk that changes to these components could cause an interruption to the organization\'s operations.',
        hierarchy_level: 2
      })

    if (configMgmtError) {
      console.error('❌ Error creating Configuration Management:', configMgmtError)
    } else {
      console.log('✅ Created: Configuration Management (Level 2)')
    }

    // Add Change Control (Level 2)
    const { error: changeControlError } = await supabase
      .from('topics')
      .insert({
        subject_id: subjectId,
        parent_topic_id: assetMgmt.id,
        name: 'Change Control',
        description: 'The process by which the need for change is recorded and approved.',
        hierarchy_level: 2
      })

    if (changeControlError) {
      console.error('❌ Error creating Change Control:', changeControlError)
    } else {
      console.log('✅ Created: Change Control (Level 2)')
    }

    // Add Change Management (Level 2)
    const { error: changeMgmtError } = await supabase
      .from('topics')
      .insert({
        subject_id: subjectId,
        parent_topic_id: assetMgmt.id,
        name: 'Change Management',
        description: 'The process through which changes to the configuration of information systems are implemented as part of the organization\'s overall configuration management efforts.',
        hierarchy_level: 2
      })

    if (changeMgmtError) {
      console.error('❌ Error creating Change Management:', changeMgmtError)
    } else {
      console.log('✅ Created: Change Management (Level 2)')
    }

    // Add ITIL Configuration Management (Level 2)
    const { data: itilConfig, error: itilConfigError } = await supabase
      .from('topics')
      .insert({
        subject_id: subjectId,
        parent_topic_id: assetMgmt.id,
        name: 'ITIL Configuration Management',
        description: 'The ITIL (Information Technology Infrastructure Library) framework for managing IT assets and configurations, encompassing service assets, configuration items, baseline configurations, and configuration management systems.',
        hierarchy_level: 2
      })
      .select()
      .single()

    if (itilConfigError) {
      console.error('❌ Error creating ITIL Configuration Management:', itilConfigError)
      return
    }

    console.log('✅ Created: ITIL Configuration Management (Level 2)')

    // Add ITIL Configuration Management subtopics (Level 3)
    const itilSubtopics = [
      {
        name: 'Service assets',
        description: 'Service assets are things, processes, or people that contribute to delivering an IT service.'
      },
      {
        name: 'Configuration Item (CI)',
        description: 'A Configuration Item (CI) is an asset that requires specific management procedures to be used to deliver the service. Each CI must be labeled, ideally using a standard naming convention. CIs are defined by their attributes and relationships stored in a configuration management database (CMDB).'
      },
      {
        name: 'Baseline configuration',
        description: 'A baseline configuration is a list of settings that an asset, such as a server or application, must adhere to. Security baselines describe the minimum set of security configuration settings a device or software must maintain to be considered adequately protected.'
      },
      {
        name: 'Configuration management system (CMS)',
        description: 'A configuration management system (CMS) describes the tools and databases used to collect, store, manage, update, and report information about CIs. A small network might capture this information in spreadsheets and diagrams, whereas a large organization may invest in dedicated applications designed for enterprise environments.'
      }
    ]

    for (const subtopic of itilSubtopics) {
      const { error } = await supabase
        .from('topics')
        .insert({
          subject_id: subjectId,
          parent_topic_id: itilConfig.id,
          name: subtopic.name,
          description: subtopic.description,
          hierarchy_level: 3
        })

      if (error) {
        console.error(`❌ Error creating "${subtopic.name}":`, error)
      } else {
        console.log(`✅ Created: ${subtopic.name} (Level 3)`)
      }
    }

    console.log('\n✨ Done! Added 9 new topics (5 Level 2, 4 Level 3)')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

addConfigManagementTopics().catch(console.error)
