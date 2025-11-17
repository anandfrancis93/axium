-- Add social engineering and human vector topics with formal definitions
-- subject_id: c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9 (Cybersecurity)

-- =============================================================================
-- LEVEL 1 TOPICS (Top-level parent concepts)
-- =============================================================================

INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
VALUES
  -- Human-based attack surface
  ('c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9', NULL,
   'Human Vector',
   'Adversaries can use a diverse range of techniques to compromise a security system. A prerequisite of many types of attacks is to obtain information about the network and security system. This knowledge is not only stored on computer disks; it also exists in the minds of employees and contractors. The people operating computers and accounts are a part of the attack surface referred to as human vectors.',
   1),

  -- Parent category for social engineering attacks
  ('c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9', NULL,
   'Social Engineering',
   'Using persuasion, manipulation, or intimidation to make the victim violate a security policy. The goal of social engineering might be to gain access to an account, gain access to physical premises, or gather information.',
   1);

-- =============================================================================
-- LEVEL 2 TOPICS (Social Engineering Attack Types)
-- =============================================================================

-- Social Engineering Techniques (children of "Social Engineering")
INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
SELECT
  'c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9',
  id,
  'Pretexting',
  'Social engineering tactic where a team will communicate, whether directly or indirectly, a lie or half-truth in order to get someone to believe a falsehood.',
  2
FROM topics
WHERE name = 'Social Engineering' AND hierarchy_level = 1;

INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
SELECT
  'c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9',
  id,
  'Phishing',
  'A type of email-based social engineering attack, in which the attacker sends email from a supposedly reputable source, such as a bank, to try to elicit private information from the victim.',
  2
FROM topics
WHERE name = 'Social Engineering' AND hierarchy_level = 1;

INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
SELECT
  'c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9',
  id,
  'Vishing',
  'A human-based attack where the attacker extracts information while speaking over the phone or leveraging IP-based voice messaging services (VoIP).',
  2
FROM topics
WHERE name = 'Social Engineering' AND hierarchy_level = 1;

INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
SELECT
  'c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9',
  id,
  'SMiShing',
  'A form of phishing that uses SMS text messages to trick a victim into revealing information.',
  2
FROM topics
WHERE name = 'Social Engineering' AND hierarchy_level = 1;

INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
SELECT
  'c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9',
  id,
  'Pharming',
  'An impersonation attack in which a request for a website, typically an e-commerce site, is redirected to a similar-looking, but fake, website.',
  2
FROM topics
WHERE name = 'Social Engineering' AND hierarchy_level = 1;

INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
SELECT
  'c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9',
  id,
  'Typosquatting',
  'An attack in which an attacker registers a domain name with a common misspelling of an existing domain, so that a user who misspells a URL they enter into a browser is taken to the attacker''s website.',
  2
FROM topics
WHERE name = 'Social Engineering' AND hierarchy_level = 1;

INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
SELECT
  'c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9',
  id,
  'Business Email Compromise',
  'An impersonation attack in which the attacker gains control of an employee''s account and uses it to convince other employees to perform fraudulent actions.',
  2
FROM topics
WHERE name = 'Social Engineering' AND hierarchy_level = 1;

INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
SELECT
  'c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9',
  id,
  'Brand Impersonation',
  'Brand impersonation means the threat actor commits resources to accurately duplicate a company''s logos and formatting (fonts, colors, and heading/body paragraph styles) to make a phishing message or pharming website, a visually compelling fake. The threat actor could even mimic the style or tone of email communications or website copy. They could try to get a phishing site listed high in search results by using realistic content.',
  2
FROM topics
WHERE name = 'Social Engineering' AND hierarchy_level = 1;

INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
SELECT
  'c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9',
  id,
  'Watering Hole Attack',
  'An attack in which an attacker targets specific groups or organizations, discovers which websites they frequent, and injects malicious code into those sites.',
  2
FROM topics
WHERE name = 'Social Engineering' AND hierarchy_level = 1;

INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
SELECT
  'c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9',
  id,
  'Impersonation',
  'Social engineering attack where an attacker pretends to be someone they are not.',
  2
FROM topics
WHERE name = 'Social Engineering' AND hierarchy_level = 1;

-- Update existing "Disinformation" to be child of Social Engineering and update description
UPDATE topics
SET
  parent_topic_id = (SELECT id FROM topics WHERE name = 'Social Engineering' AND hierarchy_level = 1),
  description = 'Disinformation/misinformation tactics could be used to create fake social media posts or referrers (sites that link to the fake site) to boost search ranking.'
WHERE name = 'Disinformation' AND hierarchy_level = 2;

-- =============================================================================
-- LEVEL 3 TOPICS (Impersonation Tactics)
-- =============================================================================

-- Impersonation Tactics (children of "Impersonation")
INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
SELECT
  'c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9',
  id,
  'Persuasive / Consensus / Liking',
  'Convince the target that the request is a natural one that would be impolite or somehow "odd" to refuse.',
  3
FROM topics
WHERE name = 'Impersonation' AND hierarchy_level = 2;

INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
SELECT
  'c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9',
  id,
  'Coercion / Threat / Urgency',
  'Intimidate the target with a bogus appeal to authority or penalty, such as getting fired or not acting quickly enough to prevent some dire outcome.',
  3
FROM topics
WHERE name = 'Impersonation' AND hierarchy_level = 2;

-- Summary
SELECT
  'Total social engineering topics added' as metric,
  COUNT(*) as count
FROM topics
WHERE name IN (
  'Human Vector', 'Social Engineering', 'Pretexting', 'Phishing', 'Vishing',
  'SMiShing', 'Pharming', 'Typosquatting', 'Business Email Compromise',
  'Brand Impersonation', 'Watering Hole Attack', 'Impersonation',
  'Persuasive / Consensus / Liking', 'Coercion / Threat / Urgency'
);

-- Show hierarchy distribution
SELECT
  hierarchy_level,
  COUNT(*) as topic_count
FROM topics
GROUP BY hierarchy_level
ORDER BY hierarchy_level;
