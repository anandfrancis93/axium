-- Add GraphRAG-specific fields to questions table
-- This migration adds fields needed for storing AI-generated questions from the GraphRAG pipeline

ALTER TABLE questions

-- GraphRAG entity metadata
ADD COLUMN IF NOT EXISTS entity_id UUID,
ADD COLUMN IF NOT EXISTS entity_name TEXT,
ADD COLUMN IF NOT EXISTS domain TEXT,
ADD COLUMN IF NOT EXISTS full_path TEXT,

-- Generation metadata
ADD COLUMN IF NOT EXISTS tokens_used INTEGER,
ADD COLUMN IF NOT EXISTS generation_cost DECIMAL(10,6),
ADD COLUMN IF NOT EXISTS model TEXT,

-- Question format (mcq_single, mcq_multi, true_false, fill_blank, open_ended, matching)
ADD COLUMN IF NOT EXISTS question_format TEXT,

-- For MCQ multi-select questions (array of correct answers)
ADD COLUMN IF NOT EXISTS correct_answers TEXT[],

-- Source type (manual, ai_generated_realtime, ai_generated_graphrag)
ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'manual',

-- User who generated the question (for attribution)
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_questions_entity_id ON questions(entity_id);
CREATE INDEX IF NOT EXISTS idx_questions_domain ON questions(domain);
CREATE INDEX IF NOT EXISTS idx_questions_question_format ON questions(question_format);
CREATE INDEX IF NOT EXISTS idx_questions_source_type ON questions(source_type);
CREATE INDEX IF NOT EXISTS idx_questions_bloom_level ON questions(bloom_level);

-- Make topic_id nullable (GraphRAG questions may not have a topic_id)
ALTER TABLE questions ALTER COLUMN topic_id DROP NOT NULL;

-- Update existing questions to have source_type
UPDATE questions SET source_type = 'manual' WHERE source_type IS NULL;

-- Add comments
COMMENT ON COLUMN questions.entity_id IS 'UUID of the curriculum entity from Neo4j (for GraphRAG questions)';
COMMENT ON COLUMN questions.entity_name IS 'Name of the curriculum entity (cached from Neo4j)';
COMMENT ON COLUMN questions.domain IS 'CompTIA domain name (e.g., "General Security Concepts")';
COMMENT ON COLUMN questions.full_path IS 'Full hierarchical path of the entity';
COMMENT ON COLUMN questions.tokens_used IS 'Total tokens used in Claude API call (input + output)';
COMMENT ON COLUMN questions.generation_cost IS 'Cost in USD for generating this question via Claude API';
COMMENT ON COLUMN questions.model IS 'Claude model used (e.g., "claude-sonnet-4-20250514")';
COMMENT ON COLUMN questions.question_format IS 'Specific question format (mcq_single, mcq_multi, true_false, etc.)';
COMMENT ON COLUMN questions.correct_answers IS 'Array of correct answers (for mcq_multi format)';
COMMENT ON COLUMN questions.source_type IS 'Source of question: manual, ai_generated_realtime, or ai_generated_graphrag';
COMMENT ON COLUMN questions.user_id IS 'User who generated this question (if applicable)';
