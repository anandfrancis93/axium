# GraphRAG Setup Guide

This guide explains how to set up and use the GraphRAG system in Axium for improved question generation.

---

## What is GraphRAG?

**GraphRAG** = Knowledge Graph + Retrieval-Augmented Generation

Instead of treating documents as isolated text chunks, GraphRAG:
1. **Extracts entities** (concepts, definitions, processes, etc.)
2. **Maps relationships** (IS_A, DEPENDS_ON, CAUSES, SIMILAR_TO, etc.)
3. **Builds a knowledge graph** stored in Neo4j
4. **Retrieves intelligently** using graph traversal for complex reasoning

**Benefits over Vector RAG:**
- Better multi-hop reasoning (connecting concepts across topics)
- Prerequisite discovery (auto-detect dependencies)
- Relationship-aware retrieval (get causal chains, not just similar text)
- Ideal for Bloom Level 4-6 questions (Analyze, Evaluate, Create)

---

## Architecture

```
┌─────────────────┐
│  Document Text  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  Entity Extraction      │  ← Claude extracts entities + relationships
│  (lib/graphrag/)        │
└────────┬────────────────┘
         │
         ▼
┌──────────────────┬──────────────────┐
│   Neo4j Graph    │  Supabase Cache  │
│  (Relationships) │    (Metadata)    │
└────────┬─────────┴─────────┬────────┘
         │                   │
         ▼                   ▼
┌─────────────────────────────────────┐
│  Graph Query (lib/graphrag/query)  │  ← Traverse graph for context
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Question Generation    │  ← Claude generates with graph context
└─────────────────────────┘
```

---

## Setup Instructions

### 1. Prerequisites

You need:
- ✅ **Neo4j database** (already configured in your `.env.local`)
- ✅ **Anthropic API key** (already configured)
- ✅ **OpenAI API key** (for embeddings)

### 2. Install Dependencies

```bash
npm install neo4j-driver
```

### 3. Enable GraphRAG

Edit `.env.local`:

```bash
# Feature Flags
NEXT_PUBLIC_ENABLE_GRAPH_RAG=true
```

Restart your dev server:

```bash
npm run dev
```

### 4. Apply Database Migration

Run the GraphRAG migration:

```bash
# Option 1: Via Supabase CLI (if installed)
supabase db push

# Option 2: Copy and paste SQL manually in Supabase Dashboard
# Go to: Supabase Dashboard → SQL Editor
# Copy contents of: supabase/migrations/20250114_graphrag_tables.sql
# Run the SQL
```

Create the entity matching function:

```bash
# Copy contents of: supabase/functions/match_graphrag_entities.sql
# Run in Supabase SQL Editor
```

### 5. Initialize Neo4j Schema

The schema is automatically initialized on first indexing, but you can manually test:

```typescript
import { initializeNeo4jSchema, testNeo4jConnection } from '@/lib/neo4j/client'

// Test connection
const connected = await testNeo4jConnection()
console.log('Neo4j connected:', connected)

// Initialize schema
await initializeNeo4jSchema()
```

---

## Usage

### Step 1: Index a Chapter

Go to the GraphRAG admin page:

```
http://localhost:3000/admin/graphrag
```

1. **Verify GraphRAG is enabled** (green badge)
2. **Select a chapter** from the list
3. **Click "Index"** to start building the knowledge graph

**What happens during indexing:**
- Fetches all knowledge chunks for the chapter
- Uses Claude to extract entities and relationships from each chunk
- Stores entities in Neo4j (for graph traversal)
- Caches in Supabase (for fast lookups)
- Takes ~5-10 minutes per chapter (depending on size)

### Step 2: Monitor Indexing Progress

The admin page shows:
- ✅ **Completed**: Graph is ready to use
- 🔵 **Running**: Currently processing (shows progress)
- ❌ **Failed**: Check error message
- ⏳ **Pending**: Queued

### Step 3: Choose RAG Mode

Four modes available:

| Mode | Description | Use Case |
|------|-------------|----------|
| **Vector Only** | Current production RAG | Fast, simple questions (Bloom 1-3) |
| **Graph Only** | GraphRAG exclusively | Testing, complex questions (Bloom 4-6) |
| **Hybrid** | Vector for Bloom 1-3, Graph for 4-6 | Best of both worlds |
| **Side-by-Side** | Generate with both, compare | A/B testing, quality evaluation |

To activate a mode, update `lib/config/features.ts`:

```typescript
export const features: Features = {
  graphRAG: {
    enabled: true,  // Must be true
    modes: {
      vectorOnly: false,
      graphOnly: false,
      hybrid: true,        // ✅ Enable hybrid mode
      sideBySide: false,
    }
  }
}
```

### Step 4: Generate Questions

Once indexing is complete, questions will automatically use GraphRAG based on your selected mode.

**Hybrid mode (recommended):**
- Bloom 1-3 (Remember, Understand, Apply) → Vector RAG
- Bloom 4-6 (Analyze, Evaluate, Create) → GraphRAG

---

## Testing & Comparison

### Manual Testing

Use the Question Generator in `/admin`:

1. Select a topic with indexed graph data
2. Set Bloom Level to 4, 5, or 6
3. Generate question
4. Check the "Context Used" to see graph relationships

### Side-by-Side Comparison

Enable `sideBySide: true` in features.ts, then:

1. Generate question with Vector RAG
2. Generate question with GraphRAG
3. Compare:
   - Context quality
   - Question complexity
   - Relationship awareness
   - Multi-hop reasoning

### Metrics Dashboard

View performance metrics:

```sql
-- In Supabase SQL Editor
SELECT
  rag_mode,
  bloom_level,
  COUNT(*) as question_count,
  AVG(retrieval_time_ms) as avg_retrieval_ms,
  AVG(total_time_ms) as avg_total_ms
FROM graphrag_metrics
GROUP BY rag_mode, bloom_level
ORDER BY bloom_level, rag_mode;
```

---

## Troubleshooting

### "Neo4j connection failed"

**Check credentials:**
```bash
# In .env.local
NEO4J_URI=neo4j+s://your-instance.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your-password
NEO4J_DATABASE=neo4j
```

**Test connection:**
```typescript
import { testNeo4jConnection } from '@/lib/neo4j/client'
const ok = await testNeo4jConnection()
console.log('Connected:', ok)
```

### "No entities found for topic"

**Causes:**
1. Chapter hasn't been indexed yet
2. Indexing failed (check job status)
3. Topic name doesn't match any entities

**Solution:**
- Re-index the chapter
- Check entity extraction worked (query `graphrag_entities` table)
- Try a broader topic search

### "Indexing stuck at 'Running'"

**Possible causes:**
1. Claude API rate limit
2. Large chapter (many chunks)
3. Server timeout

**Solution:**
- Check server logs for errors
- Reduce batch size in `batchExtractEntities` (default: 5)
- Wait longer (indexing can take 10+ minutes)

### "Relationship extraction quality is poor"

**Tuning options:**

Edit `lib/graphrag/entity-extraction.ts`:

```typescript
// Increase temperature for more creative extraction
const response = await anthropic.messages.create({
  temperature: 0.5,  // Default: 0.3
  // ...
})

// Adjust prompt to be more specific
// Add examples of good relationships
```

---

## API Reference

### Indexing API

**POST /api/graphrag/index**

Trigger indexing for a chapter.

```typescript
// Request
{
  "chapterId": "uuid",
  "mode": "full" | "incremental"
}

// Response
{
  "success": true,
  "jobId": "uuid",
  "message": "Indexing started"
}
```

**GET /api/graphrag/index?jobId=xxx**

Get job status.

```typescript
// Response
{
  "job": {
    "id": "uuid",
    "status": "completed" | "running" | "failed" | "pending",
    "total_chunks": 100,
    "processed_chunks": 100,
    "entities_extracted": 523,
    "relationships_extracted": 1247,
    "error_message": null
  }
}
```

---

## Performance & Cost

### Indexing Cost (per chapter)

**Assumptions:**
- 100-page textbook → ~100 chunks
- Entity extraction: $0.001 per chunk
- Embedding generation: $0.0001 per entity

**Total: ~$0.15 per chapter** (one-time cost)

### Query Cost

**GraphRAG query:** ~$0 (graph traversal in Neo4j is free)
**Vector RAG query:** ~$0 (vector search in Supabase is free)

Both use the same Claude API call for question generation, so **generation cost is identical**.

### Performance

| Operation | Vector RAG | GraphRAG |
|-----------|-----------|----------|
| Indexing | ~5 min | ~10 min |
| Query (retrieval) | <1ms | ~5ms |
| Question generation | 2-3s | 2-3s |

**GraphRAG is slightly slower for retrieval** but provides much better context for complex questions.

---

## Best Practices

### When to Use GraphRAG

✅ **Use GraphRAG for:**
- Bloom Level 4-6 questions (Analyze, Evaluate, Create)
- Multi-hop reasoning ("How does A affect B, which impacts C?")
- Prerequisite checking ("Does student understand X before learning Y?")
- Comparison questions ("Compare A vs B")
- Troubleshooting questions ("Why does X cause Y?")

❌ **Use Vector RAG for:**
- Bloom Level 1-3 questions (Remember, Understand, Apply)
- Simple factual recall
- Definition lookup
- Speed-critical paths

### Hybrid Mode (Recommended)

The **hybrid mode** gives you the best of both worlds:

```typescript
// In lib/config/features.ts
modes: {
  hybrid: true  // ✅ Recommended for production
}
```

This automatically routes:
- Simple questions → Fast vector search
- Complex questions → Intelligent graph traversal

### Maintenance

**Regular tasks:**

1. **Re-index chapters** when content is updated
2. **Clean expired cache** (runs automatically, but you can force):
   ```sql
   SELECT cleanup_graphrag_cache();
   ```
3. **Monitor job failures** in admin dashboard
4. **Review metrics** monthly to compare RAG modes

---

## Advanced: Community Detection (Future)

GraphRAG supports hierarchical community detection (Leiden algorithm) for global understanding.

**Not yet implemented**, but infrastructure is ready:

```typescript
// TODO: Add community detection
import { detectCommunities } from '@/lib/graphrag/communities'

const communities = await detectCommunities(chapterId, {
  resolution: 1.0,  // Granularity
  levels: 3         // Hierarchy depth
})
```

This will enable questions like:
- "What are the main themes in this course?"
- "How do all React concepts interconnect?"

---

## Support

For issues or questions:
1. Check server logs (`npm run dev` terminal)
2. Check Supabase logs (Database → Logs)
3. Check Neo4j browser (https://console.neo4j.io)
4. Review this documentation

---

## Summary

**Quick Start:**
1. Set `NEXT_PUBLIC_ENABLE_GRAPH_RAG=true` in `.env.local`
2. Restart dev server
3. Go to `/admin/graphrag`
4. Index a chapter
5. Enable hybrid mode in `features.ts`
6. Generate questions and compare!

**GraphRAG is experimental** but provides significantly better context for complex, higher-order questions. Use hybrid mode to get the best of both worlds while keeping your current production system intact.
