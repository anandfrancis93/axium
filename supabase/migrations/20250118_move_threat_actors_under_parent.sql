-- Move threat actor types to be Level 2 children of "Threat Actor"
-- These were previously promoted to Level 1, now grouping them back under parent

UPDATE topics
SET
  parent_topic_id = (SELECT id FROM topics WHERE name = 'Threat Actor' AND hierarchy_level = 1),
  hierarchy_level = 2
WHERE name IN (
  'Authorized Hacker',
  'External Threat Actor',
  'Hacker',
  'Hacktivist',
  'Insider threat',
  'Internal Threat Actor',
  'Nation-state',
  'Organized crime',
  'Unauthorized Hacker',
  'Unintentional or Inadvertent Insider Threat',
  'Unskilled attacker',
  'Whistleblower'
)
AND hierarchy_level = 1;

-- Verify the changes
SELECT
  'Moved to Level 2 under Threat Actor' as action,
  COUNT(*) as count
FROM topics
WHERE name IN (
  'Authorized Hacker',
  'External Threat Actor',
  'Hacker',
  'Hacktivist',
  'Insider threat',
  'Internal Threat Actor',
  'Nation-state',
  'Organized crime',
  'Unauthorized Hacker',
  'Unintentional or Inadvertent Insider Threat',
  'Unskilled attacker',
  'Whistleblower'
)
AND hierarchy_level = 2
AND parent_topic_id = (SELECT id FROM topics WHERE name = 'Threat Actor' AND hierarchy_level = 1);

-- Show new distribution
SELECT
  hierarchy_level,
  COUNT(*) as topic_count
FROM topics
GROUP BY hierarchy_level
ORDER BY hierarchy_level;
