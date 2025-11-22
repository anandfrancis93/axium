-- Add Advanced Data Protection topics to Data Backup

DO $$
DECLARE
  v_subject_id UUID;
  v_data_backup_id UUID;
  v_advanced_protection_id UUID;
  v_snapshots_id UUID;
BEGIN
  -- Get Cybersecurity subject ID
  SELECT id INTO v_subject_id FROM subjects WHERE name = 'Cybersecurity';

  -- Get Data Backup ID
  SELECT id INTO v_data_backup_id FROM topics
  WHERE name = 'Data Backup' AND subject_id = v_subject_id;

  -- Level 3: Advanced Data Protection
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
  VALUES (v_subject_id, v_data_backup_id, 'Advanced Data Protection',
    'Advanced techniques and methods for protecting data beyond traditional backups, including snapshots, replication, journaling, and encryption strategies to ensure data availability, integrity, and security.', 3)
  RETURNING id INTO v_advanced_protection_id;

  -- Level 4: Snapshots
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
  VALUES (v_subject_id, v_advanced_protection_id, 'Snapshots',
    'Used to create the entire architectural instance/copy of an application, disk, or system. It is often used in backup processes to provide rollback points that can restore the system or disk of a particular device to a specific time. While snapshots assist in backup strategies, they are not the same as image backups and depend on the original data. Snapshots play a vital role in data protection and recovery, capturing the state of a system at a specific point in time. Virtual Machine (VM), filesystem, and Storage Area Network (SAN) snapshots are three different types, each targeting a particular level of the storage hierarchy.', 4)
  RETURNING id INTO v_snapshots_id;

  -- Level 5: Snapshot types
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level) VALUES
    (v_subject_id, v_snapshots_id, 'VM Snapshots',
      'VM Snapshots, such as those created in VMware vSphere or Microsoft Hyper-V, capture the state of a virtual machine, including its memory, storage, and configuration settings. This allows administrators to roll back the VM to a previous state in case of failures, data corruption, or during software testing.', 5),
    (v_subject_id, v_snapshots_id, 'Filesystem Snapshots',
      'Filesystem Snapshots, like those provided by ZFS or Btrfs, capture the state of a file system at a given moment, enabling users to recover accidentally deleted files or restore previous versions of files in case of data corruption.', 5),
    (v_subject_id, v_snapshots_id, 'SAN Snapshots',
      'SAN Snapshots are taken at the block-level storage layer within a storage area network. Examples include snapshots in NetApp or Dell EMC storage systems, which capture the state of the entire storage volume, allowing for rapid recovery of large datasets and applications.', 5);

  -- Level 4: Replication
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
  VALUES (v_subject_id, v_advanced_protection_id, 'Replication',
    'Replication and journaling are data protection methods that ensure data availability and integrity by maintaining multiple copies and tracking changes to data. Replication involves creating and maintaining exact copies of data on different storage systems or locations. Organizations can safeguard against data loss due to hardware failures, human errors, or malicious attacks by having redundant copies of the data. In the event of a failure, the replicated data can be utilized to restore the system to its original state. A practical example of replication is database mirroring, where an organization maintains primary and secondary mirrored databases. Any changes made to the primary database are automatically replicated to the secondary database, ensuring data consistency and availability if the primary database encounters any issues.', 4);

  -- Level 4: Journaling
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
  VALUES (v_subject_id, v_advanced_protection_id, 'Journaling',
    'A method used by file systems to record changes not yet made to the file system in an object called a journal. Journaling records changes to data in a separate, dedicated log known as a journal. Organizations can track and monitor data modifications and revert to previous states if necessary. Journaling is beneficial for data recovery in system crashes. It enables the system to identify and undo any incomplete transactions that might have caused inconsistencies, or replay transactions that occurred after the full system backup was completed. This provides greater granularity for restores and greatly minimizes data loss. A practical example of journaling is using file system journaling, such as the Journaled File System (JFS) or the New Technology File System (NTFS), with journaling enabled. These file systems maintain a record of all changes made to files, allowing for data recovery and consistency checks after unexpected system shutdowns or crashes.', 4);

  -- Level 4: SAN Replication
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
  VALUES (v_subject_id, v_advanced_protection_id, 'SAN Replication',
    'SAN replication duplicates data from one SAN to another in real time or near real time, providing redundancy and protection against hardware failures, human errors, or data corruption. This technique involves synchronous replication, which guarantees data consistency, and asynchronous replication, which is more cost-effective but slightly less stringent in consistency.', 4);

  -- Level 4: VM Replication
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
  VALUES (v_subject_id, v_advanced_protection_id, 'VM Replication',
    'VM replication creates and maintains an up-to-date copy of a virtual machine on a separate host or location, ensuring that a secondary VM can quickly take over the workload in the event of a primary VM failure or corruption. By implementing these methods, organizations can bolster their data protection strategies, safeguarding against various risks and ensuring the availability and integrity of their critical data and systems.', 4);

  -- Level 4: Encrypting Backups
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
  VALUES (v_subject_id, v_advanced_protection_id, 'Encrypting Backups',
    'Encryption of backups is essential for various reasons, primarily data security, privacy, and compliance. By encrypting backups, organizations add an extra layer of protection against unauthorized access or theft, ensuring that sensitive data remains unreadable without the appropriate decryption key. This is particularly crucial for businesses dealing with sensitive customer data, intellectual property, or trade secrets, as unauthorized access can lead to severe reputational damage, financial loss, or legal consequences. Copies of sensitive data stored in backup sets are often overlooked, so many industries and jurisdictions have regulations that mandate the protection of sensitive data stored in backups. Encrypting backups helps organizations meet these regulatory requirements and avoid fines, penalties, or legal actions resulting from noncompliance.', 4);

END $$;
