# Question Format Personalization

**Version:** 1.0
**Last Updated:** 2025-01-05

## Overview

Axium's Question Format Personalization system enables the RL-based learning engine to personalize not just **WHAT** students learn (topics, Bloom levels) but **HOW** they learn (question formats). By tracking performance across 9 different question formats, the system can adapt to individual learning preferences and optimize cognitive load.

---

## The Two Dimensions of Learning

### Dimension 1: WHAT to Learn (Bloom's Taxonomy)
- **Remember** → Recall facts and concepts
- **Understand** → Explain ideas
- **Apply** → Use in new situations
- **Analyze** → Draw connections
- **Evaluate** → Justify decisions
- **Create** → Produce original work

### Dimension 2: HOW to Learn (Question Format)
- **MCQ Single** → Multiple choice with one correct answer
- **MCQ Multi** → Multiple choice with multiple correct answers
- **Fill in the Blank** → Complete missing parts
- **Open Ended** → Essay/explanation with rubric

---

## Format × Bloom Matrix

Different formats work best at different cognitive levels:

| Format | Bloom Levels | Complexity | Best For |
|--------|--------------|------------|----------|
| **MCQ Single** | 1-2 | Low | Factual knowledge, understanding |
| **MCQ Multi** | 2-4 | Medium | Multiple concepts, deeper understanding |
| **Fill in Blank** | 1-3 | Low | Term recall, application |
| **Open Ended** | 4-6 | High | Deep analysis, synthesis |

---

## Database Schema

### Questions Table
```sql
ALTER TABLE questions
ADD COLUMN question_format question_format DEFAULT 'mcq',
ADD COLUMN format_metadata JSONB DEFAULT '{}'::jsonb;

-- Enum type
CREATE TYPE question_format AS ENUM (
  'mcq_single', 'mcq_multi', 'open_ended',
  'fill_blank'
);
```

### User Progress - Format Tracking
```sql
-- Stored in user_progress.rl_metadata
{
  "format_performance": {
    "1": {  // Bloom level
      "mcq": {
        "attempts": 10,
        "correct": 8,
        "avg_confidence": 0.75
      },
      "fill_blank": {
        "attempts": 5,
        "correct": 4,
        "avg_confidence": 0.80
      }
    },
    "2": { /* ... */ }
  },
  "format_preferences": {
    "most_effective": ["mcq_single", "fill_blank"],
    "least_effective": ["open_ended"],
    "confidence_by_format": {
      "mcq_single": 0.75,
      "fill_blank": 0.60
    }
  }
}
```

---

## How It Works

### 1. Initial Phase (Cold Start)
- **Strategy:** Uniform random sampling
- **Goal:** Gather data on all formats
- **Duration:** First 10-20 questions per Bloom level
- User sees variety of formats to establish baseline

### 2. Exploration Phase
- **Strategy:** Epsilon-greedy (ε = 0.3)
- **Goal:** Find optimal formats while exploiting known good ones
- **Metrics Tracked:**
  - Accuracy by format
  - Confidence calibration by format
  - Time taken by format
  - Subjective difficulty by format

### 3. Optimization Phase
- **Strategy:** Exploit best formats (ε = 0.1)
- **Goal:** Maximize learning efficiency
- **Adaptation:** Continuously update format preferences

### 4. Format Selection Algorithm

```python
def select_question_format(user_id, bloom_level, rl_phase):
    # Get format performance for this Bloom level
    performance = get_format_performance(user_id, bloom_level)

    if rl_phase == 'cold_start':
        # Uniform random
        return random.choice(get_formats_for_bloom(bloom_level))

    elif rl_phase == 'exploration':
        # Epsilon-greedy with ε=0.3
        if random() < 0.3:
            return random.choice(get_formats_for_bloom(bloom_level))
        else:
            return get_best_format(performance)

    else:  # optimization, stabilization, etc.
        # Exploit best format with occasional exploration
        if random() < 0.1:
            return random.choice(get_formats_for_bloom(bloom_level))
        else:
            return get_best_format(performance)
```

---

## Effectiveness Score Calculation

```typescript
function calculateFormatEffectiveness(
  attempts: number,
  correct: number,
  avgConfidence: number
): number {
  if (attempts === 0) return 0

  const accuracy = correct / attempts

  // Weighted combination: 70% accuracy, 30% confidence
  return (accuracy * 0.7) + (avgConfidence * 0.3)
}
```

**Rationale:**
- **Accuracy (70%)** is the primary signal - did they get it right?
- **Confidence (30%)** indicates comfort level and cognitive load

---

## Usage Examples

### Admin: Generate Question with Format
```typescript
import { getRecommendedFormats } from '@/lib/utils/question-format'

const bloomLevel = 3
const formats = getRecommendedFormats(bloomLevel)
// Returns: [fill_blank, mcq_multi, ...]

// Generate question
await generateQuestion({
  topic: 'SQL Injection',
  bloom_level: 3,
  question_format: 'mcq_multi'
})
```

### UI: Display Format Badge
```typescript
import { QuestionFormatBadge } from '@/components/QuestionFormatBadge'

<QuestionFormatBadge
  format="mcq_single"
  showIcon={true}
  showDescription={true}
/>
// Shows: ◻ MCQ - Single Select - "Multiple choice with one correct answer"
```

### Query: Get Best Format for User
```sql
-- Get best format for user at Bloom level 3
SELECT
  format_key,
  (value->>'attempts')::INTEGER as attempts,
  (value->>'correct')::INTEGER as correct,
  (value->>'avg_confidence')::DECIMAL as avg_confidence,
  calculate_format_effectiveness(
    (value->>'attempts')::INTEGER,
    (value->>'correct')::INTEGER,
    (value->>'avg_confidence')::DECIMAL
  ) as effectiveness_score
FROM user_progress,
     jsonb_each(rl_metadata->'format_performance'->'3') as formats(format_key, value)
WHERE user_id = 'abc-123'
  AND subject_id = 'cybersecurity'
ORDER BY effectiveness_score DESC
LIMIT 1;
```

---

## Personalization Benefits

### 1. Cognitive Load Optimization
- **High performers** on complex formats → More open-ended questions
- **Visual learners** → More matching and fill-in-blank questions
- **Struggling with complexity** → Start with MCQ/true-false, gradually increase to multi-select and matching

### 2. Confidence Building
- Start with formats where user excels
- Gradually introduce challenging formats
- Reduce anxiety and increase engagement

### 3. Skill Gap Identification
```
User performs well on:
  - MCQ (Bloom 1-3): 85% accuracy
  - True/False: 90% accuracy

User struggles with:
  - Code Debug (Bloom 4): 45% accuracy
  - Open Ended (Bloom 5): 50% accuracy

→ System diagnosis: Strong theoretical knowledge, weak application skills
→ Recommendation: Focus on matching → mcq_multi → open_ended progression
```

### 4. Adaptive Difficulty
- Within same Bloom level, formats have different difficulty
- System can tune difficulty without changing cognitive level
- Example: Bloom 3 (Apply)
  - Easy: Fill in blank (70% avg accuracy)
  - Medium: MCQ Multi (60% avg accuracy)
  - Hard: Open ended (45% avg accuracy)

---

## Migration & Initialization

### Step 1: Apply Database Migrations
```bash
# Apply question_format column
psql -h <host> -U postgres -d <database> < supabase/migrations/20250105_add_question_format.sql

# Apply format tracking to rl_metadata
psql -h <host> -U postgres -d <database> < supabase/migrations/20250105_add_format_tracking.sql
```

### Step 2: Initialize Existing Questions
```bash
# Intelligently assign formats to existing questions
node scripts/initialize-question-formats.mjs
```

This script:
- Analyzes question text and options
- Assigns appropriate format based on content
- Initializes format_metadata structure
- Reports format distribution

### Step 3: Initialize User Progress
The script also initializes `format_performance` and `format_preferences` in `user_progress.rl_metadata` for all existing users.

---

## Future Enhancements

### Phase 1 (Current)
- ✅ Format tracking in database
- ✅ Format-aware question generation
- ✅ Basic format selection (random/epsilon-greedy)

### Phase 2 (Q2 2025)
- [ ] Multi-armed bandit for format selection
- [ ] UCB (Upper Confidence Bound) exploration strategy
- [ ] Format difficulty estimation based on population data

### Phase 3 (Q3 2025)
- [ ] Deep RL for joint format + topic selection
- [ ] Transfer learning across similar formats
- [ ] Format sequencing (pedagogical progression)

### Phase 4 (Q4 2025)
- [ ] Collaborative filtering for format recommendations
- [ ] A/B testing of format selection strategies
- [ ] Personalized format difficulty curves

---

## Key Metrics to Monitor

### Per-Format Metrics
- **Accuracy:** % correct by format
- **Confidence Calibration:** How well confidence matches performance
- **Time on Task:** Median time per format
- **Drop-off Rate:** % users who quit after seeing format

### Population Metrics
- **Format Popularity:** Which formats are most/least used
- **Format Effectiveness:** Average effectiveness score across users
- **Bloom × Format Heatmap:** Success rates for all combinations

### RL Performance Metrics
- **Convergence Speed:** How quickly system finds optimal format
- **Regret:** Difference between optimal and actual format choices
- **Exploration Efficiency:** Quality of early exploration data

---

## Related Documentation

- **`docs/RL_PHASE_TRACKING.md`** - RL phase system overview
- **`lib/utils/question-format.ts`** - Format utilities and constants
- **`components/QuestionFormatBadge.tsx`** - UI components
- **`CLAUDE.md`** - Development guidelines

---

## Questions & Support

For questions about format personalization:
1. Check this documentation first
2. Review code in `lib/utils/question-format.ts`
3. Examine migration files in `supabase/migrations/`
4. Consult `CLAUDE.md` for general patterns

---

**Last Updated:** 2025-01-05
**Authors:** Axium Development Team
**Version:** 1.0
