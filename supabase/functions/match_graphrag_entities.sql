-- Vector similarity search for GraphRAG entities
-- Similar to match_knowledge_chunks but for entities

CREATE OR REPLACE FUNCTION match_graphrag_entities(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_chapter_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  chapter_id uuid,
  neo4j_id text,
  name text,
  type text,
  description text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    graphrag_entities.id,
    graphrag_entities.chapter_id,
    graphrag_entities.neo4j_id,
    graphrag_entities.name,
    graphrag_entities.type,
    graphrag_entities.description,
    1 - (graphrag_entities.embedding <=> query_embedding) AS similarity
  FROM graphrag_entities
  WHERE
    (filter_chapter_id IS NULL OR graphrag_entities.chapter_id = filter_chapter_id)
    AND (1 - (graphrag_entities.embedding <=> query_embedding)) > match_threshold
  ORDER BY graphrag_entities.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION match_graphrag_entities IS 'Vector similarity search for GraphRAG entities using cosine distance';
