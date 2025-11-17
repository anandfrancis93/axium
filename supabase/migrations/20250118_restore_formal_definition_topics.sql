-- Restore all 68 topics with formal textbook definitions
-- No domains (Level 1) or objectives (Level 2) - only formal definition topics
-- chapter_id: 0517450a-61b2-4fa2-a425-5846b21ba4b0 (CompTIA Security+ SY0-701)

-- =============================================================================
-- LEVEL 3 TOPICS (Top-level, no parents since objectives are removed)
-- =============================================================================

-- Security Fundamentals (8 topics)
INSERT INTO topics (chapter_id, parent_topic_id, name, description, hierarchy_level)
VALUES
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', NULL,
   'Information Security',
   'Information security (infosec) refers to the protection of data resources from unauthorized access, attack, theft, or damage. Data may be vulnerable because of the way it is stored, transferred, or processed. The systems used to store, transmit, and process data must demonstrate the properties of security.',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', NULL,
   'Confidentiality',
   'The fundamental security goal of keeping information and communications private and protecting them from unauthorized access.',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', NULL,
   'Integrity',
   'The fundamental security goal of keeping organizational information accurate, free of errors, and without unauthorized modifications.',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', NULL,
   'Availability',
   'The fundamental security goal of ensuring that computer systems operate continuously and that authorized persons can access data that they need.',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', NULL,
   'Non-repudiation',
   'The security goal of ensuring that the party that sent a transmission or created data remains associated with that data and cannot deny sending or creating that data.',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', NULL,
   'Gap analysis',
   'An analysis that measures the difference between the current and desired states in order to help assess the scope of work included in a project.',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', NULL,
   'Identification',
   'The process by which a user account (and its credentials) is issued to the correct person. Sometimes referred to as enrollment.',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', NULL,
   'Authentication',
   'A method of validating a particular entity''s or individual''s unique credentials.',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', NULL,
   'Authorization',
   'The process of determining what rights and privileges a particular entity has.',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', NULL,
   'Accounting',
   'Tracking authorized usage of a resource or use of rights by a subject and alerting when unauthorized use is detected or attempted.',
   3);

-- Security Controls (13 topics)
INSERT INTO topics (chapter_id, parent_topic_id, name, description, hierarchy_level)
VALUES
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', NULL,
   'Security Controls',
   'A technology or procedure put in place to mitigate vulnerabilities and risk and to ensure the confidentiality, integrity, and availability (CIA) of information.',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', NULL,
   'Cybersecurity Frameworks (CSF)',
   'Standards, best practices, and guidelines for effective security risk management. Some frameworks are general in nature, while others are specific to industry or technology types.',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', NULL,
   'Identity and Access Management (IAM)',
   'A security process that provides identification, authentication, and authorization mechanisms for users, computers, and other entities to work with organizational assets like networks, operating systems, and applications.',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', NULL,
   'Managerial Security Control',
   'A category of security control that gives oversight of the information system.',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', NULL,
   'Operational Security Control',
   'A category of security control that is implemented by people.',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', NULL,
   'Technical Security Control',
   'A category of security control that is implemented as a system (hardware, software, or firmware). Technical controls may also be described as logical controls.',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', NULL,
   'Physical Security Control',
   'A category of security control that acts against in-person intrusion attempts.',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', NULL,
   'Preventive Security Control',
   'A type of security control that acts before an incident to eliminate or reduce the likelihood that an attack can succeed.',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', NULL,
   'Detective Security Control',
   'A type of security control that acts during an incident to identify or record that it is happening.',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', NULL,
   'Corrective Security Control',
   'A type of security control that acts after an incident to eliminate or minimize its impact.',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', NULL,
   'Directive Security Control',
   'A type of control that enforces a rule of behavior through a policy or contract.',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', NULL,
   'Deterrent Security Control',
   'A type of security control that discourages intrusion attempts.',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', NULL,
   'Compensating Security Control',
   'A security measure that takes on risk mitigation when a primary control fails or cannot completely meet expectations.',
   3);

-- Governance Roles (7 topics)
INSERT INTO topics (chapter_id, parent_topic_id, name, description, hierarchy_level)
VALUES
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', NULL,
   'Chief Information Officer (CIO)',
   'A company officer with the primary responsibility for management of information technology assets and procedures.',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', NULL,
   'Chief Technology Officer (CTO)',
   'A company officer with the primary role of making effective use of new and emerging computing platforms and innovations.',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', NULL,
   'Chief Security Officer (CSO)',
   'Typically the job title of the person with overall responsibility for information assurance and systems security.',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', NULL,
   'Information Systems Security Officer (ISSO)',
   'Organizational role with technical responsibilities for implementation of security policies, frameworks, and controls.',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', NULL,
   'Security Operations Center (SOC)',
   'The location where security professionals monitor and protect critical information assets in an organization.',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', NULL,
   'Development and operations (DevOps)',
   'A combination of software development and systems operations, and refers to the practice of integrating one discipline with the other.',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', NULL,
   'DevSecOps',
   'A combination of software development, security operations, and systems operations, and refers to the practice of integrating each discipline with the others.',
   3);

-- Incident Response Teams (3 topics)
INSERT INTO topics (chapter_id, parent_topic_id, name, description, hierarchy_level)
VALUES
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', NULL,
   'Computer Incident Response Team (CIRT)',
   'Team with responsibility for incident response. The CIRT must have expertise across a number of business domains (IT, HR, legal, and marketing, for instance).',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', NULL,
   'Computer Security Incident Response Team (CSIRT)',
   'Team with responsibility for incident response. The CSIRT must have expertise across a number of business domains (IT, HR, legal, and marketing, for instance).',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', NULL,
   'Computer Emergency Response Team (CERT)',
   'Team with responsibility for incident response. The CERT must have expertise across a number of business domains (IT, HR, legal, and marketing, for instance).',
   3);

-- Threat/Risk/Vulnerability Fundamentals (6 topics)
INSERT INTO topics (chapter_id, parent_topic_id, name, description, hierarchy_level)
VALUES
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', NULL,
   'Vulnerability',
   'A weakness that could be triggered accidentally or exploited intentionally to cause a security breach.',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', NULL,
   'Risk',
   'Likelihood and impact (or consequence) of a threat actor exercising a vulnerability. Risk = Impact * Likelihood',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', NULL,
   'Threat',
   'A potential for an entity to exercise a vulnerability (that is, to breach security).',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', NULL,
   'Threat Actor',
   'A person or entity responsible for an event that has been identified as a security incident or as a risk.',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', NULL,
   'Intentional Threat',
   'A threat actor with a malicious purpose.',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', NULL,
   'Unintentional Threat',
   'A threat actor that causes a vulnerability or exposes an attack vector without malicious intent.',
   3);

-- Threat Actor Types/Motivations/Attributes (13 topics at Level 3)
INSERT INTO topics (chapter_id, parent_topic_id, name, description, hierarchy_level)
VALUES
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', NULL,
   'Blackmail',
   'Demanding payment to prevent the release of information.',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', NULL,
   'Data exfiltration',
   'The process by which an attacker takes data that is stored inside of a private network and moves it to an external network.',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', NULL,
   'Service disruption',
   'A type of attack that compromises the availability of an asset or business process.',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', NULL,
   'Hacktivist',
   'A threat actor that is motivated by a social issue or political cause.',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', NULL,
   'Unskilled attacker',
   'An inexperienced, unskilled attacker that typically uses tools or scripts created by others.',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', NULL,
   'Nation-state',
   'A type of threat actor that is supported by the resources of its host country''s military and security services.',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', NULL,
   'Organized crime',
   'A type of threat actor that uses hacking and computer fraud for commercial gain.',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', NULL,
   'Shadow IT',
   'Computer hardware, software, or services used on a private network without authorization from the system owner.',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', NULL,
   'Insider threat',
   'A type of threat actor who is assigned privileges on the system that cause an intentional or unintentional incident.',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', NULL,
   'Level of sophistication/capability',
   'A formal classification of the resources and expertise available to a threat actor.',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', NULL,
   'Resources/funding',
   'The ability of threat actors to draw upon funding to acquire personnel, tools, and to develop novel attack types.',
   3);

-- =============================================================================
-- LEVEL 4 TOPICS (Children of Level 3 topics)
-- =============================================================================

-- NIST Cybersecurity Framework (Level 4 - child of "Cybersecurity Frameworks (CSF)")
INSERT INTO topics (chapter_id, parent_topic_id, name, description, hierarchy_level)
SELECT
  '0517450a-61b2-4fa2-a425-5846b21ba4b0',
  id,
  'NIST Cybersecurity Framework',
  'The NIST Cybersecurity Framework provides a policy framework of computer security guidance for how private sector organizations can assess and improve their ability to prevent, detect, and respond to cyber attacks. It consists of five core functions: Identify, Protect, Detect, Respond, and Recover.',
  4
FROM topics
WHERE name = 'Cybersecurity Frameworks (CSF)' AND hierarchy_level = 3;

-- Threat Actor Types (Level 4 - children of "Threat Actor")
INSERT INTO topics (chapter_id, parent_topic_id, name, description, hierarchy_level)
SELECT
  '0517450a-61b2-4fa2-a425-5846b21ba4b0',
  t.id,
  tmp.name,
  tmp.description,
  4
FROM topics t
CROSS JOIN (
  VALUES
    ('Internal Threat Actor', 'An internal actor has been granted some access permissions.'),
    ('External Threat Actor', 'An external threat actor has no standing privileges.'),
    ('Hacker', 'Often used to refer to someone who breaks into computer systems or spreads viruses, ethical hackers prefer to think of themselves as experts on and explorers of computer security systems.'),
    ('Unauthorized Hacker', 'A hacker operating with malicious intent.'),
    ('Authorized Hacker', 'A hacker engaged in authorized penetration testing or other security consultancy.'),
    ('Advanced Persistent Threat (APT)', 'An attacker''s ability to obtain, maintain, and diversify access to network systems using exploits and malware.'),
    ('Whistleblower', 'A whistleblower is someone with an ethical motivation for releasing confidential information. While this could be classed as an internal threat in some respects, it is important to realize that whistleblowers making protected disclosures, such as reporting financial fraud through an authorized channel, cannot themselves be threatened or labeled in any way that seems retaliatory or punitive.'),
    ('Unintentional or Inadvertent Insider Threat', 'A threat actor that causes a vulnerability or exposes an attack vector without malicious intent.')
) AS tmp(name, description)
WHERE t.name = 'Threat Actor' AND t.hierarchy_level = 3;

-- Threat Motivations (Level 4 - no specific parent, standalone)
INSERT INTO topics (chapter_id, parent_topic_id, name, description, hierarchy_level)
VALUES
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', NULL,
   'Disinformation',
   'A type of attack that falsifies an information resource that is normally trusted by others.',
   4),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', NULL,
   'Extortion',
   'Demanding payment to prevent or halt some type of attack.',
   4),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', NULL,
   'Fraud',
   'Falsifying records, such as an internal fraud that involves tampering with accounts.',
   4);

-- =============================================================================
-- LEVEL 5 TOPICS (Children of Level 4 topics)
-- =============================================================================

-- NIST CSF Core Functions (Level 5 - children of "NIST Cybersecurity Framework")
INSERT INTO topics (chapter_id, parent_topic_id, name, description, hierarchy_level)
SELECT
  '0517450a-61b2-4fa2-a425-5846b21ba4b0',
  id,
  'Identify',
  'Develop security policies and capabilities. Evaluate risks, threats, and vulnerabilities and recommend security controls to mitigate them.',
  5
FROM topics
WHERE name = 'NIST Cybersecurity Framework' AND hierarchy_level = 4;

INSERT INTO topics (chapter_id, parent_topic_id, name, description, hierarchy_level)
SELECT
  '0517450a-61b2-4fa2-a425-5846b21ba4b0',
  id,
  'Protect',
  'Procure/develop, install, operate, and decommission IT hardware and software assets with security as an embedded requirement of every stage of this operation''s lifecycle.',
  5
FROM topics
WHERE name = 'NIST Cybersecurity Framework' AND hierarchy_level = 4;

INSERT INTO topics (chapter_id, parent_topic_id, name, description, hierarchy_level)
SELECT
  '0517450a-61b2-4fa2-a425-5846b21ba4b0',
  id,
  'Detect',
  'Perform ongoing, proactive monitoring to ensure that controls are effective and capable of protecting against new types of threats.',
  5
FROM topics
WHERE name = 'NIST Cybersecurity Framework' AND hierarchy_level = 4;

INSERT INTO topics (chapter_id, parent_topic_id, name, description, hierarchy_level)
SELECT
  '0517450a-61b2-4fa2-a425-5846b21ba4b0',
  id,
  'Respond',
  'Identify, analyze, contain, and eradicate threats to systems and data security.',
  5
FROM topics
WHERE name = 'NIST Cybersecurity Framework' AND hierarchy_level = 4;

INSERT INTO topics (chapter_id, parent_topic_id, name, description, hierarchy_level)
SELECT
  '0517450a-61b2-4fa2-a425-5846b21ba4b0',
  id,
  'Recover',
  'Implement cybersecurity resilience to restore systems and data if other controls are unable to prevent attacks.',
  5
FROM topics
WHERE name = 'NIST Cybersecurity Framework' AND hierarchy_level = 4;

-- Summary
SELECT
  'Topics restored' as metric,
  COUNT(*) as count
FROM topics;
