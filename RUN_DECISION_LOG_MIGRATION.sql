-- ========================================
-- CREATE DECISION LOG TABLE FOR FULL TRANSPARENCY
-- ========================================
-- Run this in Supabase SQL Editor
-- (Settings > Database > SQL Editor)

-- Create comprehensive decision logging for full transparency

CREATE TABLE rl_decision_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES learning_sessions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Decision type
  decision_type TEXT NOT NULL, -- 'arm_selection', 'reward_calculation', 'mastery_update'

  -- Arm selection details (for Thompson Sampling)
  all_arms JSONB, -- [{topic_id, bloom_level, alpha, beta, sampled_value}, ...]
  selected_arm JSONB, -- {topic_id, bloom_level, alpha, beta, sampled_value}
  selection_reasoning TEXT,

  -- Question details
  question_id UUID REFERENCES questions(id) ON DELETE SET NULL,
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  bloom_level INTEGER,

  -- Response details (for reward/mastery)
  response_id UUID REFERENCES user_responses(id) ON DELETE SET NULL,
  is_correct BOOLEAN,
  confidence INTEGER,
  response_time_seconds INTEGER,

  -- Reward calculation breakdown
  reward_components JSONB, -- {learning_gain, calibration, spacing, recognition, response_time, streak, total}

  -- Mastery calculation
  old_mastery DECIMAL(5,2),
  new_mastery DECIMAL(5,2),
  mastery_formula TEXT, -- "EMA: 0.2 * 1.0 + 0.8 * 0.75 = 0.80"

  -- Full state snapshot (for debugging)
  state_snapshot JSONB -- All relevant state at decision time
);

-- Indexes for fast queries
CREATE INDEX idx_rl_decision_log_user_id ON rl_decision_log(user_id);
CREATE INDEX idx_rl_decision_log_session_id ON rl_decision_log(session_id);
CREATE INDEX idx_rl_decision_log_decision_type ON rl_decision_log(decision_type);
CREATE INDEX idx_rl_decision_log_created_at ON rl_decision_log(created_at DESC);

-- RLS Policies
ALTER TABLE rl_decision_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own decision logs"
  ON rl_decision_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own decision logs"
  ON rl_decision_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE rl_decision_log IS 'Audit log for all RL decisions - enables full transparency and reproducibility';
