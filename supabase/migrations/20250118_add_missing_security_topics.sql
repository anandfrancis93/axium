-- Add missing security topics with formal textbook definitions
-- All topics are level 3 (###) under appropriate parent objectives

-- Constants (for reference)
-- chapter_id: 0517450a-61b2-4fa2-a425-5846b21ba4b0 (CompTIA Security+ SY0-701)
-- Parent objectives:
--   Security Controls: 72efbaee-92c7-420c-b215-ebded3e7319e
--   IAM: d59b2860-b3cf-4a64-b0dd-eadc174f2f90
--   Governance: 336bc934-73e0-4b40-a8ef-463880072300
--   Incident Response: 0829bae6-5096-4059-bcc9-0935089dcbd8

-- Security Control Categories (under "Compare and contrast various types of security controls")
INSERT INTO topics (chapter_id, parent_topic_id, name, description, hierarchy_level)
VALUES
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', '72efbaee-92c7-420c-b215-ebded3e7319e',
   'Managerial Security Control',
   'A category of security control that gives oversight of the information system.',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', '72efbaee-92c7-420c-b215-ebded3e7319e',
   'Operational Security Control',
   'A category of security control that is implemented by people.',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', '72efbaee-92c7-420c-b215-ebded3e7319e',
   'Technical Security Control',
   'A category of security control that is implemented as a system (hardware, software, or firmware). Technical controls may also be described as logical controls.',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', '72efbaee-92c7-420c-b215-ebded3e7319e',
   'Physical Security Control',
   'A category of security control that acts against in-person intrusion attempts.',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', '72efbaee-92c7-420c-b215-ebded3e7319e',
   'Preventive Security Control',
   'A type of security control that acts before an incident to eliminate or reduce the likelihood that an attack can succeed.',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', '72efbaee-92c7-420c-b215-ebded3e7319e',
   'Detective Security Control',
   'A type of security control that acts during an incident to identify or record that it is happening.',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', '72efbaee-92c7-420c-b215-ebded3e7319e',
   'Corrective Security Control',
   'A type of security control that acts after an incident to eliminate or minimize its impact.',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', '72efbaee-92c7-420c-b215-ebded3e7319e',
   'Directive Security Control',
   'A type of control that enforces a rule of behavior through a policy or contract.',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', '72efbaee-92c7-420c-b215-ebded3e7319e',
   'Deterrent Security Control',
   'A type of security control that discourages intrusion attempts.',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', '72efbaee-92c7-420c-b215-ebded3e7319e',
   'Compensating Security Control',
   'A security measure that takes on risk mitigation when a primary control fails or cannot completely meet expectations.',
   3);

-- Security Controls and Frameworks (under "Compare and contrast various types of security controls")
INSERT INTO topics (chapter_id, parent_topic_id, name, description, hierarchy_level)
VALUES
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', '72efbaee-92c7-420c-b215-ebded3e7319e',
   'Security Controls',
   'A technology or procedure put in place to mitigate vulnerabilities and risk and to ensure the confidentiality, integrity, and availability (CIA) of information.',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', '72efbaee-92c7-420c-b215-ebded3e7319e',
   'Cybersecurity Frameworks (CSF)',
   'Standards, best practices, and guidelines for effective security risk management. Some frameworks are general in nature, while others are specific to industry or technology types.',
   3);

-- IAM (under "Given a scenario, implement and maintain identity and access management")
INSERT INTO topics (chapter_id, parent_topic_id, name, description, hierarchy_level)
VALUES
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', 'd59b2860-b3cf-4a64-b0dd-eadc174f2f90',
   'Identity and Access Management (IAM)',
   'A security process that provides identification, authentication, and authorization mechanisms for users, computers, and other entities to work with organizational assets like networks, operating systems, and applications.',
   3);

-- Governance and Roles (under "Summarize elements of effective security governance")
INSERT INTO topics (chapter_id, parent_topic_id, name, description, hierarchy_level)
VALUES
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', '336bc934-73e0-4b40-a8ef-463880072300',
   'Chief Information Officer (CIO)',
   'A company officer with the primary responsibility for management of information technology assets and procedures.',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', '336bc934-73e0-4b40-a8ef-463880072300',
   'Chief Technology Officer (CTO)',
   'A company officer with the primary role of making effective use of new and emerging computing platforms and innovations.',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', '336bc934-73e0-4b40-a8ef-463880072300',
   'Chief Security Officer (CSO)',
   'Typically the job title of the person with overall responsibility for information assurance and systems security.',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', '336bc934-73e0-4b40-a8ef-463880072300',
   'Information Systems Security Officer (ISSO)',
   'Organizational role with technical responsibilities for implementation of security policies, frameworks, and controls.',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', '336bc934-73e0-4b40-a8ef-463880072300',
   'Security Operations Center (SOC)',
   'The location where security professionals monitor and protect critical information assets in an organization.',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', '336bc934-73e0-4b40-a8ef-463880072300',
   'Development and operations (DevOps)',
   'A combination of software development and systems operations, and refers to the practice of integrating one discipline with the other.',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', '336bc934-73e0-4b40-a8ef-463880072300',
   'DevSecOps',
   'A combination of software development, security operations, and systems operations, and refers to the practice of integrating each discipline with the others.',
   3);

-- Incident Response Teams (under "Explain appropriate incident response activities")
INSERT INTO topics (chapter_id, parent_topic_id, name, description, hierarchy_level)
VALUES
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', '0829bae6-5096-4059-bcc9-0935089dcbd8',
   'Computer Incident Response Team (CIRT)',
   'Team with responsibility for incident response. The CIRT must have expertise across a number of business domains (IT, HR, legal, and marketing, for instance).',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', '0829bae6-5096-4059-bcc9-0935089dcbd8',
   'Computer Security Incident Response Team (CSIRT)',
   'Team with responsibility for incident response. The CSIRT must have expertise across a number of business domains (IT, HR, legal, and marketing, for instance).',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', '0829bae6-5096-4059-bcc9-0935089dcbd8',
   'Computer Emergency Response Team (CERT)',
   'Team with responsibility for incident response. The CERT must have expertise across a number of business domains (IT, HR, legal, and marketing, for instance).',
   3);

-- Summary of additions
SELECT
  COUNT(*) as total_added,
  parent_topic_id,
  pt.name as parent_objective
FROM topics t
JOIN topics pt ON t.parent_topic_id = pt.id
WHERE t.name IN (
  'Managerial Security Control',
  'Operational Security Control',
  'Technical Security Control',
  'Physical Security Control',
  'Preventive Security Control',
  'Detective Security Control',
  'Corrective Security Control',
  'Directive Security Control',
  'Deterrent Security Control',
  'Compensating Security Control',
  'Security Controls',
  'Cybersecurity Frameworks (CSF)',
  'Identity and Access Management (IAM)',
  'Chief Information Officer (CIO)',
  'Chief Technology Officer (CTO)',
  'Chief Security Officer (CSO)',
  'Information Systems Security Officer (ISSO)',
  'Security Operations Center (SOC)',
  'Development and operations (DevOps)',
  'DevSecOps',
  'Computer Incident Response Team (CIRT)',
  'Computer Security Incident Response Team (CSIRT)',
  'Computer Emergency Response Team (CERT)'
)
GROUP BY parent_topic_id, pt.name
ORDER BY pt.name;
