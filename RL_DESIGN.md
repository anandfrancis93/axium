# Reinforcement Learning System Design
## Axium Adaptive Learning Platform

---

## 1. Overview

The RL system uses **Contextual Bandits** (Thompson Sampling) to intelligently select the optimal (topic, Bloom level) pair for each user at each learning moment.

**Goal**: Maximize learning gain while maintaining engagement and building accurate metacognition (confidence calibration).

---

## 2. Algorithm: Contextual Bandits (Thompson Sampling)

**Why Contextual Bandits?**
- Simpler than full RL (no complex state transitions)
- Fast to train and update in real-time
- Balances exploration vs exploitation naturally
- Well-suited for personalized recommendation tasks

**Thompson Sampling**:
- Each "arm" = (topic, Bloom level) pair
- Maintain Beta distribution for each arm: Beta(α, β)
  - α = successes + 1 (correct answers)
  - β = failures + 1 (incorrect answers)
- At decision time: sample from each arm's distribution, pick highest sample
- After response: update the chosen arm's distribution

**Can evolve to full RL later** (e.g., DQN, PPO) if we want to model long-term mastery trajectories.

---

## 3. State (Context) Representation

For each user, we track:

### 3.1 Mastery Matrix
- **Dimensions**: Topic × Bloom Level (e.g., 50 topics × 6 levels = 300 cells)
- **Value**: Mastery score 0-100% for each cell
- **Calculation**:
  - Start at 0%
  - Increase with correct answers, decrease with incorrect
  - Use exponential moving average (recent performance weighted higher)
  - Formula: `new_mastery = 0.7 * old_mastery + 0.3 * (correct ? 100 : 0)`

### 3.2 Recent Performance Features
- Last 5 questions: correctness, confidence, response time
- Current session length (number of questions answered)
- Current session score (% correct)

### 3.3 Confidence Calibration
- **Calibration score**: How well confidence predicts correctness
- Track: P(correct | high confidence) and P(incorrect | low confidence)
- Good calibration → reward bonus

### 3.4 Temporal Features
- Days since last practice for each topic
- Total questions answered for each topic (experience)
- Current streak (consecutive correct answers)

### 3.5 User Preferences (implicit)
- Topics the user engages with more
- Preferred difficulty curve (fast progression vs thorough mastery)

---

## 4. Action Space

**Action**: Select a (topic, Bloom level) pair to quiz the user on

**Constraints**:
- Only select (topic, level) pairs that have questions in the database
- **Respect mastery prerequisites** (detailed below)
- Respect the subject/chapter the user chose to study

### 4.1 Mastery Prerequisites & Bloom Level Progression

**Critical Rule**: Progression is **per-topic vertical**, not global horizontal.

**Mastery Threshold Requirements**:
```typescript
// To unlock Bloom Level N for a topic, user must:
1. Have mastery >= 80% at Level N-1 for THAT SAME TOPIC
2. Have answered >= 3 questions correctly at Level N-1 for THAT TOPIC
3. (Optional) Have confidence calibration >= 0.6 at Level N-1

Example:
- "CIA Triad" L1: 90% mastery, 5 correct answers → UNLOCKS "CIA Triad" L2
- "Encryption" L1: 40% mastery → DOES NOT unlock "Encryption" L2
- "Encryption" L1: 85% mastery → UNLOCKS "Encryption" L2
```

**Available Arms Filter**:
```typescript
function getAvailableArms(userId: string, chapterId: string): Arm[] {
  const allArms = getAllTopicsInChapter(chapterId)
  const mastery = getUserMastery(userId, chapterId)

  return allArms.filter(arm => {
    // Level 1 is always available (entry point)
    if (arm.bloomLevel === 1) {
      return true
    }

    // For Level N (N > 1), check prerequisite Level N-1
    const prereqArm = {
      topic: arm.topic,
      bloomLevel: arm.bloomLevel - 1
    }

    const prereqMastery = mastery[`${prereqArm.topic}_${prereqArm.bloomLevel}`]

    // Must have high mastery AND sufficient attempts at previous level
    return (
      prereqMastery?.mastery_score >= 80 &&
      prereqMastery?.questions_correct >= 3
    )
  })
}
```

**Example Progression**:
```
Session 1: CIA Triad L1 (correct) → mastery 30%
Session 2: CIA Triad L1 (correct) → mastery 51%
Session 3: CIA Triad L1 (correct) → mastery 66%
Session 4: CIA Triad L1 (correct) → mastery 76%
Session 5: CIA Triad L1 (correct) → mastery 83% ✅ UNLOCKS L2
Session 6: CIA Triad L2 NOW AVAILABLE

Meanwhile:
Session 3: Encryption L1 (incorrect) → mastery 21%
Session 7: Encryption L1 (correct) → mastery 36%
// Encryption L2 still LOCKED (mastery < 80%)
```

**Action Selection Process**:
1. Get all available (topic, bloom_level) pairs that meet mastery prerequisites
2. For each available pair (arm):
   - Sample from its Beta(α, β) distribution
   - Apply context-based multipliers:
     - Low mastery → higher priority (needs practice)
     - Not practiced recently → higher priority (spacing effect)
     - Just unlocked new level → higher priority (progressive challenge)
3. Select arm with highest adjusted sample value
4. Fetch a question from that (topic, bloom_level) combination:
   - **Option A**: Pure single-topic question (primary_topic only)
   - **Option B**: Multi-topic question where selected topic is primary
   - **Option C**: Multi-topic question where selected topic is secondary (lower priority)
   - At higher Bloom levels (4-6): prefer multi-topic questions (more realistic)
   - At lower Bloom levels (1-3): prefer single-topic questions (clearer learning)

### 4.2 Multi-Topic Question Selection Strategy

**When RL selects "Encryption" at Bloom L4**:

```typescript
// Priority 1: Multi-topic questions with "Encryption" as primary
const multiTopicPrimary = await supabase
  .from('questions')
  .select('*')
  .eq('chapter_id', chapterId)
  .eq('primary_topic', 'Encryption')
  .eq('bloom_level', 4)
  .not('secondary_topics', 'is', null)

// Priority 2: Pure "Encryption" questions
const singleTopic = await supabase
  .from('questions')
  .select('*')
  .eq('chapter_id', chapterId)
  .eq('topic', 'Encryption')  // Old schema
  .eq('bloom_level', 4)
  .is('secondary_topics', null)

// Priority 3: Multi-topic where "Encryption" is secondary (bonus practice)
const multiTopicSecondary = await supabase
  .from('questions')
  .select('*')
  .eq('chapter_id', chapterId)
  .contains('secondary_topics', ['Encryption'])
  .eq('bloom_level', 4)

// Choose based on Bloom level
if (bloomLevel >= 4) {
  // Higher levels: prefer multi-topic (70% chance)
  return random() < 0.7 ? multiTopicPrimary : singleTopic
} else {
  // Lower levels: prefer single-topic (80% chance)
  return random() < 0.8 ? singleTopic : multiTopicPrimary
}
```

**Rationale**:
- **Bloom 1-2**: Focus on learning individual concepts clearly
- **Bloom 3-4**: Start integrating concepts (50/50 mix)
- **Bloom 5-6**: Heavily favor multi-topic questions (synthesis and evaluation require integration)

---

## 5. Reward Function

Multi-component reward calculated after each answer:

### 5.1 Learning Gain Reward (Primary)
```
learning_gain = new_mastery - old_mastery
reward_learning = learning_gain * 10
```
- Positive when user improves mastery
- Encourages the system to select appropriately challenging questions

### 5.2 Confidence Calibration Reward
```
if (correct && confidence >= 4):
  reward_calibration = +5  # Correctly confident
elif (incorrect && confidence <= 2):
  reward_calibration = +2  # Correctly uncertain (metacognition awareness)
elif (correct && confidence <= 2):
  reward_calibration = -2  # Incorrectly uncertain (underconfident)
elif (incorrect && confidence >= 4):
  reward_calibration = -5  # Incorrectly confident (overconfident - worst case)
else:
  reward_calibration = 0
```

### 5.3 Engagement Reward
```
# Avoid too easy or too hard
if (current_mastery > 90 && correct):
  reward_engagement = -3  # Too easy, not challenging
elif (current_mastery < 20 && incorrect):
  reward_engagement = -3  # Too hard, discouraging
else:
  reward_engagement = 0
```

### 5.4 Spaced Repetition Reward
```
if (days_since_last_practice >= 3 && correct):
  reward_spacing = +3  # Good retention over time
elif (days_since_last_practice >= 7 && correct):
  reward_spacing = +5  # Excellent long-term retention
else:
  reward_spacing = 0
```

### 5.5 Total Reward
```
total_reward = reward_learning + reward_calibration + reward_engagement + reward_spacing
```

**Normalized to range [-10, +20]** to keep Beta distribution updates stable.

---

## 6. Database Schema Extensions

### 6.1 User Topic Mastery
```sql
CREATE TABLE user_topic_mastery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  bloom_level INT NOT NULL CHECK (bloom_level BETWEEN 1 AND 6),
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,

  -- Mastery tracking
  mastery_score DECIMAL(5,2) DEFAULT 0.0 CHECK (mastery_score BETWEEN 0 AND 100),
  questions_attempted INT DEFAULT 0,
  questions_correct INT DEFAULT 0,

  -- Temporal tracking
  last_practiced_at TIMESTAMPTZ,
  first_practiced_at TIMESTAMPTZ DEFAULT NOW(),

  -- Confidence calibration
  avg_confidence DECIMAL(3,2), -- 1.0 to 5.0
  confidence_accuracy DECIMAL(5,2), -- How well confidence predicts correctness

  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, topic, bloom_level, chapter_id)
);

CREATE INDEX idx_user_mastery ON user_topic_mastery(user_id, chapter_id, mastery_score);
```

### 6.2 Multi-Topic Question Support

Questions, especially at higher Bloom levels, often integrate multiple topics.

**Example**: A Bloom L4 (Analyze) question about "Encryption" might also involve "Authentication" and "Network Security".

**Schema Enhancement**:
```sql
ALTER TABLE questions
ADD COLUMN primary_topic TEXT, -- Main topic being tested
ADD COLUMN secondary_topics TEXT[], -- Supporting topics (array)
ADD COLUMN topic_weights JSONB; -- Mastery distribution weights

-- Example values:
-- primary_topic: "Encryption"
-- secondary_topics: ["Authentication", "Network Security"]
-- topic_weights: {"primary": 1.0, "secondary": [0.3, 0.2]}

-- For backwards compatibility, if primary_topic is NULL, use the 'topic' column
ALTER TABLE questions
ADD CONSTRAINT check_has_topic CHECK (
  primary_topic IS NOT NULL OR topic IS NOT NULL
);
```

**Default Weights**:
- Primary topic: **1.0** (100% of mastery update)
- First secondary topic: **0.3** (30% of mastery update)
- Second secondary topic: **0.2** (20% of mastery update)
- Additional secondary topics: **0.1** each

**Mastery Distribution on Answer**:

When user answers a multi-topic question:
```typescript
// Question metadata:
const question = {
  primary_topic: "Encryption",
  secondary_topics: ["Authentication", "Network Security"],
  topic_weights: { primary: 1.0, secondary: [0.3, 0.2] }
}

// User answers correctly with confidence 4
const baseLearningGain = 22 // From EMA calculation

// Distribute mastery updates:
updateTopicMastery("Encryption", baseLearningGain * 1.0)         // +22
updateTopicMastery("Authentication", baseLearningGain * 0.3)    // +6.6
updateTopicMastery("Network Security", baseLearningGain * 0.2)  // +4.4
```

**Benefits**:
1. More realistic knowledge representation
2. Cross-topic reinforcement (answering encryption questions helps authentication mastery)
3. Better for higher Bloom levels that require synthesis
4. Encourages integrated understanding vs siloed knowledge

### 6.3 RL Arm Statistics (Thompson Sampling)
```sql
CREATE TABLE rl_arm_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  bloom_level INT NOT NULL CHECK (bloom_level BETWEEN 1 AND 6),

  -- Beta distribution parameters
  alpha DECIMAL(10,2) DEFAULT 1.0, -- Successes + 1
  beta DECIMAL(10,2) DEFAULT 1.0,  -- Failures + 1

  -- Statistics
  times_selected INT DEFAULT 0,
  total_reward DECIMAL(10,2) DEFAULT 0.0,
  avg_reward DECIMAL(5,2) DEFAULT 0.0,

  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, chapter_id, topic, bloom_level)
);

CREATE INDEX idx_rl_arms ON rl_arm_stats(user_id, chapter_id);
```

### 6.3 Learning Sessions (Enhanced)
```sql
-- Already exists, just add RL-specific fields
ALTER TABLE learning_sessions
ADD COLUMN selection_algorithm TEXT DEFAULT 'thompson_sampling',
ADD COLUMN session_avg_reward DECIMAL(5,2),
ADD COLUMN exploration_rate DECIMAL(3,2); -- How many exploratory vs exploitative choices
```

### 6.4 User Responses (Enhanced)
```sql
-- Already exists, add RL-specific fields
ALTER TABLE user_responses
ADD COLUMN mastery_before DECIMAL(5,2),
ADD COLUMN mastery_after DECIMAL(5,2),
ADD COLUMN learning_gain DECIMAL(5,2),
ADD COLUMN reward_received DECIMAL(5,2),
ADD COLUMN arm_selected TEXT; -- e.g., "CIA Triad_L2"
```

---

## 7. Implementation Plan

### Phase 1: Core RL Infrastructure
1. Create database tables and migrations
2. Build RL agent service (`lib/rl/thompson-sampling.ts`)
3. Build mastery calculation service (`lib/rl/mastery.ts`)
4. Build reward calculation service (`lib/rl/rewards.ts`)

### Phase 2: APIs
1. `POST /api/rl/select-question` - Get next question via RL
2. `POST /api/rl/update` - Update RL state after user response
3. `GET /api/rl/state` - Get user's current mastery matrix

### Phase 3: UI Integration
1. Homepage with subjects
2. Subject detail page
3. Learning session with RL-powered questions
4. Performance dashboard (mastery heatmap)

### Phase 4: Optimization
1. A/B test different reward functions
2. Add exploration bonuses for variety
3. Implement curriculum learning (progressive Bloom levels)
4. Add user feedback mechanism ("too easy/hard" buttons)

---

## 8. Key Implementation Details

### 8.1 Thompson Sampling Algorithm
```typescript
async function selectNextQuestion(
  userId: string,
  chapterId: string
): Promise<{ topic: string, bloomLevel: number }> {
  // 1. Get available arms (topic, bloom_level pairs with questions)
  const availableArms = await getAvailableArms(chapterId)

  // 2. Get user's current state
  const mastery = await getUserMastery(userId, chapterId)
  const armStats = await getArmStats(userId, chapterId)

  // 3. Thompson Sampling: sample from each arm's Beta distribution
  const samples = availableArms.map(arm => {
    const stats = armStats.find(s => s.topic === arm.topic && s.bloom_level === arm.bloom_level)
    const alpha = stats?.alpha || 1.0
    const beta = stats?.beta || 1.0

    // Sample from Beta(alpha, beta)
    const sample = sampleBeta(alpha, beta)

    // Apply context-based multipliers
    const topicMastery = mastery[`${arm.topic}_${arm.bloom_level}`] || 0
    const daysSinceLastPractice = getDaysSince(stats?.updated_at) || 999

    const masteryBonus = (100 - topicMastery) / 100  // Prioritize low mastery
    const spacingBonus = Math.min(daysSinceLastPractice / 7, 1.5)  // Prioritize not-recently-practiced

    const adjustedSample = sample * (1 + masteryBonus + spacingBonus)

    return { arm, sample: adjustedSample }
  })

  // 4. Select arm with highest sample
  const selected = samples.sort((a, b) => b.sample - a.sample)[0]

  return selected.arm
}
```

### 8.2 Mastery Update
```typescript
function updateMastery(
  oldMastery: number,
  isCorrect: boolean,
  confidence: number
): number {
  // Exponential moving average with confidence weighting
  const learningRate = confidence >= 4 ? 0.4 : 0.3  // Higher confidence → faster update
  const target = isCorrect ? 100 : 0

  const newMastery = (1 - learningRate) * oldMastery + learningRate * target

  return Math.max(0, Math.min(100, newMastery))
}
```

### 8.3 Beta Distribution Update
```typescript
function updateArmStats(
  armStats: { alpha: number, beta: number },
  reward: number,
  isCorrect: boolean
): { alpha: number, beta: number } {
  // Normalize reward to [0, 1]
  const normalizedReward = (reward + 10) / 30  // reward range [-10, 20] → [0, 1]

  // Update Beta distribution
  const newAlpha = armStats.alpha + normalizedReward
  const newBeta = armStats.beta + (1 - normalizedReward)

  return { alpha: newAlpha, beta: newBeta }
}
```

---

## 9. Monitoring & Metrics

Track these metrics to evaluate RL performance:

1. **Learning Efficiency**: Avg mastery gain per question
2. **Engagement**: Session length, dropout rate
3. **Confidence Calibration**: Correlation between confidence and correctness
4. **Exploration Rate**: % of questions from low-prior arms
5. **Curriculum Progression**: Bloom level distribution over time
6. **Regret**: Compared to optimal policy (simulated)

---

## 10. Future Enhancements

1. **Multi-Armed Contextual Bandits** → **Deep RL**
   - Use DQN or PPO to model long-term mastery trajectories
   - State: full mastery matrix + temporal features
   - Action: same (topic, bloom_level) pairs
   - Reward: same multi-component reward

2. **Personalized Reward Weights**
   - Learn per-user reward function weights
   - Some users may value speed, others depth

3. **Multi-Objective RL**
   - Optimize for mastery AND engagement AND retention simultaneously
   - Pareto-optimal policies

4. **Curriculum Learning**
   - Enforce progressive Bloom level structure
   - Ensure Level N mastery before Level N+1

5. **Social Learning**
   - Transfer learning from similar users
   - Cold-start problem solution

---

## 11. Question Generation with Multi-Topic Support

### 11.1 Enhanced AI Generation Prompt

Update the question generation API (`/api/questions/generate`) to instruct the AI:

```typescript
const enhancedPrompt = `...

MULTI-TOPIC INTEGRATION (for Bloom Levels 4-6):

At higher Bloom levels, questions should integrate multiple topics:

Bloom Level 1-2: Single-topic questions only
- Focus: Clear, isolated concept testing
- Example: "What does CIA stand for in security?" (single topic: CIA Triad)

Bloom Level 3: Mostly single-topic, occasionally 2 topics
- Focus: Application with minimal integration
- Example: "Apply encryption to protect data confidentiality" (primary: Encryption, secondary: CIA Triad with 0.2 weight)

Bloom Level 4-5: Multi-topic integration (2-3 topics)
- Focus: Analysis and evaluation across concepts
- Example: "Analyze how encryption and authentication work together in TLS"
  - Primary topic: Encryption (weight 1.0)
  - Secondary topics: Authentication (0.3), Network Security (0.2)

Bloom Level 6: Heavy multi-topic synthesis (3-4 topics)
- Focus: Creating solutions using multiple concepts
- Example: "Design a security architecture using encryption, access control, and monitoring"
  - Primary topic: Security Architecture (1.0)
  - Secondary: Encryption (0.3), Access Control (0.3), Security Monitoring (0.2)

FORMAT YOUR RESPONSE AS VALID JSON (enhanced):
{
  "questions": [
    {
      "question_text": "...",
      "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
      "correct_answer": "B",
      "explanation": "...",
      "primary_topic": "Encryption",
      "secondary_topics": ["Authentication", "Network Security"],
      "topic_weights": {
        "primary": 1.0,
        "secondary": [0.3, 0.2]
      }
    }
  ]
}

TOPIC WEIGHT GUIDELINES:
- Primary topic (main concept tested): 1.0
- First secondary topic (significantly involved): 0.3
- Second secondary topic (moderately involved): 0.2
- Additional secondary topics: 0.1 each
- Total weights typically sum to 1.5-1.6 (primary + secondaries)
`
```

### 11.2 Database Storage

When storing generated questions:

```typescript
const questionsToInsert = questionsData.questions.map((q: any) => ({
  chapter_id,
  question_text: q.question_text,
  question_type: 'mcq',
  options: q.options,
  correct_answer: q.correct_answer,
  explanation: q.explanation,
  bloom_level: bloomLevelNum,

  // Multi-topic support
  topic: q.primary_topic || topic, // Backwards compatibility
  primary_topic: q.primary_topic,
  secondary_topics: q.secondary_topics || [],
  topic_weights: q.topic_weights || { primary: 1.0, secondary: [] },

  difficulty_estimated: bloomLevelNum >= 4 ? 'hard' : bloomLevelNum >= 3 ? 'medium' : 'easy',
  source_type: 'ai_generated',
}))
```

### 11.3 Mastery Update Algorithm

```typescript
async function updateMasteryAfterAnswer(
  userId: string,
  question: Question,
  isCorrect: boolean,
  confidence: number
) {
  // Calculate base learning gain
  const baseLearningGain = calculateLearningGain(isCorrect, confidence)

  // Update primary topic (full weight)
  await updateTopicMastery({
    userId,
    topic: question.primary_topic || question.topic,
    bloomLevel: question.bloom_level,
    learningGain: baseLearningGain * 1.0
  })

  // Update secondary topics (weighted)
  if (question.secondary_topics?.length > 0) {
    for (let i = 0; i < question.secondary_topics.length; i++) {
      const secondaryTopic = question.secondary_topics[i]
      const weight = question.topic_weights?.secondary?.[i] || 0.1

      await updateTopicMastery({
        userId,
        topic: secondaryTopic,
        bloomLevel: question.bloom_level,
        learningGain: baseLearningGain * weight
      })
    }
  }
}

function calculateLearningGain(isCorrect: boolean, confidence: number): number {
  // Exponential moving average with confidence weighting
  const learningRate = confidence >= 4 ? 0.4 : 0.3
  const target = isCorrect ? 100 : 0

  // Learning gain is the change in mastery
  // Assuming current mastery is 50%, this returns the delta
  return learningRate * (target - 50)  // Returns +/-20 to +/-30
}
```

### 11.4 Example Multi-Topic Question Lifecycle

**Question Generated**:
```json
{
  "question_text": "Analyze how symmetric and asymmetric encryption are used together in TLS handshake to establish secure communication.",
  "primary_topic": "[General Security Concepts 1.4] Encryption (symmetric vs asymmetric)",
  "secondary_topics": [
    "[General Security Concepts 1.4] TLS/SSL (protocol)",
    "[General Security Concepts 1.3] Authentication (certificate-based)"
  ],
  "bloom_level": 4,
  "topic_weights": {
    "primary": 1.0,
    "secondary": [0.3, 0.2]
  }
}
```

**User answers correctly with confidence 5**:
- Base learning gain: +30 (high confidence correct answer)
- "Encryption" mastery: +30 * 1.0 = **+30**
- "TLS/SSL" mastery: +30 * 0.3 = **+9**
- "Authentication" mastery: +30 * 0.2 = **+6**

**Result**:
- User's encryption mastery gets primary benefit
- Related topics also improve (cross-topic reinforcement)
- More realistic knowledge graph representation

---

## 12. Example User Learning Journey

**Week 1: Starting Fresh**
```
Day 1, Session 1:
- RL selects: "CIA Triad" L1 (all L1s are available initially)
- User answers correctly with confidence 3
- Mastery: 0% → 30%
- Reward: +8 (learning gain +6, calibration 0, engagement +2)

Day 1, Session 2:
- RL selects: "Security Controls" L1 (exploring different topics)
- User answers incorrectly with confidence 2
- Mastery: 0% → 21%
- Reward: +2 (learning gain -2, calibration +2 for appropriate uncertainty, engagement +2)

Day 2, Session 3:
- RL selects: "CIA Triad" L1 (back to partially-learned topic)
- User answers correctly with confidence 4
- Mastery: 30% → 52%
- Reward: +10 (learning gain +7, calibration +3)

Day 3-5: More practice on L1 topics...
- "CIA Triad" L1 mastery reaches 83% after 5 correct answers ✅
- "Security Controls" L1 mastery reaches 78% (2 correct, 1 incorrect)
- "Encryption" L1 mastery reaches 45% (started practicing)
```

**Week 2: First Bloom Level Advancement**
```
Day 8, Session 12:
- RL checks: "CIA Triad" L1 has 83% mastery + 5 correct answers
- ✅ UNLOCKS "CIA Triad" L2 (Understand)
- RL selects: "CIA Triad" L2 (new level just unlocked - high priority)
- User answers correctly with confidence 3
- L2 Mastery: 0% → 30%
- Reward: +12 (learning gain +8, calibration 0, engagement +4 for good progression)

Day 9-10:
- RL mixes "CIA Triad" L2 with other L1 topics not yet mastered
- "Security Controls" L1 reaches 85% → unlocks L2
- "Encryption" L1 reaches 81% → unlocks L2
```

**Week 3: Multiple Active Levels**
```
User now has available:
- "CIA Triad" L1 (83% mastery - for review/spacing)
- "CIA Triad" L2 (65% mastery - active practice)
- "Security Controls" L1 (85% - review)
- "Security Controls" L2 (42% - active practice)
- "Encryption" L1 (81% - review)
- "Encryption" L2 (38% - active practice)
- "Authentication" L1 (12% - new topic)
- "Malware" L1 (0% - unexplored)

RL balances:
- Spaced repetition: Occasionally tests "CIA Triad" L1 (last practiced 5 days ago)
- Progressive challenge: Prioritizes L2 topics that are partially learned
- Exploration: Introduces new L1 topics like "Malware"
```

**Month 2: Reaching Higher Bloom Levels**
```
"CIA Triad" progression:
L1: 90% mastery (review occasionally) ✅
L2: 88% mastery (unlocked L3) ✅
L3: 72% mastery (active practice - Apply level)
L4: LOCKED (need 80%+ at L3)

"Encryption" progression:
L1: 85% mastery ✅
L2: 82% mastery (unlocked L3) ✅
L3: 45% mastery (actively learning)

RL strategy:
- Focus on advancing L3 topics (Apply level)
- Mix in L1/L2 reviews for spaced repetition
- Slowly introduce new topics to maintain variety
```

**Key Insights**:
1. **Per-topic progression**: Just because you mastered "CIA Triad" L3 doesn't mean "Encryption" L3 is available
2. **Multiple attempts required**: Need 3+ correct answers at 80%+ mastery to advance
3. **Balanced practice**: RL mixes new learning with spaced review
4. **Natural curriculum**: Higher Bloom levels become available as foundations are solidified

---

## 13. Summary of Key Design Decisions

1. **Thompson Sampling Contextual Bandits**: Balances exploration vs exploitation naturally
2. **Per-Topic Vertical Progression**: Each topic advances independently (80% mastery + 3 correct answers required)
3. **Multi-Component Reward**: Learning gain + confidence calibration + engagement + spacing
4. **Multi-Topic Questions**: Higher Bloom levels integrate multiple concepts with weighted mastery distribution
5. **Bloom Level Gating**: Cannot access Level N without mastering Level N-1 for that topic
6. **Spaced Repetition**: Days since last practice affects RL selection priority
7. **Confidence Calibration**: Tracks and rewards accurate self-assessment

**Weight Distribution**:
- Primary topic: 1.0 (100% of mastery gain)
- First secondary: 0.3 (30% of mastery gain)
- Second secondary: 0.2 (20% of mastery gain)
- Additional: 0.1 each

**Bloom Level Strategy**:
- L1-2: Single-topic questions (clear concept learning)
- L3-4: Mixed single and multi-topic (50/50)
- L5-6: Primarily multi-topic (synthesis and evaluation)

---

**Status**: Design Complete ✅ (with multi-topic support)
**Next Step**: Implement database schema and RL agent
