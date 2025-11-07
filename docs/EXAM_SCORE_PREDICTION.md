# Exam Score Prediction System (IRT-Based)

## Overview

Transform Axium's performance tracking into exam score predictions using Item Response Theory (IRT) and psychometric modeling. Specifically designed for certification exams like CompTIA Security+ (100-900 scale).

## Goals

1. **Predict exam score** with confidence intervals
2. **Estimate pass probability** for certification
3. **Identify readiness gaps** by domain/topic
4. **Track reliability** of predictions over time

---

## 1. Item Response Theory (IRT) Fundamentals

### What is IRT?

IRT models the probability of answering a question correctly based on:
- **User ability (θ)**: Latent trait (skill level)
- **Item difficulty (b)**: How hard the question is
- **Item discrimination (a)**: How well the question differentiates ability levels
- **Guessing parameter (c)**: Probability of guessing correctly

### IRT Models

**2-Parameter Logistic (2PL)** - Most common:
```
P(correct | θ, a, b) = 1 / (1 + e^(-a(θ - b)))
```

**3-Parameter Logistic (3PL)** - With guessing:
```
P(correct | θ, a, b, c) = c + (1 - c) / (1 + e^(-a(θ - b)))
```

Where:
- **θ (theta)**: User ability (-∞ to +∞, typically -3 to +3)
- **a**: Discrimination (0.5 to 2.5, higher = better discriminator)
- **b**: Difficulty (-3 to +3, same scale as θ)
- **c**: Guessing (0 to 0.25 for MCQs, typically 0.20 for 5-option)

---

## 2. Implementation Plan

### Phase 1: Database Schema

Add IRT parameters to `questions` table:

```sql
ALTER TABLE questions
ADD COLUMN irt_difficulty DECIMAL(5,3) DEFAULT NULL,
ADD COLUMN irt_discrimination DECIMAL(5,3) DEFAULT NULL,
ADD COLUMN irt_guessing DECIMAL(5,3) DEFAULT 0.20,
ADD COLUMN irt_calibrated BOOLEAN DEFAULT FALSE;

-- Track IRT calibration per question
CREATE TABLE question_irt_calibration (
  question_id UUID PRIMARY KEY REFERENCES questions(id) ON DELETE CASCADE,
  difficulty_b DECIMAL(5,3) NOT NULL,
  discrimination_a DECIMAL(5,3) NOT NULL,
  guessing_c DECIMAL(5,3) DEFAULT 0.20,
  sample_size INTEGER NOT NULL,
  fit_statistics JSONB DEFAULT '{}'::jsonb,
  calibrated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Track user ability estimates over time
CREATE TABLE user_ability_estimates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  theta DECIMAL(5,3) NOT NULL,
  standard_error DECIMAL(5,3) NOT NULL,
  predicted_score INTEGER NOT NULL,  -- On exam scale (100-900)
  confidence_interval_lower INTEGER NOT NULL,
  confidence_interval_upper INTEGER NOT NULL,
  confidence_level DECIMAL(3,2) DEFAULT 0.95,
  reliability DECIMAL(3,2),  -- 0-1, based on information function
  responses_count INTEGER NOT NULL,
  estimated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, chapter_id, estimated_at)
);

CREATE INDEX idx_user_ability_user_chapter ON user_ability_estimates(user_id, chapter_id);
CREATE INDEX idx_user_ability_estimated_at ON user_ability_estimates(estimated_at DESC);
```

### Phase 2: IRT Calibration (Question Parameter Estimation)

**When to calibrate:**
- After 30+ users have answered a question
- Re-calibrate when sample size increases significantly

**Calibration methods:**

1. **Marginal Maximum Likelihood (MML)** - Gold standard, requires large sample
2. **Expected A Posteriori (EAP)** - Works with smaller samples
3. **Simple estimates** (for initial launch):
   ```typescript
   // Difficulty: p-value method
   const pValue = correctCount / totalResponses
   const difficulty_b = -1.7 * Math.log(pValue / (1 - pValue))

   // Discrimination: point-biserial correlation
   const discrimination_a = calculatePointBiserialCorrelation(responses)

   // Guessing: empirical lower asymptote
   const guessing_c = Math.min(correctCount / totalResponses, 0.25)
   ```

### Phase 3: Ability Estimation (θ)

**Methods:**

1. **Maximum Likelihood Estimation (MLE)**:
   ```typescript
   // Iterative Newton-Raphson
   function estimateTheta(responses: Response[]): { theta: number, se: number } {
     let theta = 0  // Start at average ability

     for (let iter = 0; iter < 20; iter++) {
       const { logLikelihood, firstDerivative, secondDerivative } = calculateDerivatives(theta, responses)

       theta = theta - (firstDerivative / secondDerivative)

       if (Math.abs(firstDerivative) < 0.001) break
     }

     const standardError = 1 / Math.sqrt(-secondDerivative)
     return { theta, se: standardError }
   }
   ```

2. **Expected A Posteriori (EAP)** - More stable with few responses:
   ```typescript
   function estimateEAP(responses: Response[]): { theta: number, se: number } {
     // Bayesian approach with normal prior N(0, 1)
     const quadraturePoints = generateQuadrature(-4, 4, 40)

     let numerator = 0
     let denominator = 0

     for (const { point, weight } of quadraturePoints) {
       const likelihood = calculateLikelihood(point, responses)
       const prior = normalPDF(point, 0, 1)
       const posterior = likelihood * prior * weight

       numerator += point * posterior
       denominator += posterior
     }

     const theta = numerator / denominator

     // Calculate SE
     let variance = 0
     for (const { point, weight } of quadraturePoints) {
       const likelihood = calculateLikelihood(point, responses)
       const prior = normalPDF(point, 0, 1)
       const posterior = likelihood * prior * weight / denominator
       variance += posterior * Math.pow(point - theta, 2)
     }

     return { theta, se: Math.sqrt(variance) }
   }
   ```

### Phase 4: Scale Score Conversion

**CompTIA Security+ Scale: 100-900, Passing: 750**

Assuming:
- θ scale: -3 to +3
- Exam scale: 100 to 900
- Passing θ: 0 (average ability passes)

```typescript
function thetaToExamScore(theta: number): number {
  // Linear transformation
  const minTheta = -3
  const maxTheta = 3
  const minScore = 100
  const maxScore = 900

  // Clamp theta
  const clampedTheta = Math.max(minTheta, Math.min(maxTheta, theta))

  // Map to exam scale
  const score = minScore + ((clampedTheta - minTheta) / (maxTheta - minTheta)) * (maxScore - minScore)

  return Math.round(score)
}

// Alternative: Non-linear mapping (more realistic)
function thetaToExamScoreNonLinear(theta: number): number {
  // Use cumulative normal distribution for smoother mapping
  const zScore = theta
  const percentile = normalCDF(zScore, 0, 1)

  // Map percentile to exam scale
  const score = 100 + (percentile * 800)

  return Math.round(score)
}
```

### Phase 5: Confidence Intervals

**Standard Error of Measurement (SEM):**

```typescript
function calculateConfidenceInterval(
  theta: number,
  se: number,
  confidenceLevel: number = 0.95
): { lower: number, upper: number } {
  // Z-scores for common confidence levels
  const zScores: Record<number, number> = {
    0.68: 1.00,  // ±1 SD
    0.90: 1.645,
    0.95: 1.96,
    0.99: 2.576
  }

  const z = zScores[confidenceLevel] || 1.96

  const lowerTheta = theta - (z * se)
  const upperTheta = theta + (z * se)

  return {
    lower: thetaToExamScore(lowerTheta),
    upper: thetaToExamScore(upperTheta)
  }
}
```

**Test Information Function (Precision):**

```typescript
function calculateTestInformation(theta: number, items: Item[]): number {
  let information = 0

  for (const item of items) {
    const { a, b, c } = item
    const prob = calculateIRTProbability(theta, a, b, c)

    // Information = a^2 * P'(θ)^2 / (P(θ) * (1 - P(θ)))
    const pDerivative = a * (prob - c) * (1 - prob) / (1 - c)
    information += Math.pow(pDerivative, 2) / (prob * (1 - prob))
  }

  return information
}

function calculateReliability(theta: number, items: Item[]): number {
  const information = calculateTestInformation(theta, items)
  const variance = 1 / information

  // Reliability = 1 - (error variance / total variance)
  // Assuming total variance = 1 (standardized)
  return 1 - variance
}
```

### Phase 6: Pass Probability

**Calculate probability of passing (score ≥ 750):**

```typescript
function calculatePassProbability(theta: number, se: number): number {
  // Convert passing score to theta
  const passingScore = 750
  const passingTheta = examScoreToTheta(passingScore)

  // Calculate z-score
  const z = (theta - passingTheta) / se

  // Probability of scoring above passing theta
  const probability = normalCDF(z, 0, 1)

  return probability
}

function examScoreToTheta(score: number): number {
  const minTheta = -3
  const maxTheta = 3
  const minScore = 100
  const maxScore = 900

  return minTheta + ((score - minScore) / (maxScore - minScore)) * (maxTheta - minTheta)
}
```

---

## 3. UI Components

### Exam Readiness Card

```tsx
// components/ExamReadiness.tsx

interface ExamReadinessProps {
  predictedScore: number
  confidenceLower: number
  confidenceUpper: number
  passprobability: number
  reliability: number
  responsesCount: number
  topicReadiness: TopicReadiness[]
}

export function ExamReadiness({
  predictedScore,
  confidenceLower,
  confidenceUpper,
  passProbability,
  reliability,
  responsesCount,
  topicReadiness
}: ExamReadinessProps) {
  const passingScore = 750
  const isPassing = predictedScore >= passingScore

  return (
    <div className="neuro-card">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="neuro-inset w-12 h-12 rounded-xl flex items-center justify-center">
          <TrophyIcon size={20} className="text-blue-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-200">
          Exam Score Prediction
        </h2>
      </div>

      {/* Predicted Score */}
      <div className="neuro-raised rounded-2xl p-8 mb-6 text-center">
        <div className="text-sm text-gray-400 mb-2">Predicted Exam Score</div>
        <div className={`text-6xl font-bold mb-2 ${isPassing ? 'text-green-500' : 'text-yellow-500'}`}>
          {predictedScore}
        </div>
        <div className="text-sm text-gray-500 mb-4">
          95% CI: {confidenceLower} - {confidenceUpper}
        </div>
        <div className="text-xs text-gray-600">
          Passing Score: 750
        </div>
      </div>

      {/* Pass Probability */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="neuro-stat">
          <div className="text-sm text-blue-400 font-medium mb-2">Pass Probability</div>
          <div className={`text-3xl font-bold ${passProbability >= 0.9 ? 'text-green-500' : passProbability >= 0.7 ? 'text-yellow-500' : 'text-red-500'}`}>
            {Math.round(passProbability * 100)}%
          </div>
        </div>

        <div className="neuro-stat">
          <div className="text-sm text-purple-400 font-medium mb-2">Reliability</div>
          <div className="text-3xl font-bold text-gray-200">
            {Math.round(reliability * 100)}%
          </div>
        </div>
      </div>

      {/* Reliability Warning */}
      {responsesCount < 50 && (
        <div className="neuro-inset rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertTriangleIcon size={20} className="text-yellow-500 mt-0.5" />
          <div className="text-sm text-gray-400">
            <span className="font-semibold text-yellow-500">Limited Data</span>
            <br />
            You've answered {responsesCount} questions. Predictions become more accurate with 50+ questions across all topics.
          </div>
        </div>
      )}

      {/* Topic Readiness */}
      <div className="neuro-inset rounded-lg p-6">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Topic Readiness</h3>
        <div className="space-y-3">
          {topicReadiness.map(topic => (
            <div key={topic.name}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-300">{topic.name}</span>
                <span className={`text-sm font-semibold ${topic.ready ? 'text-green-500' : 'text-yellow-500'}`}>
                  {Math.round(topic.mastery)}%
                </span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${topic.ready ? 'bg-green-500' : 'bg-yellow-500'}`}
                  style={{ width: `${Math.min(topic.mastery, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

### Exam Readiness Page

Add to `/performance/[subject]/[chapter]/exam-readiness`

---

## 4. API Endpoints

### Calculate Exam Prediction

```typescript
// app/api/exam/predict/route.ts

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return new Response('Unauthorized', { status: 401 })

  const { searchParams } = new URL(request.url)
  const chapterId = searchParams.get('chapterId')

  // Get all user responses for this chapter
  const { data: responses } = await supabase
    .from('user_responses')
    .select(`
      *,
      questions (
        irt_difficulty,
        irt_discrimination,
        irt_guessing
      )
    `)
    .eq('user_id', user.id)
    .eq('chapter_id', chapterId)

  // Filter responses with calibrated IRT parameters
  const calibratedResponses = responses.filter(r =>
    r.questions?.irt_difficulty !== null
  )

  if (calibratedResponses.length < 10) {
    return Response.json({
      error: 'Not enough data',
      message: 'Need at least 10 responses with calibrated questions'
    }, { status: 400 })
  }

  // Estimate ability (theta)
  const { theta, se } = estimateTheta(calibratedResponses)

  // Convert to exam score
  const predictedScore = thetaToExamScore(theta)
  const { lower, upper } = calculateConfidenceInterval(theta, se, 0.95)

  // Calculate pass probability
  const passProbability = calculatePassProbability(theta, se)

  // Calculate reliability
  const items = calibratedResponses.map(r => r.questions)
  const reliability = calculateReliability(theta, items)

  // Store estimate
  await supabase.from('user_ability_estimates').insert({
    user_id: user.id,
    chapter_id: chapterId,
    theta,
    standard_error: se,
    predicted_score: predictedScore,
    confidence_interval_lower: lower,
    confidence_interval_upper: upper,
    confidence_level: 0.95,
    reliability,
    responses_count: calibratedResponses.length
  })

  return Response.json({
    predictedScore,
    confidenceLower: lower,
    confidenceUpper: upper,
    passProbability,
    reliability,
    responsesCount: calibratedResponses.length,
    theta,
    standardError: se
  })
}
```

---

## 5. Calibration Strategy

### Initial Launch (No IRT Data)

**Option 1: Default parameters based on Bloom level**

```typescript
const defaultIRTParams = {
  1: { a: 1.0, b: -1.5, c: 0.20 },  // Remember - Easy
  2: { a: 1.2, b: -0.8, c: 0.20 },  // Understand
  3: { a: 1.5, b: 0.0, c: 0.20 },   // Apply - Medium
  4: { a: 1.8, b: 0.8, c: 0.20 },   // Analyze
  5: { a: 2.0, b: 1.2, c: 0.20 },   // Evaluate
  6: { a: 2.2, b: 1.8, c: 0.20 },   // Create - Hard
}
```

**Option 2: Empirical calibration from existing data**

```sql
-- Run after 30+ users per question
SELECT
  q.id,
  COUNT(*) as sample_size,
  AVG(CASE WHEN ur.is_correct THEN 1.0 ELSE 0.0 END) as p_value,
  -- Calculate difficulty
  -1.7 * LN(AVG(CASE WHEN ur.is_correct THEN 1.0 ELSE 0.0 END) /
           (1 - AVG(CASE WHEN ur.is_correct THEN 1.0 ELSE 0.0 END))) as difficulty_b
FROM questions q
JOIN user_responses ur ON ur.question_id = q.id
WHERE q.chapter_id = 'chapter-uuid'
GROUP BY q.id
HAVING COUNT(*) >= 30
```

### Continuous Calibration

Run nightly job to re-calibrate questions with new data:

```typescript
// scripts/calibrate-irt-parameters.ts

async function calibrateIRTParameters() {
  // Get questions with sufficient responses
  const questions = await getQuestionsForCalibration()

  for (const question of questions) {
    const responses = await getQuestionResponses(question.id)

    // Estimate IRT parameters using MML or EAP
    const { a, b, c } = estimateIRTParameters(responses)

    // Update database
    await updateQuestionIRTParams(question.id, { a, b, c })
  }
}
```

---

## 6. Validation & Testing

### Cross-Validation

1. **Split-half reliability**: Compare predictions from odd vs even questions
2. **Test-retest**: Track prediction stability over time
3. **Criterion validity**: Compare predictions to actual exam scores (if available)

### Monitoring Metrics

- **Mean Absolute Error (MAE)**: Average difference between predicted and actual
- **Calibration plots**: Are 70% predictions within 70% CI?
- **Topic coverage**: Ensure sufficient questions per topic

---

## 7. Roadmap

### Phase 1: MVP (Week 1-2)
- [ ] Add database schema for IRT parameters
- [ ] Implement theta estimation (MLE)
- [ ] Create score conversion functions
- [ ] Build basic Exam Readiness UI
- [ ] Use default IRT parameters by Bloom level

### Phase 2: Calibration (Week 3-4)
- [ ] Implement empirical IRT calibration
- [ ] Create calibration dashboard for admins
- [ ] Add fit statistics and quality checks
- [ ] Schedule automated calibration jobs

### Phase 3: Advanced Features (Week 5-6)
- [ ] Computerized Adaptive Testing (CAT) suggestions
- [ ] Topic-weighted predictions (by exam blueprint)
- [ ] Historical trend tracking
- [ ] Comparison to population benchmarks

### Phase 4: Validation (Ongoing)
- [ ] Collect actual exam scores (with user consent)
- [ ] Validate prediction accuracy
- [ ] Refine scaling and calibration

---

## 8. Technical Considerations

### Performance

- Cache theta estimates (recompute only when new responses added)
- Pre-compute IRT probabilities for common theta values
- Use database indexes for fast response queries

### Privacy

- Anonymize calibration data
- User controls whether to share actual exam scores
- Clear communication about prediction limitations

### Accuracy Warnings

Display when:
- **< 10 responses**: "Insufficient data for prediction"
- **< 30 responses**: "Preliminary estimate, low confidence"
- **< 50 responses**: "Moderate confidence"
- **50+ responses**: "High confidence"

---

## 9. Example Output

```json
{
  "predictedScore": 780,
  "confidenceInterval": {
    "lower": 720,
    "upper": 840,
    "level": 0.95
  },
  "passProbability": 0.92,
  "reliability": 0.85,
  "responsesCount": 65,
  "theta": 0.85,
  "standardError": 0.35,
  "interpretation": "Strong prediction - You have a 92% chance of passing",
  "topicReadiness": [
    { "topic": "Threats, Attacks, and Vulnerabilities", "mastery": 85, "ready": true },
    { "topic": "Architecture and Design", "mastery": 72, "ready": false },
    { "topic": "Implementation", "mastery": 78, "ready": true },
    { "topic": "Operations and Incident Response", "mastery": 68, "ready": false },
    { "topic": "Governance, Risk, and Compliance", "mastery": 81, "ready": true }
  ]
}
```

---

## 10. References

- Baker, F. B. (2001). *The Basics of Item Response Theory*
- Embretson, S. E., & Reise, S. P. (2000). *Item Response Theory for Psychologists*
- Lord, F. M. (1980). *Applications of Item Response Theory to Practical Testing Problems*
- CompTIA Security+ Exam Blueprint: https://www.comptia.org/certifications/security

---

**Last Updated**: November 2025
