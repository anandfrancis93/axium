-- Safe migration: Check what exists and apply only what's missing
-- Run this to safely complete the migration

-- ============================================================================
-- PART 1: Check and add missing columns to user_progress
-- ============================================================================

-- Add calibration_mean if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_progress' AND column_name = 'calibration_mean'
  ) THEN
    ALTER TABLE user_progress ADD COLUMN calibration_mean DECIMAL(4,2) DEFAULT 0.0;
    COMMENT ON COLUMN user_progress.calibration_mean IS 'Average calibration score (-1.5 to +1.5) - measures metacognitive accuracy';
  END IF;
END $$;

-- Add calibration_stddev if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_progress' AND column_name = 'calibration_stddev'
  ) THEN
    ALTER TABLE user_progress ADD COLUMN calibration_stddev DECIMAL(4,2) DEFAULT 0.0;
    COMMENT ON COLUMN user_progress.calibration_stddev IS 'Standard deviation of calibration scores - measures consistency';
  END IF;
END $$;

-- Add calibration_slope if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_progress' AND column_name = 'calibration_slope'
  ) THEN
    ALTER TABLE user_progress ADD COLUMN calibration_slope DECIMAL(6,4) DEFAULT 0.0;
    COMMENT ON COLUMN user_progress.calibration_slope IS 'Linear regression slope of calibration over time - measures improvement rate';
  END IF;
END $$;

-- Add calibration_r_squared if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_progress' AND column_name = 'calibration_r_squared'
  ) THEN
    ALTER TABLE user_progress ADD COLUMN calibration_r_squared DECIMAL(3,2) DEFAULT 0.0;
    COMMENT ON COLUMN user_progress.calibration_r_squared IS 'R² value of linear regression (0-1) - measures trend reliability';
  END IF;
END $$;

-- Add questions_to_mastery if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_progress' AND column_name = 'questions_to_mastery'
  ) THEN
    ALTER TABLE user_progress ADD COLUMN questions_to_mastery INTEGER;
    COMMENT ON COLUMN user_progress.questions_to_mastery IS 'Projected number of questions needed to reach mastery based on current trend';
  END IF;
END $$;

-- rl_phase already exists based on error, skip it

-- Update mastery_scores comment
COMMENT ON COLUMN user_progress.mastery_scores IS
  'TRACK 2 (Student Display): Mastery scores per Bloom level per Format (0-100).
   Structure: {"bloom_level": {"format": score, ...}, ...}
   Example: {"1": {"mcq_single": 85, "open_ended": 70}, "2": {"mcq_single": 78}}
   Legacy format {"1": 85} is also supported for backward compatibility.';

-- ============================================================================
-- PART 2: Check and add missing columns to user_responses
-- ============================================================================

-- Add calibration_score if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_responses' AND column_name = 'calibration_score'
  ) THEN
    ALTER TABLE user_responses ADD COLUMN calibration_score DECIMAL(4,2);
    COMMENT ON COLUMN user_responses.calibration_score IS 'TRACK 1 (RL System): Calibration score (-1.5 to +1.5) - format-independent measure of metacognitive accuracy';
  END IF;
END $$;

-- Add question_format if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_responses' AND column_name = 'question_format'
  ) THEN
    ALTER TABLE user_responses ADD COLUMN question_format TEXT;
    COMMENT ON COLUMN user_responses.question_format IS 'Question format: mcq_single, mcq_multi, true_false, fill_blank, matching, open_ended';
  END IF;
END $$;

-- Update reward column comment
COMMENT ON COLUMN user_responses.reward IS
  'DEPRECATED: Use calibration_score instead. Legacy reward field maintained for backward compatibility.';

-- ============================================================================
-- PART 3: Create indexes if they don't exist
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_progress_rl_phase ON user_progress(rl_phase);
CREATE INDEX IF NOT EXISTS idx_user_responses_question_format ON user_responses(question_format);
CREATE INDEX IF NOT EXISTS idx_user_responses_calibration_score ON user_responses(calibration_score);

-- ============================================================================
-- PART 4: Create check constraints if they don't exist
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_rl_phase'
  ) THEN
    ALTER TABLE user_progress
    ADD CONSTRAINT check_rl_phase
    CHECK (rl_phase IN ('cold_start', 'exploration', 'optimization', 'stabilization'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_question_format'
  ) THEN
    ALTER TABLE user_responses
    ADD CONSTRAINT check_question_format
    CHECK (question_format IN ('mcq_single', 'mcq_multi', 'true_false', 'fill_blank', 'matching', 'open_ended') OR question_format IS NULL);
  END IF;
END $$;

-- ============================================================================
-- PART 5: Create or replace functions (safe to run multiple times)
-- ============================================================================

-- Helper function to check if mastery_scores uses legacy format
CREATE OR REPLACE FUNCTION is_legacy_mastery_scores(scores JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM jsonb_each(scores)
    WHERE jsonb_typeof(value) = 'number'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to convert legacy mastery_scores to new format
CREATE OR REPLACE FUNCTION migrate_legacy_mastery_scores(scores JSONB)
RETURNS JSONB AS $$
DECLARE
  new_scores JSONB := '{}'::jsonb;
  bloom_level TEXT;
  score_value NUMERIC;
BEGIN
  IF NOT is_legacy_mastery_scores(scores) THEN
    RETURN scores;
  END IF;

  FOR bloom_level, score_value IN
    SELECT key, value::numeric
    FROM jsonb_each_text(scores)
  LOOP
    new_scores := jsonb_set(
      new_scores,
      ARRAY[bloom_level],
      jsonb_build_object('overall', score_value)
    );
  END LOOP;

  RETURN new_scores;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Calculate linear regression slope for calibration scores
CREATE OR REPLACE FUNCTION calculate_calibration_regression(
  p_user_id UUID,
  p_topic_id UUID,
  p_min_samples INTEGER DEFAULT 10
)
RETURNS TABLE (
  slope DECIMAL(6,4),
  r_squared DECIMAL(3,2),
  sample_count INTEGER
) AS $$
DECLARE
  n INTEGER;
  sum_x DECIMAL := 0;
  sum_y DECIMAL := 0;
  sum_xy DECIMAL := 0;
  sum_x2 DECIMAL := 0;
  sum_y2 DECIMAL := 0;
  mean_x DECIMAL;
  mean_y DECIMAL;
  variance_x DECIMAL;
  variance_y DECIMAL;
  covariance DECIMAL;
  slope_val DECIMAL;
  r_squared_val DECIMAL;
BEGIN
  SELECT COUNT(*) INTO n
  FROM user_responses
  WHERE user_id = p_user_id
    AND topic_id = p_topic_id
    AND calibration_score IS NOT NULL;

  IF n < p_min_samples THEN
    RETURN QUERY SELECT 0::DECIMAL(6,4), 0::DECIMAL(3,2), n;
    RETURN;
  END IF;

  SELECT
    SUM(row_number),
    SUM(calibration_score),
    SUM(row_number * calibration_score),
    SUM(row_number * row_number),
    SUM(calibration_score * calibration_score)
  INTO sum_x, sum_y, sum_xy, sum_x2, sum_y2
  FROM (
    SELECT
      ROW_NUMBER() OVER (ORDER BY created_at) as row_number,
      calibration_score
    FROM user_responses
    WHERE user_id = p_user_id
      AND topic_id = p_topic_id
      AND calibration_score IS NOT NULL
  ) numbered;

  mean_x := sum_x / n;
  mean_y := sum_y / n;
  variance_x := (sum_x2 / n) - (mean_x * mean_x);
  variance_y := (sum_y2 / n) - (mean_y * mean_y);
  covariance := (sum_xy / n) - (mean_x * mean_y);

  IF variance_x > 0 THEN
    slope_val := covariance / variance_x;
  ELSE
    slope_val := 0;
  END IF;

  IF variance_y > 0 THEN
    r_squared_val := (covariance * covariance) / (variance_x * variance_y);
    r_squared_val := LEAST(GREATEST(r_squared_val, 0), 1);
  ELSE
    r_squared_val := 0;
  END IF;

  RETURN QUERY SELECT slope_val::DECIMAL(6,4), r_squared_val::DECIMAL(3,2), n;
END;
$$ LANGUAGE plpgsql;

-- Calculate standard deviation of calibration scores
CREATE OR REPLACE FUNCTION calculate_calibration_stddev(
  p_user_id UUID,
  p_topic_id UUID
)
RETURNS DECIMAL(4,2) AS $$
DECLARE
  stddev_val DECIMAL;
BEGIN
  SELECT STDDEV(calibration_score)
  INTO stddev_val
  FROM user_responses
  WHERE user_id = p_user_id
    AND topic_id = p_topic_id
    AND calibration_score IS NOT NULL;

  RETURN COALESCE(stddev_val, 0)::DECIMAL(4,2);
END;
$$ LANGUAGE plpgsql;

-- Determine RL phase based on attempts and variance
CREATE OR REPLACE FUNCTION determine_rl_phase(
  p_total_attempts INTEGER,
  p_calibration_stddev DECIMAL,
  p_calibration_slope DECIMAL,
  p_r_squared DECIMAL
)
RETURNS TEXT AS $$
BEGIN
  IF p_total_attempts < 10 THEN
    RETURN 'cold_start';
  END IF;

  IF p_total_attempts BETWEEN 10 AND 50 THEN
    RETURN 'exploration';
  END IF;

  IF p_total_attempts >= 150 AND p_calibration_stddev < 0.3 AND p_r_squared > 0.7 THEN
    RETURN 'stabilization';
  END IF;

  RETURN 'optimization';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Project questions to mastery
CREATE OR REPLACE FUNCTION project_questions_to_mastery(
  p_calibration_mean DECIMAL,
  p_calibration_slope DECIMAL,
  p_r_squared DECIMAL,
  p_total_attempts INTEGER,
  p_mastery_threshold DECIMAL DEFAULT 1.2
)
RETURNS INTEGER AS $$
DECLARE
  questions_needed INTEGER;
  current_score DECIMAL;
  score_gap DECIMAL;
BEGIN
  IF p_r_squared < 0.5 OR p_calibration_slope <= 0 THEN
    RETURN NULL;
  END IF;

  current_score := p_calibration_mean;
  score_gap := p_mastery_threshold - current_score;

  IF score_gap <= 0 THEN
    RETURN 0;
  END IF;

  questions_needed := CEIL(score_gap / p_calibration_slope);
  RETURN LEAST(questions_needed, 500);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- PART 6: Create or replace trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION update_calibration_statistics()
RETURNS TRIGGER AS $$
DECLARE
  regression_result RECORD;
  stddev_val DECIMAL;
  mean_val DECIMAL;
  phase_val TEXT;
  questions_val INTEGER;
BEGIN
  IF NEW.calibration_score IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT AVG(calibration_score)
  INTO mean_val
  FROM user_responses
  WHERE user_id = NEW.user_id
    AND topic_id = NEW.topic_id
    AND calibration_score IS NOT NULL;

  stddev_val := calculate_calibration_stddev(NEW.user_id, NEW.topic_id);

  SELECT * INTO regression_result
  FROM calculate_calibration_regression(NEW.user_id, NEW.topic_id);

  SELECT determine_rl_phase(
    (SELECT COUNT(*) FROM user_responses WHERE user_id = NEW.user_id AND topic_id = NEW.topic_id),
    stddev_val,
    regression_result.slope,
    regression_result.r_squared
  ) INTO phase_val;

  questions_val := project_questions_to_mastery(
    mean_val,
    regression_result.slope,
    regression_result.r_squared,
    regression_result.sample_count
  );

  UPDATE user_progress
  SET
    calibration_mean = mean_val,
    calibration_stddev = stddev_val,
    calibration_slope = regression_result.slope,
    calibration_r_squared = regression_result.r_squared,
    questions_to_mastery = questions_val,
    rl_phase = phase_val,
    updated_at = NOW()
  WHERE user_id = NEW.user_id
    AND topic_id = NEW.topic_id;

  IF NOT FOUND THEN
    INSERT INTO user_progress (
      user_id,
      topic_id,
      calibration_mean,
      calibration_stddev,
      calibration_slope,
      calibration_r_squared,
      questions_to_mastery,
      rl_phase,
      total_attempts
    ) VALUES (
      NEW.user_id,
      NEW.topic_id,
      mean_val,
      stddev_val,
      regression_result.slope,
      regression_result.r_squared,
      questions_val,
      phase_val,
      1
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_calibration_statistics ON user_responses;
CREATE TRIGGER trigger_update_calibration_statistics
  AFTER INSERT ON user_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_calibration_statistics();

-- ============================================================================
-- PART 7: Backfill calibration_score from reward (if needed)
-- ============================================================================

UPDATE user_responses
SET calibration_score = reward
WHERE calibration_score IS NULL AND reward IS NOT NULL;

-- ============================================================================
-- PART 8: Create or replace views
-- ============================================================================

CREATE OR REPLACE VIEW v_calibration_trends AS
SELECT
  ur.user_id,
  ur.topic_id,
  t.name as topic_name,
  DATE_TRUNC('day', ur.created_at) as day,
  COUNT(*) as attempts,
  AVG(ur.calibration_score) as avg_calibration,
  STDDEV(ur.calibration_score) as stddev_calibration,
  AVG(CASE WHEN ur.is_correct THEN 100 ELSE 0 END) as correctness_rate
FROM user_responses ur
JOIN topics t ON ur.topic_id = t.id
WHERE ur.calibration_score IS NOT NULL
GROUP BY ur.user_id, ur.topic_id, t.name, DATE_TRUNC('day', ur.created_at);

CREATE OR REPLACE VIEW v_format_performance AS
SELECT
  ur.user_id,
  ur.topic_id,
  t.name as topic_name,
  ur.question_format,
  COUNT(*) as attempts,
  AVG(CASE WHEN ur.is_correct THEN 100 ELSE 0 END) as correctness_rate,
  AVG(ur.calibration_score) as avg_calibration,
  AVG(ur.confidence) as avg_confidence
FROM user_responses ur
JOIN topics t ON ur.topic_id = t.id
WHERE ur.question_format IS NOT NULL
GROUP BY ur.user_id, ur.topic_id, t.name, ur.question_format;

CREATE OR REPLACE VIEW v_rl_phase_distribution AS
SELECT
  up.user_id,
  up.rl_phase,
  COUNT(*) as topic_count,
  AVG(up.calibration_mean) as avg_calibration,
  AVG(up.calibration_slope) as avg_slope,
  AVG(up.questions_to_mastery) as avg_questions_to_mastery
FROM user_progress up
GROUP BY up.user_id, up.rl_phase;

-- ============================================================================
-- DONE! Migration complete.
-- ============================================================================

SELECT 'Migration completed successfully!' as status;
