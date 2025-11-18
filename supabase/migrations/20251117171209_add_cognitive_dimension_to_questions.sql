-- Add cognitive_dimension column to questions table
ALTER TABLE questions 
ADD COLUMN cognitive_dimension TEXT;

-- Add cognitive_dimension column to user_responses table
ALTER TABLE user_responses 
ADD COLUMN cognitive_dimension TEXT;

-- Add comment
COMMENT ON COLUMN questions.cognitive_dimension IS 'Cognitive dimension tested: WHAT, WHY, WHEN, WHERE, HOW, CHARACTERISTICS';
COMMENT ON COLUMN user_responses.cognitive_dimension IS 'Cognitive dimension tested: WHAT, WHY, WHEN, WHERE, HOW, CHARACTERISTICS';
