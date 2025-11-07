# Migration: Text Topics → Database Topic IDs

## Overview

This migration converts Axium from using text-based topics to database-backed topic IDs with full hierarchical support.

**Status**: Ready to execute
**Estimated Time**: 2-4 hours
**Risk Level**: Medium (test thoroughly before production)
**Reversibility**: Partial (TEXT columns preserved until final step)

---

## Why This Migration?

### Current Problems with Text Topics
1. **Thompson Sampling breaks** - Typos fragment data ("Zero Trust" vs "zero trust")
2. **No hierarchy** - Cannot organize topics as parent/child
3. **Poor analytics** - Cannot aggregate by topic reliably
4. **No RAG context** - Cannot enrich chunks with hierarchical paths
5. **Limited features** - Cannot implement prerequisites, paths, etc.

### Benefits After Migration
1. **Accurate RL** - One topic = one canonical ID
2. **Hierarchical structure** - Topics organized as trees
3. **Better RAG** - Chunks enriched with hierarchy
4. **Reliable analytics** - Accurate topic-based reporting
5. **Future-proof** - Foundation for prerequisites, learning paths, etc.

---

## Migration Steps

### Phase 1: Database Schema (15 minutes)

**What**: Add `topic_id` columns to all tables

**How**:
```bash
# Apply SQL migration
npx supabase db reset  # Development only!
# OR for production:
psql $DATABASE_URL < supabase/migrations/20250108_add_topic_hierarchy.sql
psql $DATABASE_URL < supabase/migrations/20250108_migrate_to_topic_ids.sql
```

**What it does**:
- Adds `topic_id UUID` to: `user_topic_mastery`, `arm_stats`, `questions`, `user_dimension_coverage`
- Creates indexes for performance
- Keeps TEXT columns temporarily
- Creates migration helper functions

**Verify**:
```sql
\d user_topic_mastery
-- Should show both 'topic' TEXT and 'topic_id' UUID columns
```

---

### Phase 2: Upload Hierarchical Topics (10 minutes)

**What**: Replace flat topics with hierarchical structure

**Option A: Complete Reset** (Recommended for clean slate)
```bash
# This deletes ALL existing topics and progress
node scripts/reset-and-rebuild-syllabus.mjs <chapter_id> security-plus-syllabus.txt
```

**Option B: Incremental Addition** (If preserving existing data)
```bash
# This only adds new topics
node scripts/upload-hierarchical-syllabus.mjs <chapter_id> syllabus.txt
```

**Verify**:
```sql
SELECT id, name, full_name, depth, parent_topic_id
FROM topics
WHERE chapter_id = '<your_chapter_id>'
ORDER BY path;

-- Should show hierarchical structure with full_name like:
-- "Zero Trust > Control Plane > Adaptive identity"
```

---

### Phase 3: Data Migration (20-30 minutes)

**What**: Populate `topic_id` columns from existing TEXT topics

**How**:
```bash
# Dry run first (see what will happen)
node scripts/migrate-topics-to-ids.mjs --dry-run

# If dry run looks good, run actual migration
node scripts/migrate-topics-to-ids.mjs
```

**What it does**:
1. Scans all TEXT topics in `user_topic_mastery`, `arm_stats`, `questions`, `user_dimension_coverage`
2. Finds matching topics in `topics` table (case-insensitive)
3. Creates new topics for any not found
4. Populates `topic_id` columns

**Verify**:
```sql
-- Check for unmigrated rows
SELECT COUNT(*) FROM user_topic_mastery WHERE topic_id IS NULL AND topic IS NOT NULL;
SELECT COUNT(*) FROM arm_stats WHERE topic_id IS NULL AND topic IS NOT NULL;
SELECT COUNT(*) FROM questions WHERE topic_id IS NULL AND topic IS NOT NULL;
SELECT COUNT(*) FROM user_dimension_coverage WHERE topic_id IS NULL AND topic IS NOT NULL;
-- All should return 0

-- Check auto-created topics
SELECT name, description FROM topics
WHERE description LIKE '%Auto-created%';
-- These are topics from TEXT that didn't exist in uploaded syllabus
```

---

### Phase 4: Code Deployment (30-60 minutes)

**What**: Deploy updated application code

**Files Updated**:
- ✅ `lib/rl/thompson-sampling.ts` - Uses topic_id
- ✅ `app/api/rl/next-question/route.ts` - Uses topic_id
- ⏳ `app/api/rl/submit-response/route.ts` - Needs update
- ⏳ `app/admin/QuestionGenerator.tsx` - Needs topic selector UI

**How**:
```bash
# Test locally first
npm run dev
# Visit /quiz and test a full learning session

# If tests pass, deploy
git add .
git commit -m "feat: Migrate to database-backed topics with hierarchy"
git push origin main
# Deploy to production (Vercel auto-deploys)
```

**Testing Checklist**:
- [ ] Can start quiz session
- [ ] Thompson Sampling selects topics correctly
- [ ] Questions generate successfully
- [ ] Answers submit and update mastery
- [ ] Admin question generator works
- [ ] Performance page shows topics correctly

---

### Phase 5: Cleanup (10 minutes)

**What**: Remove old TEXT columns (ONLY after thorough testing)

**How**:
```bash
# Final step - drops TEXT columns permanently
node scripts/migrate-topics-to-ids.mjs --drop-text-columns
```

**What it does**:
- Drops `topic` TEXT column from all tables
- Makes `topic_id` NOT NULL (enforces database integrity)

**⚠️ WARNING**: This is irreversible without database backup!

**Verify**:
```sql
\d user_topic_mastery
-- Should NOT show 'topic' TEXT column anymore
-- Should show 'topic_id' UUID NOT NULL
```

---

## Rollback Plan

### Before Phase 5 (TEXT columns still exist)

**Can rollback easily**:
1. Revert code changes: `git revert <commit_hash>`
2. Application will use TEXT columns again
3. `topic_id` columns are ignored

### After Phase 5 (TEXT columns dropped)

**Requires database restore**:
1. Restore from backup
2. Re-apply Phase 1-3 carefully
3. Do NOT run Phase 5 until certain

---

## Migration Checklist

### Pre-Migration
- [ ] Database backup created
- [ ] Syllabus file prepared (e.g., `security-plus-syllabus.txt`)
- [ ] Tested migration scripts in development
- [ ] Code changes reviewed and tested locally
- [ ] Stakeholders notified of downtime window (if applicable)

### Phase 1: Database Schema
- [ ] SQL migrations applied
- [ ] topic_id columns exist
- [ ] Indexes created
- [ ] Migration functions created

### Phase 2: Hierarchical Topics
- [ ] Syllabus uploaded
- [ ] Topics have correct hierarchy
- [ ] full_name and path generated correctly

### Phase 3: Data Migration
- [ ] Dry run completed successfully
- [ ] Actual migration completed
- [ ] All topic_id columns populated
- [ ] No NULL topic_id where topic TEXT exists

### Phase 4: Code Deployment
- [ ] Updated code tested locally
- [ ] Quiz flow works end-to-end
- [ ] Admin tools functional
- [ ] Code deployed to production
- [ ] Production smoke tests passed

### Phase 5: Cleanup
- [ ] Application stable for 24-48 hours
- [ ] TEXT columns dropped
- [ ] topic_id constraints enforced
- [ ] Final verification passed

---

## Common Issues

### Issue: "Topic not found in database"

**Cause**: Generated question for topic that doesn't exist in `topics` table

**Fix**:
```sql
-- Check which topics exist
SELECT name FROM topics WHERE chapter_id = '<chapter_id>';

-- Add missing topic
INSERT INTO topics (chapter_id, name, parent_topic_id, sequence_order)
VALUES ('<chapter_id>', 'Missing Topic Name', NULL, 100);
```

### Issue: "Constraint violation on topic_id"

**Cause**: Trying to insert question with topic_id that doesn't exist

**Fix**:
1. Ensure topic exists in `topics` table first
2. Or set topic_id to NULL temporarily (questions.topic_id allows NULL)

### Issue: "Thompson Sampling returns no arms"

**Cause**: No topics in database for the chapter

**Fix**:
```bash
# Upload syllabus
node scripts/upload-hierarchical-syllabus.mjs <chapter_id> syllabus.txt
```

### Issue: "Migration creates duplicate topics"

**Cause**: Case mismatch (e.g., "Zero Trust" vs "zero trust" vs "ZERO TRUST")

**Fix**:
```sql
-- Find duplicates
SELECT LOWER(name), COUNT(*)
FROM topics
WHERE chapter_id = '<chapter_id>'
GROUP BY LOWER(name)
HAVING COUNT(*) > 1;

-- Merge duplicates (keep one, update references to others)
UPDATE user_topic_mastery
SET topic_id = '<canonical_topic_id>'
WHERE topic_id IN ('<duplicate_id_1>', '<duplicate_id_2>');

DELETE FROM topics WHERE id IN ('<duplicate_id_1>', '<duplicate_id_2>');
```

---

## Performance Considerations

### Indexes
All necessary indexes are created by the migration:
- `idx_user_topic_mastery_topic_id`
- `idx_arm_stats_topic_id`
- `idx_questions_topic_id`
- `idx_user_dimension_coverage_topic_id`
- `idx_topics_path` (for hierarchy queries)
- `idx_topics_parent_id` (for child lookups)

### Query Performance
- ✅ Topic lookups by ID: O(1) with index
- ✅ Hierarchy traversal: O(depth) via materialized paths
- ✅ Thompson Sampling: No performance change (already uses IDs internally after migration)

### Database Size
- Minimal increase (~50 bytes per row for UUID vs TEXT)
- Better compression due to fixed-width UUIDs vs variable TEXT

---

## Post-Migration Features

Once migration is complete, you can implement:

1. **Hierarchical Features**:
   - Roll up child mastery to parent
   - Show topic trees in UI
   - Breadcrumb navigation

2. **Prerequisites**:
   ```sql
   ALTER TABLE topics ADD COLUMN prerequisite_topic_ids UUID[];
   ```

3. **Learning Paths**:
   ```sql
   CREATE TABLE learning_paths (
     id UUID PRIMARY KEY,
     name TEXT,
     topic_ids UUID[]
   );
   ```

4. **Rich Metadata**:
   ```sql
   ALTER TABLE topics ADD COLUMN icon_url TEXT;
   ALTER TABLE topics ADD COLUMN estimated_hours INTEGER;
   ALTER TABLE topics ADD COLUMN difficulty_level INTEGER;
   ```

5. **Contextual RAG**:
   - Enrich chunks with full hierarchical path
   - Improve question generation quality

---

## Timeline

**Development Environment**: 2-3 hours
- Phase 1: 15 min
- Phase 2: 10 min
- Phase 3: 30 min
- Phase 4: 60 min (testing)
- Phase 5: 10 min

**Production Environment**: 3-4 hours (with extra caution)
- Same phases, but with more thorough testing between each step
- Recommend Phase 5 (cleanup) after 24-48 hours of stability

---

## Success Criteria

Migration is successful when:

✅ All learning sessions work correctly
✅ Thompson Sampling selects topic IDs (visible in logs)
✅ Questions are generated and stored with topic_id
✅ Mastery updates correctly per topic
✅ Admin question generator uses topic selector
✅ Performance page shows hierarchical topic names
✅ No NULL topic_id in user_topic_mastery or arm_stats
✅ Application stable for 24+ hours

---

## Contact

If you encounter issues:
1. Check logs: `npx supabase logs` or your hosting platform logs
2. Run verification queries from this document
3. Review Common Issues section
4. If stuck, restore from backup and investigate

**Remember**: Don't run Phase 5 (cleanup) until you're 100% confident!

