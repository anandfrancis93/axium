-- Fix check_has_topic constraint to allow questions with entity_id but no topic_id
--
-- Original constraint likely required topic_id to be NOT NULL
-- New constraint: Questions must have EITHER topic_id OR entity_id (or both)

-- Drop old constraint if it exists
ALTER TABLE questions
DROP CONSTRAINT IF EXISTS check_has_topic;

-- Add new constraint: must have topic_id OR entity_id
ALTER TABLE questions
ADD CONSTRAINT check_has_topic
CHECK (topic_id IS NOT NULL OR entity_id IS NOT NULL);

-- Comment explaining the constraint
COMMENT ON CONSTRAINT check_has_topic ON questions IS
'Questions must be linked to either a Supabase topic (topic_id) or a Neo4j entity (entity_id), or both.';
