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

async function addDataBackupTopics() {
  console.log('Adding Data Backup topics...\n')

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

    // Add Data Backup (Level 2)
    const { data: dataBackup, error: dataBackupError } = await supabase
      .from('topics')
      .insert({
        subject_id: subjectId,
        parent_topic_id: assetMgmt.id,
        name: 'Data Backup',
        description: 'A security copy of production data made to removable media, typically according to a regular schedule. Different backup types (full, incremental, or differential) balance media capacity, time required to backup, and time required to restore. Backups play an essential role in asset protection by ensuring the availability and integrity of an organization\'s critical data and systems. By creating copies of important information and storing them securely in separate locations, backups are a safety net in case of hardware failure, data corruption, or cyberattacks such as ransomware. Regularly testing and verifying backup data is crucial to ensuring the reliability of the recovery process. In an enterprise setting, simple backup techniques often prove insufficient to address large organizations\' unique challenges and requirements. Scalability becomes a critical concern when vast amounts of data need to be managed efficiently. Simple backup methods may struggle to accommodate growth in data size and complexity. Performance issues caused by simple backup techniques can disrupt business operations because they slow down applications while running and typically have lengthy recovery times. Additionally, enterprises demand greater granularity and customization to target specific applications, databases, or data subsets, which simple techniques often fail to provide. Compliance and security requirements necessitate advanced features such as data encryption, access control, and audit trails that simplistic approaches typically lack. Moreover, robust disaster recovery plans and centralized management are essential components of an enterprise backup strategy. Simple backup techniques might not support advanced features like off-site replication, automated failover, or streamlined management of the diverse systems and geographic locations that comprise a modern organization\'s information technology environment.',
        hierarchy_level: 2
      })
      .select()
      .single()

    if (dataBackupError) {
      console.error('❌ Error creating Data Backup:', dataBackupError)
      return
    }

    console.log('✅ Created: Data Backup (Level 2)')

    // Add Data Backup subtopics (Level 3)
    const backupSubtopics = [
      {
        name: 'Data Deduplication',
        description: 'Data deduplication describes a data compression technique that optimizes storage space by identifying and eliminating redundant data. It works by analyzing data blocks within a dataset and comparing them to find identical blocks. Instead of storing multiple copies of the same data, deduplication stores a single copy and creates references or pointers to that copy for all other instances. Deduplication can be performed at different levels, such as file-level, block-level, or byte-level. Deduplication significantly minimizes storage requirements and improves data transfer efficiency, particularly in backup and data replication processes, by reducing the amount of duplicate data stored.'
      },
      {
        name: 'Backup Frequency',
        description: 'Many dynamics influence data backup frequency requirements, including data volatility, regulatory requirements, system performance, architecture capabilities, and operational needs. Organizations with highly dynamic data or stringent regulatory mandates may opt for more frequent backups to minimize the risk of data loss and ensure compliance. Conversely, businesses with relatively stable data or less stringent regulatory oversight might choose less frequent backups, balancing data protection, data backup costs, and maintenance overhead. Ultimately, the optimal backup frequency is determined by carefully assessing an organization\'s regulatory requirements, unique needs, risk tolerance, and resources.'
      },
      {
        name: 'On-site Backup',
        description: 'Backup that writes job data to media that is stored in the same physical location as the production system.'
      },
      {
        name: 'Off-site Backup',
        description: 'Backup that writes job data to media that is stored in a separate physical location to the production system.'
      },
      {
        name: 'Recovery Validation',
        description: 'The operation to recover system functionality and/or data integrity using backup media. Critical recovery validation techniques play a vital role in ensuring the effectiveness and reliability of backup strategies. Organizations can identify potential issues and weaknesses in their data recovery processes by testing backups and making necessary improvements. One common technique is the full recovery test, which involves restoring an entire system from a backup to a separate environment and verifying the fully functional recovered system. This method helps ensure that all critical components, such as operating systems, applications, and data, can be restored and will function as expected. Another approach is the partial recovery test, where selected files, folders, or databases are restored to validate the integrity and consistency of specific data subsets. Organizations can perform regular backup audits, checking the backup logs, schedules, and configurations to ensure backups are created and maintained as intended and required. Furthermore, simulating disaster recovery scenarios, such as hardware failures or ransomware attacks, provides valuable insights into an organization\'s preparedness and resilience. Recovery validation strategies are essential because backups can complete with "100% success" but mask issues until the backup set is used for a recovery. Additionally, many organizations are unaware of the time required to perform a recovery, as recovery times are often far longer than assumed!'
      }
    ]

    for (const subtopic of backupSubtopics) {
      const { error } = await supabase
        .from('topics')
        .insert({
          subject_id: subjectId,
          parent_topic_id: dataBackup.id,
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

    // Add Enterprise Backup Features (Level 3)
    const { data: enterpriseFeatures, error: enterpriseFeaturesError } = await supabase
      .from('topics')
      .insert({
        subject_id: subjectId,
        parent_topic_id: dataBackup.id,
        name: 'Enterprise Backup Features',
        description: 'Advanced capabilities and functionalities required for enterprise-level backup solutions, including support for diverse environments, optimization techniques, rapid recovery, security features, and management tools.',
        hierarchy_level: 3
      })
      .select()
      .single()

    if (enterpriseFeaturesError) {
      console.error('❌ Error creating Enterprise Backup Features:', enterpriseFeaturesError)
      return
    }

    console.log('✅ Created: Enterprise Backup Features (Level 3)')

    // Add Enterprise Backup Features subtopics (Level 4)
    const enterpriseFeaturesList = [
      {
        name: 'Support for various environments',
        description: 'Support for various environments (virtual, physical, and cloud)'
      },
      {
        name: 'Data deduplication and compression',
        description: 'Data deduplication and compression to optimize storage space'
      },
      {
        name: 'Instant recovery and replication',
        description: 'Instant recovery and replication for quick failover'
      },
      {
        name: 'Ransomware protection and encryption',
        description: 'Ransomware protection and encryption for data security'
      },
      {
        name: 'Granular restore options',
        description: 'Granular restore options for individual files, folders, or applications'
      },
      {
        name: 'Reporting, monitoring, and alerting tools',
        description: 'Reporting, monitoring, and alerting tools for effective management'
      },
      {
        name: 'Integration capabilities',
        description: 'Integration with popular virtualization platforms, cloud providers, and storage systems'
      }
    ]

    for (const feature of enterpriseFeaturesList) {
      const { error } = await supabase
        .from('topics')
        .insert({
          subject_id: subjectId,
          parent_topic_id: enterpriseFeatures.id,
          name: feature.name,
          description: feature.description,
          hierarchy_level: 4
        })

      if (error) {
        console.error(`❌ Error creating "${feature.name}":`, error)
      } else {
        console.log(`✅ Created: ${feature.name} (Level 4)`)
      }
    }

    console.log('\n✨ Done! Added 14 new topics (1 Level 2, 6 Level 3, 7 Level 4)')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

addDataBackupTopics().catch(console.error)
