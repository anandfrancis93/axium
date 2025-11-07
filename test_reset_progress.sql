-- SQL queries to verify reset progress functionality
-- Run these BEFORE and AFTER clicking reset progress button

-- Replace with your chapter_id
\set chapter_id '0517450a-61b2-4fa2-a425-5846b21ba4b0'

-- ============================================================================
-- BEFORE RESET: Count all data for this chapter
-- ============================================================================

-- 1. Check user_responses (via sessions)
SELECT
  'user_responses' as table_name,
  COUNT(*) as record_count
FROM user_responses ur
WHERE session_id IN (
  SELECT id FROM learning_sessions
  WHERE chapter_id = '0517450a-61b2-4fa2-a425-5846b21ba4b0'
);

-- 2. Check learning_sessions
SELECT
  'learning_sessions' as table_name,
  COUNT(*) as record_count
FROM learning_sessions
WHERE chapter_id = '0517450a-61b2-4fa2-a425-5846b21ba4b0';

-- 3. Check user_topic_mastery
SELECT
  'user_topic_mastery' as table_name,
  COUNT(*) as record_count
FROM user_topic_mastery
WHERE chapter_id = '0517450a-61b2-4fa2-a425-5846b21ba4b0';

-- 4. Check rl_arm_stats
SELECT
  'rl_arm_stats' as table_name,
  COUNT(*) as record_count
FROM rl_arm_stats
WHERE chapter_id = '0517450a-61b2-4fa2-a425-5846b21ba4b0';

-- 5. Check user_dimension_coverage
SELECT
  'user_dimension_coverage' as table_name,
  COUNT(*) as record_count
FROM user_dimension_coverage
WHERE chapter_id = '0517450a-61b2-4fa2-a425-5846b21ba4b0';

-- 6. Check generated questions (NOT deleted by reset - stored for reuse)
SELECT
  'questions (generated)' as table_name,
  COUNT(*) as record_count
FROM questions q
INNER JOIN topics t ON t.id = q.topic_id
WHERE t.chapter_id = '0517450a-61b2-4fa2-a425-5846b21ba4b0'
  AND q.source_type = 'ai_generated_realtime';

-- ============================================================================
-- Summary view
-- ============================================================================
SELECT
  'SUMMARY' as info,
  (SELECT COUNT(*) FROM user_responses ur WHERE session_id IN (SELECT id FROM learning_sessions WHERE chapter_id = '0517450a-61b2-4fa2-a425-5846b21ba4b0')) as responses,
  (SELECT COUNT(*) FROM learning_sessions WHERE chapter_id = '0517450a-61b2-4fa2-a425-5846b21ba4b0') as sessions,
  (SELECT COUNT(*) FROM user_topic_mastery WHERE chapter_id = '0517450a-61b2-4fa2-a425-5846b21ba4b0') as mastery,
  (SELECT COUNT(*) FROM rl_arm_stats WHERE chapter_id = '0517450a-61b2-4fa2-a425-5846b21ba4b0') as arm_stats,
  (SELECT COUNT(*) FROM user_dimension_coverage WHERE chapter_id = '0517450a-61b2-4fa2-a425-5846b21ba4b0') as dimension_coverage,
  (SELECT COUNT(*) FROM questions q INNER JOIN topics t ON t.id = q.topic_id WHERE t.chapter_id = '0517450a-61b2-4fa2-a425-5846b21ba4b0' AND q.source_type = 'ai_generated_realtime') as generated_questions;
