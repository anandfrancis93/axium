-- Add embeddings to topics for semantic similarity search
-- This enables finding conceptually related topics automatically

-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to topics table
ALTER TABLE topics
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create index for fast similarity search using HNSW (Hierarchical Navigable Small World)
-- This makes vector similarity queries very fast
CREATE INDEX IF NOT EXISTS idx_topics_embedding ON topics USING hnsw (embedding vector_cosine_ops);

-- Add comment
COMMENT ON COLUMN topics.embedding IS 'OpenAI text-embedding-3-small vector (1536 dimensions) for semantic similarity search. Used to find conceptually related topics.';

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Topic embeddings support added!';
  RAISE NOTICE 'Next: Run script to generate embeddings for all existing topics';
END $$;
