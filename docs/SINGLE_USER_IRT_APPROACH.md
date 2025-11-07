# Single-User IRT Implementation

## Key Insight

**You are the only user**, so traditional IRT calibration (estimating question difficulty from population data) doesn't apply. Instead, we focus on:

1. **Tracking YOUR ability (θ) over time**
2. **Using reasonable default question difficulties** (Bloom-based)
3. **Measuring YOUR performance consistency** (not population variance)
4. **Temporal progression** (how you improve as you study)

---

## Simplified Architecture

### What We Keep:
✅ **Default IRT Parameters** - Bloom-based difficulty estimates
✅ **Theta (θ) Estimation** - Your ability calculated from your responses
✅ **Exam Score Prediction** - θ mapped to 100-900 scale
✅ **Confidence Intervals** - Based on YOUR response consistency
✅ **Temporal Tracking** - θ over time as you study

### What We Skip:
❌ **Empirical Question Calibration** - Can't estimate from population (n=1)
❌ **User Comparison** - No other users to compare against
❌ **Discrimination via Variance** - Requires user diversity

---

## Core Formula (Simplified for Single User)

### 3PL IRT Model (Same as before):
```
P(correct | θ, a, b, c) = c + (1 - c) / (1 + e^(-a(θ - b)))
```

Where:
- **θ (theta)**: YOUR ability (what we estimate)
- **a**: Question discrimination (from Bloom defaults)
- **b**: Question difficulty (from Bloom defaults)
- **c**: Guessing probability (0.20 for MCQ)

### Estimating YOUR Ability (θ):

**Maximum Likelihood Estimation (MLE):**

```typescript
// Find θ that maximizes P(your responses | θ)

function estimateTheta(yourResponses: Response[]): { theta: number, se: number } {
  let theta = 0  // Start at neutral ability

  // Newton-Raphson iteration
  for (let iter = 0; iter < 20; iter++) {
    let firstDerivative = 0
    let secondDerivative = 0

    for (const response of yourResponses) {
      const { a, b, c } = getQuestionParams(response.question_id)
      const prob = calculateIRTProbability(theta, a, b, c)

      // Calculate derivatives (for optimization)
      const derivative1 = calculateFirstDerivative(theta, a, b, c, prob, response.is_correct)
      const derivative2 = calculateSecondDerivative(theta, a, b, c, prob)

      firstDerivative += derivative1
      secondDerivative += derivative2
    }

    // Update theta
    theta = theta - (firstDerivative / secondDerivative)

    // Check convergence
    if (Math.abs(firstDerivative) < 0.001) break
  }

  // Standard error = precision of estimate
  const standardError = 1 / Math.sqrt(-secondDerivative)

  return { theta, se: standardError }
}
```

---

## Confidence Intervals (Single-User Version)

### Standard Error Based on YOUR Consistency:

**Test Information Function:**
```
I(θ) = Σ [a² × (P - c)² × (1 - P)] / [(1 - c)² × P × (1 - P)]
```

Where:
- Higher information = more confident estimate
- Based on how well questions at different difficulties measure YOUR ability

**Standard Error of Measurement:**
```
SEM(θ) = 1 / √I(θ)
```

**95% Confidence Interval:**
```
θ_lower = θ - 1.96 × SEM(θ)
θ_upper = θ + 1.96 × SEM(θ)
```

**Interpretation for single user:**
- **Narrow CI**: You're answering consistently across difficulty levels → confident estimate
- **Wide CI**: Performance varies wildly → need more questions to get stable estimate

---

## Exam Score Prediction (100-900 Scale)

### Mapping θ to CompTIA Scale:

**Assumption:** Passing score (750) corresponds to **θ = 0** (average ability)

```typescript
function thetaToExamScore(theta: number): number {
  const minTheta = -3
  const maxTheta = 3
  const minScore = 100
  const maxScore = 900

  // Linear mapping
  const score = minScore + ((theta - minTheta) / (maxTheta - minTheta)) * (maxScore - minScore)

  return Math.round(score)
}

// Examples:
// θ = -3  → 100 (minimum)
// θ = -1  → 367
// θ =  0  → 500 (average/passing)
// θ = +1  → 633
// θ = +2  → 767 (likely pass)
// θ = +3  → 900 (maximum)
```

**Better mapping (non-linear):** Use percentile-based transformation

```typescript
function thetaToExamScorePercentile(theta: number): number {
  // Convert θ to percentile using normal CDF
  const percentile = normalCDF(theta, 0, 1)

  // Map percentile to exam scale
  // Passing at 750 = ~75th percentile assumption
  const score = 100 + (percentile * 800)

  return Math.round(score)
}
```

---

## Temporal Tracking (Your Learning Journey)

Since you're the only user, **tracking θ over time** is powerful:

### Daily/Weekly θ Estimates:

```typescript
// Calculate θ using only responses up to a given date
function calculateHistoricalTheta(userId: string, upToDate: Date): ThetaEstimate {
  const responses = getResponsesUpTo(userId, upToDate)
  return estimateTheta(responses)
}

// Build timeline
const timeline = []
for (const date of studyDates) {
  const { theta, se } = calculateHistoricalTheta(userId, date)
  timeline.push({
    date,
    theta,
    predictedScore: thetaToExamScore(theta),
    responsesCount: getResponsesUpTo(userId, date).length
  })
}
```

### Visualization:

```
Predicted Exam Score Over Time

900 ┤                                    ╭─
    │                                ╭───╯
800 ┤                            ╭───╯
    │                        ╭───╯          ← Your progress!
750 ┤ - - - - - - - - - ╭───╯- - - - - -  (Passing threshold)
    │                ╭───╯
700 ┤            ╭───╯
    │        ╭───╯
600 ┤    ╭───╯
    │╭───╯
500 ┤╯
    └────────────────────────────────────
     Week1  Week2  Week3  Week4  Week5
```

---

## Pass Probability (Single-User)

**Question:** What's the probability I'll score ≥ 750 on the exam?

```typescript
function calculatePassProbability(theta: number, se: number): number {
  // Convert passing score to theta
  const passingTheta = examScoreToTheta(750)  // ≈ 0

  // Calculate z-score
  const z = (theta - passingTheta) / se

  // Probability you're above passing threshold
  return normalCDF(z, 0, 1)
}

// Examples:
// θ = 0.0, SE = 0.5 → 50% chance (right at threshold, uncertain)
// θ = 1.0, SE = 0.3 → 95% chance (well above, confident)
// θ = -0.5, SE = 0.4 → 11% chance (below, need more study)
```

---

## Implementation Simplifications

### Database Schema (Simplified):

```sql
-- No need for question_irt_calibration table (no multi-user calibration)

-- Just track YOUR ability over time
CREATE TABLE user_ability_estimates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  chapter_id UUID NOT NULL REFERENCES chapters(id),
  theta DECIMAL(5,3) NOT NULL,
  standard_error DECIMAL(5,3) NOT NULL,
  predicted_score INTEGER NOT NULL,  -- 100-900 scale
  confidence_lower INTEGER NOT NULL,  -- 95% CI
  confidence_upper INTEGER NOT NULL,
  responses_count INTEGER NOT NULL,
  estimated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ability_user_chapter_date ON user_ability_estimates(user_id, chapter_id, estimated_at DESC);
```

### Question Parameters (Always Default):

```sql
-- Add to questions table (optional, can compute on-the-fly)
ALTER TABLE questions
ADD COLUMN irt_difficulty DECIMAL(5,3) DEFAULT NULL,
ADD COLUMN irt_discrimination DECIMAL(5,3) DEFAULT NULL,
ADD COLUMN irt_guessing DECIMAL(5,3) DEFAULT 0.20;

-- Populate with Bloom-based defaults
UPDATE questions SET
  irt_difficulty = CASE bloom_level
    WHEN 1 THEN -1.5
    WHEN 2 THEN -0.8
    WHEN 3 THEN 0.0
    WHEN 4 THEN 0.8
    WHEN 5 THEN 1.2
    WHEN 6 THEN 1.8
  END,
  irt_discrimination = CASE bloom_level
    WHEN 1 THEN 1.0
    WHEN 2 THEN 1.2
    WHEN 3 THEN 1.5
    WHEN 4 THEN 1.8
    WHEN 5 THEN 2.0
    WHEN 6 THEN 2.2
  END,
  irt_guessing = 0.20
WHERE irt_difficulty IS NULL;
```

---

## Performance Metrics (Single-User Focus)

### 1. Current Ability Estimate
```
Your Current Ability (θ): 0.85 ± 0.25
Predicted Exam Score: 780 (95% CI: 720-835)
```

### 2. Pass Probability
```
Probability of Passing: 92%
(Based on 65 questions answered)
```

### 3. Progress Over Time
```
Week 1: θ = -0.5  →  Score: 630
Week 2: θ = 0.0   →  Score: 700
Week 3: θ = 0.5   →  Score: 750  ← You crossed passing!
Week 4: θ = 0.85  →  Score: 780
```

### 4. Reliability Indicator
```
Estimate Reliability: 85%
(Based on 65 responses across 15 topics)

⚠️ Low confidence in "Operations & Incident Response" (only 5 questions)
```

### 5. Topic-Specific θ (Advanced)
```
Threats & Attacks:         θ = 1.2  →  Strong
Architecture & Design:     θ = 0.6  →  Passing
Implementation:            θ = 0.8  →  Good
Operations & Response:     θ = -0.2 →  Needs work
Governance & Compliance:   θ = 0.9  →  Strong
```

---

## UI Component (Simplified for Single User)

```tsx
// components/ExamReadinessSingleUser.tsx

export function ExamReadiness({ userId, chapterId }: Props) {
  const [prediction, setPrediction] = useState(null)

  useEffect(() => {
    // Fetch latest prediction
    fetch(`/api/exam/predict?chapterId=${chapterId}`)
      .then(res => res.json())
      .then(setPrediction)
  }, [chapterId])

  if (!prediction) return <div>Loading...</div>

  return (
    <div className="neuro-card">
      {/* Your Predicted Score */}
      <div className="text-center mb-6">
        <div className="text-sm text-gray-400">Your Predicted Exam Score</div>
        <div className="text-6xl font-bold text-blue-400">
          {prediction.predictedScore}
        </div>
        <div className="text-sm text-gray-500">
          95% CI: {prediction.confidenceLower} - {prediction.confidenceUpper}
        </div>
      </div>

      {/* Pass Probability */}
      <div className="neuro-stat">
        <div className="text-sm text-green-400">Probability of Passing</div>
        <div className="text-4xl font-bold text-gray-200">
          {Math.round(prediction.passProbability * 100)}%
        </div>
      </div>

      {/* Progress Chart */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-4">Your Learning Journey</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={prediction.timeline}>
            <XAxis dataKey="date" />
            <YAxis domain={[100, 900]} />
            <Area dataKey="predictedScore" stroke="#3b82f6" fill="#3b82f6" />
            <ReferenceLine y={750} stroke="#10b981" strokeDasharray="5 5" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Data Quality Warning */}
      {prediction.responsesCount < 50 && (
        <div className="neuro-inset p-4 mt-6">
          <AlertTriangleIcon className="text-yellow-500" />
          <span>Predictions improve with 50+ questions answered</span>
          <span>Current: {prediction.responsesCount}</span>
        </div>
      )}
    </div>
  )
}
```

---

## Advantages for Single User

✅ **Simpler implementation** - No multi-user calibration complexity
✅ **Focus on YOUR growth** - Track θ improvement over time
✅ **Immediate predictions** - No waiting for population data
✅ **Personal insights** - See exactly where you need to study
✅ **Temporal analysis** - Chart your progress toward exam readiness

---

## Limitations (Single User)

❌ **No objective question difficulty** - Rely on Bloom estimates
❌ **No peer comparison** - Can't tell if you're above/below average
❌ **Assumption-dependent** - Passing score = θ of 0 is a guess
❌ **Early predictions unreliable** - Need 30+ responses for stability

---

## Validation (How to Check Accuracy)

Since you can't compare to other users, validate by:

1. **Take actual practice exams** - Compare predicted vs actual scores
2. **Track temporal consistency** - θ should increase as you study
3. **Cross-topic comparison** - Strong topics should have higher θ
4. **Confidence interval tightness** - Should narrow as you answer more questions

---

## Next Steps

1. ✅ Keep default IRT parameters (Bloom-based)
2. ⏭️ Implement theta estimation (MLE)
3. ⏭️ Build exam score mapping
4. ⏭️ Create temporal tracking UI
5. ⏭️ Add confidence intervals
6. ⏭️ Calculate pass probability

**Skip:**
- ❌ Multi-user question calibration
- ❌ Population comparison features
- ❌ User diversity metrics

---

**Last Updated**: November 2025
