# GraphRAG Context Testing Guide

This directory contains test scripts to verify that GraphRAG context is being used in question generation.

## Background

We fixed a bug where questions were being generated **without** GraphRAG context due to a column name mismatch:
- **Bug**: Code queried `summary` field (doesn't exist)
- **Fix**: Changed to `context_summary` field (actual column)

## Test Scripts

### 1. TypeScript Test (Pre-Question Generation)

**File**: `test-graphrag-context.ts`

**Purpose**: Verifies GraphRAG data exists and is accessible

**Run**:
```bash
npx tsx scripts/test-graphrag-context.ts
```

**What it checks**:
- ✅ GraphRAG entity exists for "Resource reuse"
- ✅ Entity has `context_summary` populated
- ✅ Topic exists in database
- ✅ `getGraphRAGContext()` function works correctly
- ℹ️  Prerequisite paths (optional)

**Expected Output**:
```
✅ GraphRAG Entity: Found entity: Resource reuse
✅ Topic Lookup: Found topic: Resource reuse
✅ Context Retrieval: Successfully retrieved context_summary
   context_length: 444
   context: "Resource reuse vulnerabilities occur when..."

🎉 All critical tests passed!
```

---

### 2. SQL Test (Post-Question Generation)

**File**: `verify-graphrag-questions.sql`

**Purpose**: Verifies questions were generated WITH GraphRAG context

**Run**:
```bash
psql "$DATABASE_URL" -f scripts/verify-graphrag-questions.sql
```

**What it checks**:
- GraphRAG entity context
- Recently generated questions
- Statistics (questions with/without context)
- Context comparison (entity vs question)

**Expected Output**:
```
1. GraphRAG Entity Check:
   name: Resource reuse
   context_length: 444
   context_preview: "Resource reuse vulnerabilities occur when..."

2. Recent Questions for Resource Reuse:
   question_preview: "What is the primary security risk..."
   rag_context_length: 444
   rag_context_preview: "Resource reuse vulnerabilities occur when..."

3. Statistics:
   questions_with_context: 5
   questions_without_context: 0
   avg_context_length: 444
```

---

## Testing Workflow

### Step 1: Pre-Deployment Test
```bash
# Verify GraphRAG data is accessible
npx tsx scripts/test-graphrag-context.ts
```

**Expected**: All critical tests pass ✅

---

### Step 2: Generate Questions

Go to your app and start a quiz:
1. Navigate to `/learn`
2. Select "Resource reuse" topic
3. Start quiz (generates 5 questions)

---

### Step 3: Post-Generation Verification
```bash
# Verify questions have RAG context
psql "$DATABASE_URL" -f scripts/verify-graphrag-questions.sql
```

**Expected**: 
- `questions_with_context` > 0
- `avg_context_length` ~400-500 characters
- Context matches entity summary

---

## Troubleshooting

### ❌ Test 1 Fails: "context_summary is null"

**Problem**: GraphRAG entity has no context

**Solution**: 
1. Check GraphRAG indexing completed successfully
2. Verify Neo4j sync ran
3. Re-run indexing: `/admin/graphrag`

---

### ❌ Test 2 Fails: "questions_without_context > 0"

**Problem**: Questions generated without RAG context

**Possible causes**:
1. Old deployment still running (not deployed yet)
2. Topic name mismatch between `topics` and `graphrag_entities`
3. Code reverted to old version

**Solution**:
1. Verify deployment completed
2. Check topic names match exactly
3. Review `/api/quiz/start/route.ts` line 171

---

## What Changed

### Before Fix ❌
```typescript
.select('name, type, description, summary, full_path')  // Wrong column
if (entity && entity.summary) {  // Always null
```

**Result**: Empty context → Generic questions

### After Fix ✅
```typescript
.select('name, type, description, context_summary, full_path')  // Correct
if (entity && entity.context_summary) {  // Works!
```

**Result**: Rich context → Curriculum-specific questions

---

## Expected GraphRAG Context

For "Resource reuse" topic:

```
Resource reuse vulnerabilities occur when virtualization platforms 
insufficiently clear memory, storage, or other resources before 
reallocating them to new VMs, potentially exposing previous VM data. 
Attackers may recover sensitive information from reallocated memory 
pages, disk blocks, or network buffers. Mitigation requires secure 
resource wiping, memory zeroing, and proper VM deprovisioning 
procedures to prevent data leakage between VMs.
```

This context comes from your Neo4j knowledge graph and CompTIA Security+ curriculum.

---

## Success Criteria

✅ **Pre-deployment**: TypeScript test passes  
✅ **Post-deployment**: SQL test shows questions_with_context > 0  
✅ **Context Match**: Question context matches entity context  
✅ **Length**: Context ~400-500 characters (not empty)  

---

## Questions?

If tests fail, check:
1. Deployment completed successfully
2. `.env.local` has DATABASE_URL set
3. GraphRAG indexing ran successfully
4. Topic names match exactly in both tables
