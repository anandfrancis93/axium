-- Create "Motivations of Threat Actors" parent and group motivation topics under it
-- subject_id: c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9 (Cybersecurity)

-- Step 1: Create parent topic
INSERT INTO topics (subject_id, parent_topic_id, name, description, hierarchy_level)
VALUES
  ('c1f9b907-9f8e-41d8-aef4-0ea1e42f57e9', NULL,
   'Motivations of Threat Actors',
   'Reasons behind cyber attacks, including financial gain, espionage, hacktivism, and revenge. Understanding threat actor motivations helps predict attack patterns and implement appropriate defenses.',
   1);

-- Step 2: Move all 6 motivation topics to be Level 2 children of the new parent
UPDATE topics
SET
  parent_topic_id = (SELECT id FROM topics WHERE name = 'Motivations of Threat Actors' AND hierarchy_level = 1),
  hierarchy_level = 2
WHERE name IN (
  'Service disruption',
  'Data exfiltration',
  'Blackmail',
  'Extortion',
  'Fraud',
  'Disinformation'
);

-- Verify the changes
SELECT
  'Motivations grouped' as action,
  COUNT(*) as count
FROM topics
WHERE parent_topic_id = (SELECT id FROM topics WHERE name = 'Motivations of Threat Actors' AND hierarchy_level = 1);

-- Show the hierarchy
SELECT
  CASE hierarchy_level
    WHEN 1 THEN name
    WHEN 2 THEN '  +- ' || name
  END as tree,
  hierarchy_level
FROM topics t
WHERE name = 'Motivations of Threat Actors'
   OR parent_topic_id = (SELECT id FROM topics WHERE name = 'Motivations of Threat Actors' AND hierarchy_level = 1)
ORDER BY
  hierarchy_level,
  name;

-- Show new distribution
SELECT
  hierarchy_level,
  COUNT(*) as topic_count
FROM topics
GROUP BY hierarchy_level
ORDER BY hierarchy_level;
