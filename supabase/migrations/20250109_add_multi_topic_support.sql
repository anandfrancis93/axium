-- Add multi-topic support for questions
-- Replaces old weighted approach with simpler core + related topics

-- Add new columns for multi-topic questions
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS core_topics UUID[] DEFAULT ARRAY[]::UUID[],
ADD COLUMN IF NOT EXISTS related_topics UUID[] DEFAULT ARRAY[]::UUID[];

-- Add comments
COMMENT ON COLUMN questions.core_topics IS 'Array of topic IDs that get full weight (1.0) and all rewards. All core topics are tested equally in this question.';
COMMENT ON COLUMN questions.related_topics IS 'Array of topic IDs shown for context only (weight 0.0). No mastery or reward updates.';

-- Create indexes for multi-topic queries
CREATE INDEX IF NOT EXISTS idx_questions_core_topics ON questions USING GIN(core_topics);
CREATE INDEX IF NOT EXISTS idx_questions_related_topics ON questions USING GIN(related_topics);

-- For backward compatibility, if a question only has topic_id set, treat it as a single core topic
-- This will be handled in application code, no constraint needed here

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Multi-topic support added to questions table!';
  RAISE NOTICE 'New columns: core_topics (UUID[]), related_topics (UUID[])';
END $$;
