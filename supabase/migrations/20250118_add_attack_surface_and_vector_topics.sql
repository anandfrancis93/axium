-- Add attack surface, threat vectors, and supply chain topics with formal definitions
-- subject_id: c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9 (Cybersecurity)

-- =============================================================================
-- LEVEL 3 TOPICS (Top-level)
-- =============================================================================

INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
VALUES
  -- Attack Surface & Vectors
  ('c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9', NULL,
   'Attack Surface',
   'The attack surface is all the points at which a malicious threat actor could try to exploit a vulnerability. Any location or method where a threat actor can interact with a network port, app, computer, or user is part of a potential attack surface.',
   3),
  ('c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9', NULL,
   'Threat Vector',
   'A specific path by which a threat actor gains unauthorized access to a system.',
   3),

  -- Software Vulnerabilities
  ('c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9', NULL,
   'Vulnerable Software',
   'Weakness that could be triggered accidentally or exploited intentionally to cause a security breach.',
   3),
  ('c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9', NULL,
   'Unsupported Systems / Applications',
   'Product life cycle phase where mainstream vendor support is no longer available.',
   3),
  ('c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9', NULL,
   'Client-Based Software',
   'The agent runs as a scanning process installed on each host and reports to a management server.',
   3),
  ('c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9', NULL,
   'Agentless Software',
   'The vulnerability management product might use agentless techniques to scan a host without requiring any sort of installation. Agentless scanning is most likely to be used in threat actor reconnaissance.',
   3),

  -- Parent concepts for hierarchical topics
  ('c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9', NULL,
   'Unsecure Networks',
   'Network attack vectors where security protections are weak, absent, or have been bypassed, allowing threat actors to gain unauthorized access.',
   3),
  ('c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9', NULL,
   'Lure-Based Vectors',
   'Attack types that entice a victim into using or opening a removable device, document, image, or program that conceals malware.',
   3),
  ('c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9', NULL,
   'Supply Chain',
   'The end-to-end process of supplying, manufacturing, distributing, and finally releasing goods and services to a customer.',
   3);

-- =============================================================================
-- LEVEL 4 TOPICS (Children of Level 3 parents)
-- =============================================================================

-- Network Vector Types (children of "Unsecure Networks")
INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
SELECT
  'c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9',
  id,
  'Remote',
  'Remote means that the vulnerability can be exploited by sending code to the target over a network and does not depend on an authenticated session with the system to execute.',
  4
FROM topics
WHERE name = 'Unsecure Networks' AND hierarchy_level = 3;

INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
SELECT
  'c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9',
  id,
  'Local',
  'Local means that the exploit code must be executed from an authenticated session on the computer. The attack could still occur over a network, but the threat actor needs to use some valid credentials or hijack an existing session to execute it.',
  4
FROM topics
WHERE name = 'Unsecure Networks' AND hierarchy_level = 3;

INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
SELECT
  'c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9',
  id,
  'Direct Access',
  'The threat actor uses physical access to the site to perpetrate an attack. Examples could include getting access to an unlocked workstation; using a boot disk to try to install malicious tools; or physically stealing a PC, laptop, or disk drive.',
  4
FROM topics
WHERE name = 'Unsecure Networks' AND hierarchy_level = 3;

INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
SELECT
  'c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9',
  id,
  'Wired Network',
  'A threat actor with access to the site attaches an unauthorized device to a physical network port, and the device is permitted to communicate with other hosts. This potentially allows the threat actor to launch eavesdropping, on-path, and DoS attacks.',
  4
FROM topics
WHERE name = 'Unsecure Networks' AND hierarchy_level = 3;

INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
SELECT
  'c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9',
  id,
  'Remote and Wireless Network',
  'The attacker either obtains credentials for a remote access or wireless connection to the network or cracks the security protocols used for authentication. Alternatively, the attacker spoofs a trusted resource, such as an access point, and uses it to perform credential harvesting and then uses the stolen account details to access the network.',
  4
FROM topics
WHERE name = 'Unsecure Networks' AND hierarchy_level = 3;

INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
SELECT
  'c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9',
  id,
  'Cloud Access',
  'Many companies now run part or all of their network services via Internet-accessible clouds. The attacker only needs to find one account, service, or host with weak credentials to gain access. The attacker is likely to target the accounts used to develop services in the cloud or manage cloud systems. They may also try to attack the cloud service provider (CSP) as a way of accessing the victim system.',
  4
FROM topics
WHERE name = 'Unsecure Networks' AND hierarchy_level = 3;

INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
SELECT
  'c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9',
  id,
  'Bluetooth Network',
  'The threat actor exploits a vulnerability or misconfiguration to transmit a malicious file to a user''s device over the Bluetooth personal area wireless networking protocol.',
  4
FROM topics
WHERE name = 'Unsecure Networks' AND hierarchy_level = 3;

INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
SELECT
  'c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9',
  id,
  'Default Credentials',
  'The attacker gains control of a network device or app because it has been left configured with a default password. Default credentials are likely to be published in the product''s setup documentation or are otherwise easy to discover.',
  4
FROM topics
WHERE name = 'Unsecure Networks' AND hierarchy_level = 3;

INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
SELECT
  'c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9',
  id,
  'Open Service Port',
  'The threat actor is able to establish an unauthenticated connection to a logical TCP or UDP network port. The server will run an application to process network traffic arriving over the port. The software might be vulnerable to exploit code or to service disruption.',
  4
FROM topics
WHERE name = 'Unsecure Networks' AND hierarchy_level = 3;

-- Lure-Based Vector Types (children of "Lure-Based Vectors")
INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
SELECT
  'c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9',
  id,
  'Removable Device',
  'The attacker conceals malware on a USB thumb drive or memory card and tries to trick employees into connecting the media to a PC, laptop, or smartphone. For some exploits, simply connecting the media may be sufficient to run the malware. More typically, the attacker may need the employee to open a file in a vulnerable application or run a setup program.',
  4
FROM topics
WHERE name = 'Lure-Based Vectors' AND hierarchy_level = 3;

INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
SELECT
  'c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9',
  id,
  'Executable File',
  'The threat actor conceals exploit code in a program file. One example is Trojan Horse malware. A Trojan is a program that seems to be something free and useful or fun, but it actually contains a process that will create backdoor access to the computer for the threat actor.',
  4
FROM topics
WHERE name = 'Lure-Based Vectors' AND hierarchy_level = 3;

INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
SELECT
  'c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9',
  id,
  'Document Files',
  'The threat actor conceals malicious code by embedding it in word processing and PDF format files. This can take advantage of scripting features, or simply exploit a vulnerability in the document viewer or editor software.',
  4
FROM topics
WHERE name = 'Lure-Based Vectors' AND hierarchy_level = 3;

INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
SELECT
  'c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9',
  id,
  'Image Files',
  'The threat actor conceals exploit code within an image file that targets a vulnerability in browser or document editing software.',
  4
FROM topics
WHERE name = 'Lure-Based Vectors' AND hierarchy_level = 3;

INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
SELECT
  'c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9',
  id,
  'Email',
  'The attacker sends a malicious file attachment via email, or via any other communications system that allows attachments. The attacker needs to use social engineering techniques to persuade or trick the user into opening the attachment.',
  4
FROM topics
WHERE name = 'Lure-Based Vectors' AND hierarchy_level = 3;

INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
SELECT
  'c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9',
  id,
  'Short Message Service (SMS)',
  'The file or a link to the file is sent to a mobile device using the text messaging handler built into smartphone firmware and a protocol called Signaling System 7 (SS7). SMS and the SS7 protocol are associated with numerous vulnerabilities. Additionally, an organization is unlikely to have any monitoring capability for SMS as it is operated by the handset or subscriber identity module (SIM) card provider.',
  4
FROM topics
WHERE name = 'Lure-Based Vectors' AND hierarchy_level = 3;

INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
SELECT
  'c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9',
  id,
  'Instant Messaging (IM)',
  'There are many replacements for SMS that run on Windows, Android, or iOS devices. These can support voice and video messaging plus file attachments. Most of these services are secured using encryption and offer considerably more security than SMS, but they can still contain software vulnerabilities. The use of encryption can make it difficult for an organization to scan messages and attachments for threats.',
  4
FROM topics
WHERE name = 'Lure-Based Vectors' AND hierarchy_level = 3;

INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
SELECT
  'c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9',
  id,
  'Web and Social Media',
  'Malware may be concealed in files attached to posts or presented as downloads. An attacker may compromise a site so that it automatically infects vulnerable browser software (a drive-by download). Social media may also be used more subtly, such as a disinformation campaign that persuades users to install a "must-have" app that is actually a Trojan.',
  4
FROM topics
WHERE name = 'Lure-Based Vectors' AND hierarchy_level = 3;

INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
SELECT
  'c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9',
  id,
  'Zero-click',
  'The most powerful exploits are zero-click. Most file-based exploit code has to be deliberately opened by the user. Zero-click means that simply receiving an attachment or viewing an image on a webpage triggers the exploit.',
  4
FROM topics
WHERE name = 'Lure-Based Vectors' AND hierarchy_level = 3;

-- Supply Chain Types (children of "Supply Chain")
INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
SELECT
  'c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9',
  id,
  'Supplier',
  'Obtains products directly from a manufacturer to sell in bulk to other businesses. This type of trade is referred to as business to business (B2B).',
  4
FROM topics
WHERE name = 'Supply Chain' AND hierarchy_level = 3;

INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
SELECT
  'c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9',
  id,
  'Vendor',
  'Obtains products from suppliers to sell to retail businesses (B2B) or directly to customers (B2C). A vendor might add some level of customization and direct support.',
  4
FROM topics
WHERE name = 'Supply Chain' AND hierarchy_level = 3;

INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
SELECT
  'c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9',
  id,
  'Business Partner',
  'Implies a closer relationship where two companies share quite closely aligned goals and marketing opportunities.',
  4
FROM topics
WHERE name = 'Supply Chain' AND hierarchy_level = 3;

INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
SELECT
  'c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9',
  id,
  'Managed Service Provider (MSP)',
  'A managed service provider (MSP) provisions and supports IT resources such as networks, security, or web infrastructure. MSPs are useful when an organization finds it cheaper or more reliable to outsource all or part of IT provision rather than try to manage it directly. From a security point of view, this type of outsourcing is complex as it can be difficult to monitor the MSP. The MSP''s employees are all potential sources of insider threat.',
  4
FROM topics
WHERE name = 'Supply Chain' AND hierarchy_level = 3;

-- Summary
SELECT
  'Total topics added' as metric,
  COUNT(*) as count
FROM topics
WHERE name IN (
  'Attack Surface', 'Threat Vector', 'Vulnerable Software', 'Unsupported Systems / Applications',
  'Client-Based Software', 'Agentless Software', 'Unsecure Networks', 'Lure-Based Vectors', 'Supply Chain',
  'Remote', 'Local', 'Direct Access', 'Wired Network', 'Remote and Wireless Network',
  'Cloud Access', 'Bluetooth Network', 'Default Credentials', 'Open Service Port',
  'Removable Device', 'Executable File', 'Document Files', 'Image Files',
  'Email', 'Short Message Service (SMS)', 'Instant Messaging (IM)', 'Web and Social Media', 'Zero-click',
  'Supplier', 'Vendor', 'Business Partner', 'Managed Service Provider (MSP)'
);
