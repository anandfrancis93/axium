-- ========================================
-- CHECK DECISION LOG ENTRIES
-- ========================================
-- Run this in Supabase SQL Editor to verify logging is working

-- 1. Count by decision type
SELECT
  decision_type,
  COUNT(*) as count
FROM rl_decision_log
GROUP BY decision_type
ORDER BY decision_type;

-- 2. View recent decisions with proper columns
SELECT
  decision_type,
  created_at,
  topic_id,
  bloom_level,
  selected_arm->>'topic_name' as selected_topic,
  selected_arm->>'bloom_level' as selected_bloom,
  is_correct,
  confidence,
  old_mastery,
  new_mastery
FROM rl_decision_log
ORDER BY created_at DESC
LIMIT 20;

-- 3. Check for errors (missing required fields)
SELECT
  decision_type,
  created_at,
  CASE
    WHEN decision_type = 'arm_selection' AND selected_arm IS NULL THEN 'Missing selected_arm'
    WHEN decision_type = 'reward_calculation' AND reward_components IS NULL THEN 'Missing reward_components'
    WHEN decision_type = 'mastery_update' AND (old_mastery IS NULL OR new_mastery IS NULL) THEN 'Missing mastery values'
    ELSE 'OK'
  END as status,
  topic_id,
  bloom_level
FROM rl_decision_log
ORDER BY created_at DESC
LIMIT 20;

-- 4. Check reward_calculation entries specifically
SELECT
  created_at,
  topic_id,
  bloom_level,
  is_correct,
  confidence,
  reward_components
FROM rl_decision_log
WHERE decision_type = 'reward_calculation'
ORDER BY created_at DESC
LIMIT 10;

-- 5. Check mastery_update entries specifically
SELECT
  created_at,
  topic_id,
  bloom_level,
  old_mastery,
  new_mastery,
  (new_mastery - old_mastery) as change,
  mastery_formula
FROM rl_decision_log
WHERE decision_type = 'mastery_update'
ORDER BY created_at DESC
LIMIT 10;
