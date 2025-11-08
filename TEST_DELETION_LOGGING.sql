-- ========================================
-- TEST DELETION TRANSPARENCY LOGGING
-- ========================================
-- Run these queries to verify deletion logging works correctly

-- 1. View all deletion logs
SELECT
  id,
  created_at,
  selection_reasoning as reason,
  topic_id,
  bloom_level,
  state_snapshot->'scope' as scope,
  state_snapshot->'deleted_counts' as deleted_counts
FROM rl_decision_log
WHERE decision_type = 'data_deletion'
ORDER BY created_at DESC;

-- 2. View deletion log with full snapshot (detailed)
SELECT
  id,
  created_at,
  selection_reasoning as reason,
  state_snapshot->'scope' as scope,
  state_snapshot->'chapter_id' as chapter_id,
  topic_id,
  bloom_level,
  state_snapshot->'deleted_counts'->>'responses' as responses_deleted,
  state_snapshot->'deleted_counts'->>'mastery' as mastery_deleted,
  state_snapshot->'deleted_counts'->>'armStats' as arm_stats_deleted,
  state_snapshot->'deleted_counts'->>'progress' as progress_deleted,
  state_snapshot->'deleted_counts'->>'questions' as questions_deleted,
  state_snapshot->'data_snapshot' as data_snapshot
FROM rl_decision_log
WHERE decision_type = 'data_deletion'
ORDER BY created_at DESC
LIMIT 10;

-- 3. Count deletions by scope
SELECT
  state_snapshot->>'scope' as deletion_scope,
  COUNT(*) as total_deletions
FROM rl_decision_log
WHERE decision_type = 'data_deletion'
GROUP BY state_snapshot->>'scope'
ORDER BY total_deletions DESC;

-- 4. View all decision types (including deletions)
SELECT
  decision_type,
  COUNT(*) as count,
  MIN(created_at) as first_logged,
  MAX(created_at) as last_logged
FROM rl_decision_log
GROUP BY decision_type
ORDER BY count DESC;

-- 5. View recent deletion with snapshot details
-- (This shows you can recover what was deleted)
SELECT
  id,
  created_at,
  selection_reasoning,
  state_snapshot->'data_snapshot'->'responses' as deleted_responses_snapshot,
  state_snapshot->'data_snapshot'->'mastery' as deleted_mastery_snapshot,
  state_snapshot->'data_snapshot'->'armStats' as deleted_arm_stats_snapshot
FROM rl_decision_log
WHERE decision_type = 'data_deletion'
ORDER BY created_at DESC
LIMIT 1;
