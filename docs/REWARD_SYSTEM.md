# Reward System Documentation

## Overview

Axium uses a multi-component reward function to optimize learning through Reinforcement Learning. The system balances five key dimensions to guide students toward effective learning strategies.

**Total Reward Range:** -11 to +25 points

The reward system evaluates **how** students learn by measuring metacognition (confidence calibration), retrieval strength (recognition method), retention (spacing), speed (response time), and consistency (streaks).

### The 5 Reward Components

1. **Calibration** (-3 to +3) - Accuracy of self-assessment
2. **Recognition** (-4 to +3) - Retrieval method strength
3. **Spacing** (0 to +5) - Retention over time
4. **Response Time** (-3 to +5) - Retrieval fluency
5. **Streak** (0 to +5) - Consecutive correct answers

**Note on Mastery:** Mastery is calculated separately as simple accuracy per dimension: (high-confidence correct / high-confidence total) × 100%. The reward system focuses on learning quality, not mastery updates.

---

## Confidence Levels

**Purpose:** Track student self-assessment accuracy before answering

| Level | Value | Description | When Used |
|-------|-------|-------------|-----------|
| **Low** | 1 | Student unsure, guessing or uncertain | Before answering when not confident |
| **Medium** | 2 | Student somewhat confident, thinks they know | Before answering with moderate certainty |
| **High** | 3 | Student very confident, sure of answer | Before answering with high certainty |

**Important Notes:**
- Confidence is collected **before** the student answers
- Maps to API values: `{ low: 1, medium: 2, high: 3 }`
- Used in calibration reward to encourage accurate self-assessment
- Scale runs from 1-3 (simplified scale)

**Code Reference:** `app/api/rl/submit-response/route.ts:91-95`

---

## Recognition Methods

**Purpose:** Track how students retrieved the answer (memory strength indicator)

| Method | Value | Description | Correct Reward | Incorrect Penalty |
|--------|-------|-------------|----------------|-------------------|
| **Memory** | memory | Knew answer from memory (strongest retrieval) | +3 | -4 |
| **Recognition** | recognition | Recognized correct answer among options | +2 | -3 |
| **Educated Guess** | educated_guess | Narrowed down options, made informed guess | +1 | -2 |
| **Random Guess** | random | Complete guess, no idea | 0 | -1 |

**Important Notes:**
- Recognition method is collected **after** the student answers
- Reflects retrieval strength (memory > recognition > educated guess > random)
- Different from confidence (self-assessment vs. retrieval method)
- Used in recognition reward component

### Recognition Reward Breakdown

**All possible combinations and their rewards:**

| Answer Correctness | Recognition Method | Points | Interpretation |
|-------------------|-------------------|--------|----------------|
| ✅ **Correct** | Memory | **+3** | Best - Knew from memory, strong retrieval |
| ✅ **Correct** | Recognition | **+2** | Good - Recognized correct answer |
| ✅ **Correct** | Educated Guess | **+1** | Fair - Narrowed down and guessed correctly |
| ✅ **Correct** | Random | **0** | Lucky - No credit for random guess |
| ❌ **Incorrect** | Memory | **-4** | Worst - False memory (thought they knew but wrong) |
| ❌ **Incorrect** | Recognition | **-3** | Bad - Misrecognized (thought they recognized but wrong) |
| ❌ **Incorrect** | Educated Guess | **-2** | Poor - Educated guess was wrong |
| ❌ **Incorrect** | Random | **-1** | Expected - Honest about not knowing |

**Key Insights:**
- **Correct answers:** Rewarded based on retrieval strength (memory best, random no credit)
- **Incorrect answers:** Penalized based on overconfidence (false memory worst, honest random least penalty)
- **Honesty pays:** Random guess when incorrect = minimal penalty (-1)
- **False confidence hurts:** Memory when incorrect = maximum penalty (-4)

**Code Reference:** `lib/rl/rewards.ts:107-143`

---

## Reward Components

### 1. Calibration Reward

**Range:** -3 to +3

**Purpose:** Rewards accurate self-assessment (confidence calibration)

#### Correct Answers

| Confidence | Calibration | Reward |
|------------|-------------|--------|
| High (3) | Perfect - knew it and got it right | +3 |
| Medium (2) | Good - somewhat sure and correct | +2 |
| Low (1) | Underconfident - unsure but correct | +1 |

#### Incorrect Answers

| Confidence | Calibration | Penalty |
|------------|-------------|---------|
| High (3) | Severe overconfidence - sure but wrong | -3 |
| Medium (2) | Moderate overconfidence - somewhat sure but wrong | -2 |
| Low (1) | Good uncertainty - unsure and wrong | -1 |

**Code Reference:** `lib/rl/rewards.ts:46-68`

---

### 2. Recognition Reward

**Range:** -4 to +3

**Purpose:** Rewards stronger retrieval methods

See [Recognition Methods](#recognition-methods) section above for detailed breakdown of all combinations.

**Code Reference:** `lib/rl/rewards.ts:107-143`

---

### 3. Spacing Reward

**Range:** 0 to +5

**Purpose:** Rewards retention over time (spaced repetition benefits)

| Days Since Last Practice | Correct Answer Reward | Incorrect Answer |
|-------------------------|---------------------|------------------|
| 7+ days | +5 (excellent long-term retention) | 0 |
| 3-6 days | +3 (good retention) | 0 |
| 1-2 days | +1 (some spacing) | 0 |
| Same day | 0 (no spacing benefit) | 0 |

**Important Notes:**
- Only correct answers receive spacing rewards
- Encourages distributed practice over cramming
- Based on scientifically proven spacing effect

**Code Reference:** `lib/rl/rewards.ts:79-96`

---

### 4. Response Time Reward

**Range:** -3 to +5

**Purpose:** Rewards retrieval fluency (thinking speed, not reading speed)

#### Methodology

The system **separates reading time from thinking time** to fairly evaluate cognitive processing:

1. **Estimate Reading Time:** Based on 220 WPM (words per minute) for technical content
2. **Calculate Thinking Time:** `thinkingTime = max(0, responseTime - readingTime)`
3. **Evaluate Against Thresholds:** Adjusted by Bloom level and question format

#### Thinking Time Thresholds by Bloom Level

| Bloom Level | Fluent | Good | Slow |
|-------------|--------|------|------|
| 1 - Remember | 5s | 15s | 30s |
| 2 - Understand | 5s | 15s | 30s |
| 3 - Apply | 10s | 20s | 40s |
| 4 - Analyze | 15s | 30s | 60s |
| 5 - Evaluate | 20s | 45s | 90s |
| 6 - Create | 20s | 45s | 90s |

#### Question Format Modifiers

| Format | Modifier | Reasoning |
|--------|----------|-----------|
| True/False | 0.8× | Simpler decision (2 options) |
| MCQ Single | 1.0× | Baseline (4 options, one correct) |
| Fill in Blank | 1.2× | Need to recall exact term |
| MCQ Multi | 1.5× | Evaluate multiple correct answers |
| Matching | 1.7× | Multiple pairings to consider |
| Open Ended | 2.5× | Formulate and type explanation |

#### Rewards

**Correct Answers:**

| Thinking Time | Reward | Interpretation |
|---------------|--------|----------------|
| < Fluent threshold | +5 | Automatic retrieval (fluent mastery) |
| < Good threshold | +3 | Thoughtful retrieval (solid knowledge) |
| < Slow threshold | +1 | Slow retrieval (struggling but got it) |
| ≥ Slow threshold | -1 | Too slow (very uncertain or overthinking) |

**Incorrect Answers:**

| Thinking Time | Penalty | Interpretation |
|---------------|---------|----------------|
| < 0.75 × Fluent threshold | -3 | Careless/impulsive (rushed and wrong) |
| ≥ 0.75 × Fluent threshold | 0 | Expected (took time but still wrong) |

**Code Reference:** `lib/rl/rewards.ts:224-295`

---

### 5. Streak Reward

**Range:** 0 to +5

**Purpose:** Rewards consecutive correct answers for the same topic

| Streak Length | Reward | Interpretation |
|---------------|--------|----------------|
| 10+ in a row | +5 | Outstanding streak! |
| 5-9 in a row | +3 | Excellent streak |
| 3-4 in a row | +2 | Good streak |
| 2 in a row | +1 | Building momentum |
| 1 (or just broke) | 0 | No bonus yet |

**Important Notes:**
- Only rewards correct answers
- Streak resets to 0 on incorrect answer
- Counts across all Bloom levels for the same topic

**Code Reference:** `lib/rl/rewards.ts:161-183`

---

## Total Reward Calculation

**Formula:**
```
Total Reward = Calibration + Recognition + Spacing + Response Time + Streak
```

**Range:** -11 to +25

**Component Impact:**

| Component | Range | Impact Level |
|-----------|-------|--------------|
| Response Time | -3 to +5 | Highest (8 point range) |
| Recognition | -4 to +3 | High (7 point range) |
| Calibration | -3 to +3 | Moderate (6 point range) |
| Spacing | 0 to +5 | Moderate (5 point range) |
| Streak | 0 to +5 | Moderate (5 point range) |

**Note:** Mastery is calculated separately based on accuracy per dimension, not from reward components.

**Code Reference:** `lib/rl/rewards.ts:347-348`

---

## Key Differences: Confidence vs. Recognition

| Aspect | Confidence | Recognition |
|--------|-----------|-------------|
| **When Collected** | Before answering | After answering |
| **What It Measures** | Self-assessment accuracy | Retrieval strength |
| **Purpose** | Encourage metacognition | Measure memory quality |
| **Values** | Low (1), Medium (2), High (3) | Memory, Recognition, Educated Guess, Random |
| **Related Reward** | Calibration Reward | Recognition Reward |
| **Reward Range** | -3 to +3 | -4 to +3 |
| **Visible to User** | Yes (input field) | Yes (input field) |
| **Impact** | Measures how well you know yourself | Measures how strong your retrieval is |

---

## Example Scenarios

### Scenario 1: Perfect Learning
- **Correct answer:** Yes
- **Confidence:** High (3) → Calibration: +3
- **Recognition:** Memory → Recognition: +3
- **Days since last practice:** 8 → Spacing: +5
- **Thinking time:** 3s (Bloom L1, very fast) → Response Time: +5
- **Streak:** 6 in a row → Streak: +3

**Total Reward:** +19 (highly rewarded!)

---

### Scenario 2: Overconfident Mistake
- **Correct answer:** No
- **Confidence:** High (3) → Calibration: -3 (overconfident)
- **Recognition:** Memory → Recognition: -4 (false memory)
- **Days since last practice:** N/A → Spacing: 0
- **Thinking time:** 2s (too fast, careless) → Response Time: -3
- **Streak:** Reset to 0 → Streak: 0

**Total Reward:** -10 (strongly discouraged)

---

### Scenario 3: Honest Uncertainty
- **Correct answer:** No
- **Confidence:** Low (1) → Calibration: -1 (good uncertainty)
- **Recognition:** Random → Recognition: -1 (honest about not knowing)
- **Days since last practice:** N/A → Spacing: 0
- **Thinking time:** 25s (took time to think) → Response Time: 0
- **Streak:** Reset to 0 → Streak: 0

**Total Reward:** -2 (minimal penalty for honest attempt)

---

### Scenario 4: Underconfident Success
- **Correct answer:** Yes
- **Confidence:** Low (1) → Calibration: +1 (underconfident)
- **Recognition:** Educated Guess → Recognition: +1
- **Days since last practice:** 4 → Spacing: +3
- **Thinking time:** 18s (Bloom L2, good pace) → Response Time: +3
- **Streak:** 3 in a row → Streak: +2

**Total Reward:** +10 (rewarded despite low confidence)

---

## Implementation Notes

### Database Storage

Reward components are stored in `user_responses` table:

```sql
CREATE TABLE user_responses (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  question_id UUID REFERENCES questions(id),
  topic_id UUID REFERENCES topics(id),

  -- User inputs
  is_correct BOOLEAN NOT NULL,
  confidence INTEGER NOT NULL CHECK (confidence IN (1, 2, 3)),
  recognition_method recognition_method,  -- ENUM
  response_time_seconds INTEGER,

  -- Reward components (stored for analysis)
  reward_total DECIMAL(10, 2),
  reward_components JSONB,  -- Stores breakdown

  -- Streak tracking
  topic_streak INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### API Integration

**Submit Response Endpoint:** `POST /api/rl/submit-response`

```typescript
const response = await fetch('/api/rl/submit-response', {
  method: 'POST',
  body: JSON.stringify({
    questionId: string,
    topicId: string,
    bloomLevel: number,
    isCorrect: boolean,
    confidence: 'low' | 'medium' | 'high',  // Maps to 1/2/3
    recognitionMethod: 'memory' | 'recognition' | 'educated_guess' | 'random',
    responseTimeSeconds: number
  })
})
```

**Response includes full reward breakdown:**

```json
{
  "success": true,
  "reward": {
    "calibration": 3,
    "recognition": 3,
    "spacing": 5,
    "responseTime": 5,
    "streak": 3,
    "total": 19
  }
}
```

**Note:** Mastery is calculated separately as accuracy per dimension, not from reward components.

---

## Future Enhancements

### Planned Additions

1. **Difficulty Adjustment Reward** - Bonus for answering harder questions correctly
2. **Bloom Level Progression Reward** - Encourage advancing to higher cognitive levels
3. **Multi-Attempt Penalty Curve** - Diminishing rewards for repeated attempts on same question
4. **Time-of-Day Optimization** - Bonus for studying during scientifically optimal times
5. **Inter-Topic Transfer Reward** - Recognize application of knowledge across topics

### Research Directions

1. **Personalized Reward Weights** - Learn optimal reward weights per student using meta-learning
2. **Curriculum-Aware Rewards** - Adjust rewards based on prerequisite knowledge
3. **Collaborative Learning Rewards** - Bonus for peer explanations and teaching
4. **Long-Term Retention Tracking** - Measure knowledge retention months after learning

---

## References

- **Code Implementation:** `lib/rl/rewards.ts`
- **API Endpoint:** `app/api/rl/submit-response/route.ts`
- **Database Schema:** `supabase/schema.sql`
- **RL Documentation:** `docs/RL_PHASE_TRACKING.md`
- **Question Format Guide:** `docs/QUESTION_FORMAT_PERSONALIZATION.md`

---

**Last Updated:** 2025-11-12
**Version:** 1.0
**Maintainer:** Axium Development Team
