-- Function to search for similar knowledge chunks using vector similarity
-- This enables RAG (Retrieval-Augmented Generation) for question generation

CREATE OR REPLACE FUNCTION match_knowledge_chunks(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 5,
  filter_chapter_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  chapter_id uuid,
  content text,
  source_file_name text,
  page_number int,
  chunk_index int,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.id,
    kc.chapter_id,
    kc.content,
    kc.source_file_name,
    kc.page_number,
    kc.chunk_index,
    1 - (kc.embedding <=> query_embedding) as similarity
  FROM knowledge_chunks kc
  WHERE
    (filter_chapter_id IS NULL OR kc.chapter_id = filter_chapter_id)
    AND 1 - (kc.embedding <=> query_embedding) > match_threshold
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
