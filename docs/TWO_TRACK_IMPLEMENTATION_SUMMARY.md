# Two-Track RL Calibration System - Implementation Summary

## Overview

Successfully implemented a sophisticated two-track reward system that eliminates question format bias while providing rich learning analytics and metacognitive tracking.

---

## ✅ Completed Features

### 1. Database Schema Updates

**Files Modified:**
- `supabase/schema.sql`
- `supabase/migrations/20251115_add_statistical_tracking.sql`

**Changes:**
- Added calibration statistics columns to `user_progress`:
  - `calibration_mean` - Average calibration score (-1.5 to +1.5)
  - `calibration_stddev` - Consistency measurement
  - `calibration_slope` - Linear regression slope (improvement rate)
  - `calibration_r_squared` - Trend reliability (0-1)
  - `questions_to_mastery` - Projected questions to reach mastery
  - `rl_phase` - Current RL phase (cold_start, exploration, optimization, stabilization)

- Updated `mastery_scores` structure to track by format:
  ```json
  {
    "1": {
      "mcq_single": 85,
      "open_ended": 70
    },
    "2": {
      "mcq_single": 78
    }
  }
  ```

- Added to `user_responses`:
  - `calibration_score` - TRACK 1 (format-independent)
  - `question_format` - Question type tracking
  - `reward` - Legacy field (same as calibration_score)

**Statistical Functions:**
- `calculate_calibration_regression()` - Linear regression with R²
- `calculate_calibration_stddev()` - Standard deviation
- `determine_rl_phase()` - Phase classification
- `project_questions_to_mastery()` - Time-to-mastery projection
- Automatic trigger (`update_calibration_statistics`) - Updates stats after each response

**Analytics Views:**
- `v_calibration_trends` - Daily calibration aggregates
- `v_format_performance` - Format-specific metrics
- `v_rl_phase_distribution` - Phase statistics

---

### 2. Two-Track Reward System

**TRACK 1: Calibration Score (Format-Independent)**
- **Purpose:** RL optimization, topic selection, adaptive learning
- **Range:** -1.5 to +1.5
- **Measures:** Metacognitive accuracy (confidence × recognition method × correctness)
- **Use:** ALL RL decisions use ONLY this track

**TRACK 2: Correctness Score (Format-Dependent)**
- **Purpose:** Student motivation, progress display
- **Range:** 0-100% per format
- **Measures:** Raw correctness within each format
- **Use:** Display only, NEVER compared across formats

**Benefit:** Eliminates format bias by separating metacognition (comparable) from correctness (not comparable).

---

### 3. 24-Scenario Calibration Matrix

**Implementation:** `app/api/quiz/submit/route.ts` - `calculateCalibrationScore()`

**Dimensions:**
- **Correctness:** Correct / Incorrect
- **Confidence:** Low (1), Medium (2), High (3)
- **Recognition Method:** Memory, Recognition, Educated Guess, Random Guess

**Example Scenarios:**
| Correctness | Confidence | Method | Score | Interpretation |
|-------------|-----------|--------|-------|----------------|
| Correct | High (3) | Memory | +1.5 | Perfect mastery |
| Correct | Low (1) | Random Guess | +0.5 | Lucky but honest |
| Incorrect | High (3) | Memory | -1.5 | False memory (worst) |
| Incorrect | Low (1) | Random Guess | -0.2 | Excellent calibration despite error |

---

### 4. Recognition Method Filtering

**Files:**
- `lib/utils/recognition-method.ts` - Filtering logic
- `components/quiz/RecognitionMethodSelector.tsx` - Dynamic UI
- `app/learn/page.tsx` - Integration

**Filtering Rules:**
- **MCQ (single/multi), Fill-blank, True/False, Matching:** All 4 methods
  - Rationale: Options available to recognize
- **Open-ended:** Only 2 methods (memory, educated_guess)
  - Rationale: No options to recognize or guess randomly

**User Experience:**
- Selector automatically shows only valid methods
- Auto-selects appropriate default when format changes
- Displays explanation when methods are filtered

---

### 5. Statistical Analysis

**Linear Regression:**
- **Slope:** Rate of improvement per question
- **R²:** Trend reliability (0 = no trend, 1 = perfect fit)
- **Purpose:** Detect consistent improvement, plateaus, regression

**Standard Deviation:**
- **Measures:** Consistency of calibration
- **Purpose:** Detect exploration vs. stabilization phases
- **Interpretation:**
  - < 0.3: Very consistent (stabilization)
  - 0.3-0.6: Moderate variance (optimization)
  - > 0.6: High variance (exploration)

**Questions to Mastery Projection:**
- **Formula:** `(threshold - current) / slope`
- **Threshold:** +1.2 calibration score
- **Requirements:** R² > 0.5, slope > 0
- **Purpose:** Motivational goal-setting

---

### 6. RL Phase Tracking

**Phases:**
1. **Cold Start** (< 10 attempts) - Gray ○
   - Gathering initial data
   - Random exploration

2. **Exploration** (10-50 attempts) - Blue ◐
   - Testing strategies
   - Finding what works

3. **Optimization** (50-150 attempts) - Cyan ◑
   - Focusing on high-value actions
   - Refining approach

4. **Stabilization** (150+ attempts, low variance) - Green ●
   - Stable, consistent performance
   - Converged policy

**Phase Determination Logic:**
```sql
FUNCTION determine_rl_phase(
  attempts,
  stddev,
  slope,
  r_squared
)
```

**Purpose:** Adaptive exploration/exploitation balance

---

### 7. Enhanced UI Components

**AnswerFeedback Updates:**
- `components/quiz/AnswerFeedback.tsx`
- Displays calibration score prominently
- Visual scale showing -1.5 to +1.5 range
- Detailed explanation of score meaning
- Color-coded: Green (positive), Red (negative)

**Recognition Method Selector:**
- `components/quiz/RecognitionMethodSelector.tsx`
- Filters methods by question format
- Auto-selects appropriate default
- Displays filtering explanation

**QuizPage Integration:**
- `app/learn/page.tsx`
- Passes question format to selector
- Submits recognition method with answer
- Displays calibration score in feedback

---

### 8. Analytics Dashboard

**Main Page:** `app/analytics/page.tsx`

**Features:**
1. **Topic Selector** - Choose which topic to analyze
2. **Key Metrics Cards:**
   - Average Calibration
   - Consistency (StdDev)
   - Learning Rate (Slope)
   - Questions to Mastery

3. **RL Phase Indicator:**
   - Visual progress bar through phases
   - Phase-specific descriptions
   - Attempt count milestones

4. **Daily Trend Chart:**
   - Bar chart showing daily avg calibration
   - Color-coded (green = positive, red = negative)
   - Peak/average/total stats

5. **Advanced Line Chart:**
   - Individual responses plotted
   - Linear regression trend line
   - R² and slope displayed
   - Hover tooltips with details

6. **Scatter Plot with Distribution:**
   - All responses as scatter points
   - Color-coded by recognition method
   - Confidence bands (±1 stddev)
   - Regression line overlay
   - Pattern analysis

7. **Format Performance Grid:**
   - Correctness rate per format (TRACK 2)
   - Calibration score per format (TRACK 1)
   - Average confidence
   - Attempt counts

---

### 9. Advanced Visualization Components

**CalibrationLineChart:**
- `components/analytics/CalibrationLineChart.tsx`
- SVG-based line chart with regression
- Interactive tooltips
- R² interpretation
- Trend reliability indicators

**CalibrationScatterPlot:**
- `components/analytics/CalibrationScatterPlot.tsx`
- Distribution visualization
- Confidence bands
- Recognition method color-coding
- Pattern analysis text

---

## 🎯 System Benefits

### For Students:
1. **Fair Evaluation:** No penalty for trying harder formats
2. **Metacognitive Growth:** Learn to assess own knowledge
3. **Clear Goals:** See projected time to mastery
4. **Pattern Recognition:** Understand learning habits

### For the RL System:
1. **Unbiased Rewards:** Format-independent calibration
2. **Rich Data:** 4 recognition methods vs. 1
3. **Phase Detection:** Automatic exploration/exploitation
4. **Trend Analysis:** Detect plateaus, regressions, breakthroughs

### For Analytics:
1. **Comparable Metrics:** Calibration works across formats
2. **Deep Insights:** Linear regression, R², stddev
3. **Visual Clarity:** Multiple chart types
4. **Actionable Data:** Projection to mastery, phase indicators

---

## 📊 Data Flow

### Question Answered:
1. User submits answer with confidence + recognition method
2. **Calculate:**
   - Correctness (TRACK 2)
   - Calibration score from 24-scenario matrix (TRACK 1)
3. **Store:**
   - Response record with both tracks
   - Trigger auto-calculates statistics
4. **Update:**
   - Format-specific mastery (TRACK 2)
   - Calibration statistics (TRACK 1)
   - RL phase classification
5. **Display:**
   - Calibration score with visual scale
   - Contextual feedback message
   - Progress indicators

### Analytics View:
1. Select topic
2. Fetch:
   - User progress (with statistics)
   - Daily trends (aggregated)
   - Individual responses (for charts)
   - Format performance
3. Calculate:
   - Regression intercept for visualizations
   - Percentage within confidence band
4. Render:
   - Metrics cards
   - RL phase progress
   - Multiple chart types
   - Format breakdown

---

## 🧪 Testing Checklist

### Unit Testing:
- [ ] Test all 24 calibration scenarios
- [ ] Verify recognition method filtering
- [ ] Test statistical calculations
- [ ] Verify RL phase transitions
- [ ] Test format-specific mastery tracking

### Integration Testing:
- [ ] Submit answers with all 4 recognition methods
- [ ] Test MCQ (all 4 methods available)
- [ ] Test open-ended (only 2 methods)
- [ ] Verify calibration score calculation
- [ ] Verify format-specific correctness tracking

### UI Testing:
- [ ] Answer 10+ questions to unlock advanced charts
- [ ] Verify line chart displays correctly
- [ ] Verify scatter plot shows distribution
- [ ] Check RL phase progress bar
- [ ] Test format performance grid

### Analytics Testing:
- [ ] Generate diverse data (correct/incorrect, all confidences, all methods)
- [ ] Verify daily trend aggregation
- [ ] Check regression line accuracy
- [ ] Verify R² calculation
- [ ] Test questions-to-mastery projection

### Database Testing:
- [ ] Run migration script
- [ ] Verify triggers fire correctly
- [ ] Check view queries perform well
- [ ] Test legacy data migration
- [ ] Verify indexes exist

---

## 🚀 Deployment Steps

### 1. Database Migration
```bash
# Run migration
psql -U postgres -d axium -f supabase/migrations/20251115_add_statistical_tracking.sql

# Verify tables updated
psql -U postgres -d axium -c "\d user_progress"
psql -U postgres -d axium -c "\d user_responses"

# Test functions
SELECT calculate_calibration_regression('user_id', 'topic_id');
SELECT determine_rl_phase(25, 0.4, 0.01, 0.6);
```

### 2. Application Deployment
```bash
# Install dependencies (if any new ones)
npm install

# Build application
npm run build

# Test locally
npm run dev

# Deploy to production
# (Your deployment process here)
```

### 3. Data Verification
```sql
-- Check calibration scores populated
SELECT COUNT(*) FROM user_responses WHERE calibration_score IS NOT NULL;

-- Check statistics calculated
SELECT
  topic_id,
  calibration_mean,
  calibration_slope,
  rl_phase
FROM user_progress
WHERE total_attempts > 0;

-- Check views working
SELECT * FROM v_calibration_trends LIMIT 10;
SELECT * FROM v_format_performance LIMIT 10;
```

---

## 📈 Expected Results

### After 10 Questions:
- Basic statistics available
- RL phase: "Cold Start" or "Exploration"
- Daily trend chart visible
- Format performance grid populated

### After 50 Questions:
- Linear regression reliable (R² > 0.4)
- RL phase: "Exploration" or "Optimization"
- Scatter plot shows clear distribution
- Confidence bands visible
- Questions to mastery projected

### After 150+ Questions:
- High reliability (R² > 0.7)
- RL phase: "Optimization" or "Stabilization"
- Clear learning patterns visible
- Accurate time-to-mastery projection
- Consistent calibration (low stddev)

---

## 🔧 Configuration Options

### Calibration Matrix
- Edit: `app/api/quiz/submit/route.ts` - `calculateCalibrationScore()`
- Adjust rewards for different scenarios
- Current range: -1.5 to +1.5

### RL Phase Thresholds
- Edit: `supabase/migrations/20251115_add_statistical_tracking.sql` - `determine_rl_phase()`
- Current: 10, 50, 150 attempts
- Adjust based on learning curve

### Mastery Threshold
- Edit: `project_questions_to_mastery()` function
- Current: +1.2 calibration score
- Adjust based on desired proficiency

### Minimum Data Requirements
- Edit: `app/analytics/page.tsx`
- Current: 10 responses for advanced charts
- Adjust based on statistical significance needs

---

## 📝 Notes

### Backward Compatibility:
- Legacy `reward` field maintained (stores same value as `calibration_score`)
- Legacy mastery format migrated automatically: `{"1": 85}` → `{"1": {"overall": 85}}`
- Migration functions handle existing data gracefully

### Performance Considerations:
- Statistical calculations triggered after each response
- Views use indexed columns for fast queries
- Charts render client-side for responsiveness
- Consider caching for large datasets

### Future Enhancements:
- Export analytics data to CSV/PDF
- Comparative analytics (user vs. cohort average)
- RL-driven topic recommendations
- Adaptive question format selection based on performance
- Real-time notifications for phase transitions

---

## 🎓 Key Learnings

### Why Two Tracks:
Different question formats have different base difficulty levels. Comparing correctness across formats creates unfair bias. By separating metacognition (calibration) from correctness, we get:
1. Fair RL rewards
2. Meaningful student metrics
3. Format-specific insights

### Why Recognition Methods:
Traditional systems only ask "how confident are you?" Adding "how did you arrive at your answer?" provides:
1. 24 scenarios vs. 6 (4x richer data)
2. Metacognitive awareness
3. Better calibration signals
4. Pattern detection (e.g., always guessing)

### Why Statistical Analysis:
Single-point metrics don't show learning trajectory. By tracking trends:
1. Detect improvement vs. plateau
2. Project time to mastery
3. Identify RL phases automatically
4. Provide actionable insights

---

## 📞 Support

For questions or issues:
1. Check `docs/` folder for additional documentation
2. Review migration SQL for function definitions
3. Inspect component code for implementation details
4. Test with diverse data to validate behavior

---

**Implementation Date:** November 15, 2025
**Status:** ✅ Complete - Ready for Testing
**Next Step:** End-to-end system testing
