-- Create function to find similar topics using vector similarity
-- This is used by the related topics discovery system

CREATE OR REPLACE FUNCTION find_similar_topics(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  exclude_topic_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  name text,
  full_name text,
  path text,
  depth int,
  parent_topic_id uuid,
  prerequisites uuid[],
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.name,
    t.full_name,
    t.path,
    t.depth,
    t.parent_topic_id,
    t.prerequisites,
    1 - (t.embedding <=> query_embedding) as similarity
  FROM topics t
  WHERE
    t.embedding IS NOT NULL
    AND (exclude_topic_id IS NULL OR t.id != exclude_topic_id)
    AND 1 - (t.embedding <=> query_embedding) > match_threshold
  ORDER BY t.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Add comment
COMMENT ON FUNCTION find_similar_topics IS 'Find topics semantically similar to a given embedding using cosine similarity. Used for related topics discovery.';
