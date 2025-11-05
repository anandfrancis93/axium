# RL System Database Migration Guide

## Overview

This migration adds the complete database schema for the Thompson Sampling Contextual Bandit RL system.

---

## What's Included

### New Tables

1. **`user_topic_mastery`**
   - Tracks per-user mastery score for each (topic, bloom_level) pair
   - Stores: mastery_score (0-100), questions_attempted, questions_correct
   - Includes confidence calibration tracking
   - Tracks temporal patterns (first/last practiced)

2. **`rl_arm_stats`**
   - Thompson Sampling Beta distribution parameters
   - One record per user per (topic, bloom_level) arm
   - Tracks: alpha, beta, times_selected, avg_reward

### Enhanced Tables

3. **`questions`** - Added multi-topic support:
   - `primary_topic` - Main topic (weight 1.0)
   - `secondary_topics` - Array of supporting topics
   - `topic_weights` - JSONB: `{"primary": 1.0, "secondary": [0.3, 0.2]}`

4. **`learning_sessions`** - Added RL metadata:
   - `selection_algorithm` - Which RL algorithm was used
   - `session_avg_reward` - Average reward across session
   - `exploration_rate` - % exploratory vs exploitative

5. **`user_responses`** - Added RL tracking:
   - `mastery_before` / `mastery_after` - Mastery change
   - `learning_gain` - Delta in mastery
   - `reward_received` - Total RL reward
   - `arm_selected` - Which (topic, bloom) was chosen

### Functions

6. **`get_available_arms(user_id, chapter_id)`**
   - Returns all (topic, bloom_level) pairs with unlock status
   - Checks mastery prerequisites (80% + 3 correct at previous level)

7. **`update_topic_mastery(...)`**
   - Updates mastery using Exponential Moving Average
   - Supports weighted updates for multi-topic questions
   - Clamps mastery to 0-100 range

8. **`update_arm_stats(user_id, chapter_id, topic, bloom_level, reward)`**
   - Updates Thompson Sampling Beta(α, β) parameters
   - Normalizes rewards from [-10, 20] to [0, 1]

### Views

9. **`user_mastery_heatmap`**
   - Pivot table: topics × bloom levels showing mastery scores
   - Perfect for performance dashboard visualization

10. **`user_progress_summary`**
    - Per-chapter summary: topics started/mastered, overall accuracy
    - Quick overview for progress tracking

---

## How to Apply Migration

### Step 1: Copy SQL to Supabase

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **"New Query"**
4. Open `supabase/rl-system-schema.sql` in this repository
5. **Copy all contents** and paste into Supabase SQL Editor

### Step 2: Run Migration

1. Click **"Run"** button in Supabase SQL Editor
2. Wait for execution to complete (should take 5-10 seconds)
3. You should see: `RL System Schema Migration Complete!` in the results

### Step 3: Verify Tables Created

Run this query to verify:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('user_topic_mastery', 'rl_arm_stats')
ORDER BY table_name;
```

Expected output:
```
rl_arm_stats
user_topic_mastery
```

### Step 4: Verify Functions Created

```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('get_available_arms', 'update_topic_mastery', 'update_arm_stats')
ORDER BY routine_name;
```

Expected output:
```
get_available_arms
update_arm_stats
update_topic_mastery
```

### Step 5: Verify Columns Added to Existing Tables

```sql
-- Check questions table
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'questions'
  AND column_name IN ('primary_topic', 'secondary_topics', 'topic_weights')
ORDER BY column_name;
```

Expected output:
```
primary_topic
secondary_topics
topic_weights
```

---

## Testing the Schema

### Test 1: Get Available Arms

```sql
-- Test get_available_arms function (replace with your user_id and chapter_id)
SELECT *
FROM get_available_arms(
  'your-user-id-here'::uuid,
  'your-chapter-id-here'::uuid
);
```

Expected: Should return all topics from the chapter with bloom levels 1-6 and `is_unlocked` status.

### Test 2: Insert Test Mastery Record

```sql
-- Insert a test mastery record
INSERT INTO user_topic_mastery (
  user_id,
  topic,
  bloom_level,
  chapter_id,
  mastery_score,
  questions_attempted,
  questions_correct
)
VALUES (
  auth.uid(),
  'Test Topic',
  1,
  'your-chapter-id-here'::uuid,
  75.0,
  5,
  4
);

-- Verify it was inserted
SELECT * FROM user_topic_mastery WHERE user_id = auth.uid();
```

### Test 3: Update Mastery Function

```sql
-- Test update_topic_mastery function
SELECT update_topic_mastery(
  auth.uid(),                      -- user_id
  'CIA Triad',                     -- topic
  1,                               -- bloom_level
  'your-chapter-id-here'::uuid,   -- chapter_id
  true,                            -- is_correct
  4,                               -- confidence
  20.0,                            -- learning_gain
  1.0                              -- weight
);

-- Check the result
SELECT * FROM user_topic_mastery
WHERE user_id = auth.uid()
  AND topic = 'CIA Triad'
  AND bloom_level = 1;
```

### Test 4: Check Mastery Heatmap View

```sql
SELECT *
FROM user_mastery_heatmap
WHERE user_id = auth.uid()
LIMIT 10;
```

---

## Rollback (if needed)

If you need to rollback this migration:

```sql
-- Drop tables
DROP TABLE IF EXISTS rl_arm_stats CASCADE;
DROP TABLE IF EXISTS user_topic_mastery CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS get_available_arms CASCADE;
DROP FUNCTION IF EXISTS update_topic_mastery CASCADE;
DROP FUNCTION IF EXISTS update_arm_stats CASCADE;

-- Drop views
DROP VIEW IF EXISTS user_mastery_heatmap CASCADE;
DROP VIEW IF EXISTS user_progress_summary CASCADE;

-- Remove columns from questions
ALTER TABLE questions
DROP COLUMN IF EXISTS primary_topic,
DROP COLUMN IF EXISTS secondary_topics,
DROP COLUMN IF EXISTS topic_weights;

-- Remove columns from learning_sessions
ALTER TABLE learning_sessions
DROP COLUMN IF EXISTS selection_algorithm,
DROP COLUMN IF EXISTS session_avg_reward,
DROP COLUMN IF EXISTS exploration_rate;

-- Remove columns from user_responses
ALTER TABLE user_responses
DROP COLUMN IF EXISTS mastery_before,
DROP COLUMN IF EXISTS mastery_after,
DROP COLUMN IF EXISTS learning_gain,
DROP COLUMN IF EXISTS reward_received,
DROP COLUMN IF EXISTS arm_selected;
```

---

## Troubleshooting

### Error: "relation already exists"

**Cause**: Tables were already created in a previous run.

**Solution**: Either:
1. Drop the existing tables first (see Rollback section)
2. OR modify the script to use `CREATE TABLE IF NOT EXISTS` (already done)

### Error: "column already exists"

**Cause**: Columns were already added to questions/learning_sessions/user_responses.

**Solution**: The script uses `ADD COLUMN IF NOT EXISTS` so this shouldn't happen. If it does, the columns are already there - you're good to go!

### Error: "permission denied"

**Cause**: Not running as a user with sufficient privileges.

**Solution**: Make sure you're running the SQL in Supabase's SQL Editor, which has elevated privileges.

---

## Next Steps

After successfully applying this migration:

1. ✅ Database schema is ready
2. ⏭️ Implement RL agent service (`lib/rl/thompson-sampling.ts`)
3. ⏭️ Create RL API endpoints (`/api/rl/...`)
4. ⏭️ Build learning session UI with RL-powered question selection

See `RL_DESIGN.md` for full implementation details.

---

**Migration Status**: Ready to apply
**Estimated Time**: 5-10 seconds
**Breaking Changes**: None (all changes are additive)
