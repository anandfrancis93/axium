# GraphRAG Quick Start

Get GraphRAG running in 5 minutes!

---

## Step 1: Install Dependencies

```bash
npm install
```

This installs `neo4j-driver` (already added to package.json).

---

## Step 2: Enable Feature Flag

Your `.env.local` already has the flag (set to `false`). Change it to `true`:

```bash
# In .env.local (line 24)
NEXT_PUBLIC_ENABLE_GRAPH_RAG=true
```

---

## Step 3: Apply Database Migration

**Option A: Supabase Dashboard (Easiest)**

1. Go to https://supabase.com/dashboard
2. Select your project: `pxtcgyvxgyffaaeugjwc`
3. Navigate to **SQL Editor**
4. Copy and paste contents of:
   - `supabase/migrations/20250114_graphrag_tables.sql`
5. Click **Run**
6. Copy and paste contents of:
   - `supabase/functions/match_graphrag_entities.sql`
7. Click **Run**

**Option B: Supabase CLI (if installed)**

```bash
supabase db push
```

---

## Step 4: Restart Dev Server

```bash
npm run dev
```

---

## Step 5: Go to GraphRAG Admin

Open your browser:

```
http://localhost:3000/admin/graphrag
```

You should see:
- ✅ **GraphRAG Enabled** (green badge)
- List of chapters ready to index

---

## Step 6: Index Your First Chapter

1. Click **"Index"** button next to any chapter
2. Wait ~5-10 minutes (check status - it will update automatically)
3. When status shows ✅ **Completed**, you're ready!

**What's happening:**
- Extracting entities from knowledge chunks
- Building relationships with Claude
- Storing graph in Neo4j
- Caching in Supabase

---

## Step 7: Enable Hybrid Mode

Edit `lib/config/features.ts`:

```typescript
export const features: Features = {
  graphRAG: {
    enabled: process.env.NEXT_PUBLIC_ENABLE_GRAPH_RAG === 'true',
    description: 'Knowledge Graph-based RAG for improved question generation',
    adminOnly: true,
    modes: {
      vectorOnly: false,     // ❌ Disable
      graphOnly: false,      // ❌ Disable
      hybrid: true,          // ✅ Enable (recommended)
      sideBySide: false,     // For testing only
    }
  }
}
```

Save and restart dev server.

---

## Step 8: Test Question Generation

Go to **Question Generator** in admin:

```
http://localhost:3000/admin
```

1. Select a topic from the indexed chapter
2. Set **Bloom Level** to 4, 5, or 6 (for GraphRAG)
3. Click **"Generate Question"**
4. Observe the context used (should show graph relationships!)

---

## Step 9: Compare Results (Optional)

To compare Vector RAG vs GraphRAG:

1. Enable `sideBySide: true` in `lib/config/features.ts`
2. Generate questions and see both results
3. Compare:
   - Context quality
   - Relationship awareness
   - Multi-hop reasoning

---

## What Next?

✅ **Production Ready:**
- Use **hybrid mode** for best results
- Bloom 1-3 → Vector RAG (fast)
- Bloom 4-6 → GraphRAG (smart)

✅ **Index All Chapters:**
- Go back to `/admin/graphrag`
- Index all chapters one by one
- Monitor job status

✅ **Monitor Performance:**
- Check `graphrag_metrics` table in Supabase
- Compare retrieval times
- Measure question quality improvements

---

## Troubleshooting

### "GraphRAG is disabled"

→ Check `.env.local`: `NEXT_PUBLIC_ENABLE_GRAPH_RAG=true`
→ Restart dev server

### "Neo4j connection failed"

→ Check `.env.local` Neo4j credentials:
```
NEO4J_URI=neo4j+s://...
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=...
NEO4J_DATABASE=neo4j
```

### "Indexing stuck at Running"

→ Check server terminal for errors
→ Wait longer (can take 10+ minutes for large chapters)
→ Check Claude API rate limits

### "No graph context for topic"

→ Ensure chapter is indexed (status: Completed)
→ Check `graphrag_entities` table has data
→ Try with a different topic

---

## Success Indicators

✅ GraphRAG admin shows "Enabled"
✅ At least one chapter indexed successfully
✅ Questions at Bloom 4-6 show graph relationships in context
✅ Hybrid mode enabled in features.ts

---

## Full Documentation

See `docs/GRAPHRAG_SETUP.md` for complete documentation.

---

Happy Graph Querying! 🚀
