-- Cleanup Migration: Drop Zombie Columns and Broken Functions
--
-- This migration removes leftover features that were added then removed:
-- 1. Calibration statistics columns (trigger was dropped, columns remain)
-- 2. Dimension system functions (tables were dropped, functions remain)
-- 3. Topic embedding function (column doesn't exist, function broken)
-- 4. Thompson Sampling function (references dropped table)
-- 5. Streak-based functions (column doesn't exist)

-- =============================================================================
-- 1. DROP ZOMBIE COLUMNS FROM user_progress
-- =============================================================================

-- These columns were added by 20250115_add_statistical_tracking.sql
-- The trigger was dropped by 20250116_drop_broken_calibration_trigger.sql
-- But the columns remain unused

ALTER TABLE user_progress
DROP COLUMN IF EXISTS calibration_mean,
DROP COLUMN IF EXISTS calibration_stddev,
DROP COLUMN IF EXISTS calibration_slope,
DROP COLUMN IF EXISTS calibration_r_squared,
DROP COLUMN IF EXISTS questions_to_mastery;

-- =============================================================================
-- 2. DROP BROKEN DIMENSION FUNCTIONS
-- =============================================================================

-- Tables dropped: user_dimension_coverage, subject_dimension_config
-- These functions reference those tables and are broken

DROP FUNCTION IF EXISTS get_topic_dimension_matrix(UUID, UUID);
DROP FUNCTION IF EXISTS get_least_tested_dimension_by_id(UUID, UUID);
DROP FUNCTION IF EXISTS get_topic_dimension_summary(UUID);
DROP FUNCTION IF EXISTS calculate_dimension_matrix(UUID, UUID);

-- Legacy dimension calculation functions
DROP FUNCTION IF EXISTS get_least_tested_dimension(TEXT, TEXT);

-- =============================================================================
-- 3. DROP TOPIC EMBEDDING FUNCTION
-- =============================================================================

-- Column topics.embedding doesn't exist, function is broken
DROP FUNCTION IF EXISTS find_similar_topics(UUID, INTEGER);

-- =============================================================================
-- 4. DROP THOMPSON SAMPLING FUNCTION
-- =============================================================================

-- References dropped user_topic_mastery table
DROP FUNCTION IF EXISTS calculate_thompson_sampling_quality_weight(NUMERIC, INTEGER);

-- =============================================================================
-- 5. DROP STREAK-BASED FUNCTIONS
-- =============================================================================

-- Column user_progress.current_streak doesn't exist
DROP FUNCTION IF EXISTS update_user_progress_with_streak(UUID, UUID, INTEGER, TEXT, BOOLEAN);

-- =============================================================================
-- 6. DROP CALIBRATION VIEWS (if they exist)
-- =============================================================================

DROP VIEW IF EXISTS v_calibration_distribution;
DROP VIEW IF EXISTS v_user_calibration_stats;

-- =============================================================================
-- 7. DROP RL PHASE FUNCTIONS (if any remain)
-- =============================================================================

DROP FUNCTION IF EXISTS determine_rl_phase(BIGINT, NUMERIC, NUMERIC, NUMERIC);
DROP FUNCTION IF EXISTS determine_rl_phase(INTEGER, NUMERIC, NUMERIC, NUMERIC);

COMMENT ON TABLE user_progress IS 'User learning progress - tracks mastery per Bloom level, attempts, and last practiced time. Calibration statistics and RL phase tracking removed.';
