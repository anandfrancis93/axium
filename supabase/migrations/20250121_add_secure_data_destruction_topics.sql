-- Add Secure Data Destruction topics to Asset Management

DO $$
DECLARE
  v_subject_id UUID;
  v_asset_mgmt_id UUID;
  v_secure_destruction_id UUID;
  v_asset_disposal_id UUID;
BEGIN
  -- Get Cybersecurity subject ID
  SELECT id INTO v_subject_id FROM subjects WHERE name = 'Cybersecurity';

  -- Get Asset Management ID
  SELECT id INTO v_asset_mgmt_id FROM topics
  WHERE name = 'Asset Management' AND subject_id = v_subject_id;

  -- Level 2: Secure Data Destruction
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
  VALUES (v_subject_id, v_asset_mgmt_id, 'Secure Data Destruction',
    'The methods and techniques used to permanently and securely remove data from storage devices to prevent unauthorized access or recovery, including specialized approaches for different storage technologies and compliance with data protection regulations.', 2)
  RETURNING id INTO v_secure_destruction_id;

  -- Level 3: Hard Disk Drive (HDD)
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
  VALUES (v_subject_id, v_secure_destruction_id, 'Hard Disk Drive (HDD)',
    'Data wiping methods such as overwriting with zeros or multiple patterns can be effective. This process can include a single pass of zeros or more complex patterns involving multiple passes to thwart attempts at data recovery.', 3);

  -- Level 3: Solid-State Drives (SSD)
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
  VALUES (v_subject_id, v_secure_destruction_id, 'Solid-State Drives (SSD)',
    'Traditional overwriting methods are less effective due to wear leveling and bad block management. Instead, use commands such as the ATA Secure Erase, which are designed to handle the specific challenges of SSD technology by instructing the drive''s firmware to internally sanitize all stored data, including that within inaccessible marked-as-bad memory cells.', 3);

  -- Level 3: Asset Disposal / Decommissioning
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
  VALUES (v_subject_id, v_secure_destruction_id, 'Asset Disposal / Decommissioning',
    'In asset management, the policies and procedures that govern the removal of devices and software from production networks, and their subsequent disposal through sale, donation, or as waste.', 3)
  RETURNING id INTO v_asset_disposal_id;

  -- Level 4: Asset Disposal / Decommissioning subtopics
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level) VALUES
    (v_subject_id, v_asset_disposal_id, 'Sanitization',
      'The process of thoroughly and completely removing data from a storage medium so that file remnants cannot be recovered. Refers to the process of removing sensitive information from storage media to prevent unauthorized access or data breaches. This process uses specialized techniques, such as data wiping, degaussing, or encryption, to ensure that the data becomes irretrievable. Sanitization is particularly important when repurposing or donating storage devices, as it helps protect the organization''s sensitive information and maintains compliance with data protection regulations.', 4),
    (v_subject_id, v_asset_disposal_id, 'Destruction',
      'An asset disposal technique that ensures that data remnants are rendered physically inaccessible and irrevocable, through degaussing, shredding, or incineration. Involves the physical or electronic elimination of information stored on media, rendering it inaccessible and irrecoverable. Physical destruction methods include shredding, crushing, or incinerating storage devices, while electronic destruction involves overwriting data multiple times or using degaussing techniques to eliminate magnetic fields on storage media. Destruction is a crucial step in the decommissioning process and ensures that sensitive data cannot be retrieved or misused after the disposal of storage devices.', 4),
    (v_subject_id, v_asset_disposal_id, 'Certification',
      'An asset disposal technique that relies on a third party to use sanitization or destruction methods for data remnant removal, and provides documentary evidence that the process is complete and successful. Refers to the documentation and verification of the data sanitization or destruction process. This often involves obtaining a certificate of destruction or sanitization from a reputable third-party provider, attesting that the data has been securely removed or destroyed in accordance with industry standards and regulations. Certification helps organizations maintain compliance with data protection requirements, provides evidence of due diligence, and reduces the risk of legal liabilities. Certifying data destruction without third-party involvement can be challenging, as the latter provides an impartial evaluation.', 4);

END $$;
