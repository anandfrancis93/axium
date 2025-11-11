-- Recalculate all mastery scores allowing negative values
-- This replays all user responses in chronological order

DO $$
DECLARE
  rec RECORD;
  current_mastery DECIMAL;
  learning_gain DECIMAL;
  new_mastery DECIMAL;
  alpha CONSTANT DECIMAL := 0.3; -- EMA smoothing factor
BEGIN
  -- For each unique user-topic-bloom combination
  FOR rec IN
    SELECT DISTINCT
      user_id,
      topic_id,
      bloom_level,
      chapter_id
    FROM user_responses
    ORDER BY user_id, topic_id, bloom_level
  LOOP
    -- Reset mastery to 0 for recalculation
    current_mastery := 0;

    -- Process all responses for this combination in chronological order
    FOR response IN
      SELECT
        id,
        is_correct,
        confidence,
        created_at
      FROM user_responses
      WHERE user_id = rec.user_id
        AND topic_id = rec.topic_id
        AND bloom_level = rec.bloom_level
      ORDER BY created_at ASC
    LOOP
      -- Calculate learning gain (simplified - matches calculateLearningGain logic)
      -- This is a simplified version; actual calculation includes calibration + recognition
      IF response.is_correct THEN
        learning_gain := alpha * (100 - current_mastery); -- Move toward 100%
      ELSE
        learning_gain := alpha * (0 - current_mastery); -- Move toward 0%
      END IF;

      -- Apply learning gain WITHOUT floor (allow negative)
      -- Only cap at 100% ceiling
      new_mastery := LEAST(100, current_mastery + learning_gain);

      -- Update current mastery for next iteration
      current_mastery := new_mastery;
    END LOOP;

    -- Update the final mastery score in user_topic_mastery
    UPDATE user_topic_mastery
    SET mastery_score = current_mastery,
        updated_at = NOW()
    WHERE user_id = rec.user_id
      AND topic_id = rec.topic_id
      AND bloom_level = rec.bloom_level
      AND chapter_id = rec.chapter_id;

    RAISE NOTICE 'Updated mastery for user % topic % bloom % to %',
      rec.user_id, rec.topic_id, rec.bloom_level, current_mastery;
  END LOOP;

  RAISE NOTICE 'Mastery recalculation complete';
END $$;
