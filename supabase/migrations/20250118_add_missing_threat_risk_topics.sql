-- Add missing threat, risk, and vulnerability topics with formal textbook definitions
-- chapter_id: 0517450a-61b2-4fa2-a425-5846b21ba4b0 (CompTIA Security+ SY0-701)
-- parent_id for fundamental concepts: e679b2ad-c848-4f73-a491-25d036db67bd (Summarize fundamental security concepts) - Level 2
-- parent_id for threat actors: 74bee594-3b11-44cb-83c8-3a6697a526f5 (Threat actors) - Level 3
-- parent_id for motivations: 16cc3e8c-0f12-4330-871d-034aefeaef5c (Motivations of threat actors) - Level 3

-- Fundamental security concepts (Level 3 - under Level 2 parent)
INSERT INTO topics (chapter_id, parent_topic_id, name, description, hierarchy_level)
VALUES
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', 'e679b2ad-c848-4f73-a491-25d036db67bd',
   'Vulnerability',
   'A weakness that could be triggered accidentally or exploited intentionally to cause a security breach.',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', 'e679b2ad-c848-4f73-a491-25d036db67bd',
   'Risk',
   'Likelihood and impact (or consequence) of a threat actor exercising a vulnerability. Risk = Impact * Likelihood',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', 'e679b2ad-c848-4f73-a491-25d036db67bd',
   'Threat',
   'A potential for an entity to exercise a vulnerability (that is, to breach security).',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', 'e679b2ad-c848-4f73-a491-25d036db67bd',
   'Threat Actor',
   'A person or entity responsible for an event that has been identified as a security incident or as a risk.',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', 'e679b2ad-c848-4f73-a491-25d036db67bd',
   'Intentional Threat',
   'A threat actor with a malicious purpose.',
   3),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', 'e679b2ad-c848-4f73-a491-25d036db67bd',
   'Unintentional Threat',
   'A threat actor that causes a vulnerability or exposes an attack vector without malicious intent.',
   3);

-- Threat actor types (Level 4 - under Level 3 parent "Threat actors")
INSERT INTO topics (chapter_id, parent_topic_id, name, description, hierarchy_level)
VALUES
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', '74bee594-3b11-44cb-83c8-3a6697a526f5',
   'Internal Threat Actor',
   'An internal actor has been granted some access permissions.',
   4),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', '74bee594-3b11-44cb-83c8-3a6697a526f5',
   'External Threat Actor',
   'An external threat actor has no standing privileges.',
   4),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', '74bee594-3b11-44cb-83c8-3a6697a526f5',
   'Hacker',
   'Often used to refer to someone who breaks into computer systems or spreads viruses, ethical hackers prefer to think of themselves as experts on and explorers of computer security systems.',
   4),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', '74bee594-3b11-44cb-83c8-3a6697a526f5',
   'Unauthorized Hacker',
   'A hacker operating with malicious intent.',
   4),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', '74bee594-3b11-44cb-83c8-3a6697a526f5',
   'Authorized Hacker',
   'A hacker engaged in authorized penetration testing or other security consultancy.',
   4),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', '74bee594-3b11-44cb-83c8-3a6697a526f5',
   'Advanced Persistent Threat (APT)',
   'An attacker''s ability to obtain, maintain, and diversify access to network systems using exploits and malware.',
   4),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', '74bee594-3b11-44cb-83c8-3a6697a526f5',
   'Whistleblower',
   'A whistleblower is someone with an ethical motivation for releasing confidential information. While this could be classed as an internal threat in some respects, it is important to realize that whistleblowers making protected disclosures, such as reporting financial fraud through an authorized channel, cannot themselves be threatened or labeled in any way that seems retaliatory or punitive.',
   4),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', '74bee594-3b11-44cb-83c8-3a6697a526f5',
   'Unintentional or Inadvertent Insider Threat',
   'A threat actor that causes a vulnerability or exposes an attack vector without malicious intent.',
   4);

-- Threat actor motivations (Level 4 - under Level 3 parent "Motivations of threat actors")
INSERT INTO topics (chapter_id, parent_topic_id, name, description, hierarchy_level)
VALUES
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', '16cc3e8c-0f12-4330-871d-034aefeaef5c',
   'Disinformation',
   'A type of attack that falsifies an information resource that is normally trusted by others.',
   4),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', '16cc3e8c-0f12-4330-871d-034aefeaef5c',
   'Extortion',
   'Demanding payment to prevent or halt some type of attack.',
   4),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', '16cc3e8c-0f12-4330-871d-034aefeaef5c',
   'Fraud',
   'Falsifying records, such as an internal fraud that involves tampering with accounts.',
   4);

-- Summary of additions
SELECT
  COUNT(*) as total_added,
  parent_topic_id,
  pt.name as parent_topic,
  t.hierarchy_level
FROM topics t
JOIN topics pt ON t.parent_topic_id = pt.id
WHERE t.name IN (
  'Vulnerability', 'Risk', 'Threat', 'Threat Actor', 'Intentional Threat', 'Unintentional Threat',
  'Internal Threat Actor', 'External Threat Actor', 'Hacker', 'Unauthorized Hacker',
  'Authorized Hacker', 'Advanced Persistent Threat (APT)', 'Whistleblower',
  'Unintentional or Inadvertent Insider Threat',
  'Disinformation', 'Extortion', 'Fraud'
)
GROUP BY parent_topic_id, pt.name, t.hierarchy_level
ORDER BY t.hierarchy_level, pt.name;
