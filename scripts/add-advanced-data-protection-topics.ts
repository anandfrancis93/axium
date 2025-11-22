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

async function addAdvancedDataProtectionTopics() {
  console.log('Adding Advanced Data Protection topics...\n')

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

    // Get Data Backup ID
    const { data: dataBackup, error: dataBackupError } = await supabase
      .from('topics')
      .select('id')
      .eq('name', 'Data Backup')
      .eq('subject_id', subjectId)
      .single()

    if (dataBackupError || !dataBackup) {
      console.error('❌ Error finding Data Backup topic:', dataBackupError)
      return
    }

    // Add Advanced Data Protection (Level 3)
    const { data: advancedProtection, error: advancedProtectionError } = await supabase
      .from('topics')
      .insert({
        subject_id: subjectId,
        parent_topic_id: dataBackup.id,
        name: 'Advanced Data Protection',
        description: 'Advanced techniques and methods for protecting data beyond traditional backups, including snapshots, replication, journaling, and encryption strategies to ensure data availability, integrity, and security.',
        hierarchy_level: 3
      })
      .select()
      .single()

    if (advancedProtectionError) {
      console.error('❌ Error creating Advanced Data Protection:', advancedProtectionError)
      return
    }

    console.log('✅ Created: Advanced Data Protection (Level 3)')

    // Add Snapshots (Level 4)
    const { data: snapshots, error: snapshotsError } = await supabase
      .from('topics')
      .insert({
        subject_id: subjectId,
        parent_topic_id: advancedProtection.id,
        name: 'Snapshots',
        description: 'Used to create the entire architectural instance/copy of an application, disk, or system. It is often used in backup processes to provide rollback points that can restore the system or disk of a particular device to a specific time. While snapshots assist in backup strategies, they are not the same as image backups and depend on the original data. Snapshots play a vital role in data protection and recovery, capturing the state of a system at a specific point in time. Virtual Machine (VM), filesystem, and Storage Area Network (SAN) snapshots are three different types, each targeting a particular level of the storage hierarchy.',
        hierarchy_level: 4
      })
      .select()
      .single()

    if (snapshotsError) {
      console.error('❌ Error creating Snapshots:', snapshotsError)
      return
    }

    console.log('✅ Created: Snapshots (Level 4)')

    // Add Snapshot types (Level 5)
    const snapshotTypes = [
      {
        name: 'VM Snapshots',
        description: 'VM Snapshots, such as those created in VMware vSphere or Microsoft Hyper-V, capture the state of a virtual machine, including its memory, storage, and configuration settings. This allows administrators to roll back the VM to a previous state in case of failures, data corruption, or during software testing.'
      },
      {
        name: 'Filesystem Snapshots',
        description: 'Filesystem Snapshots, like those provided by ZFS or Btrfs, capture the state of a file system at a given moment, enabling users to recover accidentally deleted files or restore previous versions of files in case of data corruption.'
      },
      {
        name: 'SAN Snapshots',
        description: 'SAN Snapshots are taken at the block-level storage layer within a storage area network. Examples include snapshots in NetApp or Dell EMC storage systems, which capture the state of the entire storage volume, allowing for rapid recovery of large datasets and applications.'
      }
    ]

    for (const type of snapshotTypes) {
      const { error } = await supabase
        .from('topics')
        .insert({
          subject_id: subjectId,
          parent_topic_id: snapshots.id,
          name: type.name,
          description: type.description,
          hierarchy_level: 5
        })

      if (error) {
        console.error(`❌ Error creating "${type.name}":`, error)
      } else {
        console.log(`✅ Created: ${type.name} (Level 5)`)
      }
    }

    // Add other Level 4 topics
    const level4Topics = [
      {
        name: 'Replication',
        description: 'Replication and journaling are data protection methods that ensure data availability and integrity by maintaining multiple copies and tracking changes to data. Replication involves creating and maintaining exact copies of data on different storage systems or locations. Organizations can safeguard against data loss due to hardware failures, human errors, or malicious attacks by having redundant copies of the data. In the event of a failure, the replicated data can be utilized to restore the system to its original state. A practical example of replication is database mirroring, where an organization maintains primary and secondary mirrored databases. Any changes made to the primary database are automatically replicated to the secondary database, ensuring data consistency and availability if the primary database encounters any issues.'
      },
      {
        name: 'Journaling',
        description: 'A method used by file systems to record changes not yet made to the file system in an object called a journal. Journaling records changes to data in a separate, dedicated log known as a journal. Organizations can track and monitor data modifications and revert to previous states if necessary. Journaling is beneficial for data recovery in system crashes. It enables the system to identify and undo any incomplete transactions that might have caused inconsistencies, or replay transactions that occurred after the full system backup was completed. This provides greater granularity for restores and greatly minimizes data loss. A practical example of journaling is using file system journaling, such as the Journaled File System (JFS) or the New Technology File System (NTFS), with journaling enabled. These file systems maintain a record of all changes made to files, allowing for data recovery and consistency checks after unexpected system shutdowns or crashes.'
      },
      {
        name: 'SAN Replication',
        description: 'SAN replication duplicates data from one SAN to another in real time or near real time, providing redundancy and protection against hardware failures, human errors, or data corruption. This technique involves synchronous replication, which guarantees data consistency, and asynchronous replication, which is more cost-effective but slightly less stringent in consistency.'
      },
      {
        name: 'VM Replication',
        description: 'VM replication creates and maintains an up-to-date copy of a virtual machine on a separate host or location, ensuring that a secondary VM can quickly take over the workload in the event of a primary VM failure or corruption. By implementing these methods, organizations can bolster their data protection strategies, safeguarding against various risks and ensuring the availability and integrity of their critical data and systems.'
      },
      {
        name: 'Encrypting Backups',
        description: 'Encryption of backups is essential for various reasons, primarily data security, privacy, and compliance. By encrypting backups, organizations add an extra layer of protection against unauthorized access or theft, ensuring that sensitive data remains unreadable without the appropriate decryption key. This is particularly crucial for businesses dealing with sensitive customer data, intellectual property, or trade secrets, as unauthorized access can lead to severe reputational damage, financial loss, or legal consequences. Copies of sensitive data stored in backup sets are often overlooked, so many industries and jurisdictions have regulations that mandate the protection of sensitive data stored in backups. Encrypting backups helps organizations meet these regulatory requirements and avoid fines, penalties, or legal actions resulting from noncompliance.'
      }
    ]

    for (const topic of level4Topics) {
      const { error } = await supabase
        .from('topics')
        .insert({
          subject_id: subjectId,
          parent_topic_id: advancedProtection.id,
          name: topic.name,
          description: topic.description,
          hierarchy_level: 4
        })

      if (error) {
        console.error(`❌ Error creating "${topic.name}":`, error)
      } else {
        console.log(`✅ Created: ${topic.name} (Level 4)`)
      }
    }

    console.log('\n✨ Done! Added 9 new topics (1 Level 3, 5 Level 4, 3 Level 5)')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

addAdvancedDataProtectionTopics().catch(console.error)
