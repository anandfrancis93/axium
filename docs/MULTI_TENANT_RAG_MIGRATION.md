# Multi-Tenant RAG Migration Guide

## Overview

This document outlines the schema changes needed to support **per-user file uploads** and **private knowledge bases** in Axium.

---

## Current vs. Target Architecture

### **Current (Shared Materials)**
```
subjects → chapters → topics → knowledge_chunks (public)
                              ↓
                        user_progress (per-user)
```

**Limitation:** All users see the same knowledge_chunks (course materials uploaded by admin)

---

### **Target (Per-User Materials)**
```
auth.users → user_libraries → knowledge_chunks (private, filtered by user_id)
                              ↓
                        Questions generated from USER's PDFs
```

**Benefit:** Each user has their own private knowledge base

---

## Required Schema Changes

### **1. Add user_id to knowledge_chunks**

```sql
-- Add user_id column to knowledge_chunks
ALTER TABLE knowledge_chunks
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Make it required for new uploads (existing rows can be NULL = admin-uploaded)
-- Don't add NOT NULL constraint if you want to keep existing shared materials

-- Add index for performance (critical for filtering)
CREATE INDEX idx_knowledge_chunks_user_id ON knowledge_chunks(user_id);

-- Composite index for user + chapter queries
CREATE INDEX idx_knowledge_chunks_user_chapter ON knowledge_chunks(user_id, chapter_id);
```

---

### **2. Update RLS Policies**

```sql
-- Drop the old "anyone can view" policy
DROP POLICY "Anyone can view knowledge chunks" ON knowledge_chunks;

-- NEW: Users can only view their own chunks OR shared chunks (user_id IS NULL)
CREATE POLICY "Users can view own chunks or shared chunks"
  ON knowledge_chunks FOR SELECT
  USING (
    user_id IS NULL              -- Shared/admin-uploaded materials
    OR user_id = auth.uid()      -- User's own uploads
  );

-- NEW: Users can insert their own chunks
CREATE POLICY "Users can insert own chunks"
  ON knowledge_chunks FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- NEW: Users can update their own chunks
CREATE POLICY "Users can update own chunks"
  ON knowledge_chunks FOR UPDATE
  USING (user_id = auth.uid());

-- NEW: Users can delete their own chunks
CREATE POLICY "Users can delete own chunks"
  ON knowledge_chunks FOR DELETE
  USING (user_id = auth.uid());
```

---

### **3. Update Vector Search Function**

```sql
-- Updated function to filter by user_id
CREATE OR REPLACE FUNCTION search_knowledge_chunks(
  query_embedding vector(1536),
  match_count integer DEFAULT 5,
  filter_chapter_id uuid DEFAULT NULL,
  filter_topic_id uuid DEFAULT NULL,
  filter_user_id uuid DEFAULT NULL  -- NEW parameter
)
RETURNS TABLE (
  id uuid,
  content text,
  similarity float,
  chapter_id uuid,
  topic_id uuid,
  user_id uuid,              -- NEW: return user_id
  source_file_name text,
  page_number integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.id,
    kc.content,
    1 - (kc.embedding <=> query_embedding) as similarity,
    kc.chapter_id,
    kc.topic_id,
    kc.user_id,              -- NEW
    kc.source_file_name,
    kc.page_number
  FROM knowledge_chunks kc
  WHERE
    (filter_chapter_id IS NULL OR kc.chapter_id = filter_chapter_id)
    AND (filter_topic_id IS NULL OR kc.topic_id = filter_topic_id)
    AND (
      -- Filter by user_id OR include shared chunks (user_id IS NULL)
      filter_user_id IS NULL
      OR kc.user_id = filter_user_id
      OR kc.user_id IS NULL
    )
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;
```

---

### **4. Update match_knowledge_chunks function (if using)**

```sql
-- If you're using the match_knowledge_chunks RPC from match-knowledge-chunks.sql
CREATE OR REPLACE FUNCTION match_knowledge_chunks(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 5,
  filter_chapter_id uuid DEFAULT NULL,
  filter_user_id uuid DEFAULT NULL  -- NEW
)
RETURNS TABLE (
  id uuid,
  chapter_id uuid,
  content text,
  source_file_name text,
  page_number int,
  chunk_index int,
  similarity float,
  user_id uuid  -- NEW
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
    1 - (kc.embedding <=> query_embedding) as similarity,
    kc.user_id  -- NEW
  FROM knowledge_chunks kc
  WHERE
    (filter_chapter_id IS NULL OR kc.chapter_id = filter_chapter_id)
    AND (filter_user_id IS NULL OR kc.user_id = filter_user_id OR kc.user_id IS NULL)
    AND 1 - (kc.embedding <=> query_embedding) > match_threshold
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

---

## API Changes Required

### **1. Document Upload API**

**File:** `app/api/documents/upload/route.ts`

```typescript
// BEFORE
const { error: insertError } = await supabase
  .from('knowledge_chunks')
  .insert({
    chapter_id: chapterId,
    content: chunks[i],
    embedding: embedding,
    source_file_name: file?.name || 'text_input',
  })

// AFTER - Include user_id
const { data: { user } } = await supabase.auth.getUser()

const { error: insertError } = await supabase
  .from('knowledge_chunks')
  .insert({
    chapter_id: chapterId,
    user_id: user.id,  // NEW: Associate with current user
    content: chunks[i],
    embedding: embedding,
    source_file_name: file?.name || 'text_input',
  })
```

---

### **2. Question Generation API**

**File:** `app/api/questions/generate/route.ts`

```typescript
// BEFORE
const { data: chunks, error: searchError } = await supabase.rpc(
  'match_knowledge_chunks',
  {
    query_embedding: embeddingString,
    match_threshold: 0.1,
    match_count: 5,
    filter_chapter_id: chapter_id,
  }
)

// AFTER - Filter by current user's chunks
const { data: { user } } = await supabase.auth.getUser()

const { data: chunks, error: searchError } = await supabase.rpc(
  'match_knowledge_chunks',
  {
    query_embedding: embeddingString,
    match_threshold: 0.1,
    match_count: 5,
    filter_chapter_id: chapter_id,
    filter_user_id: user.id,  // NEW: Only search user's chunks + shared chunks
  }
)
```

---

## Data Model Options

### **Option A: User-Owned Chapters (Recommended)**

Each user creates their own chapters/topics from uploaded materials:

```sql
-- Add user_id to chapters table too
ALTER TABLE chapters
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Users can have personal chapters OR use shared ones
```

**Pros:**
- Full customization (users define their own structure)
- Clean separation of user data

**Cons:**
- More complex UI (users need to organize materials)

---

### **Option B: Shared Structure, User Content**

Chapters/topics are shared (predefined), but knowledge_chunks are per-user:

```sql
-- Chapters/topics remain public (current setup)
-- Only knowledge_chunks have user_id
```

**Pros:**
- Simpler UI (predefined structure)
- Users just upload to existing chapters

**Cons:**
- Less flexible (users can't create custom chapters)

---

### **Option C: Hybrid (Best of Both)**

```sql
-- chapters table
ALTER TABLE chapters
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN is_shared BOOLEAN DEFAULT false;

-- RLS
CREATE POLICY "Users can view own or shared chapters"
  ON chapters FOR SELECT
  USING (is_shared = true OR user_id = auth.uid());
```

**Use Case:**
- Admin uploads course materials → `is_shared = true` (everyone sees)
- User uploads their own notes → `user_id = user.id, is_shared = false` (private)

---

## Cost Implications (Per-User RAG)

### **Embedding Costs**

**Scenario: 1,000 users, each uploads 5 PDFs (avg 50 chunks/PDF)**

```
Total chunks: 1,000 users × 5 PDFs × 50 chunks = 250,000 chunks
Avg chunk size: 500 tokens

Total tokens: 250,000 chunks × 500 tokens = 125M tokens

Embedding costs:
  text-embedding-3-small: 125M × $0.02/M = $2,500
  voyage-3-lite:          125M × $0.02/M = $2,500 (same price, better quality)
  voyage-3:               125M × $0.06/M = $7,500
  gemini-embedding-001:   125M × $0.15/M = $18,750
```

**Recommendation:** **voyage-3-lite** (same cost as OpenAI, better quality)

---

### **Storage Costs**

**250,000 chunks:**

```
Dimensions:
  text-embedding-3-small (1536): 250k × 1536 × 4 bytes = ~1.5 GB
  voyage-3-lite (1024):          250k × 1024 × 4 bytes = ~1.0 GB

Supabase pricing:
  Free tier: 500 MB (not enough)
  Pro tier ($25/month): 8 GB database (enough for ~2M chunks)
```

**Optimization:** Use voyage-3-lite (33% smaller vectors)

---

### **Query Performance**

**Critical:** Vector search MUST filter by user_id efficiently

```sql
-- GOOD: Uses composite index
CREATE INDEX idx_knowledge_chunks_user_chapter
  ON knowledge_chunks(user_id, chapter_id);

-- Query will be fast:
WHERE user_id = '...' AND chapter_id = '...'
ORDER BY embedding <=> query_embedding
```

**Performance tip:** Always include `user_id` filter first (reduces search space)

---

## Migration Checklist

- [ ] **1. Backup database** (export schema + data)
- [ ] **2. Add user_id column to knowledge_chunks**
- [ ] **3. Create indexes** (user_id, composite user_id + chapter_id)
- [ ] **4. Update RLS policies** (per-user filtering)
- [ ] **5. Update vector search functions** (add filter_user_id)
- [ ] **6. Update upload API** (insert user_id)
- [ ] **7. Update question generation API** (filter by user_id)
- [ ] **8. Test with multiple users** (ensure isolation)
- [ ] **9. Update frontend** (show only user's uploads)
- [ ] **10. Consider embedding model upgrade** (voyage-3-lite)

---

## Testing Multi-Tenancy

### **Test Isolation:**

```sql
-- User A uploads document
INSERT INTO knowledge_chunks (user_id, chapter_id, content, embedding)
VALUES ('user-a-uuid', 'chapter-1', 'User A content', [...]);

-- User B uploads document
INSERT INTO knowledge_chunks (user_id, chapter_id, content, embedding)
VALUES ('user-b-uuid', 'chapter-1', 'User B content', [...]);

-- Query as User A (should only see their chunks + shared)
SELECT * FROM knowledge_chunks
WHERE user_id = 'user-a-uuid' OR user_id IS NULL;

-- Result: Only User A's chunks (NOT User B's) ✅
```

---

## Security Considerations

1. **Always use RLS** - Never trust client-side filtering
2. **Validate user_id on insert** - Use `auth.uid()` server-side
3. **Rate limit uploads** - Prevent abuse (max files per user)
4. **Validate file size** - Prevent storage abuse
5. **Scan for malicious content** - Virus scanning, content moderation

---

## Alternative: Separate Databases Per User

**For 10,000+ users:** Consider separate vector stores per user

- **Pinecone namespaces:** Isolate by user
- **Qdrant collections:** One per user
- **Weaviate tenants:** Multi-tenant by design

**Tradeoff:** More complex, but better isolation + performance at scale

---

## Recommended Embedding Model (Per-User RAG)

**voyage-3-lite** is ideal:

1. ✅ Same cost as your current OpenAI ($0.02/M)
2. ✅ Better quality (+1-2% MTEB)
3. ✅ Smaller dimensions (1024 vs 1536 = 33% storage savings)
4. ✅ Longer context (16K vs 8K tokens)
5. ✅ 200M free tokens to test migration

**At scale (1000 users), 33% storage savings = significant cost reduction**

---

## Next Steps

1. Decide on data model (Option A, B, or C above)
2. Run schema migration on dev environment
3. Update APIs to include user_id
4. Test multi-tenant isolation
5. Consider embedding model upgrade (voyage-3-lite)
6. Deploy to production with phased rollout

---

**See:** `CLAUDE.md` for coding best practices and UI design patterns.
