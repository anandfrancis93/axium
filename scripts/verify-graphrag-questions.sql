-- Verification Script: Check if questions are being generated with GraphRAG context
-- Run this AFTER generating new questions for "Resource reuse"
--
-- Usage: psql "$DATABASE_URL" -f scripts/verify-graphrag-questions.sql

\echo '=== GraphRAG Question Generation Verification ==='
\echo ''

-- 1. Check GraphRAG entity exists
\echo '1. GraphRAG Entity Check:'
SELECT 
  name,
  type,
  LENGTH(context_summary) as context_length,
  LEFT(context_summary, 100) as context_preview
FROM graphrag_entities
WHERE name = 'Resource reuse';

\echo ''
\echo '2. Recent Questions for Resource Reuse:'
-- 2. Show recent questions with RAG context
SELECT 
  q.id,
  LEFT(q.question_text, 80) as question_preview,
  q.question_format,
  q.bloom_level,
  LENGTH(q.rag_context) as rag_context_length,
  LEFT(q.rag_context, 150) as rag_context_preview,
  q.created_at
FROM questions q
JOIN topics t ON t.id = q.topic_id
WHERE t.name = 'Resource reuse'
  AND q.source_type = 'ai_generated_realtime'
ORDER BY q.created_at DESC
LIMIT 5;

\echo ''
\echo '3. Statistics:'
-- 3. Summary statistics
SELECT 
  COUNT(*) FILTER (WHERE rag_context IS NOT NULL) as questions_with_context,
  COUNT(*) FILTER (WHERE rag_context IS NULL OR rag_context = '') as questions_without_context,
  ROUND(AVG(LENGTH(rag_context))) as avg_context_length,
  MAX(created_at) as latest_question
FROM questions q
JOIN topics t ON t.id = q.topic_id
WHERE t.name = 'Resource reuse'
  AND q.source_type = 'ai_generated_realtime';

\echo ''
\echo '4. Context Comparison:'
-- 4. Compare question context with entity context
SELECT 
  'Entity Context' as source,
  LENGTH(context_summary) as length,
  LEFT(context_summary, 200) as preview
FROM graphrag_entities
WHERE name = 'Resource reuse'
UNION ALL
SELECT 
  'Question Context' as source,
  LENGTH(q.rag_context) as length,
  LEFT(q.rag_context, 200) as preview
FROM questions q
JOIN topics t ON t.id = q.topic_id
WHERE t.name = 'Resource reuse'
  AND q.source_type = 'ai_generated_realtime'
  AND q.rag_context IS NOT NULL
ORDER BY created_at DESC
LIMIT 1;

\echo ''
\echo '=== Verification Complete ==='
\echo ''
\echo 'Expected Results:'
\echo '  - questions_with_context should be > 0'
\echo '  - avg_context_length should be ~400-500 characters'
\echo '  - Context should match between Entity and Question'
