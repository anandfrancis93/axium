-- Fix spaced repetition to be per-user instead of global
-- The questions.next_review_date was storing globally, causing all users to share review dates

-- Create user_question_reviews table for per-user spaced repetition tracking
CREATE TABLE IF NOT EXISTS user_question_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  next_review_date TIMESTAMPTZ NOT NULL,
  review_count INTEGER DEFAULT 1,
  last_reviewed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

-- Add RLS policies
ALTER TABLE user_question_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reviews"
  ON user_question_reviews FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reviews"
  ON user_question_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
  ON user_question_reviews FOR UPDATE
  USING (auth.uid() = user_id);

-- Index for faster due question queries
CREATE INDEX IF NOT EXISTS idx_user_question_reviews_due
  ON user_question_reviews(user_id, next_review_date);

-- Index for question lookups
CREATE INDEX IF NOT EXISTS idx_user_question_reviews_question
  ON user_question_reviews(question_id);

-- Comments
COMMENT ON TABLE user_question_reviews IS 'Per-user spaced repetition tracking - stores when each user should review each question';
COMMENT ON COLUMN user_question_reviews.next_review_date IS 'When this user should next review this question';
COMMENT ON COLUMN user_question_reviews.review_count IS 'Number of times this user has reviewed this question';
