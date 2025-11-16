-- Drop broken RL phase distribution view
-- This view references rl_phase column which was deleted in 20250115_drop_rl_phase.sql

DROP VIEW IF EXISTS v_rl_phase_distribution;

-- Comment: This view was broken after deleting rl_phase column from user_progress table
