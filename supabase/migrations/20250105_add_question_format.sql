-- Add Question Format Support for Personalized Learning
-- This enables tracking which question formats work best for each user

-- Create enum type for question formats
CREATE TYPE question_format AS ENUM (
  'mcq_single',       -- Multiple Choice - Single correct answer
  'mcq_multi',        -- Multiple Choice - Multiple correct answers (select all that apply)
  'code',             -- Code writing/debugging
  'open_ended',       -- Essay/explanation questions
  'diagram',          -- Visual/diagram-based
  'fill_blank',       -- Fill in the blank
  'true_false',       -- True/False questions
  'matching',         -- Match items
  'code_trace',       -- Trace code execution
  'code_debug'        -- Find and fix bugs
);

-- Add question_format column to questions table
ALTER TABLE questions
ADD COLUMN question_format question_format DEFAULT 'mcq_single',
ADD COLUMN format_metadata JSONB DEFAULT '{}'::jsonb;

-- Add index for querying by format
CREATE INDEX idx_questions_format ON questions(question_format);
CREATE INDEX idx_questions_bloom_format ON questions(bloom_level, question_format);

-- Add format performance tracking to user_progress rl_metadata
-- This will be done via application logic, but document the structure here
COMMENT ON COLUMN questions.question_format IS 'Format of the question (MCQ single/multi, code, diagram, etc.)';
COMMENT ON COLUMN questions.format_metadata IS 'Format-specific metadata (e.g., num_correct for MCQ multi, code template, diagram data)';

-- Create view for format effectiveness by bloom level
CREATE OR REPLACE VIEW question_format_distribution AS
SELECT
  bloom_level,
  question_format,
  COUNT(*) as question_count
FROM questions
GROUP BY bloom_level, question_format
ORDER BY bloom_level, question_count DESC;

-- Add comment explaining format-bloom relationship
COMMENT ON TYPE question_format IS 'Question format types - different formats are more effective at different Bloom levels';

-- Sample format metadata structures (documentation)
/*
MCQ Single format_metadata:
{
  "options_count": 4,
  "shuffle_options": true,
  "has_explanation": true
}

MCQ Multi format_metadata:
{
  "options_count": 4,
  "num_correct": 2,
  "partial_credit": true,
  "shuffle_options": true
}

Code format_metadata:
{
  "language": "python",
  "template": "def function():\n    # TODO",
  "test_cases": [...],
  "hints_available": true
}

Diagram format_metadata:
{
  "diagram_type": "tree|graph|flowchart",
  "interactive": true,
  "canvas_size": {"width": 800, "height": 600}
}

Open-ended format_metadata:
{
  "min_words": 50,
  "max_words": 200,
  "rubric": {...}
}
*/
