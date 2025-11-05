-- ============================================================================
-- Axium RL System Database Schema
-- Implements Thompson Sampling Contextual Bandits for Adaptive Learning
-- ============================================================================

-- ============================================================================
-- 1. USER TOPIC MASTERY TABLE
-- Tracks per-user, per-topic, per-Bloom-level mastery scores
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_topic_mastery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  bloom_level INT NOT NULL CHECK (bloom_level BETWEEN 1 AND 6),
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,

  -- Mastery tracking
  mastery_score DECIMAL(5,2) DEFAULT 0.0 CHECK (mastery_score BETWEEN 0 AND 100),
  questions_attempted INT DEFAULT 0,
  questions_correct INT DEFAULT 0,

  -- Temporal tracking
  last_practiced_at TIMESTAMPTZ,
  first_practiced_at TIMESTAMPTZ DEFAULT NOW(),

  -- Confidence calibration
  avg_confidence DECIMAL(3,2), -- 1.0 to 5.0
  confidence_accuracy DECIMAL(5,2), -- How well confidence predicts correctness (0-100%)

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one record per user-topic-bloom-chapter combination
  UNIQUE(user_id, topic, bloom_level, chapter_id)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_mastery_lookup ON user_topic_mastery(user_id, chapter_id, mastery_score);
CREATE INDEX IF NOT EXISTS idx_user_mastery_topic ON user_topic_mastery(user_id, topic, bloom_level);
CREATE INDEX IF NOT EXISTS idx_user_mastery_last_practiced ON user_topic_mastery(user_id, last_practiced_at);

-- Enable RLS
ALTER TABLE user_topic_mastery ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own mastery"
  ON user_topic_mastery FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own mastery"
  ON user_topic_mastery FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mastery records"
  ON user_topic_mastery FOR UPDATE
  USING (auth.uid() = user_id);


-- ============================================================================
-- 2. RL ARM STATISTICS TABLE
-- Thompson Sampling: Beta distribution parameters for each (topic, bloom_level) arm
-- ============================================================================

CREATE TABLE IF NOT EXISTS rl_arm_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  bloom_level INT NOT NULL CHECK (bloom_level BETWEEN 1 AND 6),

  -- Beta distribution parameters (Thompson Sampling)
  alpha DECIMAL(10,2) DEFAULT 1.0, -- Successes + 1
  beta DECIMAL(10,2) DEFAULT 1.0,  -- Failures + 1

  -- Statistics
  times_selected INT DEFAULT 0,
  total_reward DECIMAL(10,2) DEFAULT 0.0,
  avg_reward DECIMAL(5,2) DEFAULT 0.0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one record per user-chapter-topic-bloom combination
  UNIQUE(user_id, chapter_id, topic, bloom_level)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rl_arms_lookup ON rl_arm_stats(user_id, chapter_id);
CREATE INDEX IF NOT EXISTS idx_rl_arms_topic ON rl_arm_stats(user_id, topic, bloom_level);

-- Enable RLS
ALTER TABLE rl_arm_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own RL stats"
  ON rl_arm_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own RL stats"
  ON rl_arm_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own RL stats"
  ON rl_arm_stats FOR UPDATE
  USING (auth.uid() = user_id);


-- ============================================================================
-- 3. ENHANCE QUESTIONS TABLE - Multi-Topic Support
-- ============================================================================

-- Add multi-topic columns
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS primary_topic TEXT,
ADD COLUMN IF NOT EXISTS secondary_topics TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS topic_weights JSONB DEFAULT '{"primary": 1.0, "secondary": []}'::jsonb;

-- Add constraint: must have either primary_topic or topic
ALTER TABLE questions
DROP CONSTRAINT IF EXISTS check_has_topic;

ALTER TABLE questions
ADD CONSTRAINT check_has_topic CHECK (
  primary_topic IS NOT NULL OR topic IS NOT NULL
);

-- Index for multi-topic queries
CREATE INDEX IF NOT EXISTS idx_questions_primary_topic ON questions(chapter_id, primary_topic, bloom_level);
CREATE INDEX IF NOT EXISTS idx_questions_secondary_topics ON questions USING GIN(secondary_topics);

-- Add comment explaining multi-topic structure
COMMENT ON COLUMN questions.primary_topic IS 'Main topic being tested (weight 1.0)';
COMMENT ON COLUMN questions.secondary_topics IS 'Supporting topics involved in question (array)';
COMMENT ON COLUMN questions.topic_weights IS 'JSON: {"primary": 1.0, "secondary": [0.3, 0.2]}';


-- ============================================================================
-- 4. ENHANCE LEARNING SESSIONS TABLE - RL Metadata
-- ============================================================================

ALTER TABLE learning_sessions
ADD COLUMN IF NOT EXISTS selection_algorithm TEXT DEFAULT 'thompson_sampling',
ADD COLUMN IF NOT EXISTS session_avg_reward DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS exploration_rate DECIMAL(3,2); -- % of exploratory vs exploitative selections

COMMENT ON COLUMN learning_sessions.selection_algorithm IS 'RL algorithm used: thompson_sampling, epsilon_greedy, etc';
COMMENT ON COLUMN learning_sessions.session_avg_reward IS 'Average reward across all questions in session';
COMMENT ON COLUMN learning_sessions.exploration_rate IS 'Percentage of questions that were exploratory choices';


-- ============================================================================
-- 5. ENHANCE USER RESPONSES TABLE - RL Tracking
-- ============================================================================

ALTER TABLE user_responses
ADD COLUMN IF NOT EXISTS mastery_before DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS mastery_after DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS learning_gain DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS reward_received DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS arm_selected TEXT; -- e.g., "Encryption_L4"

-- Index for reward analysis
CREATE INDEX IF NOT EXISTS idx_user_responses_reward ON user_responses(user_id, reward_received);
CREATE INDEX IF NOT EXISTS idx_user_responses_learning_gain ON user_responses(user_id, learning_gain);

COMMENT ON COLUMN user_responses.mastery_before IS 'Mastery score before answering (0-100)';
COMMENT ON COLUMN user_responses.mastery_after IS 'Mastery score after answering (0-100)';
COMMENT ON COLUMN user_responses.learning_gain IS 'Change in mastery: mastery_after - mastery_before';
COMMENT ON COLUMN user_responses.reward_received IS 'Total RL reward for this response';
COMMENT ON COLUMN user_responses.arm_selected IS 'Which (topic, bloom_level) arm was selected';


-- ============================================================================
-- 6. HELPER FUNCTIONS
-- ============================================================================

-- Function to get user's available arms (topics they can practice)
CREATE OR REPLACE FUNCTION get_available_arms(
  p_user_id UUID,
  p_chapter_id UUID
)
RETURNS TABLE (
  topic TEXT,
  bloom_level INT,
  mastery_score DECIMAL,
  is_unlocked BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH topic_bloom_combinations AS (
    -- Get all unique (topic, bloom_level) combinations from questions
    SELECT DISTINCT
      COALESCE(q.primary_topic, q.topic) as topic,
      q.bloom_level
    FROM questions q
    WHERE q.chapter_id = p_chapter_id
  ),
  user_mastery AS (
    -- Get user's current mastery
    SELECT
      utm.topic,
      utm.bloom_level,
      utm.mastery_score,
      utm.questions_correct
    FROM user_topic_mastery utm
    WHERE utm.user_id = p_user_id
      AND utm.chapter_id = p_chapter_id
  )
  SELECT
    tbc.topic,
    tbc.bloom_level,
    COALESCE(um.mastery_score, 0.0) as mastery_score,
    CASE
      -- Bloom Level 1 is always unlocked
      WHEN tbc.bloom_level = 1 THEN true
      -- Higher levels require prerequisite mastery
      ELSE EXISTS (
        SELECT 1
        FROM user_mastery um_prereq
        WHERE um_prereq.topic = tbc.topic
          AND um_prereq.bloom_level = tbc.bloom_level - 1
          AND um_prereq.mastery_score >= 80
          AND um_prereq.questions_correct >= 3
      )
    END as is_unlocked
  FROM topic_bloom_combinations tbc
  LEFT JOIN user_mastery um
    ON um.topic = tbc.topic
    AND um.bloom_level = tbc.bloom_level
  ORDER BY tbc.topic, tbc.bloom_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update mastery score (Exponential Moving Average)
CREATE OR REPLACE FUNCTION update_topic_mastery(
  p_user_id UUID,
  p_topic TEXT,
  p_bloom_level INT,
  p_chapter_id UUID,
  p_is_correct BOOLEAN,
  p_confidence INT,
  p_learning_gain DECIMAL,
  p_weight DECIMAL DEFAULT 1.0
)
RETURNS VOID AS $$
DECLARE
  v_current_mastery DECIMAL;
  v_new_mastery DECIMAL;
  v_learning_rate DECIMAL;
BEGIN
  -- Get current mastery (or 0 if not exists)
  SELECT mastery_score INTO v_current_mastery
  FROM user_topic_mastery
  WHERE user_id = p_user_id
    AND topic = p_topic
    AND bloom_level = p_bloom_level
    AND chapter_id = p_chapter_id;

  v_current_mastery := COALESCE(v_current_mastery, 0.0);

  -- Calculate new mastery with weighted learning gain
  v_new_mastery := v_current_mastery + (p_learning_gain * p_weight);
  v_new_mastery := GREATEST(0, LEAST(100, v_new_mastery)); -- Clamp to 0-100

  -- Insert or update mastery record
  INSERT INTO user_topic_mastery (
    user_id,
    topic,
    bloom_level,
    chapter_id,
    mastery_score,
    questions_attempted,
    questions_correct,
    last_practiced_at,
    first_practiced_at,
    updated_at
  )
  VALUES (
    p_user_id,
    p_topic,
    p_bloom_level,
    p_chapter_id,
    v_new_mastery,
    1,
    CASE WHEN p_is_correct THEN 1 ELSE 0 END,
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id, topic, bloom_level, chapter_id)
  DO UPDATE SET
    mastery_score = v_new_mastery,
    questions_attempted = user_topic_mastery.questions_attempted + 1,
    questions_correct = user_topic_mastery.questions_correct + CASE WHEN p_is_correct THEN 1 ELSE 0 END,
    last_practiced_at = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update RL arm stats (Thompson Sampling)
CREATE OR REPLACE FUNCTION update_arm_stats(
  p_user_id UUID,
  p_chapter_id UUID,
  p_topic TEXT,
  p_bloom_level INT,
  p_reward DECIMAL
)
RETURNS VOID AS $$
DECLARE
  v_normalized_reward DECIMAL;
BEGIN
  -- Normalize reward from [-10, 20] to [0, 1]
  v_normalized_reward := (p_reward + 10.0) / 30.0;
  v_normalized_reward := GREATEST(0, LEAST(1, v_normalized_reward));

  -- Insert or update arm stats
  INSERT INTO rl_arm_stats (
    user_id,
    chapter_id,
    topic,
    bloom_level,
    alpha,
    beta,
    times_selected,
    total_reward,
    avg_reward,
    updated_at
  )
  VALUES (
    p_user_id,
    p_chapter_id,
    p_topic,
    p_bloom_level,
    1.0 + v_normalized_reward,
    1.0 + (1.0 - v_normalized_reward),
    1,
    p_reward,
    p_reward,
    NOW()
  )
  ON CONFLICT (user_id, chapter_id, topic, bloom_level)
  DO UPDATE SET
    alpha = rl_arm_stats.alpha + v_normalized_reward,
    beta = rl_arm_stats.beta + (1.0 - v_normalized_reward),
    times_selected = rl_arm_stats.times_selected + 1,
    total_reward = rl_arm_stats.total_reward + p_reward,
    avg_reward = (rl_arm_stats.total_reward + p_reward) / (rl_arm_stats.times_selected + 1),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- 7. ANALYTICS VIEWS
-- ============================================================================

-- View: User's mastery heatmap (topic × bloom level)
CREATE OR REPLACE VIEW user_mastery_heatmap AS
SELECT
  utm.user_id,
  utm.chapter_id,
  utm.topic,
  MAX(CASE WHEN utm.bloom_level = 1 THEN utm.mastery_score END) as bloom_1,
  MAX(CASE WHEN utm.bloom_level = 2 THEN utm.mastery_score END) as bloom_2,
  MAX(CASE WHEN utm.bloom_level = 3 THEN utm.mastery_score END) as bloom_3,
  MAX(CASE WHEN utm.bloom_level = 4 THEN utm.mastery_score END) as bloom_4,
  MAX(CASE WHEN utm.bloom_level = 5 THEN utm.mastery_score END) as bloom_5,
  MAX(CASE WHEN utm.bloom_level = 6 THEN utm.mastery_score END) as bloom_6,
  AVG(utm.mastery_score) as avg_mastery
FROM user_topic_mastery utm
GROUP BY utm.user_id, utm.chapter_id, utm.topic;

-- View: User's learning progress summary
CREATE OR REPLACE VIEW user_progress_summary AS
SELECT
  utm.user_id,
  utm.chapter_id,
  COUNT(DISTINCT utm.topic) as topics_started,
  COUNT(*) FILTER (WHERE utm.mastery_score >= 80) as topics_mastered,
  AVG(utm.mastery_score) as overall_mastery,
  SUM(utm.questions_attempted) as total_questions_attempted,
  SUM(utm.questions_correct) as total_questions_correct,
  CASE
    WHEN SUM(utm.questions_attempted) > 0
    THEN (SUM(utm.questions_correct)::DECIMAL / SUM(utm.questions_attempted) * 100)
    ELSE 0
  END as overall_accuracy,
  MAX(utm.last_practiced_at) as last_activity
FROM user_topic_mastery utm
GROUP BY utm.user_id, utm.chapter_id;


-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Add helpful comments
COMMENT ON TABLE user_topic_mastery IS 'Tracks per-user mastery for each (topic, bloom_level) pair';
COMMENT ON TABLE rl_arm_stats IS 'Thompson Sampling: Beta distribution parameters for each arm';
COMMENT ON FUNCTION get_available_arms IS 'Returns topics user can practice based on mastery prerequisites';
COMMENT ON FUNCTION update_topic_mastery IS 'Updates mastery score using exponential moving average';
COMMENT ON FUNCTION update_arm_stats IS 'Updates Thompson Sampling Beta parameters after reward';

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'RL System Schema Migration Complete!';
  RAISE NOTICE 'Tables created: user_topic_mastery, rl_arm_stats';
  RAISE NOTICE 'Functions created: get_available_arms, update_topic_mastery, update_arm_stats';
  RAISE NOTICE 'Views created: user_mastery_heatmap, user_progress_summary';
END $$;
