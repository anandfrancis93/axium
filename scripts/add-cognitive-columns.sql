-- Add cognitive_dimension column to questions table
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS cognitive_dimension TEXT;

-- Add cognitive_dimension column to user_responses table
ALTER TABLE user_responses
ADD COLUMN IF NOT EXISTS cognitive_dimension TEXT;

-- Add comments for documentation
COMMENT ON COLUMN questions.cognitive_dimension IS 'Cognitive dimension tested: WHAT, WHY, WHEN, WHERE, HOW, CHARACTERISTICS';
COMMENT ON COLUMN user_responses.cognitive_dimension IS 'Cognitive dimension tested: WHAT, WHY, WHEN, WHERE, HOW, CHARACTERISTICS';

-- Verify columns were added
SELECT
  'questions' as table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'questions'
  AND column_name = 'cognitive_dimension'
UNION ALL
SELECT
  'user_responses' as table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'user_responses'
  AND column_name = 'cognitive_dimension';
