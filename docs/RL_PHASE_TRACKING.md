# RL Phase Tracking System

## Overview

The RL (Reinforcement Learning) Phase Tracking system monitors each user's learning progress through distinct phases, helping to understand where they are in their learning journey for each topic.

## Phases

### 1. Cold Start Phase
**Criteria**: < 10 total attempts

- **Description**: RL has no prior knowledge about your ability, preferences, or the quality of its actions
- **Goal**: Gather initial data points
- **Behavior**: Random question selection, broad exploration
- **Color**: Gray
- **Icon**: ○

### 2. Exploration Phase
**Criteria**: 10-50 total attempts

- **Description**: The RL agent starts testing different actions (questions, topics, levels) to see what yields the best rewards (learning outcomes)
- **Goal**: Discover effective learning strategies
- **Behavior**: Varied question types, testing different Bloom levels
- **Color**: Blue
- **Icon**: ◐

### 3. Optimization Phase
**Criteria**: 50-150 total attempts

- **Description**: The agent begins focusing on actions (questions/topics/levels) that maximize learning, based on past rewards
- **Behavior**: Prioritizing proven effective question types and difficulty levels
- **Color**: Cyan
- **Icon**: ◑

### 4. Stabilization Phase
**Criteria**: 150+ attempts, low mastery variance (< 400), good confidence calibration (< 0.3)

- **Description**: The system has a good understanding of your ability profile and has converged to a stable policy
- **Goal**: Maintain consistent performance
- **Behavior**: Predictable, stable question selection
- **Color**: Green
- **Icon**: ●

### 5. Adaptation Phase
**Criteria**: 150+ attempts but high variance or calibration issues

- **Description**: Over time, your performance changes — so the system continues to adapt by updating its policy with new data
- **Goal**: Adjust to changing performance
- **Behavior**: Responsive to recent performance shifts
- **Color**: Yellow
- **Icon**: ◉

### 6. Meta-Learning Phase
**Criteria**: 500+ attempts, excellent confidence calibration (< 0.15)

- **Description**: The system learns how to learn better — adjusting how fast it adapts, how to explore, etc.
- **Goal**: Optimize the learning process itself
- **Behavior**: Self-tuning, highly personalized
- **Color**: Purple
- **Icon**: ◈

## Database Schema

### user_progress Table Additions

```sql
-- RL Phase enum type
CREATE TYPE rl_phase AS ENUM (
  'cold_start',
  'exploration',
  'optimization',
  'stabilization',
  'adaptation',
  'meta_learning'
);

-- New columns
ALTER TABLE user_progress
ADD COLUMN rl_phase rl_phase DEFAULT 'cold_start',
ADD COLUMN rl_metadata JSONB DEFAULT '{
  "exploration_count": 0,
  "optimization_count": 0,
  "total_rewards": 0,
  "policy_updates": 0,
  "phase_transitions": [],
  "last_phase_change": null
}'::jsonb;
```

### Automatic Phase Calculation

The `calculate_rl_phase()` function automatically determines the appropriate phase based on:

1. **Total Attempts**: Primary indicator of experience
2. **Mastery Scores**: Average performance across Bloom levels
3. **Mastery Variance**: Consistency of performance
4. **Confidence Calibration Error**: How well self-assessment matches actual performance

### Automatic Phase Updates

A trigger (`trigger_update_rl_phase`) automatically updates the RL phase whenever:
- `total_attempts` changes
- `mastery_scores` changes
- `confidence_calibration_error` changes

## RL Metadata Structure

```typescript
{
  exploration_count: number       // Count of exploration actions
  optimization_count: number      // Count of optimization actions
  total_rewards: number          // Cumulative rewards earned
  policy_updates: number         // Number of policy adjustments
  phase_transitions: Array<{     // History of phase changes
    from: string
    to: string
    timestamp: string
    total_attempts: number
  }>
  last_phase_change: string | null  // Timestamp of last phase transition
}
```

## Usage in Code

### Display RL Phase

```typescript
import { RLPhaseBadge, RLPhaseIndicator } from '@/components/RLPhaseBadge'

// Simple badge
<RLPhaseBadge phase={userProgress.rl_phase} />

// With description
<RLPhaseBadge
  phase={userProgress.rl_phase}
  showDescription={true}
/>

// Compact indicator
<RLPhaseIndicator phase={userProgress.rl_phase} />
```

### Get Phase Information

```typescript
import { getRLPhaseInfo, getRLPhaseProgress } from '@/lib/utils/rl-phase'

const phaseInfo = getRLPhaseInfo(userProgress.rl_phase)
console.log(phaseInfo.name)         // "Exploration"
console.log(phaseInfo.description)  // "Testing different approaches..."
console.log(phaseInfo.color)        // "text-blue-400"

const progress = getRLPhaseProgress(userProgress.rl_phase)
console.log(progress)  // 33.33 (2/6 phases completed)
```

## Migration

To apply the RL Phase Tracking migration:

1. **Via Supabase Dashboard**:
   - Go to SQL Editor
   - Copy contents of `supabase/migrations/20250105_add_rl_phase_tracking.sql`
   - Run the migration

2. **Via CLI** (if Supabase CLI is installed):
   ```bash
   supabase db push
   ```

3. **Via Script**:
   ```bash
   node scripts/apply-rl-phase-migration.mjs
   ```

## Future Enhancements

1. **Personalized Thresholds**: Adjust phase criteria based on individual learning patterns
2. **Phase-Specific Strategies**: Different question selection strategies per phase
3. **Visualization**: Graph showing phase transitions over time
4. **Notifications**: Alert users when they advance to a new phase
5. **Analytics**: Track average time in each phase, most common transition paths

## Benefits

1. **Transparency**: Users see their learning journey progress
2. **Adaptation**: System behavior changes appropriately for each phase
3. **Motivation**: Clear milestones and progression
4. **Analytics**: Teachers/admins can see class-wide phase distribution
5. **Personalization**: Enables phase-specific learning strategies
