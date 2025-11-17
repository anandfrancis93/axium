-- Renumber hierarchy levels now that domains and objectives are removed
-- Old: Level 3, 4, 5
-- New: Level 1, 2, 3

-- Update all topics: subtract 2 from current hierarchy_level
UPDATE topics
SET hierarchy_level = hierarchy_level - 2;

-- Verify the new distribution
SELECT
  hierarchy_level,
  COUNT(*) as topic_count
FROM topics
GROUP BY hierarchy_level
ORDER BY hierarchy_level;
