-- Remove chapter concept, link topics directly to subjects
-- Keep only "Cybersecurity" subject, remove "CompTIA Security+" subject

-- Step 1: Add subject_id column to topics
ALTER TABLE topics ADD COLUMN subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE;

-- Step 2: Populate subject_id from existing chapter relationships
UPDATE topics
SET subject_id = chapters.subject_id
FROM chapters
WHERE topics.chapter_id = chapters.id;

-- Step 3: Make subject_id NOT NULL (all topics should now have a subject)
ALTER TABLE topics ALTER COLUMN subject_id SET NOT NULL;

-- Step 4: Drop indexes that reference chapter_id
DROP INDEX IF EXISTS idx_topics_chapter_id;
DROP INDEX IF EXISTS idx_topics_sequence;
DROP INDEX IF EXISTS topics_chapter_parent_name_idx;

-- Step 5: Drop chapter_id column (no longer needed)
ALTER TABLE topics DROP COLUMN chapter_id;

-- Step 5: Delete all chapters (no longer needed)
DELETE FROM chapters;

-- Step 6: Delete "CompTIA Security+" subject (keep only "Cybersecurity")
DELETE FROM subjects WHERE name != 'Cybersecurity';

-- Step 7: Recreate indexes with subject_id instead of chapter_id
CREATE INDEX idx_topics_subject_id ON topics(subject_id);
CREATE INDEX idx_topics_sequence ON topics(subject_id, sequence_order);
CREATE UNIQUE INDEX topics_subject_parent_name_idx ON topics(subject_id, COALESCE(parent_topic_id, '00000000-0000-0000-0000-000000000000'::uuid), name);

-- Summary
SELECT
  'Subjects remaining' as metric,
  COUNT(*) as count
FROM subjects
UNION ALL
SELECT
  'Chapters remaining',
  COUNT(*)
FROM chapters
UNION ALL
SELECT
  'Topics remaining',
  COUNT(*)
FROM topics
UNION ALL
SELECT
  'Topics in Cybersecurity subject',
  COUNT(*)
FROM topics t
JOIN subjects s ON t.subject_id = s.id
WHERE s.name = 'Cybersecurity';
