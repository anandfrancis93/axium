-- Migration: Add trigger to automatically calculate calibration statistics
-- This trigger updates user_progress statistics whenever a new response is added

-- Function to calculate calibration statistics for a topic
CREATE OR REPLACE FUNCTION calculate_calibration_statistics()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_topic_id UUID;
  v_mean DECIMAL(4,2);
  v_stddev DECIMAL(4,2);
  v_slope DECIMAL(8,6);
  v_r_squared DECIMAL(4,2);
  v_count INTEGER;
  v_sum_x DECIMAL;
  v_sum_y DECIMAL;
  v_sum_xy DECIMAL;
  v_sum_x2 DECIMAL;
  v_sum_y2 DECIMAL;
  v_mean_x DECIMAL;
  v_mean_y DECIMAL;
  v_ss_xx DECIMAL;
  v_ss_yy DECIMAL;
  v_ss_xy DECIMAL;
BEGIN
  v_user_id := NEW.user_id;
  v_topic_id := NEW.topic_id;

  -- Calculate statistics from user_responses
  SELECT
    COUNT(*),
    AVG(calibration_score),
    STDDEV_POP(calibration_score)
  INTO
    v_count,
    v_mean,
    v_stddev
  FROM user_responses
  WHERE user_id = v_user_id
    AND topic_id = v_topic_id
    AND calibration_score IS NOT NULL;

  -- Calculate linear regression (slope and R²) if we have enough data points
  IF v_count >= 10 THEN
    -- Calculate sums for linear regression
    SELECT
      SUM(row_num),
      SUM(calibration_score),
      SUM(row_num * calibration_score),
      SUM(row_num * row_num),
      SUM(calibration_score * calibration_score)
    INTO
      v_sum_x,
      v_sum_y,
      v_sum_xy,
      v_sum_x2,
      v_sum_y2
    FROM (
      SELECT
        ROW_NUMBER() OVER (ORDER BY created_at) as row_num,
        calibration_score
      FROM user_responses
      WHERE user_id = v_user_id
        AND topic_id = v_topic_id
        AND calibration_score IS NOT NULL
    ) numbered_responses;

    -- Calculate means
    v_mean_x := v_sum_x / v_count;
    v_mean_y := v_sum_y / v_count;

    -- Calculate sums of squares
    v_ss_xx := v_sum_x2 - (v_sum_x * v_sum_x / v_count);
    v_ss_yy := v_sum_y2 - (v_sum_y * v_sum_y / v_count);
    v_ss_xy := v_sum_xy - (v_sum_x * v_sum_y / v_count);

    -- Calculate slope
    IF v_ss_xx > 0 THEN
      v_slope := v_ss_xy / v_ss_xx;
    ELSE
      v_slope := 0;
    END IF;

    -- Calculate R²
    IF v_ss_yy > 0 AND v_ss_xx > 0 THEN
      v_r_squared := (v_ss_xy * v_ss_xy) / (v_ss_xx * v_ss_yy);
    ELSE
      v_r_squared := 0;
    END IF;
  ELSE
    -- Not enough data for regression
    v_slope := 0;
    v_r_squared := 0;
  END IF;

  -- Update user_progress with calculated statistics
  UPDATE user_progress
  SET
    calibration_mean = COALESCE(v_mean, 0),
    calibration_stddev = COALESCE(v_stddev, 0),
    calibration_slope = COALESCE(v_slope, 0),
    calibration_r_squared = COALESCE(v_r_squared, 0),
    updated_at = NOW()
  WHERE user_id = v_user_id AND topic_id = v_topic_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on user_responses
DROP TRIGGER IF EXISTS update_calibration_statistics ON user_responses;
CREATE TRIGGER update_calibration_statistics
  AFTER INSERT ON user_responses
  FOR EACH ROW
  EXECUTE FUNCTION calculate_calibration_statistics();

-- Backfill existing data
DO $$
DECLARE
  progress_record RECORD;
BEGIN
  FOR progress_record IN
    SELECT DISTINCT user_id, topic_id
    FROM user_responses
    WHERE calibration_score IS NOT NULL
  LOOP
    -- This will trigger the calculation for each user-topic combination
    PERFORM calculate_calibration_statistics_for_topic(
      progress_record.user_id,
      progress_record.topic_id
    );
  END LOOP;
END $$;

-- Helper function to manually recalculate for a specific user-topic
CREATE OR REPLACE FUNCTION calculate_calibration_statistics_for_topic(
  p_user_id UUID,
  p_topic_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_mean DECIMAL(4,2);
  v_stddev DECIMAL(4,2);
  v_slope DECIMAL(8,6);
  v_r_squared DECIMAL(4,2);
  v_count INTEGER;
  v_sum_x DECIMAL;
  v_sum_y DECIMAL;
  v_sum_xy DECIMAL;
  v_sum_x2 DECIMAL;
  v_sum_y2 DECIMAL;
  v_mean_x DECIMAL;
  v_mean_y DECIMAL;
  v_ss_xx DECIMAL;
  v_ss_yy DECIMAL;
  v_ss_xy DECIMAL;
BEGIN
  -- Calculate statistics from user_responses
  SELECT
    COUNT(*),
    AVG(calibration_score),
    STDDEV_POP(calibration_score)
  INTO
    v_count,
    v_mean,
    v_stddev
  FROM user_responses
  WHERE user_id = p_user_id
    AND topic_id = p_topic_id
    AND calibration_score IS NOT NULL;

  -- Calculate linear regression if we have enough data
  IF v_count >= 10 THEN
    SELECT
      SUM(row_num),
      SUM(calibration_score),
      SUM(row_num * calibration_score),
      SUM(row_num * row_num),
      SUM(calibration_score * calibration_score)
    INTO
      v_sum_x,
      v_sum_y,
      v_sum_xy,
      v_sum_x2,
      v_sum_y2
    FROM (
      SELECT
        ROW_NUMBER() OVER (ORDER BY created_at) as row_num,
        calibration_score
      FROM user_responses
      WHERE user_id = p_user_id
        AND topic_id = p_topic_id
        AND calibration_score IS NOT NULL
    ) numbered_responses;

    v_mean_x := v_sum_x / v_count;
    v_mean_y := v_sum_y / v_count;
    v_ss_xx := v_sum_x2 - (v_sum_x * v_sum_x / v_count);
    v_ss_yy := v_sum_y2 - (v_sum_y * v_sum_y / v_count);
    v_ss_xy := v_sum_xy - (v_sum_x * v_sum_y / v_count);

    IF v_ss_xx > 0 THEN
      v_slope := v_ss_xy / v_ss_xx;
    ELSE
      v_slope := 0;
    END IF;

    IF v_ss_yy > 0 AND v_ss_xx > 0 THEN
      v_r_squared := (v_ss_xy * v_ss_xy) / (v_ss_xx * v_ss_yy);
    ELSE
      v_r_squared := 0;
    END IF;
  ELSE
    v_slope := 0;
    v_r_squared := 0;
  END IF;

  -- Update user_progress
  UPDATE user_progress
  SET
    calibration_mean = COALESCE(v_mean, 0),
    calibration_stddev = COALESCE(v_stddev, 0),
    calibration_slope = COALESCE(v_slope, 0),
    calibration_r_squared = COALESCE(v_r_squared, 0),
    updated_at = NOW()
  WHERE user_id = p_user_id AND topic_id = p_topic_id;
END;
$$ LANGUAGE plpgsql;
