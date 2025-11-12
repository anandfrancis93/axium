# Reward System Documentation

## Overview

Axium uses a multi-component reward function to optimize learning through Reinforcement Learning. The system balances six key dimensions to guide students toward effective learning strategies, plus an intermediate **Quality Score** calculation that determines learning gain.

**Total Reward Range:** -21 to +35 points

The reward system evaluates both **what** the student learned (correctness, mastery gain) and **how** they learned it (confidence calibration, retrieval method, spacing, response time).

### The 7 Components

**6 Visible Reward Components:**
1. Learning Gain (-10 to +10) - Improvement in mastery
2. Calibration (-3 to +3) - Accuracy of self-assessment
3. Spacing (0 to +5) - Retention over time
4. Recognition (-4 to +3) - Retrieval method strength
5. Response Time (-3 to +5) - Retrieval fluency
6. Streak (0 to +5) - Consecutive correct answers

**1 Intermediate Calculation:**
7. Quality Score (-3.5 to +3) - Determines learning gain magnitude

---

## Confidence Levels

**Purpose:** Track student self-assessment accuracy before answering

| Level | Value | Description | When Used |
|-------|-------|-------------|-----------|
| **Low** | 2 | Student unsure, guessing or uncertain | Before answering when not confident |
| **Medium** | 3 | Student somewhat confident, thinks they know | Before answering with moderate certainty |
| **High** | 4 | Student very confident, sure of answer | Before answering with high certainty |

**Important Notes:**
- Confidence is collected **before** the student answers
- Maps to API values: `{ low: 2, medium: 3, high: 4 }`
- Used in calibration reward to encourage accurate self-assessment
- Scale runs from 2-4 (not 1-5)

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

**Code Reference:** `lib/rl/rewards.ts:107-143`

---

## Quality Score (Intermediate Calculation)

**Range:** -3.5 to +3

**Purpose:** Measures the quality of learning by combining calibration and recognition

**Formula:**
```
Quality Score = (Calibration Reward + Recognition Reward) / 2
```

**How It Works:**

Quality Score is not shown directly to users, but is used internally to calculate the **Learning Gain** reward component. It represents how well the student learned based on:

1. **Calibration** - How accurately they assessed their own knowledge
2. **Recognition** - How strong their retrieval method was

### Quality Score → Learning Gain

```
Learning Gain = Quality Score × Bloom Multiplier
```

**Bloom Level Multipliers:**

| Bloom Level | Multiplier | Rationale |
|-------------|-----------|-----------|
| 1-3 (Remember, Understand, Apply) | 10× | Lower levels require ~5 perfect answers for 80% mastery |
| 4-6 (Analyze, Evaluate, Create) | 9× | Higher levels require ~3 perfect answers for 80% mastery |

### Examples

**Example 1: Perfect Answer**
- Calibration: +3 (High confidence + Correct)
- Recognition: +3 (Memory retrieval)
- **Quality Score:** (3 + 3) / 2 = **+3**
- **Learning Gain (Bloom L1):** 3 × 10 = **+30 mastery points**
- **Learning Gain (Bloom L4):** 3 × 9 = **+27 mastery points**

**Example 2: Overconfident Mistake**
- Calibration: -3 (High confidence + Incorrect)
- Recognition: -4 (False memory)
- **Quality Score:** (-3 + -4) / 2 = **-3.5**
- **Learning Gain (Bloom L1):** -3.5 × 10 = **-35 mastery points**
- **Learning Gain (Bloom L4):** -3.5 × 9 = **-31.5 mastery points**

**Example 3: Honest Uncertainty**
- Calibration: -1 (Low confidence + Incorrect)
- Recognition: -1 (Random guess, honest)
- **Quality Score:** (-1 + -1) / 2 = **-1**
- **Learning Gain (Bloom L1):** -1 × 10 = **-10 mastery points**
- **Learning Gain (Bloom L4):** -1 × 9 = **-9 mastery points**

**Example 4: Underconfident Success**
- Calibration: +1 (Low confidence + Correct)
- Recognition: +1 (Educated guess)
- **Quality Score:** (1 + 1) / 2 = **+1**
- **Learning Gain (Bloom L1):** 1 × 10 = **+10 mastery points**
- **Learning Gain (Bloom L4):** 1 × 9 = **+9 mastery points**

**Code Reference:** `lib/rl/mastery.ts:25-42`

---

## Reward Components

### 1. Learning Gain Reward

**Range:** -10 to +10

**Purpose:** Rewards improvement in mastery

| Learning Gain | Reward |
|---------------|--------|
| +100 (max improvement) | +10 |
| +50 | +5 |
| 0 (no change) | 0 |
| -50 | -5 |
| -100 (max decline) | -10 |

**Formula:** `reward = learningGain / 10`

**Code Reference:** `lib/rl/rewards.ts:32-35`

---

### 2. Calibration Reward

**Range:** -3 to +3

**Purpose:** Rewards accurate self-assessment (confidence calibration)

#### Correct Answers

| Confidence | Calibration | Reward |
|------------|-------------|--------|
| High (4) | Perfect - knew it and got it right | +3 |
| Medium (3) | Good - somewhat sure and correct | +2 |
| Low (2) | Underconfident - unsure but correct | +1 |

#### Incorrect Answers

| Confidence | Calibration | Penalty |
|------------|-------------|---------|
| High (4) | Severe overconfidence - sure but wrong | -3 |
| Medium (3) | Moderate overconfidence - somewhat sure but wrong | -2 |
| Low (2) | Good uncertainty - unsure and wrong | -1 |

**Code Reference:** `lib/rl/rewards.ts:46-68`

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

### 4. Recognition Reward

**Range:** -4 to +3

**Purpose:** Rewards stronger retrieval methods

See [Recognition Methods](#recognition-methods) table above for detailed breakdown.

**Code Reference:** `lib/rl/rewards.ts:107-143`

---

### 5. Response Time Reward

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

### 6. Streak Reward

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
Total Reward = Learning Gain + Calibration + Spacing + Recognition + Response Time + Streak
```

**Range:** Approximately -21 to +35

**Component Weights:**

| Component | Range | Weight in Total |
|-----------|-------|-----------------|
| Learning Gain | -10 to +10 | Highest impact |
| Response Time | -3 to +5 | Moderate-high impact |
| Spacing | 0 to +5 | Moderate impact |
| Streak | 0 to +5 | Moderate impact |
| Calibration | -3 to +3 | Lower impact |
| Recognition | -4 to +3 | Lower impact |

**Code Reference:** `lib/rl/rewards.ts:347-348`

---

## Key Differences: Confidence vs. Recognition vs. Quality Score

| Aspect | Confidence | Recognition | Quality Score |
|--------|-----------|-------------|---------------|
| **When Calculated** | Before answering | After answering | After answering (intermediate) |
| **What It Measures** | Self-assessment accuracy | Retrieval strength | Overall learning quality |
| **Purpose** | Encourage metacognition | Measure memory quality | Calculate mastery gain |
| **Values** | Low (2), Medium (3), High (4) | Memory, Recognition, Educated Guess, Random | Average of calibration + recognition |
| **Related Reward** | Calibration Reward | Recognition Reward | Learning Gain Reward |
| **Range** | -3 to +3 | -4 to +3 | -3.5 to +3 |
| **Visible to User** | Yes (input field) | Yes (input field) | No (internal calculation) |
| **Used In** | Reward breakdown, calibration reward | Reward breakdown, recognition reward | Mastery score updates |

---

## Example Scenarios

### Scenario 1: Perfect Learning
- **Correct answer:** Yes
- **Confidence:** High (4) → Calibration: +3
- **Recognition:** Memory → Recognition: +3
- **Quality Score:** (3 + 3) / 2 = +3
- **Days since last practice:** 8 → Spacing: +5
- **Thinking time:** 3s (Bloom L1, very fast) → Response Time: +5
- **Streak:** 6 in a row → Streak: +3
- **Learning gain:** Quality Score (3) × Bloom Multiplier (10) = +30 mastery points → Learning Gain: +3 (normalized for reward)

**Total Reward:** +22 (highly rewarded!)

---

### Scenario 2: Overconfident Mistake
- **Correct answer:** No
- **Confidence:** High (4) → Calibration: -3 (overconfident)
- **Recognition:** Memory → Recognition: -4 (false memory)
- **Quality Score:** (-3 + -4) / 2 = -3.5
- **Days since last practice:** N/A → Spacing: 0
- **Thinking time:** 2s (too fast, careless) → Response Time: -3
- **Streak:** Reset to 0 → Streak: 0
- **Learning gain:** Quality Score (-3.5) × Bloom Multiplier (10) = -35 mastery points → Learning Gain: -3.5 (normalized for reward)

**Total Reward:** -10 (strongly discouraged)

---

### Scenario 3: Honest Uncertainty
- **Correct answer:** No
- **Confidence:** Low (2) → Calibration: -1 (good uncertainty)
- **Recognition:** Random → Recognition: -1 (honest about not knowing)
- **Quality Score:** (-1 + -1) / 2 = -1
- **Days since last practice:** N/A → Spacing: 0
- **Thinking time:** 25s (took time to think) → Response Time: 0
- **Streak:** Reset to 0 → Streak: 0
- **Learning gain:** Quality Score (-1) × Bloom Multiplier (10) = -10 mastery points → Learning Gain: -1 (normalized for reward)

**Total Reward:** -2 (minimal penalty for honest attempt)

---

### Scenario 4: Underconfident Success
- **Correct answer:** Yes
- **Confidence:** Low (2) → Calibration: +1 (underconfident)
- **Recognition:** Educated Guess → Recognition: +1
- **Quality Score:** (1 + 1) / 2 = +1
- **Days since last practice:** 4 → Spacing: +3
- **Thinking time:** 18s (Bloom L2, good pace) → Response Time: +3
- **Streak:** 3 in a row → Streak: +2
- **Learning gain:** Quality Score (1) × Bloom Multiplier (10) = +10 mastery points → Learning Gain: +1 (normalized for reward)

**Total Reward:** +11 (rewarded despite low confidence)

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
  confidence INTEGER NOT NULL CHECK (confidence IN (2, 3, 4)),
  recognition_method recognition_method,  -- ENUM
  response_time_seconds INTEGER,

  -- Reward components (stored for analysis)
  reward_total DECIMAL(10, 2),
  reward_components JSONB,  -- Stores breakdown

  -- Learning metrics
  learning_gain DECIMAL(10, 2),
  current_mastery DECIMAL(10, 2),

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
    confidence: 'low' | 'medium' | 'high',  // Maps to 2/3/4
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
    "learningGain": 2.5,
    "calibration": 3,
    "spacing": 5,
    "recognition": 3,
    "responseTime": 5,
    "streak": 3,
    "total": 21.5
  },
  "masteryUpdate": {
    "previous": 65.5,
    "current": 68.0,
    "change": 2.5
  }
}
```

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
