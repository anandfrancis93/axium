-- Update security concepts with formal textbook definitions
-- Only updates topics that already exist in the database

-- Cybersecurity Frameworks (CSF) - if exists
UPDATE topics
SET description = 'Standards, best practices, and guidelines for effective security risk management. Some frameworks are general in nature, while others are specific to industry or technology types.'
WHERE name = 'Cybersecurity Frameworks (CSF)';

-- Security Controls - if exists
UPDATE topics
SET description = 'A technology or procedure put in place to mitigate vulnerabilities and risk and to ensure the confidentiality, integrity, and availability (CIA) of information.'
WHERE name = 'Security Controls';

-- Gap analysis
UPDATE topics
SET description = 'An analysis that measures the difference between the current and desired states in order to help assess the scope of work included in a project.'
WHERE name = 'Gap analysis';

-- Identity and Access Management (IAM) - if exists
UPDATE topics
SET description = 'A security process that provides identification, authentication, and authorization mechanisms for users, computers, and other entities to work with organizational assets like networks, operating systems, and applications.'
WHERE name = 'Identity and Access Management (IAM)';

-- Identification
UPDATE topics
SET description = 'The process by which a user account (and its credentials) is issued to the correct person. Sometimes referred to as enrollment.'
WHERE name = 'Identification';

-- Authentication
UPDATE topics
SET description = 'A method of validating a particular entity''s or individual''s unique credentials.'
WHERE name = 'Authentication';

-- Authorization
UPDATE topics
SET description = 'The process of determining what rights and privileges a particular entity has.'
WHERE name = 'Authorization';

-- Accounting
UPDATE topics
SET description = 'Tracking authorized usage of a resource or use of rights by a subject and alerting when unauthorized use is detected or attempted.'
WHERE name = 'Accounting';

-- Managerial Security Control - if exists
UPDATE topics
SET description = 'A category of security control that gives oversight of the information system.'
WHERE name = 'Managerial Security Control';

-- Operational Security Control - if exists
UPDATE topics
SET description = 'A category of security control that is implemented by people.'
WHERE name = 'Operational Security Control';

-- Technical Security Control - if exists
UPDATE topics
SET description = 'A category of security control that is implemented as a system (hardware, software, or firmware). Technical controls may also be described as logical controls.'
WHERE name = 'Technical Security Control';

-- Physical Security Control - if exists
UPDATE topics
SET description = 'A category of security control that acts against in-person intrusion attempts.'
WHERE name = 'Physical Security Control';

-- Preventive Security Control - if exists
UPDATE topics
SET description = 'A type of security control that acts before an incident to eliminate or reduce the likelihood that an attack can succeed.'
WHERE name = 'Preventive Security Control';

-- Detective Security Control - if exists
UPDATE topics
SET description = 'A type of security control that acts during an incident to identify or record that it is happening.'
WHERE name = 'Detective Security Control';

-- Corrective Security Control - if exists
UPDATE topics
SET description = 'A type of security control that acts after an incident to eliminate or minimize its impact.'
WHERE name = 'Corrective Security Control';

-- Directive Security Control - if exists
UPDATE topics
SET description = 'A type of control that enforces a rule of behavior through a policy or contract.'
WHERE name = 'Directive Security Control';

-- Deterrent Security Control - if exists
UPDATE topics
SET description = 'A type of security control that discourages intrusion attempts.'
WHERE name = 'Deterrent Security Control';

-- Compensating Security Control - if exists
UPDATE topics
SET description = 'A security measure that takes on risk mitigation when a primary control fails or cannot completely meet expectations.'
WHERE name = 'Compensating Security Control';

-- Chief Information Officer (CIO) - if exists
UPDATE topics
SET description = 'A company officer with the primary responsibility for management of information technology assets and procedures.'
WHERE name = 'Chief Information Officer (CIO)';

-- Chief Technology Officer (CTO) - if exists
UPDATE topics
SET description = 'A company officer with the primary role of making effective use of new and emerging computing platforms and innovations.'
WHERE name = 'Chief Technology Officer (CTO)';

-- Chief Security Officer (CSO) - if exists
UPDATE topics
SET description = 'Typically the job title of the person with overall responsibility for information assurance and systems security.'
WHERE name = 'Chief Security Officer (CSO)';

-- Information Systems Security Officer (ISSO) - if exists
UPDATE topics
SET description = 'Organizational role with technical responsibilities for implementation of security policies, frameworks, and controls.'
WHERE name = 'Information Systems Security Officer (ISSO)';

-- Security Operations Center (SOC) - if exists
UPDATE topics
SET description = 'The location where security professionals monitor and protect critical information assets in an organization.'
WHERE name = 'Security Operations Center (SOC)';

-- Development and operations (DevOps) - if exists
UPDATE topics
SET description = 'A combination of software development and systems operations, and refers to the practice of integrating one discipline with the other.'
WHERE name = 'Development and operations (DevOps)';

-- DevSecOps - if exists
UPDATE topics
SET description = 'A combination of software development, security operations, and systems operations, and refers to the practice of integrating each discipline with the others.'
WHERE name = 'DevSecOps';

-- Computer Incident Response Team (CIRT) - if exists
UPDATE topics
SET description = 'Team with responsibility for incident response. The CIRT must have expertise across a number of business domains (IT, HR, legal, and marketing, for instance).'
WHERE name = 'Computer Incident Response Team (CIRT)';

-- Computer Security Incident Response Team (CSIRT) - if exists
UPDATE topics
SET description = 'Team with responsibility for incident response. The CSIRT must have expertise across a number of business domains (IT, HR, legal, and marketing, for instance).'
WHERE name = 'Computer Security Incident Response Team (CSIRT)';

-- Computer Emergency Response Team (CERT) - if exists
UPDATE topics
SET description = 'Team with responsibility for incident response. The CERT must have expertise across a number of business domains (IT, HR, legal, and marketing, for instance).'
WHERE name = 'Computer Emergency Response Team (CERT)';

-- Show summary of updates
SELECT
  name,
  LEFT(description, 60) || '...' as description_preview,
  LENGTH(description) as chars
FROM topics
WHERE name IN (
  'Gap analysis',
  'Identification',
  'Authentication',
  'Authorization',
  'Accounting'
)
ORDER BY name;
