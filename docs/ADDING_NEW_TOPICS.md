# Adding New Topics and Performance Tracking

This guide explains how the Axium system handles new topics and automatically tracks performance.

## TL;DR - It's Automatic!

When you add a new topic to the `topics` table, **everything else happens automatically**:
- ✅ Thompson Sampling picks it up immediately
- ✅ Questions can be generated for it
- ✅ Performance tracking starts on first attempt
- ✅ Mastery data is created lazily
- ✅ Dimension coverage initializes automatically

**No manual setup required!**

---

## How to Add New Topics

### Method 1: Direct Database Insert (Recommended)

```sql
-- Example: Add a single root topic
INSERT INTO topics (chapter_id, name, description, parent_topic_id, depth, path, available_bloom_levels)
VALUES (
  'your-chapter-uuid',
  'Network Security',
  'Fundamentals of securing computer networks',
  NULL,  -- NULL = root topic (no parent)
  0,     -- depth = 0 for root topics
  'Network Security',  -- path = just the name for root
  ARRAY[1, 2, 3, 4, 5, 6]  -- All Bloom levels available
);

-- Example: Add a child topic
INSERT INTO topics (chapter_id, name, description, parent_topic_id, depth, path, available_bloom_levels)
VALUES (
  'your-chapter-uuid',
  'Firewalls',
  'Types and configuration of network firewalls',
  'parent-topic-uuid',  -- UUID of 'Network Security'
  1,     -- depth = 1 (one level deep)
  'Network Security > Firewalls',  -- hierarchical path
  ARRAY[1, 2, 3, 4]  -- Only first 4 Bloom levels
);
```

### Method 2: Script Extraction from PDFs

Use the `extract-all-topics.mjs` script to extract topics from uploaded PDF content:

```bash
# Edit the script to set your chapter_id
nano scripts/extract-all-topics.mjs

# Run the extraction
node scripts/extract-all-topics.mjs
```

This script:
- Reads all `knowledge_chunks` for a chapter
- Extracts topic names from structured content
- Prints unique topics (you manually insert them)

### Method 3: Bulk Insert with Hierarchy

```sql
-- Insert multiple topics with hierarchy in one transaction
BEGIN;

-- Root topic
INSERT INTO topics (id, chapter_id, name, description, parent_topic_id, depth, path, available_bloom_levels)
VALUES
  ('uuid-1', 'chapter-uuid', 'Cryptography', 'Encryption fundamentals', NULL, 0, 'Cryptography', ARRAY[1,2,3,4,5,6]);

-- Child topics
INSERT INTO topics (id, chapter_id, name, description, parent_topic_id, depth, path, available_bloom_levels)
VALUES
  ('uuid-2', 'chapter-uuid', 'Symmetric Encryption', 'Shared key encryption', 'uuid-1', 1, 'Cryptography > Symmetric Encryption', ARRAY[1,2,3,4]),
  ('uuid-3', 'chapter-uuid', 'Asymmetric Encryption', 'Public key cryptography', 'uuid-1', 1, 'Cryptography > Asymmetric Encryption', ARRAY[1,2,3,4,5]);

-- Grandchild topics
INSERT INTO topics (id, chapter_id, name, description, parent_topic_id, depth, path, available_bloom_levels)
VALUES
  ('uuid-4', 'chapter-uuid', 'AES', 'Advanced Encryption Standard', 'uuid-2', 2, 'Cryptography > Symmetric Encryption > AES', ARRAY[1,2,3]);

COMMIT;
```

---

## How Performance Tracking Works (Automatically)

### 1. **Topic Discovery via Thompson Sampling**

When a quiz starts, the system calls `get_available_arms(user_id, chapter_id)`:

```sql
-- This function returns ALL possible (topic_id, bloom_level) combinations
-- It checks the topics table and generates arms on-the-fly
SELECT topic_id, topic, bloom_level, mastery_score, is_unlocked
FROM get_available_arms('user-uuid', 'chapter-uuid');
```

**Key Points:**
- Reads from `topics` table (line 22: `FROM topics t WHERE t.chapter_id = p_chapter_id`)
- Generates all combinations using `unnest(available_bloom_levels)` (line 21)
- **No pre-existing data required** - new topics show up immediately
- Initial mastery_score = 0.0 (line 47: `COALESCE(upd.mastery_score, 0.0)`)

### 2. **Lazy Initialization of Progress Data**

When a user first encounters a new topic, the system creates records **on-demand**:

#### **A. User Progress Record** (`user_progress` table)

Created when first question is answered via `submit-response` API:

```typescript
// In app/api/rl/submit-response/route.ts
// Creates or updates user_progress for this topic_id
const { data: progressData, error: progressError } = await supabase
  .from('user_progress')
  .upsert({
    user_id: userId,
    topic_id: topicId,
    current_bloom_level: bloomLevel,
    total_attempts: 1,
    correct_answers: isCorrect ? 1 : 0,
    // ... other fields initialized
  }, {
    onConflict: 'user_id,topic_id'  // Update if exists, insert if not
  })
```

**What gets tracked:**
- `current_bloom_level` - Highest unlocked level
- `total_attempts` - Total questions answered
- `correct_answers` - Number correct
- `mastery_scores` - JSON object with scores per Bloom level
- `rl_phase` - Learning phase (cold_start → meta_learning)
- `confidence_calibration_error` - Self-assessment accuracy

#### **B. RL Arm Stats** (`rl_arm_stats` table)

Thompson Sampling statistics created on first selection:

```typescript
// When arm is selected and question answered
const { data: armStats, error: armError } = await supabase
  .from('rl_arm_stats')
  .upsert({
    user_id: userId,
    topic_id: topicId,
    bloom_level: bloomLevel,
    successes: isCorrect ? 1 : 0,  // Beta distribution α
    failures: isCorrect ? 0 : 1,   // Beta distribution β
    times_selected: 1,
    last_selected_at: new Date().toISOString()
  }, {
    onConflict: 'user_id,topic_id,bloom_level'
  })
```

**What gets tracked:**
- `successes` & `failures` - Beta distribution parameters for Thompson Sampling
- `times_selected` - How often this arm was chosen
- `last_selected_at` - For spacing rewards

#### **C. Dimension Coverage** (`user_dimension_coverage` table)

Tracks mastery across 6 dimensions × 6 Bloom levels = 36 cells:

```typescript
// After answering a question in a specific dimension
const { data: coverage, error: coverageError } = await supabase
  .from('user_dimension_coverage')
  .upsert({
    user_id: userId,
    chapter_id: chapterId,
    topic_id: topicId,
    bloom_level: bloomLevel,
    dimension: dimension,  // 'definition', 'example', etc.
    unique_questions_answered: [questionId],
    times_tested: 1,
    total_attempts: 1,
    average_score: isCorrect ? 100 : 0
  }, {
    onConflict: 'user_id,chapter_id,topic_id,bloom_level,dimension'
  })
```

**What gets tracked:**
- `unique_questions_answered[]` - Array of question UUIDs answered
- `times_tested` - Number of unique questions
- `total_attempts` - Total times tested (can repeat questions)
- `average_score` - Running average (0-100)

#### **D. User Responses** (`user_responses` table)

Every single answer is logged:

```typescript
const { data: response, error: responseError } = await supabase
  .from('user_responses')
  .insert({
    user_id: userId,
    question_id: questionId,
    session_id: sessionId,
    topic_id: topicId,
    bloom_level: bloomLevel,
    is_correct: isCorrect,
    confidence: confidence,  // 1-5 scale
    recognition_method: recognitionMethod,  // 'memory', 'recognition', 'guess', 'random'
    reward: calculatedReward,  // Multi-component reward (-15 to +25)
    created_at: new Date().toISOString()
  })
```

**What gets tracked:**
- Every answer with full context
- Confidence calibration data
- Recognition method (how they knew the answer)
- Calculated reward for RL learning

---

## Performance Visualization

### 1. **Chapter-Level Performance** (`/performance/[subject]/[chapter]`)

Shows all topics in the chapter:

**Mastery Heatmap:**
```
Topic               L1   L2   L3   L4   L5   L6
─────────────────────────────────────────────
Network Security    85%  72%  --   --   --   --
Firewalls           90%  80%  65%  --   --   --
VPNs                95%  85%  70%  45%  --   --
```

**How it works:**
- Queries `user_progress` for all topics in chapter
- Shows mastery_score for each Bloom level
- Color-coded: mastered (green), proficient (blue), developing (yellow), struggling (red)
- Lock icons for locked levels

### 2. **Topic-Level Performance** (`/performance/[subject]/[chapter]/[topic]`)

Shows comprehensive mastery matrix (6 Bloom × 6 Dimensions = 36 cells):

**Dimension Matrix:**
```
                  Definition  Example  Comparison  Scenario  Implementation  Troubleshooting
─────────────────────────────────────────────────────────────────────────────────────────────
L1 Remember       85% (3/4)   90% (2/3)   --         --        --              --
L2 Understand     70% (2/5)   80% (3/4)   75% (1/2)  --        --              --
L3 Apply          --          65% (1/3)   --         70% (2/3) --              --
L4 Analyze        --          --          --         --        --              --
L5 Evaluate       --          --          --         --        --              --
L6 Create         --          --          --         --        --              --
```

**How it works:**
- Calls `get_topic_dimension_matrix(user_id, chapter_id, topic_name)` database function
- Returns all 36 cells (some empty if not tested)
- Shows: times_tested, unique_questions_count, average_score
- Uses `user_dimension_coverage` table

---

## Question Generation for New Topics

### Automatic RAG Retrieval

When a new topic is selected, questions are generated using:

1. **Topic embedding** - Converts topic name to vector
2. **Similarity search** - Finds relevant `knowledge_chunks` via `match_knowledge_chunks()`
3. **Grok generation** - Creates question based on retrieved context

```typescript
// In app/api/rl/next-question/route.ts
const selectedQuestion = await generateQuestionOnDemand(
  supabase,
  user.id,
  session.chapter_id,
  selectedArm.topicId,     // New topic's UUID
  selectedArm.topicName,   // New topic's name
  selectedArm.bloomLevel,
  targetDimension,
  subjectDimensionMap
)
```

**Requirements:**
- Topic must have uploaded PDFs with knowledge_chunks
- If no chunks found → error: "No relevant content found for topic"

---

## Example Workflow: Adding "Blockchain" Topic

### Step 1: Insert Topic

```sql
INSERT INTO topics (chapter_id, name, description, parent_topic_id, depth, path, available_bloom_levels)
VALUES (
  '0517450a-61b2-4fa2-a425-5846b21ba4b0',  -- Your chapter UUID
  'Blockchain',
  'Distributed ledger technology and cryptocurrencies',
  NULL,
  0,
  'Blockchain',
  ARRAY[1, 2, 3, 4, 5, 6]
);
```

### Step 2: Upload PDFs (Optional but Recommended)

Via Admin panel:
- Upload PDF about Blockchain
- System chunks it (1000 chars per chunk)
- Generates embeddings (OpenAI text-embedding-3-small)
- Stores in `knowledge_chunks` table

### Step 3: Start Quiz

User visits `/subjects/Cybersecurity/CISSP/quiz`:

1. **Thompson Sampling runs:**
   ```sql
   SELECT * FROM get_available_arms('user-uuid', 'chapter-uuid');
   -- Returns "Blockchain" with bloom_level 1, mastery_score 0.0, is_unlocked true
   ```

2. **Question generated:**
   - RAG retrieves chunks about Blockchain
   - Grok creates a definition question at Bloom L1
   - Question stored with `user_id` and `topic_id`

3. **User answers:**
   - `user_progress` created for Blockchain
   - `rl_arm_stats` created for (Blockchain, L1)
   - `user_dimension_coverage` created for (Blockchain, L1, definition)
   - `user_responses` logs the answer

### Step 4: View Performance

User visits `/performance/Cybersecurity/CISSP/Blockchain`:
- See 6×6 matrix
- Only (L1, definition) cell has data: "85% (1/1)"
- All other cells show "--" (not tested)

---

## Bloom Level Unlocking

Higher Bloom levels unlock **automatically** based on mastery:

**Unlock Requirements:**
- ✅ 3+ correct answers at previous level
- ✅ 80%+ accuracy at previous level

**Example:**
```
User answers 5 questions at (Blockchain, L1):
- Correct: 4/5 = 80%

→ Bloom Level 2 unlocks automatically
→ Next quiz can select (Blockchain, L2)
```

**Checked by:**
```sql
-- In get_available_arms function (line 54-63)
WHEN tbc.bloom_level > 1 THEN EXISTS (
  SELECT 1
  FROM user_progress up2
  WHERE up2.user_id = p_user_id
    AND up2.topic_id = tbc.topic_id
    AND up2.current_bloom_level >= (tbc.bloom_level - 1)
    AND up2.correct_answers >= 3
    AND (up2.correct_answers::DECIMAL / up2.total_attempts::DECIMAL) >= 0.80
)
```

---

## Key Takeaways

1. **Zero Configuration** - Just add topic to database, everything else is automatic
2. **Lazy Initialization** - Progress data created only when needed
3. **Hierarchical Support** - Parent/child topics work seamlessly
4. **Automatic Unlocking** - Bloom levels unlock based on mastery
5. **Comprehensive Tracking** - 36 cells per topic (6 Bloom × 6 Dimensions)
6. **RAG-Powered** - Questions generated from uploaded PDFs
7. **Thompson Sampling** - RL algorithm balances exploration vs exploitation

**No manual performance setup ever required!**

---

## Troubleshooting

### New topic doesn't appear in quiz

**Check:**
1. Topic exists in `topics` table with correct `chapter_id`
2. `available_bloom_levels` is not empty (should be `[1,2,3,4,5,6]`)
3. Bloom L1 should always be unlocked (no prerequisites)

**Debug:**
```sql
-- See all arms for a chapter
SELECT * FROM get_available_arms('your-user-uuid', 'chapter-uuid')
WHERE topic = 'Your New Topic';

-- Should return at least one row with bloom_level 1 and is_unlocked = true
```

### No questions generated for new topic

**Check:**
1. PDFs uploaded for this chapter
2. `knowledge_chunks` exist with embeddings
3. Topic name matches content in chunks (case-insensitive)

**Debug:**
```sql
-- Check if chunks exist
SELECT COUNT(*) FROM knowledge_chunks WHERE chapter_id = 'chapter-uuid';

-- Try manual vector search
SELECT content, similarity
FROM match_knowledge_chunks('[0.1,0.2,...]'::vector, 0.1, 5, 'chapter-uuid');
```

### Performance not showing

**Check:**
1. User has answered at least one question for this topic
2. `user_progress` record exists
3. `user_dimension_coverage` record exists

**Debug:**
```sql
-- Check progress
SELECT * FROM user_progress
WHERE user_id = 'user-uuid' AND topic_id = 'topic-uuid';

-- Check dimension coverage
SELECT * FROM user_dimension_coverage
WHERE user_id = 'user-uuid' AND topic_id = 'topic-uuid';

-- Check responses
SELECT * FROM user_responses
WHERE user_id = 'user-uuid' AND topic_id = 'topic-uuid';
```

---

## Advanced: Batch Import Topics

For large-scale topic import, use a script:

```javascript
// import-topics.mjs
import { createClient } from '@supabase/supabase-js'

const topics = [
  { name: 'Topic 1', description: '...', depth: 0, parent: null },
  { name: 'Topic 2', description: '...', depth: 1, parent: 'Topic 1' },
  // ... more topics
]

const supabase = createClient(url, key)

for (const topic of topics) {
  const { data, error } = await supabase
    .from('topics')
    .insert({
      chapter_id: 'your-chapter-uuid',
      name: topic.name,
      description: topic.description,
      parent_topic_id: topic.parent ? await getTopicId(topic.parent) : null,
      depth: topic.depth,
      path: topic.depth === 0 ? topic.name : `${topic.parent} > ${topic.name}`,
      available_bloom_levels: [1, 2, 3, 4, 5, 6]
    })

  if (error) console.error(`Error inserting ${topic.name}:`, error)
  else console.log(`✓ Inserted ${topic.name}`)
}
```

---

**Last Updated:** January 2025
