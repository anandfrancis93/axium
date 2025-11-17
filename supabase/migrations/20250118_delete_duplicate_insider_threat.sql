-- Delete duplicate "Insider threat" topic
-- Keeping: fd7678c3-6c52-4a0b-85d1-0230569eedb1 (under "Threat actors") ✅
-- Deleting: e92a823a-691a-490e-a1d6-465e4275248c (under "User guidance and training") ❌

-- Verify no questions exist before deletion
DO $$
DECLARE
  question_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO question_count
  FROM questions
  WHERE topic_id = 'e92a823a-691a-490e-a1d6-465e4275248c';

  IF question_count > 0 THEN
    RAISE EXCEPTION 'Cannot delete topic: % questions exist', question_count;
  END IF;
END $$;

-- Delete the misplaced duplicate
DELETE FROM topics
WHERE id = 'e92a823a-691a-490e-a1d6-465e4275248c'
  AND name = 'Insider threat'
  AND parent_topic_id IN (
    SELECT id FROM topics WHERE name = 'User guidance and training'
  );

-- Verify deletion (should show only 1 remaining)
SELECT
  id,
  name,
  pt.name as parent_name,
  created_at
FROM topics t
LEFT JOIN topics pt ON t.parent_topic_id = pt.id
WHERE t.name = 'Insider threat';
