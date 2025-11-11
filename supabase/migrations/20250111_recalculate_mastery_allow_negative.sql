-- Recalculate user_dimension_coverage scores allowing negative values
-- This is what the mastery matrix actually displays

DO $$
DECLARE
  rec RECORD;
  response_rec RECORD;
  current_mastery DECIMAL;
  learning_gain DECIMAL;
  new_mastery DECIMAL;
  alpha CONSTANT DECIMAL := 0.3; -- EMA smoothing factor
BEGIN
  -- For each unique user-chapter-topic-bloom-dimension combination
  FOR rec IN (
    SELECT DISTINCT
      udc.user_id,
      udc.chapter_id,
      udc.topic_id,
      udc.bloom_level,
      udc.dimension
    FROM user_dimension_coverage udc
    ORDER BY udc.user_id, udc.topic_id, udc.bloom_level, udc.dimension
  )
  LOOP
    -- Reset mastery to 0 for recalculation
    current_mastery := 0;

    -- Get all responses for this dimension in chronological order
    FOR response_rec IN (
      SELECT
        ur.is_correct,
        ur.created_at
      FROM user_responses ur
      JOIN questions q ON ur.question_id = q.id
      WHERE ur.user_id = rec.user_id
        AND ur.topic_id = rec.topic_id
        AND ur.bloom_level = rec.bloom_level
        AND q.dimension = rec.dimension
      ORDER BY ur.created_at ASC
    )
    LOOP
      -- Calculate learning gain (simplified EMA)
      IF response_rec.is_correct THEN
        learning_gain := alpha * (100 - current_mastery); -- Move toward 100%
      ELSE
        learning_gain := alpha * (0 - current_mastery); -- Move toward 0%
      END IF;

      -- Apply learning gain WITHOUT floor (allow negative), cap at 100%
      new_mastery := LEAST(100, current_mastery + learning_gain);

      -- Update for next iteration
      current_mastery := new_mastery;
    END LOOP;

    -- Update the average_score in user_dimension_coverage
    UPDATE user_dimension_coverage
    SET average_score = current_mastery,
        updated_at = NOW()
    WHERE user_id = rec.user_id
      AND chapter_id = rec.chapter_id
      AND topic_id = rec.topic_id
      AND bloom_level = rec.bloom_level
      AND dimension = rec.dimension;

    RAISE NOTICE 'Updated dimension coverage for user % topic % bloom % dim % to %',
      rec.user_id, rec.topic_id, rec.bloom_level, rec.dimension, current_mastery;
  END LOOP;

  RAISE NOTICE 'Dimension coverage recalculation complete';
END $$;
