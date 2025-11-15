-- Create function to increment question usage counter
-- This is called every time a question is shown to a user

CREATE OR REPLACE FUNCTION increment_question_usage(p_question_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE questions
  SET times_used = COALESCE(times_used, 0) + 1
  WHERE id = p_question_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION increment_question_usage IS 'Increments the times_used counter for a question';
