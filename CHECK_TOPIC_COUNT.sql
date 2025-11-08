-- Check how many topics are actually in the database by depth

-- Count by depth
SELECT
  depth,
  COUNT(*) as topic_count
FROM topics
WHERE chapter_id IS NOT NULL
GROUP BY depth
ORDER BY depth;

-- Count total topics
SELECT COUNT(*) as total_topics
FROM topics
WHERE chapter_id IS NOT NULL;

-- Show sample topics by depth
SELECT
  depth,
  name,
  full_name
FROM topics
WHERE chapter_id IS NOT NULL
ORDER BY depth, name
LIMIT 50;
