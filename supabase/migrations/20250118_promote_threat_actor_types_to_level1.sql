-- Promote threat actor types from Level 2 to Level 1
-- Remove parent relationship with "Threat Actor" topic

UPDATE topics
SET
  parent_topic_id = NULL,
  hierarchy_level = 1
WHERE name IN (
  'Advanced Persistent Threat (APT)',
  'Authorized Hacker',
  'External Threat Actor',
  'Hacker',
  'Internal Threat Actor',
  'Unauthorized Hacker',
  'Unintentional or Inadvertent Insider Threat',
  'Whistleblower'
)
AND hierarchy_level = 2;

-- Verify the changes
SELECT
  'Promoted to Level 1' as action,
  COUNT(*) as count
FROM topics
WHERE name IN (
  'Advanced Persistent Threat (APT)',
  'Authorized Hacker',
  'External Threat Actor',
  'Hacker',
  'Internal Threat Actor',
  'Unauthorized Hacker',
  'Unintentional or Inadvertent Insider Threat',
  'Whistleblower'
)
AND hierarchy_level = 1
AND parent_topic_id IS NULL;

-- Show new distribution
SELECT
  hierarchy_level,
  COUNT(*) as topic_count
FROM topics
GROUP BY hierarchy_level
ORDER BY hierarchy_level;
