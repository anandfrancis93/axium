-- ========================================
-- DEBUG REWARD CALCULATION LOGGING
-- ========================================

-- 1. Check if ANY reward_calculation logs exist (bypass RLS)
SELECT COUNT(*) as total_reward_logs
FROM rl_decision_log
WHERE decision_type = 'reward_calculation';

-- 2. Check if there are any errors in the logs
SELECT
  decision_type,
  created_at,
  topic_id IS NOT NULL as has_topic,
  bloom_level IS NOT NULL as has_bloom,
  is_correct IS NOT NULL as has_is_correct,
  confidence IS NOT NULL as has_confidence,
  response_time_seconds IS NOT NULL as has_response_time,
  reward_components IS NOT NULL as has_reward_components,
  response_id IS NOT NULL as has_response_id,
  question_id IS NOT NULL as has_question_id
FROM rl_decision_log
ORDER BY created_at DESC
LIMIT 20;

-- 3. Check mastery_update values in detail
SELECT
  created_at,
  topic_id,
  bloom_level,
  old_mastery,
  new_mastery,
  mastery_formula,
  response_id IS NOT NULL as has_response_id
FROM rl_decision_log
WHERE decision_type = 'mastery_update'
ORDER BY created_at DESC
LIMIT 10;

-- 4. Check if response_id exists in user_responses
SELECT
  dl.decision_type,
  dl.created_at,
  dl.response_id,
  ur.id as actual_response_id,
  ur.is_correct,
  ur.confidence
FROM rl_decision_log dl
LEFT JOIN user_responses ur ON dl.response_id = ur.id
WHERE dl.decision_type IN ('mastery_update', 'reward_calculation')
ORDER BY dl.created_at DESC
LIMIT 10;

-- 5. Try to manually insert a test reward_calculation log
-- (This will help identify if it's a constraint or RLS issue)
-- UNCOMMENT TO TEST:
/*
INSERT INTO rl_decision_log (
  user_id,
  session_id,
  decision_type,
  topic_id,
  bloom_level,
  is_correct,
  confidence,
  response_time_seconds,
  reward_components
) VALUES (
  auth.uid(),
  (SELECT id FROM learning_sessions WHERE user_id = auth.uid() ORDER BY created_at DESC LIMIT 1),
  'reward_calculation',
  (SELECT id FROM topics LIMIT 1),
  1,
  true,
  3,
  30,
  '{"learningGain": 5.0, "calibration": 2.0, "spacing": 1.0, "recognition": 3.0, "responseTime": 2.0, "streak": 0.0, "total": 13.0}'::jsonb
);
*/

-- After uncommenting and running the insert, check if it worked:
-- SELECT * FROM rl_decision_log WHERE decision_type = 'reward_calculation' ORDER BY created_at DESC LIMIT 1;
