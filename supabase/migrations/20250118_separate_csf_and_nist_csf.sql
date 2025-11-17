-- Separate "Cybersecurity Frameworks (CSF)" and "NIST Cybersecurity Framework"
-- Structure:
--   Level 3: Cybersecurity Frameworks (CSF) - general overview of frameworks
--     Level 4: NIST Cybersecurity Framework - specific NIST framework
--       Level 5: Identify, Protect, Detect, Respond, Recover

-- Step 1: Rename NIST CSF back to a generic frameworks topic
UPDATE topics
SET
  name = 'Cybersecurity Frameworks (CSF)',
  description = 'Standards, best practices, and guidelines for effective security risk management. Some frameworks are general in nature, while others are specific to industry or technology types.'
WHERE id = 'cd712f80-ca6c-4978-8b87-985d0512bcdd';

-- Step 2: Create NIST CSF as a level 4 child under Cybersecurity Frameworks
INSERT INTO topics (chapter_id, parent_topic_id, name, description, hierarchy_level)
VALUES
  ('0517450a-61b2-4fa2-a425-5846b21ba4b0', 'cd712f80-ca6c-4978-8b87-985d0512bcdd',
   'NIST Cybersecurity Framework',
   'The NIST Cybersecurity Framework provides a policy framework of computer security guidance for how private sector organizations can assess and improve their ability to prevent, detect, and respond to cyber attacks. It consists of five core functions: Identify, Protect, Detect, Respond, and Recover.',
   4)
RETURNING id;

-- Step 3: Update the 5 functions to be level 5 children under NIST CSF
-- First, get the new NIST CSF topic ID
DO $$
DECLARE
  nist_csf_id UUID;
BEGIN
  -- Get the newly created NIST CSF topic ID
  SELECT id INTO nist_csf_id
  FROM topics
  WHERE name = 'NIST Cybersecurity Framework'
    AND hierarchy_level = 4
    AND parent_topic_id = 'cd712f80-ca6c-4978-8b87-985d0512bcdd';

  -- Update the 5 functions to point to the new NIST CSF parent and be level 5
  UPDATE topics
  SET
    parent_topic_id = nist_csf_id,
    hierarchy_level = 5
  WHERE id IN (
    SELECT id FROM topics
    WHERE name IN ('Identify', 'Protect', 'Detect', 'Respond', 'Recover')
      AND parent_topic_id = 'cd712f80-ca6c-4978-8b87-985d0512bcdd'
  );
END $$;

-- Verify the new structure
SELECT
  t.hierarchy_level,
  REPEAT('  ', t.hierarchy_level - 3) || t.name as indented_name,
  LEFT(t.description, 60) || '...' as description_preview,
  pt.name as parent_name
FROM topics t
LEFT JOIN topics pt ON t.parent_topic_id = pt.id
WHERE t.id = 'cd712f80-ca6c-4978-8b87-985d0512bcdd'
   OR t.parent_topic_id = 'cd712f80-ca6c-4978-8b87-985d0512bcdd'
   OR t.parent_topic_id IN (
     SELECT id FROM topics WHERE parent_topic_id = 'cd712f80-ca6c-4978-8b87-985d0512bcdd'
   )
ORDER BY t.hierarchy_level, t.name;
