-- User Data Statistics Query
-- Run this query to see a comprehensive overview of all your saved data
-- Replace 'YOUR_USER_ID_HERE' with your actual user ID from auth.users

WITH user_stats AS (
  SELECT
    -- User Responses
    (SELECT COUNT(*) FROM user_responses WHERE user_id = auth.uid()) as total_responses,
    (SELECT COUNT(DISTINCT topic_id) FROM user_responses WHERE user_id = auth.uid()) as topics_attempted,
    (SELECT COUNT(DISTINCT bloom_level) FROM user_responses WHERE user_id = auth.uid()) as bloom_levels_attempted,
    (SELECT COUNT(*) FROM user_responses WHERE user_id = auth.uid() AND is_correct = true) as correct_responses,
    (SELECT COUNT(*) FROM user_responses WHERE user_id = auth.uid() AND is_correct = false) as incorrect_responses,

    -- Learning Sessions
    (SELECT COUNT(*) FROM learning_sessions WHERE user_id = auth.uid()) as total_sessions,
    (SELECT COUNT(*) FROM learning_sessions WHERE user_id = auth.uid() AND ended_at IS NOT NULL) as completed_sessions,
    (SELECT COUNT(*) FROM learning_sessions WHERE user_id = auth.uid() AND ended_at IS NULL) as active_sessions,

    -- User Progress
    (SELECT COUNT(*) FROM user_progress WHERE user_id = auth.uid()) as topics_in_progress,
    (SELECT COUNT(*) FROM user_progress WHERE user_id = auth.uid() AND current_bloom_level >= 6) as topics_at_max_bloom,

    -- Topic Mastery
    (SELECT COUNT(*) FROM user_topic_mastery WHERE user_id = auth.uid()) as topics_with_mastery_data,
    (SELECT COUNT(*) FROM user_topic_mastery WHERE user_id = auth.uid() AND overall_mastery >= 80) as mastered_topics,

    -- Dimension Coverage
    (SELECT COUNT(*) FROM user_dimension_coverage WHERE user_id = auth.uid()) as dimension_coverage_records,
    (SELECT COUNT(DISTINCT dimension_id) FROM user_dimension_coverage WHERE user_id = auth.uid()) as unique_dimensions_covered,

    -- RL Arm Stats
    (SELECT COUNT(*) FROM rl_arm_stats WHERE user_id = auth.uid()) as rl_arm_stats_records,
    (SELECT COUNT(DISTINCT topic_id) FROM rl_arm_stats WHERE user_id = auth.uid()) as topics_with_rl_stats,

    -- RL Decision Log (Audit)
    (SELECT COUNT(*) FROM rl_decision_log WHERE user_id = auth.uid()) as total_decision_logs,
    (SELECT COUNT(*) FROM rl_decision_log WHERE user_id = auth.uid() AND decision_type = 'arm_selection') as arm_selection_logs,
    (SELECT COUNT(*) FROM rl_decision_log WHERE user_id = auth.uid() AND decision_type = 'reward_calculation') as reward_calculation_logs,
    (SELECT COUNT(*) FROM rl_decision_log WHERE user_id = auth.uid() AND decision_type = 'mastery_update') as mastery_update_logs,
    (SELECT COUNT(*) FROM rl_decision_log WHERE user_id = auth.uid() AND decision_type = 'data_deletion') as data_deletion_logs,

    -- Questions (AI-generated for user)
    (SELECT COUNT(*) FROM questions WHERE created_by = auth.uid()) as ai_generated_questions,
    (SELECT COUNT(DISTINCT topic_id) FROM questions WHERE created_by = auth.uid()) as topics_with_generated_questions,

    -- API Call Logs
    (SELECT COUNT(*) FROM api_call_log WHERE user_id = auth.uid()) as total_api_calls,
    (SELECT COALESCE(SUM(total_cost), 0) FROM api_call_log WHERE user_id = auth.uid()) as total_api_cost_usd,

    -- User Info
    (SELECT email FROM auth.users WHERE id = auth.uid()) as user_email,
    (SELECT created_at FROM auth.users WHERE id = auth.uid()) as account_created_at
)
SELECT
  -- User Identity
  user_email as "Email",
  to_char(account_created_at, 'YYYY-MM-DD HH24:MI') as "Account Created",

  -- Learning Activity
  total_responses as "Total Responses",
  correct_responses as "Correct",
  incorrect_responses as "Incorrect",
  CASE
    WHEN total_responses > 0
    THEN ROUND((correct_responses::numeric / total_responses::numeric) * 100, 1)
    ELSE 0
  END as "Accuracy %",

  -- Topic Progress
  topics_attempted as "Topics Attempted",
  topics_in_progress as "Topics In Progress",
  topics_with_mastery_data as "Topics w/ Mastery Data",
  mastered_topics as "Mastered Topics (≥80%)",
  topics_at_max_bloom as "Topics at Bloom 6",

  -- Bloom Levels
  bloom_levels_attempted as "Bloom Levels Tried",

  -- Dimensions
  unique_dimensions_covered as "Unique Dimensions",
  dimension_coverage_records as "Dimension Records",

  -- Sessions
  total_sessions as "Total Sessions",
  completed_sessions as "Completed Sessions",
  active_sessions as "Active Sessions",

  -- RL System
  rl_arm_stats_records as "RL Arm Stats Records",
  topics_with_rl_stats as "Topics w/ RL Stats",

  -- Audit Logs
  total_decision_logs as "Total Audit Logs",
  arm_selection_logs as "Arm Selection Logs",
  reward_calculation_logs as "Reward Calc Logs",
  mastery_update_logs as "Mastery Update Logs",
  data_deletion_logs as "Data Deletion Logs",

  -- Generated Content
  ai_generated_questions as "AI Questions Generated",
  topics_with_generated_questions as "Topics w/ AI Questions",

  -- API Usage
  total_api_calls as "Total API Calls",
  ROUND(total_api_cost_usd::numeric, 4) as "Total API Cost ($)"

FROM user_stats;
