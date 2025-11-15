-- Diagnostic script: Check what's already in the database
-- Run this first to see what exists before applying the migration

-- Check user_progress columns
SELECT 'user_progress columns:' as check_type;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_progress'
AND column_name IN (
  'calibration_mean',
  'calibration_stddev',
  'calibration_slope',
  'calibration_r_squared',
  'questions_to_mastery',
  'rl_phase'
)
ORDER BY column_name;

-- Check user_responses columns
SELECT 'user_responses columns:' as check_type;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_responses'
AND column_name IN (
  'calibration_score',
  'question_format'
)
ORDER BY column_name;

-- Check if functions exist
SELECT 'Functions:' as check_type;
SELECT routine_name
FROM information_schema.routines
WHERE routine_name IN (
  'calculate_calibration_regression',
  'calculate_calibration_stddev',
  'determine_rl_phase',
  'project_questions_to_mastery',
  'update_calibration_statistics'
)
ORDER BY routine_name;

-- Check if views exist
SELECT 'Views:' as check_type;
SELECT table_name
FROM information_schema.views
WHERE table_name IN (
  'v_calibration_trends',
  'v_format_performance',
  'v_rl_phase_distribution'
)
ORDER BY table_name;

-- Check if trigger exists
SELECT 'Triggers:' as check_type;
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'trigger_update_calibration_statistics';

-- Check if indexes exist
SELECT 'Indexes:' as check_type;
SELECT indexname
FROM pg_indexes
WHERE indexname IN (
  'idx_user_progress_rl_phase',
  'idx_user_responses_question_format',
  'idx_user_responses_calibration_score'
)
ORDER BY indexname;

SELECT 'Diagnostic check complete!' as status;
