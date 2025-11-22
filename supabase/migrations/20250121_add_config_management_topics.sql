-- Add Configuration Management and Change Control topics to Asset Management

DO $$
DECLARE
  v_subject_id UUID;
  v_asset_mgmt_id UUID;
  v_itil_config_id UUID;
BEGIN
  -- Get Cybersecurity subject ID
  SELECT id INTO v_subject_id FROM subjects WHERE name = 'Cybersecurity';

  -- Get Asset Management ID
  SELECT id INTO v_asset_mgmt_id FROM topics
  WHERE name = 'Asset Management' AND subject_id = v_subject_id;

  -- Level 2: Standard Naming Convention
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
  VALUES (v_subject_id, v_asset_mgmt_id, 'Standard Naming Convention',
    'Applying consistent names and labels to assets and digital resources/identities within a configuration management system. A standard naming convention makes the environment more consistent for hardware assets and for digital assets such as accounts and virtual machines. The naming strategy should allow administrators to identify the type and function of any particular resource or location at any point in the configuration management database (CMDB) or network directory. Each label should conform to rules for host and DNS names (support.microsoft.com/en-us/help/909264/naming-conventions-in-active-directory-for-computers-domains-sites-and). As well as an ID attribute, the location and function of tangible and digital assets can be recorded using attribute tags and fields or DNS CNAME and TXT resource records.', 2);

  -- Level 2: Configuration Management
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
  VALUES (v_subject_id, v_asset_mgmt_id, 'Configuration Management',
    'A process through which an organization''s information systems components are kept in a controlled state that meets the organization''s requirements, including those for security and compliance. Configuration management ensures that each configurable element within an asset inventory has not diverged from its approved configuration. Change control and change management reduce the risk that changes to these components could cause an interruption to the organization''s operations.', 2);

  -- Level 2: Change Control
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
  VALUES (v_subject_id, v_asset_mgmt_id, 'Change Control',
    'The process by which the need for change is recorded and approved.', 2);

  -- Level 2: Change Management
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
  VALUES (v_subject_id, v_asset_mgmt_id, 'Change Management',
    'The process through which changes to the configuration of information systems are implemented as part of the organization''s overall configuration management efforts.', 2);

  -- Level 2: ITIL Configuration Management
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
  VALUES (v_subject_id, v_asset_mgmt_id, 'ITIL Configuration Management',
    'The ITIL (Information Technology Infrastructure Library) framework for managing IT assets and configurations, encompassing service assets, configuration items, baseline configurations, and configuration management systems.', 2)
  RETURNING id INTO v_itil_config_id;

  -- Level 3: ITIL Configuration Management subtopics
  INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level) VALUES
    (v_subject_id, v_itil_config_id, 'Service assets',
      'Service assets are things, processes, or people that contribute to delivering an IT service.', 3),
    (v_subject_id, v_itil_config_id, 'Configuration Item (CI)',
      'A Configuration Item (CI) is an asset that requires specific management procedures to be used to deliver the service. Each CI must be labeled, ideally using a standard naming convention. CIs are defined by their attributes and relationships stored in a configuration management database (CMDB).', 3),
    (v_subject_id, v_itil_config_id, 'Baseline configuration',
      'A baseline configuration is a list of settings that an asset, such as a server or application, must adhere to. Security baselines describe the minimum set of security configuration settings a device or software must maintain to be considered adequately protected.', 3),
    (v_subject_id, v_itil_config_id, 'Configuration management system (CMS)',
      'A configuration management system (CMS) describes the tools and databases used to collect, store, manage, update, and report information about CIs. A small network might capture this information in spreadsheets and diagrams, whereas a large organization may invest in dedicated applications designed for enterprise environments.', 3);

END $$;
