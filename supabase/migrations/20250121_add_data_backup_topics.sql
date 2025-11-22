-- Add Data Backup topics to Asset Management

DO $$
DECLARE
  v_subject_id UUID;
  v_asset_mgmt_id UUID;
  v_data_backup_id UUID;
  v_enterprise_features_id UUID;
BEGIN
  -- Get Cybersecurity subject ID
  SELECT id INTO v_subject_id FROM subjects WHERE name = 'Cybersecurity';

  -- Get Asset Management ID
  SELECT id INTO v_asset_mgmt_id FROM topics
  WHERE name = 'Asset Management' AND subject_id = v_subject_id;

  -- Level 2: Data Backup
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
  VALUES (v_subject_id, v_asset_mgmt_id, 'Data Backup',
    'A security copy of production data made to removable media, typically according to a regular schedule. Different backup types (full, incremental, or differential) balance media capacity, time required to backup, and time required to restore. Backups play an essential role in asset protection by ensuring the availability and integrity of an organization''s critical data and systems. By creating copies of important information and storing them securely in separate locations, backups are a safety net in case of hardware failure, data corruption, or cyberattacks such as ransomware. Regularly testing and verifying backup data is crucial to ensuring the reliability of the recovery process. In an enterprise setting, simple backup techniques often prove insufficient to address large organizations'' unique challenges and requirements. Scalability becomes a critical concern when vast amounts of data need to be managed efficiently. Simple backup methods may struggle to accommodate growth in data size and complexity. Performance issues caused by simple backup techniques can disrupt business operations because they slow down applications while running and typically have lengthy recovery times. Additionally, enterprises demand greater granularity and customization to target specific applications, databases, or data subsets, which simple techniques often fail to provide. Compliance and security requirements necessitate advanced features such as data encryption, access control, and audit trails that simplistic approaches typically lack. Moreover, robust disaster recovery plans and centralized management are essential components of an enterprise backup strategy. Simple backup techniques might not support advanced features like off-site replication, automated failover, or streamlined management of the diverse systems and geographic locations that comprise a modern organization''s information technology environment.', 2)
  RETURNING id INTO v_data_backup_id;

  -- Level 3: Data Backup subtopics
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level) VALUES
    (v_subject_id, v_data_backup_id, 'Data Deduplication',
      'Data deduplication describes a data compression technique that optimizes storage space by identifying and eliminating redundant data. It works by analyzing data blocks within a dataset and comparing them to find identical blocks. Instead of storing multiple copies of the same data, deduplication stores a single copy and creates references or pointers to that copy for all other instances. Deduplication can be performed at different levels, such as file-level, block-level, or byte-level. Deduplication significantly minimizes storage requirements and improves data transfer efficiency, particularly in backup and data replication processes, by reducing the amount of duplicate data stored.', 3),
    (v_subject_id, v_data_backup_id, 'Backup Frequency',
      'Many dynamics influence data backup frequency requirements, including data volatility, regulatory requirements, system performance, architecture capabilities, and operational needs. Organizations with highly dynamic data or stringent regulatory mandates may opt for more frequent backups to minimize the risk of data loss and ensure compliance. Conversely, businesses with relatively stable data or less stringent regulatory oversight might choose less frequent backups, balancing data protection, data backup costs, and maintenance overhead. Ultimately, the optimal backup frequency is determined by carefully assessing an organization''s regulatory requirements, unique needs, risk tolerance, and resources.', 3),
    (v_subject_id, v_data_backup_id, 'On-site Backup',
      'Backup that writes job data to media that is stored in the same physical location as the production system.', 3),
    (v_subject_id, v_data_backup_id, 'Off-site Backup',
      'Backup that writes job data to media that is stored in a separate physical location to the production system.', 3),
    (v_subject_id, v_data_backup_id, 'Recovery Validation',
      'The operation to recover system functionality and/or data integrity using backup media. Critical recovery validation techniques play a vital role in ensuring the effectiveness and reliability of backup strategies. Organizations can identify potential issues and weaknesses in their data recovery processes by testing backups and making necessary improvements. One common technique is the full recovery test, which involves restoring an entire system from a backup to a separate environment and verifying the fully functional recovered system. This method helps ensure that all critical components, such as operating systems, applications, and data, can be restored and will function as expected. Another approach is the partial recovery test, where selected files, folders, or databases are restored to validate the integrity and consistency of specific data subsets. Organizations can perform regular backup audits, checking the backup logs, schedules, and configurations to ensure backups are created and maintained as intended and required. Furthermore, simulating disaster recovery scenarios, such as hardware failures or ransomware attacks, provides valuable insights into an organization''s preparedness and resilience. Recovery validation strategies are essential because backups can complete with "100% success" but mask issues until the backup set is used for a recovery. Additionally, many organizations are unaware of the time required to perform a recovery, as recovery times are often far longer than assumed!', 3);

  -- Level 3: Enterprise Backup Features
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
  VALUES (v_subject_id, v_data_backup_id, 'Enterprise Backup Features',
    'Advanced capabilities and functionalities required for enterprise-level backup solutions, including support for diverse environments, optimization techniques, rapid recovery, security features, and management tools.', 3)
  RETURNING id INTO v_enterprise_features_id;

  -- Level 4: Enterprise Backup Features subtopics
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level) VALUES
    (v_subject_id, v_enterprise_features_id, 'Support for various environments',
      'Support for various environments (virtual, physical, and cloud)', 4),
    (v_subject_id, v_enterprise_features_id, 'Data deduplication and compression',
      'Data deduplication and compression to optimize storage space', 4),
    (v_subject_id, v_enterprise_features_id, 'Instant recovery and replication',
      'Instant recovery and replication for quick failover', 4),
    (v_subject_id, v_enterprise_features_id, 'Ransomware protection and encryption',
      'Ransomware protection and encryption for data security', 4),
    (v_subject_id, v_enterprise_features_id, 'Granular restore options',
      'Granular restore options for individual files, folders, or applications', 4),
    (v_subject_id, v_enterprise_features_id, 'Reporting, monitoring, and alerting tools',
      'Reporting, monitoring, and alerting tools for effective management', 4),
    (v_subject_id, v_enterprise_features_id, 'Integration capabilities',
      'Integration with popular virtualization platforms, cloud providers, and storage systems', 4);

END $$;
