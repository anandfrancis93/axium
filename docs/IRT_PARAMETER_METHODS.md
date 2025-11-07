# IRT Parameter Estimation Methods

## Overview

This document explains the three methods Axium uses to estimate IRT parameters (a, b, c) for questions, and when to use each method.

---

## The Three Methods

### Method 1: Default Parameters (Bloom-Based) ⭐ **USE THIS NOW**

**When to use:**
- ✅ New questions with < 30 responses
- ✅ Questions answered by < 10 unique users
- ✅ Initial deployment (your current situation)

**How it works:**

Each Bloom level has pre-defined IRT parameters based on cognitive complexity:

| Bloom Level | Difficulty (b) | Discrimination (a) | Guessing (c) | Rationale |
|-------------|----------------|-------------------|--------------|-----------|
| 1 - Remember | -1.5 | 1.0 | 0.20 | Easy recall, moderate discrimination |
| 2 - Understand | -0.8 | 1.2 | 0.20 | Slightly harder, better discrimination |
| 3 - Apply | 0.0 | 1.5 | 0.20 | Medium difficulty, good discrimination |
| 4 - Analyze | 0.8 | 1.8 | 0.20 | Hard, very good discrimination |
| 5 - Evaluate | 1.2 | 2.0 | 0.20 | Harder, excellent discrimination |
| 6 - Create | 1.8 | 2.2 | 0.20 | Hardest, best discrimination |

**Additional adjustments by question type:**

```typescript
True/False:        c = 0.50  (50% chance of guessing)
MCQ 4-option:      c = 0.25  (25% chance)
MCQ 5-option:      c = 0.20  (20% chance, default)
MCQ Multi-select:  c = 0.15  (harder to guess all correct)
Code questions:    c = 0.05  (very low guessing)
Open-ended:        c = 0.01  (essentially no guessing)
```

**Implementation:**

```typescript
import { getQuestionIRTParameters } from '@/lib/irt/default-parameters'

// For a Bloom Level 3 MCQ question
const params = getQuestionIRTParameters(3, 'mcq_single')
// Returns: { a: 1.5, b: 0.0, c: 0.25 }

// For a Bloom Level 5 code question
const params2 = getQuestionIRTParameters(5, 'code_debug')
// Returns: { a: 2.0, b: 1.2, c: 0.05 }
```

**Pros:**
- ✅ Works immediately with zero data
- ✅ Based on educational theory (Bloom's Taxonomy)
- ✅ Reasonable starting point

**Cons:**
- ❌ Not personalized to your specific questions
- ❌ May over/underestimate difficulty for unusual questions

---

### Method 2: Simple Empirical Calibration ⭐ **USE AFTER 30+ RESPONSES**

**When to use:**
- ✅ Questions with 30-100 responses
- ✅ At least 10 unique users
- ✅ Moderate sample size

**How it works:**

Uses classical test theory formulas to estimate parameters from response data:

#### 1. **Difficulty (b)** - Normal Ogive Approximation

```
p = proportion correct = (correct responses) / (total responses)

b = -1.7 × ln(p / (1-p))
```

**Example:**
- If 60% of users answered correctly (p = 0.60):
- b = -1.7 × ln(0.60 / 0.40) = -1.7 × ln(1.5) ≈ -0.69
- **Interpretation**: Slightly easier than average (negative b)

- If 30% answered correctly (p = 0.30):
- b = -1.7 × ln(0.30 / 0.70) = -1.7 × ln(0.429) ≈ +1.43
- **Interpretation**: Hard question (positive b)

#### 2. **Discrimination (a)** - Variance Method

```
variance = p × (1-p)

a = 0.5 + (variance / 0.25) × 2.0
```

**Example:**
- If p = 0.50 (50% correct):
- variance = 0.50 × 0.50 = 0.25 (maximum variance)
- a = 0.5 + (0.25 / 0.25) × 2.0 = 2.5 (excellent discrimination)

- If p = 0.90 (90% correct):
- variance = 0.90 × 0.10 = 0.09 (low variance)
- a = 0.5 + (0.09 / 0.25) × 2.0 = 1.22 (moderate discrimination)

**Why variance matters**: Questions answered correctly by ~50% of users discriminate best between high/low ability learners.

#### 3. **Guessing (c)** - Lower Asymptote

```
c = min(p_value, 0.25)
```

Cap at 0.25 for typical MCQs (25% random guess rate).

**Implementation:**

```typescript
import { calibrateQuestionSimple } from '@/lib/irt/calibration'

const responses = [
  { user_id: 'user1', is_correct: true },
  { user_id: 'user2', is_correct: false },
  // ... 30+ responses from 10+ users
]

const result = calibrateQuestionSimple(responses, bloomLevel)
// Returns:
// {
//   a: 1.8,
//   b: 0.45,
//   c: 0.20,
//   sample_size: 35,
//   unique_users: 12,
//   p_value: 0.57,
//   calibration_method: 'empirical'
// }
```

**Pros:**
- ✅ Personalized to your actual question difficulty
- ✅ Fast computation
- ✅ Good enough for most applications

**Cons:**
- ❌ Less accurate than MML
- ❌ Doesn't account for user ability variation
- ❌ Needs moderate sample size

---

### Method 3: Marginal Maximum Likelihood (MML) ⭐ **GOLD STANDARD (NOT YET IMPLEMENTED)**

**When to use:**
- ✅ Questions with 100+ responses
- ✅ At least 30 unique users
- ✅ When accuracy is critical
- ✅ Research or high-stakes assessments

**How it works:**

MML simultaneously estimates:
1. Item parameters (a, b, c) for all questions
2. User ability distribution (θ) across the population

Uses an **Expectation-Maximization (E-M) algorithm**:

#### E-Step (Expectation)
Estimate user abilities given current item parameters:

```
P(θ | responses) ∝ P(responses | θ) × P(θ)
```

#### M-Step (Maximization)
Update item parameters to maximize likelihood:

```
max Σ log P(responses | a, b, c, θ)
```

Iterate until convergence (typically 50-100 cycles).

**Why MML is better:**
- Accounts for varying user abilities
- Produces standard errors for parameters
- Better handles extreme responses (0% or 100% correct)
- Statistically optimal estimates

**Implementation:** (Placeholder, requires numerical optimization library)

```typescript
import { calibrateQuestionMML } from '@/lib/irt/calibration'

// NOT YET IMPLEMENTED - Coming in Phase 3
const result = calibrateQuestionMML(responses)
```

**Pros:**
- ✅ Most accurate parameter estimates
- ✅ Gold standard in psychometrics
- ✅ Handles complex response patterns

**Cons:**
- ❌ Computationally expensive
- ❌ Requires large sample size (100+)
- ❌ Complex to implement
- ❌ Overkill for small-scale applications

---

## Hybrid Strategy (Recommended)

Use a **tiered approach** based on available data:

```
┌─────────────────────────────────────────────────────────────┐
│ Question has < 30 responses?                                │
│   → Use Method 1: Default Parameters (Bloom-based)          │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ Question has 30-100 responses from 10+ users?               │
│   → Use Method 2: Simple Empirical Calibration              │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ Question has 100+ responses from 30+ users?                 │
│   → Use Method 3: MML Calibration (when implemented)        │
└─────────────────────────────────────────────────────────────┘
```

### Implementation Example

```typescript
async function getQuestionIRTParams(questionId: string): Promise<IRTParameters> {
  // Check if empirically calibrated
  const { data: calibrated } = await supabase
    .from('question_irt_calibration')
    .select('*')
    .eq('question_id', questionId)
    .single()

  if (calibrated && calibrated.sample_size >= 30) {
    // Use empirical calibration
    return {
      a: calibrated.discrimination_a,
      b: calibrated.difficulty_b,
      c: calibrated.guessing_c
    }
  }

  // Fall back to default parameters
  const { data: question } = await supabase
    .from('questions')
    .select('bloom_level, question_type')
    .eq('id', questionId)
    .single()

  return getQuestionIRTParameters(question.bloom_level, question.question_type)
}
```

---

## Calibration Schedule

### Initial Launch
- All questions use **Method 1** (default parameters)
- System works immediately with zero data

### Weekly Calibration Job
- Run every Sunday at 2 AM
- Identify questions with 30+ responses
- Calibrate using **Method 2** (simple empirical)
- Update `question_irt_calibration` table

### Future: Advanced Calibration
- When dataset grows (1000+ responses)
- Implement **Method 3** (MML)
- Run monthly for high-stakes questions

---

## Data Requirements Summary

| Method | Min Responses | Min Users | Accuracy | Computation | Use Case |
|--------|--------------|-----------|----------|-------------|----------|
| **Default** | 0 | 0 | ⭐⭐⭐ Good | Instant | New questions |
| **Simple Empirical** | 30 | 10 | ⭐⭐⭐⭐ Better | Fast | Most questions |
| **MML** | 100 | 30 | ⭐⭐⭐⭐⭐ Best | Slow | High-stakes |

---

## Validation

### How to check if parameters are reasonable:

1. **Difficulty (b)**:
   - Should range from -3 to +3
   - Most questions: -1.5 to +1.5
   - If outside this range, question may be too easy/hard

2. **Discrimination (a)**:
   - Should be positive (0.5 to 2.5)
   - If < 0.5: Question doesn't discriminate well (maybe poorly worded?)
   - If > 2.5: Question may be too sensitive (check for flaws)

3. **Guessing (c)**:
   - MCQs: 0.15 to 0.25
   - True/False: ~0.50
   - Code/Open: < 0.10
   - If too high: Question may be ambiguous

### Red Flags

⚠️ **Warning signs of bad parameters:**

```typescript
// BAD EXAMPLE 1: Too easy with low discrimination
{ a: 0.6, b: -2.8, c: 0.20 }
// → Everyone gets it right, doesn't test ability

// BAD EXAMPLE 2: Too hard with high guessing
{ a: 1.5, b: 2.5, c: 0.40 }
// → Nobody knows answer, high guessing rate

// BAD EXAMPLE 3: Negative discrimination
{ a: -0.5, b: 0.0, c: 0.20 }
// → Higher ability users get it WRONG more often (broken question!)

// GOOD EXAMPLE
{ a: 1.8, b: 0.5, c: 0.20 }
// → Moderate difficulty, good discrimination, normal guessing
```

---

## Current Status (Your System)

Based on analysis:

```
Total Responses: 10
Unique Questions: 10
Unique Users: 1
```

**Recommendation:** Use **Method 1 (Default Parameters)** for all questions.

As you answer more questions and more users join, the system will automatically upgrade to Method 2 for well-sampled questions.

---

## Next Steps

1. ✅ Implement Method 1 (Default Parameters) - **DONE**
2. ✅ Implement Method 2 (Simple Empirical) - **DONE**
3. ⏭️ Add database schema for calibration
4. ⏭️ Create calibration cron job
5. ⏭️ Build admin dashboard to view calibration status
6. 🔮 Future: Implement Method 3 (MML)

---

**Last Updated**: November 2025
