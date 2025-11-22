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

async function addSecureDataDestructionTopics() {
  console.log('Adding Secure Data Destruction topics...\n')

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

    // Add Secure Data Destruction (Level 2)
    const { data: secureDestruction, error: secureDestructionError } = await supabase
      .from('topics')
      .insert({
        subject_id: subjectId,
        parent_topic_id: assetMgmt.id,
        name: 'Secure Data Destruction',
        description: 'The methods and techniques used to permanently and securely remove data from storage devices to prevent unauthorized access or recovery, including specialized approaches for different storage technologies and compliance with data protection regulations.',
        hierarchy_level: 2
      })
      .select()
      .single()

    if (secureDestructionError) {
      console.error('❌ Error creating Secure Data Destruction:', secureDestructionError)
      return
    }

    console.log('✅ Created: Secure Data Destruction (Level 2)')

    // Add storage device types (Level 3)
    const storageTypes = [
      {
        name: 'Hard Disk Drive (HDD)',
        description: 'Data wiping methods such as overwriting with zeros or multiple patterns can be effective. This process can include a single pass of zeros or more complex patterns involving multiple passes to thwart attempts at data recovery.'
      },
      {
        name: 'Solid-State Drives (SSD)',
        description: 'Traditional overwriting methods are less effective due to wear leveling and bad block management. Instead, use commands such as the ATA Secure Erase, which are designed to handle the specific challenges of SSD technology by instructing the drive\'s firmware to internally sanitize all stored data, including that within inaccessible marked-as-bad memory cells.'
      }
    ]

    for (const type of storageTypes) {
      const { error } = await supabase
        .from('topics')
        .insert({
          subject_id: subjectId,
          parent_topic_id: secureDestruction.id,
          name: type.name,
          description: type.description,
          hierarchy_level: 3
        })

      if (error) {
        console.error(`❌ Error creating "${type.name}":`, error)
      } else {
        console.log(`✅ Created: ${type.name} (Level 3)`)
      }
    }

    // Add Asset Disposal / Decommissioning (Level 3)
    const { data: assetDisposal, error: assetDisposalError } = await supabase
      .from('topics')
      .insert({
        subject_id: subjectId,
        parent_topic_id: secureDestruction.id,
        name: 'Asset Disposal / Decommissioning',
        description: 'In asset management, the policies and procedures that govern the removal of devices and software from production networks, and their subsequent disposal through sale, donation, or as waste.',
        hierarchy_level: 3
      })
      .select()
      .single()

    if (assetDisposalError) {
      console.error('❌ Error creating Asset Disposal / Decommissioning:', assetDisposalError)
      return
    }

    console.log('✅ Created: Asset Disposal / Decommissioning (Level 3)')

    // Add Asset Disposal methods (Level 4)
    const disposalMethods = [
      {
        name: 'Sanitization',
        description: 'The process of thoroughly and completely removing data from a storage medium so that file remnants cannot be recovered. Refers to the process of removing sensitive information from storage media to prevent unauthorized access or data breaches. This process uses specialized techniques, such as data wiping, degaussing, or encryption, to ensure that the data becomes irretrievable. Sanitization is particularly important when repurposing or donating storage devices, as it helps protect the organization\'s sensitive information and maintains compliance with data protection regulations.'
      },
      {
        name: 'Destruction',
        description: 'An asset disposal technique that ensures that data remnants are rendered physically inaccessible and irrevocable, through degaussing, shredding, or incineration. Involves the physical or electronic elimination of information stored on media, rendering it inaccessible and irrecoverable. Physical destruction methods include shredding, crushing, or incinerating storage devices, while electronic destruction involves overwriting data multiple times or using degaussing techniques to eliminate magnetic fields on storage media. Destruction is a crucial step in the decommissioning process and ensures that sensitive data cannot be retrieved or misused after the disposal of storage devices.'
      },
      {
        name: 'Certification',
        description: 'An asset disposal technique that relies on a third party to use sanitization or destruction methods for data remnant removal, and provides documentary evidence that the process is complete and successful. Refers to the documentation and verification of the data sanitization or destruction process. This often involves obtaining a certificate of destruction or sanitization from a reputable third-party provider, attesting that the data has been securely removed or destroyed in accordance with industry standards and regulations. Certification helps organizations maintain compliance with data protection requirements, provides evidence of due diligence, and reduces the risk of legal liabilities. Certifying data destruction without third-party involvement can be challenging, as the latter provides an impartial evaluation.'
      }
    ]

    for (const method of disposalMethods) {
      const { error } = await supabase
        .from('topics')
        .insert({
          subject_id: subjectId,
          parent_topic_id: assetDisposal.id,
          name: method.name,
          description: method.description,
          hierarchy_level: 4
        })

      if (error) {
        console.error(`❌ Error creating "${method.name}":`, error)
      } else {
        console.log(`✅ Created: ${method.name} (Level 4)`)
      }
    }

    console.log('\n✨ Done! Added 6 new topics (1 Level 2, 3 Level 3, 3 Level 4)')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

addSecureDataDestructionTopics().catch(console.error)
