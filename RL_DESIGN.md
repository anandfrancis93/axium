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
- Respect prerequisite structure (shouldn't give Bloom 4 if user hasn't attempted Bloom 3)
- Respect the subject/chapter the user chose to study

**Action Selection Process**:
1. Get all available (topic, bloom_level) pairs for current chapter
2. For each available pair (arm):
   - Sample from its Beta(α, β) distribution
   - Apply context-based multipliers:
     - Low mastery → higher priority
     - Not practiced recently → higher priority
     - Next logical Bloom level → higher priority
3. Select arm with highest adjusted sample value
4. Fetch a random question from that (topic, bloom_level) combination

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

### 6.2 RL Arm Statistics (Thompson Sampling)
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

**Status**: Design Complete ✅
**Next Step**: Implement database schema and RL agent
