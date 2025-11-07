# Managing Curriculum Topics

## Overview

Axium uses a hierarchical topic structure to organize learning content. This guide explains how to add, modify, and reorganize topics as your curriculum grows.

## Adding New Topics

### Method 1: Syllabus File Upload (Recommended)

**Best for:** Bulk additions, initial setup, major curriculum updates

**Steps:**

1. **Create or update syllabus file** (e.g., `math-syllabus.txt`):
   ```
   Algebra
     Linear equations
     Quadratic equations
     Polynomials
     Matrices
   Geometry
     Triangles
     Circles
   Calculus
     Derivatives
     Integrals
     Limits
   ```

2. **Upload using script:**
   ```bash
   node scripts/upload-hierarchical-syllabus.mjs <chapter_id> math-syllabus.txt
   ```

3. **Verify in database:**
   ```sql
   SELECT id, name, full_name, depth
   FROM topics
   WHERE chapter_id = '<chapter_id>'
   ORDER BY path;
   ```

**The script automatically:**
- Skips existing topics (matches by name)
- Only inserts new topics
- Preserves hierarchy
- Updates materialized paths

### Method 2: Direct SQL Insert

**Best for:** Adding 1-5 topics, quick additions

**Steps:**

1. **Find parent topic ID** (if adding child):
   ```sql
   SELECT id, name FROM topics
   WHERE chapter_id = '<chapter_id>'
   AND name = 'Algebra';
   ```

2. **Insert new topic:**
   ```sql
   INSERT INTO topics (chapter_id, name, parent_topic_id, sequence_order, description)
   VALUES (
     '<chapter_id>',
     'Polynomials',
     '<algebra_topic_id>',  -- NULL if top-level
     3,                      -- Order within parent
     'Working with polynomial expressions and equations'
   );
   ```

3. **Verify hierarchy:**
   ```sql
   SELECT full_name FROM topics WHERE name = 'Polynomials';
   -- Should show: "Algebra > Polynomials"
   ```

### Method 3: Admin UI (Future Feature)

**Planned feature:** In-app topic management interface

```typescript
// Future implementation
<TopicManager chapterId={chapterId}>
  <AddTopicButton parentId={algebraId} />
  <ReorderTopics />
  <EditTopicMetadata />
</TopicManager>
```

## Common Scenarios

### Scenario 1: Expanding a Topic with Subtopics

**Situation:** "Linear equations" needs to be broken down further

**Before:**
```
Algebra
  ├── Linear equations
  └── Quadratic equations
```

**After:**
```
Algebra
  ├── Linear equations
  │   ├── Solving simple equations
  │   ├── Systems of equations
  │   └── Graphing linear functions
  └── Quadratic equations
```

**SQL:**
```sql
-- Get parent ID
SELECT id FROM topics WHERE name = 'Linear equations';
-- Returns: <linear_eqn_id>

-- Add subtopics
INSERT INTO topics (chapter_id, name, parent_topic_id, sequence_order)
VALUES
  ('<chapter_id>', 'Solving simple equations', '<linear_eqn_id>', 1),
  ('<chapter_id>', 'Systems of equations', '<linear_eqn_id>', 2),
  ('<chapter_id>', 'Graphing linear functions', '<linear_eqn_id>', 3);
```

**User Progress:**
- Existing mastery on "Linear equations" is preserved
- New subtopics start at 0 mastery
- Can implement: "Parent mastery = average of children mastery"

### Scenario 2: Adding Entire New Section

**Situation:** Adding "Calculus" as a new major topic area

**Syllabus file approach:**
```text
# Add to existing math-syllabus.txt

Calculus
  Limits
    One-sided limits
    Infinite limits
    Limits at infinity
  Derivatives
    Power rule
    Chain rule
    Implicit differentiation
  Integrals
    Definite integrals
    Indefinite integrals
    Integration by substitution
```

**Run:**
```bash
node scripts/upload-hierarchical-syllabus.mjs <chapter_id> math-syllabus.txt
```

### Scenario 3: Reorganizing Topics

**Situation:** Split "Geometry" into "Plane Geometry" and "Solid Geometry"

**Steps:**

1. **Create new parent topics:**
   ```sql
   INSERT INTO topics (chapter_id, name, parent_topic_id, sequence_order)
   VALUES
     ('<chapter_id>', 'Plane Geometry', NULL, 2),
     ('<chapter_id>', 'Solid Geometry', NULL, 3)
   RETURNING id;
   ```

2. **Move existing topics:**
   ```sql
   -- Move Triangles and Circles to Plane Geometry
   UPDATE topics
   SET parent_topic_id = '<plane_geometry_id>'
   WHERE name IN ('Triangles', 'Circles');
   ```

3. **Add new topics to Solid Geometry:**
   ```sql
   INSERT INTO topics (chapter_id, name, parent_topic_id, sequence_order)
   VALUES
     ('<chapter_id>', 'Spheres', '<solid_geometry_id>', 1),
     ('<chapter_id>', 'Cubes', '<solid_geometry_id>', 2),
     ('<chapter_id>', 'Cylinders', '<solid_geometry_id>', 3);
   ```

4. **Deprecate old parent** (optional):
   ```sql
   UPDATE topics
   SET description = '[DEPRECATED] Use Plane Geometry or Solid Geometry'
   WHERE name = 'Geometry' AND parent_topic_id IS NULL;
   ```

**Note:** User progress on child topics is automatically preserved (references don't change).

## Best Practices

### 1. Plan Your Hierarchy

**Good hierarchy:**
```
Physics
  ├── Mechanics
  │   ├── Kinematics
  │   │   ├── Position and displacement
  │   │   ├── Velocity and acceleration
  │   │   └── Motion graphs
  │   └── Dynamics
  │       ├── Newton's laws
  │       └── Friction
  └── Thermodynamics
      ├── Heat and temperature
      └── Laws of thermodynamics
```

**Characteristics:**
- Max 3-4 levels deep (Root → Parent → Child → Grandchild)
- 3-7 items per level (cognitive load limit)
- Clear conceptual progression (simple → complex)
- Mutually exclusive categories

### 2. Use Descriptive Names

```
✅ Good: "Newton's Second Law (F=ma)"
✅ Good: "Solving linear equations with one variable"
❌ Bad: "Topic 1"
❌ Bad: "Misc"
```

### 3. Maintain Sequence Order

```sql
-- Topics should have logical sequence_order
SELECT name, sequence_order
FROM topics
WHERE parent_topic_id = '<parent_id>'
ORDER BY sequence_order;

-- Results:
1. Introduction to topic
2. Basic concepts
3. Intermediate applications
4. Advanced problems
```

### 4. Version Your Syllabus Files

```
syllabus/
├── math-v1-initial.txt       (10 topics)
├── math-v2-calculus.txt      (30 topics - added calculus)
├── math-v3-expanded.txt      (50 topics - added subtopics)
└── math-current.txt          (symlink to latest)
```

### 5. Test in Development First

```bash
# Use a test chapter ID
node scripts/upload-hierarchical-syllabus.mjs <test_chapter_id> new-topics.txt

# Verify structure
psql -c "SELECT full_name FROM topics WHERE chapter_id = '<test_chapter_id>';"

# If good, apply to production chapter
node scripts/upload-hierarchical-syllabus.mjs <prod_chapter_id> new-topics.txt
```

## Handling User Progress During Changes

### Adding New Topics
- ✅ **Safe:** No impact on existing progress
- Users start with 0 mastery on new topics
- Thompson Sampling will naturally explore new arms

### Renaming Topics
```sql
-- Safe: topic_id doesn't change
UPDATE topics SET name = 'Advanced Calculus' WHERE name = 'Calculus II';
-- User progress is preserved (references topic_id)
```

### Moving Topics (Change Parent)
```sql
-- Safe: topic_id doesn't change
UPDATE topics SET parent_topic_id = '<new_parent_id>' WHERE id = '<topic_id>';
-- User progress is preserved
-- But full_name will change (path updates via trigger)
```

### Deleting Topics
```sql
-- ⚠️ CAREFUL: Cascades to user_topic_mastery
DELETE FROM topics WHERE id = '<topic_id>';
-- This deletes ALL user progress for this topic!

-- Better: Mark as deprecated
UPDATE topics
SET description = '[DEPRECATED] Merged into Advanced Algebra'
WHERE id = '<topic_id>';
```

### Merging Topics
```sql
-- Scenario: Merge "Derivatives I" and "Derivatives II" into "Derivatives"

-- 1. Create new merged topic
INSERT INTO topics (chapter_id, name, parent_topic_id)
VALUES ('<chapter_id>', 'Derivatives', '<calculus_id>')
RETURNING id;  -- <merged_topic_id>

-- 2. Migrate user progress (keep highest mastery)
INSERT INTO user_topic_mastery (user_id, chapter_id, topic_id, bloom_level, mastery_score, ...)
SELECT
  user_id,
  chapter_id,
  '<merged_topic_id>',
  bloom_level,
  MAX(mastery_score) as mastery_score,
  ...
FROM user_topic_mastery
WHERE topic_id IN ('<derivatives_1_id>', '<derivatives_2_id>')
GROUP BY user_id, chapter_id, bloom_level;

-- 3. Deprecate old topics
UPDATE topics
SET description = '[DEPRECATED] Merged into Derivatives'
WHERE id IN ('<derivatives_1_id>', '<derivatives_2_id>');
```

## Troubleshooting

### "Topic already exists" Error

**Cause:** Duplicate name in same parent

**Fix:**
```sql
-- Check for duplicates
SELECT name, COUNT(*)
FROM topics
WHERE chapter_id = '<chapter_id>'
GROUP BY name
HAVING COUNT(*) > 1;

-- Rename duplicate
UPDATE topics
SET name = 'Triangles (Advanced)'
WHERE id = '<duplicate_id>';
```

### Hierarchy Not Updating (full_name incorrect)

**Cause:** Trigger didn't fire

**Fix:**
```sql
-- Manually recalculate for one topic
UPDATE topics
SET
  path = generate_topic_path(id),
  full_name = generate_topic_full_name(id),
  depth = calculate_topic_depth(id)
WHERE id = '<topic_id>';

-- Recalculate for entire chapter
UPDATE topics
SET
  path = generate_topic_path(id),
  full_name = generate_topic_full_name(id),
  depth = calculate_topic_depth(id)
WHERE chapter_id = '<chapter_id>';
```

### Orphaned Topics (parent_topic_id points to deleted topic)

**Prevention:** Use CASCADE on foreign key (already in schema)

**Fix if it happens:**
```sql
-- Find orphans
SELECT id, name FROM topics
WHERE parent_topic_id IS NOT NULL
AND parent_topic_id NOT IN (SELECT id FROM topics);

-- Re-parent to root
UPDATE topics
SET parent_topic_id = NULL
WHERE id IN (<orphan_ids>);
```

## Future Enhancements

### Planned Features

1. **Admin UI for Topic Management**
   - Visual tree editor
   - Drag-and-drop reordering
   - Bulk import/export
   - Live preview of hierarchy

2. **Topic Dependencies**
   ```sql
   ALTER TABLE topics ADD COLUMN prerequisite_topic_ids UUID[];
   -- e.g., "Integrals" requires ["Derivatives", "Limits"]
   ```

3. **Topic Metadata**
   ```sql
   ALTER TABLE topics ADD COLUMN estimated_hours INTEGER;
   ALTER TABLE topics ADD COLUMN difficulty_level INTEGER; -- 1-5
   ALTER TABLE topics ADD COLUMN icon_url TEXT;
   ```

4. **Automatic Mastery Rollup**
   ```typescript
   // Parent mastery = weighted average of children
   const parentMastery = calculateRollupMastery(parentTopicId, userId)
   ```

5. **Learning Paths**
   ```sql
   CREATE TABLE learning_paths (
     id UUID PRIMARY KEY,
     name TEXT,
     topic_ids UUID[]  -- Ordered sequence
   );
   -- e.g., "Beginner Math Path": [Algebra, Geometry, Trigonometry]
   ```

## Summary

**To add topics:**
1. Update syllabus file with new topics
2. Run upload script
3. Verify hierarchy
4. Upload PDFs covering new topics
5. Generate questions

**Key principles:**
- Plan hierarchy before adding topics
- Use version-controlled syllabus files
- Test in development first
- Preserve user progress during changes
- Keep hierarchy 3-4 levels max

**Resources:**
- Upload script: `scripts/upload-hierarchical-syllabus.mjs`
- Reset script: `scripts/reset-and-rebuild-syllabus.mjs`
- Delete script: `scripts/delete-chapter-topics.mjs`
- Database functions: `supabase/migrations/20250108_add_topic_hierarchy.sql`
