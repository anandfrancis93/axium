-- Add NIST Cybersecurity Framework with its 5 core functions
-- Structure:
--   Level 3: NIST Cybersecurity Framework (replaces generic "Cybersecurity Frameworks (CSF)")
--   Level 4: Identify, Protect, Detect, Respond, Recover (the 5 functions)

-- Get chapter_id and parent_id for reference
-- chapter_id: 0517450a-61b2-4fa2-a425-5846b21ba4b0 (CompTIA Security+ SY0-701)
-- parent_id: 72efbaee-92c7-420c-b215-ebded3e7319e (Compare and contrast various types of security controls)
-- CSF topic_id: cd712f80-ca6c-4978-8b87-985d0512bcdd

-- Update the generic CSF topic to be specifically NIST CSF
UPDATE topics
SET
  name = 'NIST Cybersecurity Framework',
  description = 'The NIST Cybersecurity Framework provides a policy framework of computer security guidance for how private sector organizations can assess and improve their ability to prevent, detect, and respond to cyber attacks. It consists of five core functions: Identify, Protect, Detect, Respond, and Recover.'
WHERE id = 'cd712f80-ca6c-4978-8b87-985d0512bcdd'
  AND name = 'Cybersecurity Frameworks (CSF)';

-- Add the 5 core functions as level 4 subtopics under NIST CSF
INSERT INTO topics (chapter_id, parent_topic_id, name, description, hierarchy_level)
VALUES
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', 'cd712f80-ca6c-4978-8b87-985d0512bcdd',
   'Identify',
   'Develop security policies and capabilities. Evaluate risks, threats, and vulnerabilities and recommend security controls to mitigate them.',
   4),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', 'cd712f80-ca6c-4978-8b87-985d0512bcdd',
   'Protect',
   'Procure/develop, install, operate, and decommission IT hardware and software assets with security as an embedded requirement of every stage of this operation''s lifecycle.',
   4),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', 'cd712f80-ca6c-4978-8b87-985d0512bcdd',
   'Detect',
   'Perform ongoing, proactive monitoring to ensure that controls are effective and capable of protecting against new types of threats.',
   4),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', 'cd712f80-ca6c-4978-8b87-985d0512bcdd',
   'Respond',
   'Identify, analyze, contain, and eradicate threats to systems and data security.',
   4),
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', 'cd712f80-ca6c-4978-8b87-985d0512bcdd',
   'Recover',
   'Implement cybersecurity resilience to restore systems and data if other controls are unable to prevent attacks.',
   4);

-- Verify the structure
SELECT
  t.hierarchy_level,
  t.name,
  LEFT(t.description, 80) || '...' as description_preview,
  pt.name as parent_name
FROM topics t
LEFT JOIN topics pt ON t.parent_topic_id = pt.id
WHERE t.name IN ('NIST Cybersecurity Framework', 'Identify', 'Protect', 'Detect', 'Respond', 'Recover')
  OR t.id = 'cd712f80-ca6c-4978-8b87-985d0512bcdd'
ORDER BY t.hierarchy_level, t.name;
