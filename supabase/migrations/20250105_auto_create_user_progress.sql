-- Auto-create user_progress records when users answer questions
-- This ensures user_progress exists for RL phase tracking

-- Function to create or update user_progress when a question is answered
CREATE OR REPLACE FUNCTION handle_user_response_for_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update user_progress record
  INSERT INTO user_progress (
    user_id,
    topic_id,
    current_bloom_level,
    total_attempts,
    correct_answers,
    mastery_scores,
    created_at,
    updated_at
  )
  VALUES (
    NEW.user_id,
    NEW.topic_id,
    NEW.bloom_level,
    1,
    CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
    jsonb_build_object(NEW.bloom_level::text,
      CASE WHEN NEW.is_correct THEN 100 ELSE 0 END
    ),
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id, topic_id)
  DO UPDATE SET
    -- Increment attempts
    total_attempts = user_progress.total_attempts + 1,

    -- Increment correct answers if this answer was correct
    correct_answers = user_progress.correct_answers +
      CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,

    -- Update mastery score for this Bloom level
    mastery_scores = jsonb_set(
      COALESCE(user_progress.mastery_scores, '{}'::jsonb),
      ARRAY[NEW.bloom_level::text],
      to_jsonb(
        ROUND(
          (
            (COALESCE((user_progress.mastery_scores->>NEW.bloom_level::text)::DECIMAL, 0) *
             COALESCE((SELECT COUNT(*) FROM user_responses WHERE user_id = NEW.user_id AND topic_id = NEW.topic_id AND bloom_level = NEW.bloom_level), 0)) +
            (CASE WHEN NEW.is_correct THEN 100 ELSE 0 END)
          ) / (
            COALESCE((SELECT COUNT(*) FROM user_responses WHERE user_id = NEW.user_id AND topic_id = NEW.topic_id AND bloom_level = NEW.bloom_level), 0) + 1
          )
        )::INTEGER
      )
    ),

    -- Update timestamp
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on user_responses
CREATE TRIGGER trigger_handle_user_response_for_progress
  AFTER INSERT ON user_responses
  FOR EACH ROW
  EXECUTE FUNCTION handle_user_response_for_progress();

COMMENT ON FUNCTION handle_user_response_for_progress IS 'Automatically creates or updates user_progress records when questions are answered';
COMMENT ON TRIGGER trigger_handle_user_response_for_progress ON user_responses IS 'Ensures user_progress is maintained when users answer questions';
