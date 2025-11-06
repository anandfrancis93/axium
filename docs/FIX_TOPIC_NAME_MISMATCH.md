# Fix: Topic Name Mismatch (No Data Showing After Questions)

## Problem Summary

You answered 2 questions but don't see any data in the performance pages. Here's why:

### Root Cause
**Topic name mismatch** between Thompson Sampling and the topics table:

- **Thompson Sampling** (via `get_available_arms`) returns: `"Certificate revocation lists (CRLs) (certificates)"`
- **Topics table** has: `"Certificate revocation lists (CRLs)"`
- **Question generation** tries to look up topic_id with the mismatched name
- **Lookup fails** → topic_id stays NULL → no user_progress created

### Why This Happened
1. We migrated 584 clean topic names to the `topics` table
2. But `get_available_arms()` database function still pulls from `chapter_topics` table
3. `chapter_topics` has the old format with double parenthetical context

## The Fix

### Step 1: Apply Database Migration

**Option A: Via Supabase Dashboard** (Recommended)

1. Go to https://supabase.com/dashboard/project/pxtcgyvxgyffaaeugjwc
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the contents of `supabase/migrations/20250106_fix_get_available_arms.sql`
5. Paste into the editor
6. Click **Run** (or press Ctrl+Enter)

**Option B: Using the migration file directly**

```sql
-- Full migration SQL is in:
-- supabase/migrations/20250106_fix_get_available_arms.sql

-- Key change: Updates get_available_arms() to pull from topics table
-- instead of chapter_topics table
```

### Step 2: Verify the Fix

After applying the migration, test it:

```bash
npm run dev

# Then visit:
# http://localhost:3000/subjects/security-plus-701/security-plus-sy0-701/quiz
```

Answer a question and check:
1. Question should have `topic_id` assigned (check `scripts/debug-user-activity.mjs`)
2. User response should be created with `topic_id` and `bloom_level`
3. `user_progress` record should be auto-created
4. RL phase should be calculated

## What the Migration Does

### Before (Broken)
```sql
-- get_available_arms() pulls from chapter_topics
SELECT ct.topic FROM chapter_topics ct  -- ❌ Has parenthetical context
-- Returns: "802.1X (port security)"

-- Question generation tries lookup:
SELECT id FROM topics WHERE name = '802.1X (port security)'  -- ❌ Not found!
-- Returns: NULL → topic_id stays NULL
```

### After (Fixed)
```sql
-- get_available_arms() pulls from topics table
SELECT t.name FROM topics t  -- ✅ Clean names
-- Returns: "802.1X"

-- Question generation tries lookup:
SELECT id FROM topics WHERE name = '802.1X'  -- ✅ Found!
-- Returns: UUID → topic_id assigned correctly
```

## Testing the Complete Flow

### 1. Start Fresh Session
```bash
npm run dev
```

### 2. Answer Questions
- Go to quiz page
- Answer 2-3 questions
- Submit answers

### 3. Check Database
```bash
node scripts/debug-user-activity.mjs
```

Expected output:
```
User Responses:
Count: 3
  Response 1:
    - Topic ID: a1b2c3d4... ✅ (not NULL!)
    - Bloom Level: 1 ✅
    - Correct: true

User Progress:
Count: 2
  Progress 1:
    - Topic ID: a1b2c3d4... ✅
    - RL Phase: cold_start ✅
    - Total Attempts: 2
    - Correct: 2

Recent Questions:
  Question 1:
    - Topic: 802.1X
    - Topic ID: a1b2c3d4... ✅ (not NULL!)
    - Bloom Level: 1
```

### 4. View Performance Page
```
http://localhost:3000/performance/security-plus-701/security-plus-sy0-701/{topic-name}
```

Expected:
- ✅ RL phase badge displays
- ✅ Mastery matrix shows data
- ✅ Progress stats populated

## Additional Files Created

1. `supabase/migrations/20250106_fix_get_available_arms.sql` - Migration to fix Thompson Sampling
2. `scripts/debug-user-activity.mjs` - Debug script to check database state
3. `scripts/extract-clean-topics.mjs` - Script that extracted all 584 topics

## Why No User Responses Were Created

Looking at the debug output, you have:
- 3 learning sessions created ✅
- 2 questions answered in latest session ✅
- But 0 user_responses ❌

This suggests the submit-response endpoint is **silently failing** due to the topic_id lookup failure. The error is likely being caught and not creating the response record.

After applying the migration, this should be fixed because:
1. Thompson Sampling will return clean topic names
2. Question generation will find the topic in the topics table
3. topic_id will be assigned correctly
4. submit-response will successfully look up topic_id
5. user_response will be created with topic_id
6. Trigger will create user_progress
7. RL phase will be calculated

## Summary

**Current State**:
- ❌ 168 topics in topics table (old migration)
- ✅ 584 topics now in topics table (new clean names)
- ❌ `get_available_arms()` still uses `chapter_topics` (wrong source)
- ❌ Topic name mismatch prevents data flow

**After Migration**:
- ✅ `get_available_arms()` uses `topics` table
- ✅ Topic names match between selection and lookup
- ✅ Questions get topic_id assigned
- ✅ User responses created successfully
- ✅ user_progress auto-created by trigger
- ✅ RL phases calculate
- ✅ Performance data displays

**Action Required**: Apply the SQL migration via Supabase Dashboard!
