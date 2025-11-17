# 5W1H Cognitive Dimensions Framework

## Overview

The **5W1H Cognitive Dimensions Framework** ensures comprehensive topic mastery by requiring students to demonstrate understanding from **6 distinct cognitive perspectives** before advancing to the next Bloom level.

This universal framework applies to **ANY topic** - whether it's a concept (Encryption), process (Authentication), tool (Firewall), or attack (Phishing).

## The 6 Cognitive Dimensions

### 1. WHAT - Definition, Identification, Components
**Focus:** What is it? What are its parts? What defines it?

**Tests:** Understanding of definitions, core concepts, components, and classifications

**Examples by Bloom Level:**
- **Bloom 1 (Remember):** "What is Ephemeral Session Key?"
- **Bloom 3 (Apply):** "What components make up a PKI infrastructure?"
- **Bloom 5 (Evaluate):** "What criteria define an effective access control policy?"

---

### 2. WHY - Purpose, Rationale, Motivation
**Focus:** Why is it used? Why does it matter? What problem does it solve?

**Tests:** Understanding of purpose, rationale, significance, and value

**Examples by Bloom Level:**
- **Bloom 1 (Remember):** "Why is multifactor authentication important?"
- **Bloom 3 (Apply):** "Why would you choose asymmetric over symmetric encryption?"
- **Bloom 5 (Evaluate):** "Why might this security control fail to achieve its purpose?"

---

### 3. WHEN - Context, Timing, Lifecycle
**Focus:** When is it used? When does it occur? What is its lifecycle?

**Tests:** Understanding of temporal context, appropriate timing, and lifecycle stages

**Examples by Bloom Level:**
- **Bloom 1 (Remember):** "When is a firewall typically deployed?"
- **Bloom 3 (Apply):** "When should you apply this patch?"
- **Bloom 5 (Evaluate):** "When would this approach be inappropriate?"

---

### 4. WHERE - Location, Scope, Boundaries
**Focus:** Where is it applied? Where does it fit? What is its scope?

**Tests:** Understanding of context, placement, boundaries, and applicability

**Examples by Bloom Level:**
- **Bloom 1 (Remember):** "Where in the OSI model does TLS operate?"
- **Bloom 3 (Apply):** "Where would you place this IDS sensor?"
- **Bloom 5 (Evaluate):** "Where are the boundaries of this control's effectiveness?"

---

### 5. HOW - Mechanism, Process, Methodology
**Focus:** How does it work? How is it implemented? What are the steps?

**Tests:** Understanding of mechanisms, processes, procedures, and implementation

**Examples by Bloom Level:**
- **Bloom 1 (Remember):** "How does AES encryption function?"
- **Bloom 3 (Apply):** "How would you implement MFA in this system?"
- **Bloom 6 (Create):** "How would you design a more secure authentication system?"

---

### 6. CHARACTERISTICS - Properties, Attributes, Relationships
**Focus:** What are its properties? How does it relate to others? What are its attributes?

**Tests:** Understanding of features, traits, relationships, and distinguishing factors

**Examples by Bloom Level:**
- **Bloom 1 (Remember):** "What are the key characteristics of symmetric encryption?"
- **Bloom 4 (Analyze):** "How do the characteristics of MAC compare to DAC?"
- **Bloom 5 (Evaluate):** "Which characteristic is most critical for this use case?"

---

## Progression Requirements

### Unlock Criteria for Next Bloom Level

To advance from Level N to Level N+1, students must satisfy **ALL THREE** requirements:

1. **✅ Mastery:** 100% accuracy at current Bloom level (all attempts correct)
2. **✅ Dimension Coverage:** At least **4 of 6** cognitive dimensions covered
3. **✅ Statistical Reliability:** Minimum **5 attempts** at current Bloom level

### Example: Unlocking Bloom Level 2

**Topic:** Ephemeral Session Key

| Dimension | Attempts | Status |
|-----------|----------|--------|
| WHAT ✅ | 2 correct | Covered |
| WHY ✅ | 1 correct | Covered |
| HOW ✅ | 2 correct | Covered |
| CHARACTERISTICS ✅ | 1 correct | Covered |
| WHEN ❌ | 0 | Not covered |
| WHERE ❌ | 0 | Not covered |

**Progress:**
- ✅ Mastery: 100% (6/6 correct)
- ✅ Dimension Coverage: 4/6 (66.7%)
- ✅ Min Attempts: 6 attempts
- **🔓 Level 2 UNLOCKED**

---

## Database Schema

### Questions Table
```sql
ALTER TABLE questions
ADD COLUMN cognitive_dimension cognitive_dimension,
ADD COLUMN dimension_metadata JSONB DEFAULT '{}'::jsonb;
```

**Enum:**
```sql
CREATE TYPE cognitive_dimension AS ENUM (
  'WHAT',
  'WHY',
  'WHEN',
  'WHERE',
  'HOW',
  'CHARACTERISTICS'
);
```

### User Progress Table
```sql
ALTER TABLE user_progress
ADD COLUMN dimension_coverage JSONB DEFAULT '{}'::jsonb;
```

**Structure:**
```json
{
  "1": ["WHAT", "WHY", "HOW", "CHARACTERISTICS"],
  "2": ["WHAT", "WHERE"],
  "3": []
}
```
Keys = Bloom levels, Values = covered dimensions

---

## Functions

### 1. Calculate Dimension Coverage
```sql
SELECT calculate_dimension_coverage(
  user_id := '...',
  topic_id := '...',
  bloom_level := 1
);
```

**Returns:**
```json
{
  "covered_dimensions": ["WHAT", "WHY", "HOW"],
  "coverage_count": 3,
  "total_dimensions": 6,
  "coverage_percentage": 50.00
}
```

### 2. Check Coverage Requirement
```sql
SELECT check_dimension_coverage_requirement(
  user_id := '...',
  topic_id := '...',
  bloom_level := 1,
  required_dimensions := 4  -- Default: 4
);
-- Returns: true/false
```

### 3. Get Uncovered Dimensions
```sql
SELECT get_uncovered_dimensions(
  user_id := '...',
  topic_id := '...',
  bloom_level := 1
);
-- Returns: ['WHEN', 'WHERE', 'CHARACTERISTICS']
```

### 4. Enhanced Unlock Check
```sql
SELECT check_bloom_level_unlock(
  user_id := '...',
  topic_id := '...',
  current_bloom_level := 1
);
-- Returns: true if ALL criteria met (mastery + dimensions + attempts)
```

---

## Question Generation

### API Request
```typescript
POST /api/questions/generate
{
  "chapter_id": "...",
  "topic_id": "...",
  "bloom_level": 1,
  "cognitive_dimension": "WHY",  // Target specific dimension
  "question_format": "mcq_single",
  "num_questions": 1
}
```

### Selection Strategy

**Prioritize uncovered dimensions:**
```typescript
import { selectNextDimension } from '@/lib/utils/cognitive-dimensions'

const coveredDimensions = ['WHAT', 'WHY']
const nextDimension = selectNextDimension(coveredDimensions)
// Returns: One of ['WHEN', 'WHERE', 'HOW', 'CHARACTERISTICS']
```

---

## Automatic Tracking

### Trigger: After Answer Submission
```sql
CREATE TRIGGER after_user_response_insert
AFTER INSERT ON user_responses
FOR EACH ROW
EXECUTE FUNCTION trigger_update_dimension_coverage();
```

**What it does:**
1. User answers question
2. Trigger fires
3. Dimension coverage cache updated automatically
4. No manual tracking needed

---

## UI Display

### Topic Detail Page - Dimension Coverage Breakdown

```
Ephemeral Session Key - Bloom Level 1

Dimension Coverage: 4/6 (67%)  [Need 4 to unlock Level 2]

✅ WHAT (Definition)           - 2 attempts, 100% accuracy
✅ WHY (Purpose)                - 1 attempt, 100% accuracy
❌ WHEN (Timing)                - Not attempted
❌ WHERE (Scope)                - Not attempted
✅ HOW (Mechanism)              - 2 attempts, 100% accuracy
✅ CHARACTERISTICS (Properties) - 1 attempt, 100% accuracy

Next: Answer questions about WHEN or WHERE to unlock Level 2
```

---

## Benefits

### 1. Comprehensive Understanding
Forces students to understand topics from multiple angles, not just memorize definitions.

### 2. Universal Applicability
Works for ANY topic - concepts, processes, tools, attacks, frameworks, etc.

### 3. Prevents Gaming
Can't advance by repeatedly answering the same type of question (e.g., only "What is X?" questions).

### 4. Cognitive Load Optimization
Easier to answer questions from familiar dimensions → build confidence
Gradually introduce new dimensions → expand understanding

### 5. Diagnostic Power
Identify knowledge gaps:
- Good at WHAT/WHY (theory) but weak at HOW (implementation)?
- Strong at definitions but can't apply (WHERE/WHEN)?

---

## Example Learning Journey

### Topic: Multifactor Authentication (MFA)

**Bloom Level 1 (Remember)**

1. **WHAT:** "What is multifactor authentication?"
2. **WHY:** "Why is MFA more secure than single-factor?"
3. **WHEN:** "When should MFA be required?"
4. **HOW:** "How many factors are used in MFA?"
5. **CHARACTERISTICS:** "What are the three factor types in MFA?"

**Status:** 5/5 correct, 5/6 dimensions → Need 1 more question (WHERE)

6. **WHERE:** "Where is MFA typically implemented?"

**Status:** 6/6 correct, 6/6 dimensions → 🔓 **Level 2 Unlocked**

**Bloom Level 2 (Understand)**

7. **WHAT:** "What distinguishes knowledge factors from possession factors?"
8. **WHY:** "Why might SMS-based MFA be less secure than app-based?"
9. **HOW:** "How does TOTP generate time-based codes?"
10. **CHARACTERISTICS:** "Compare hardware tokens vs. software tokens"

**Status:** 4/4 correct, 4/6 dimensions → Continue testing WHEN/WHERE

---

## Implementation Files

- **Migration:** `supabase/migrations/20250118_add_cognitive_dimensions.sql`
- **Types:** `lib/utils/cognitive-dimensions.ts`
- **Database Types:** `lib/types/database.ts`
- **Question API:** `app/api/questions/generate/route.ts`
- **Documentation:** `docs/5W1H_COGNITIVE_DIMENSIONS.md` (this file)

---

## Configuration

### Adjust Requirements
Edit in migration file or database:

```sql
-- Change minimum dimensions required (default: 4)
SELECT check_dimension_coverage_requirement(..., required_dimensions := 5);

-- Change minimum attempts (default: 5)
-- Update in check_bloom_level_unlock function
```

### TypeScript Constants
```typescript
// lib/utils/cognitive-dimensions.ts
export const DIMENSION_REQUIREMENTS = {
  MIN_DIMENSIONS: 4,        // Must cover at least 4 of 6
  MIN_ATTEMPTS: 5,          // Minimum total attempts
  MASTERY_THRESHOLD: 100    // Must achieve 100% mastery
}
```

---

## Summary

The **5W1H Cognitive Dimensions Framework** transforms learning from shallow memorization to deep, multidimensional understanding. By requiring coverage across WHAT, WHY, WHEN, WHERE, HOW, and CHARACTERISTICS, students develop comprehensive mastery before advancing.

**Key Formula:**
```
Unlock = (Mastery ≥ 100%) AND (Dimensions ≥ 4/6) AND (Attempts ≥ 5)
```

This ensures students truly understand a topic from all angles before moving to higher cognitive complexity.
