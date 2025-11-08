# RL System Transparency - Testing Guide

This guide walks you through testing the **100% transparent RL system** in Axium to verify that all decisions are being logged and displayed correctly.

---

## Prerequisites

1. **Run the migrations** (if not already done):
   - Open Supabase SQL Editor
   - Execute `RUN_DECISION_LOG_MIGRATION.sql`
   - **IMPORTANT:** Execute `FIX_RESPONSE_TIME_TYPE.sql` to fix data type issue
   - Verify the `rl_decision_log` table was created

2. **Have an active learning session:**
   - At least one chapter with topics
   - Some learning progress (or start fresh)

**Note:** If you see the error `invalid input syntax for type integer: "8.256"` in logs, you need to run the `FIX_RESPONSE_TIME_TYPE.sql` migration.

---

## Testing Checklist

### ✅ 1. Test Decision Logging (Backend)

**Goal:** Verify all RL decisions are being logged to the database.

**Steps:**

1. **Answer 3-5 questions** in a quiz session:
   ```
   Navigate to: /subjects/[subject]/[chapter]/quiz
   ```

2. **Check the decision log table** in Supabase:
   ```sql
   -- View all recent decisions (CORRECTED - use topic_id and bloom_level columns)
   SELECT
     decision_type,
     created_at,
     topic_id,
     bloom_level,
     selected_arm->>'topic_name' as selected_topic,
     is_correct,
     confidence,
     response_time_seconds,
     reward_components IS NOT NULL as has_rewards
   FROM rl_decision_log
   ORDER BY created_at DESC
   LIMIT 20;
   ```

3. **Expected Results:**
   - You should see 3 decision types per question answered:
     - `arm_selection` - Thompson Sampling chose this topic×Bloom (logged when question is fetched)
     - `reward_calculation` - Reward breakdown after answer (logged when answer is submitted)
     - `mastery_update` - Mastery score changed (logged when answer is submitted)
   - **Note:** You may see more `arm_selection` logs than the other types if you fetched a question but didn't answer it yet
   - Total for 3 answered questions: 9 records (3 of each type)
   - Total if 1 unanswered question is displayed: 10 records (4 arm_selection, 3 reward_calculation, 3 mastery_update)

**Pass Criteria:**
- ✅ All 3 decision types logged for each question
- ✅ `created_at` timestamps are sequential
- ✅ `user_id` matches your user ID

---

### ✅ 2. Test Audit Dashboard (Admin View)

**Goal:** Verify the audit dashboard displays all logged decisions correctly.

**Steps:**

1. **Navigate to the audit dashboard:**
   ```
   URL: /audit
   ```

2. **Test filtering:**
   - Click "All Decisions" → Should show all records
   - Click "Arm Selection" → Should show only Thompson Sampling decisions
   - Click "Reward Calculation" → Should show only reward breakdowns
   - Click "Mastery Update" → Should show only mastery changes

3. **Test decision details:**
   - Click any "Arm Selection" decision
   - **Expected:**
     - Right panel shows "REASONING" section
     - "Selected Arm" section with topic, Bloom level, sampled value
     - "All Arms Considered" table sorted by adjusted value
     - Selected arm highlighted in blue

   - Click any "Reward Calculation" decision
   - **Expected:**
     - "Response" section (Correct/Incorrect, Confidence, Response Time)
     - "Reward Breakdown" with all components:
       - Learning Gain
       - Calibration
       - Spacing
       - Recognition
       - Response Time
       - Streak
       - Total

   - Click any "Mastery Update" decision
   - **Expected:**
     - Old Mastery → New Mastery visualization
     - Change amount (+ or -)
     - Formula showing EMA calculation

4. **Test refresh:**
   - Click the refresh button (↻)
   - Should reload latest decisions

**Pass Criteria:**
- ✅ All filters work correctly
- ✅ Decision details display all expected fields
- ✅ Selected arm is highlighted in "All Arms Considered" table
- ✅ Reward breakdown shows all 7 components (6 + total)
- ✅ Mastery formula is displayed

---

### ✅ 3. Test RL State Viewer (Performance Page)

**Goal:** Verify current Thompson Sampling state is displayed with alpha/beta values.

**Steps:**

1. **Navigate to performance page:**
   ```
   URL: /performance/[subject]/[chapter]
   ```

2. **Locate "Thompson Sampling State" section:**
   - Should appear between "Exam Score Prediction" and "Mastery Heatmap"
   - Only appears if you have RL arm stats (after answering questions)

3. **Expand the section:**
   - Click the section header to expand
   - Should see a table with columns:
     - Topic
     - Bloom
     - Alpha (α)
     - Beta (β)
     - Est. Success
     - Times Selected
     - Avg Reward

4. **Verify data:**
   - **Alpha/Beta values:** Should be ≥ 1.00 (start with prior of 1.0)
   - **Est. Success:** Should be calculated as `α/(α+β) × 100`
     - Example: α=3.5, β=1.5 → 3.5/(3.5+1.5) = 70%
   - **Color coding:**
     - Green (≥70%) - High success rate
     - Yellow (50-69%) - Medium success rate
     - Red (<50%) - Low success rate
   - **Times Selected:** Should match number of questions answered for that arm
   - **Avg Reward:** Should be between -1.0 and 1.0 typically

5. **Verify per-topic Bloom progression:**
   - You may see same topic at multiple Bloom levels (e.g., "Cryptography" at Bloom 1 AND Bloom 2)
   - Higher Bloom levels only appear after mastering previous level (80% + 3 correct)
   - Different topics can be at different Bloom levels (e.g., "Cryptography Bloom 2" + "Firewalls Bloom 1")

6. **Hover over values:**
   - Tooltip on "Est. Success" should explain calculation
   - Tooltip on "Avg Reward" should explain higher = better

7. **Check explanation section:**
   - Should explain what Alpha, Beta, Thompson Sampling mean
   - Should be at bottom of expanded section

**Pass Criteria:**
- ✅ Table displays all arms with non-zero stats
- ✅ Alpha and Beta values are correct (≥1.0)
- ✅ Estimated success rate calculation is correct
- ✅ Color coding matches success rate
- ✅ Tooltips provide helpful explanations
- ✅ Explanation section is clear and accurate
- ✅ Per-topic Bloom progression visible (same topic at multiple levels)

---

### ✅ 4. Test Decision Explainer (Quiz Feedback)

**Goal:** Verify users see why each question was selected after answering.

**Steps:**

1. **Start a new quiz:**
   ```
   URL: /subjects/[subject]/[chapter]/quiz
   ```

2. **Answer a question:**
   - Select confidence level
   - Choose an answer
   - Select recognition method (how you arrived at answer)
   - Submit

3. **Check feedback step:**
   - After submitting, you should see feedback
   - **Look for "Why This Question?" section**
   - Should appear after explanation and before mastery updates

4. **Verify content:**
   - **Reasoning text:** Should explain Thompson Sampling decision
     - Example: *"Thompson Sampling: Sampled 809 arms, selected Application Security (Bloom 1) with adjusted sample 2.857 (raw: 0.952, mastery: 0.0%)"*
   - **Arm count:** Should show ~809 arms initially (all topics at Bloom 1)
   - **Alternatives count:** Should show number like *"808 other topics were considered by Thompson Sampling"*

5. **Test multiple questions:**
   - Answer 3-5 more questions
   - Each should show different reasoning based on current state
   - Topics with lower mastery should be selected more often

6. **After mastering a topic (80% + 3 correct):**
   - Bloom 2 for that topic should unlock
   - Arm count should increase (e.g., 809 → 810)
   - You may see reasoning like *"Sampled 810 arms, selected Cryptography (Bloom 2)..."*

**Pass Criteria:**
- ✅ "Why This Question?" section appears in feedback
- ✅ Reasoning explains Thompson Sampling decision
- ✅ Shows specific topic name and Bloom level selected
- ✅ Initial arm count is ~809 (all topics at Bloom 1)
- ✅ Arm count increases as Bloom levels unlock
- ✅ Shows number of alternatives considered
- ✅ Text is clear and understandable

---

## Verification Queries

Use these SQL queries in Supabase to verify logging is working correctly:

### Check Decision Count by Type
```sql
SELECT
  decision_type,
  COUNT(*) as count
FROM rl_decision_log
WHERE user_id = 'YOUR_USER_ID'
GROUP BY decision_type
ORDER BY count DESC;
```

**Expected:** Roughly equal counts for each type (arm_selection, reward_calculation, mastery_update).

---

### View Recent Arm Selections
```sql
SELECT
  created_at,
  selected_arm->>'topic_name' as topic,
  selected_arm->>'bloom_level' as bloom,
  selected_arm->>'adjusted_value' as adjusted_sample,
  selection_reasoning
FROM rl_decision_log
WHERE decision_type = 'arm_selection'
  AND user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC
LIMIT 10;
```

**Expected:** See which topics were selected and why.

---

### View Reward Breakdown
```sql
SELECT
  created_at,
  is_correct,
  confidence,
  reward_components->'total' as total_reward,
  reward_components->'learningGain' as learning_gain,
  reward_components->'calibration' as calibration,
  reward_components->'spacing' as spacing
FROM rl_decision_log
WHERE decision_type = 'reward_calculation'
  AND user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC
LIMIT 10;
```

**Expected:** See full reward calculation for each answer.

---

### Track Mastery Progression
```sql
SELECT
  created_at,
  old_mastery,
  new_mastery,
  (new_mastery - old_mastery) as change,
  mastery_formula
FROM rl_decision_log
WHERE decision_type = 'mastery_update'
  AND user_id = 'YOUR_USER_ID'
  AND topic_id = 'YOUR_TOPIC_ID'
ORDER BY created_at DESC;
```

**Expected:** See how mastery score evolved over time for a specific topic.

---

## Common Issues and Solutions

### Issue 1: No decisions in audit log
**Symptoms:** Audit page shows empty list or "No decisions yet"

**Solutions:**
1. Check if migration was run: `SELECT * FROM rl_decision_log LIMIT 1;`
2. Answer at least one question in quiz
3. Check browser console for errors
4. Verify user is logged in

---

### Issue 2: RL State Viewer not showing
**Symptoms:** "Thompson Sampling State" section missing on performance page

**Solutions:**
1. Answer at least one question to create arm stats
2. Check `rl_arm_stats` table: `SELECT COUNT(*) FROM rl_arm_stats WHERE user_id = 'YOUR_USER_ID';`
3. If count is 0, the section won't appear (working as designed)

---

### Issue 3: Decision explainer not showing in quiz
**Symptoms:** No "Why This Question?" section in feedback

**Solutions:**
1. Check if `decision_context` is being returned by API
2. Open browser DevTools → Network tab
3. Look for `/api/rl/next-question` response
4. Verify it includes `decision_context` field with `reasoning` and `alternatives_count`

---

### Issue 4: Alpha/Beta values always 1.0
**Symptoms:** All arms show α=1.00, β=1.00

**Solutions:**
1. This is normal for new arms (uniform prior)
2. Values update after selecting the arm
3. Check `rl_arm_stats` to see if times_selected > 0
4. If times_selected > 0 but α/β still 1.0, check `update_arm_stats_by_id` function

---

### Issue 5: reward_calculation logs missing
**Symptoms:** Only see `arm_selection` and `mastery_update`, no `reward_calculation`

**Solutions:**
1. Check Vercel logs for error: "invalid input syntax for type integer"
2. If you see this error, run `FIX_RESPONSE_TIME_TYPE.sql`:
   ```sql
   ALTER TABLE rl_decision_log
   ALTER COLUMN response_time_seconds TYPE DECIMAL(10,3);
   ```
3. This fixes the data type mismatch (INTEGER vs DECIMAL for fractional seconds)
4. After running, answer 1 question to verify fix worked

---

### ✅ 5. Test Data Deletion Transparency

**Goal:** Verify all data deletions (reset progress) are logged with full snapshots.

**Steps:**

1. **Navigate to performance page with existing progress:**
   ```
   URL: /performance/[subject]/[chapter]
   ```

2. **Trigger a reset (choose one):**

   **Option A: Reset entire chapter**
   - Click "Reset Progress" button on chapter performance page
   - Confirm the reset action

   **Option B: Reset specific topic**
   - Navigate to topic detail page: `/performance/[subject]/[chapter]/[topic]`
   - Click "Reset Topic Progress" button
   - Optionally select specific Bloom level to reset

3. **Check the decision log in Supabase:**
   ```sql
   -- View deletion log
   SELECT
     decision_type,
     created_at,
     selection_reasoning,
     state_snapshot->'scope' as scope,
     state_snapshot->'deleted_counts' as deleted_counts
   FROM rl_decision_log
   WHERE decision_type = 'data_deletion'
   ORDER BY created_at DESC
   LIMIT 5;
   ```

4. **Expected Results:**
   - One `data_deletion` log entry created
   - `selection_reasoning` contains reason (e.g., "User-initiated chapter progress reset")
   - `state_snapshot.scope` is one of:
     - `chapter` - Full chapter reset
     - `topic` - Full topic reset (all Bloom levels)
     - `topic_bloom_level` - Specific topic×Bloom reset
   - `state_snapshot.deleted_counts` shows counts:
     - `responses` - Number of user_responses deleted
     - `sessions` - Number of learning_sessions deleted
     - `mastery` - Number of user_topic_mastery deleted
     - `armStats` - Number of rl_arm_stats deleted
     - `progress` - Number of user_progress deleted
     - `questions` - Number of AI-generated questions deleted
   - `state_snapshot.data_snapshot` contains full snapshot of deleted data

5. **Test audit dashboard:**
   - Go to `/audit`
   - Click "Data Deletion" filter
   - Should see deletion event(s)
   - Click on deletion event
   - **Expected:**
     - Right panel shows "Reason" section
     - "Scope" section (chapter/topic/topic_bloom_level)
     - "Records Deleted" with counts
     - "Data Snapshot" showing recoverable data

6. **Verify data snapshot integrity:**
   ```sql
   -- View snapshot details
   SELECT
     id,
     created_at,
     state_snapshot->'data_snapshot'->'responses' as responses_snapshot,
     state_snapshot->'data_snapshot'->'mastery' as mastery_snapshot,
     state_snapshot->'data_snapshot'->'armStats' as arm_stats_snapshot
   FROM rl_decision_log
   WHERE decision_type = 'data_deletion'
   ORDER BY created_at DESC
   LIMIT 1;
   ```
   - Each snapshot should contain array of deleted records
   - Records should have full data (not just IDs)
   - Snapshot enables theoretical recovery if needed

**Pass Criteria:**
- ✅ Deletion event logged immediately after reset
- ✅ Reason explains why deletion occurred
- ✅ Scope correctly identifies what was deleted
- ✅ Deleted counts match actual deletions
- ✅ Data snapshot contains full records (not just counts)
- ✅ Audit dashboard displays deletion correctly
- ✅ All deletion fields populated

**Recovery Potential:**
While not implemented, the snapshot allows you to:
- Audit what was deleted and when
- Verify user didn't accidentally delete important progress
- Theoretically restore data if needed (manual process)
- Debug issues related to missing data

---

## End-to-End Test Scenario

**Complete walkthrough to verify full transparency:**

1. **Setup:**
   - Clear decision log (optional): `DELETE FROM rl_decision_log WHERE user_id = 'YOUR_USER_ID';`
   - Note current time: `SELECT NOW();`

2. **Answer 5 questions:**
   - Go to `/subjects/security-plus/architecture-and-design/quiz`
   - Answer 5 questions with varying correctness
   - Note the topics/Bloom levels selected

3. **Verify logging (Supabase):**
   ```sql
   SELECT decision_type, COUNT(*)
   FROM rl_decision_log
   WHERE user_id = 'YOUR_USER_ID'
     AND created_at > 'YOUR_START_TIME'
   GROUP BY decision_type;
   ```
   - Should see 5 of each type (15 total)

4. **Check audit dashboard:**
   - Go to `/audit`
   - Filter to "Arm Selection" → Should see 5 decisions
   - Click first one → Verify all arms shown with samples
   - Filter to "Reward Calculation" → Should see 5 decisions
   - Click first one → Verify all reward components
   - Filter to "Mastery Update" → Should see 5 decisions
   - Click first one → Verify old→new mastery with formula

5. **Check performance page:**
   - Go to `/performance/security-plus/architecture-and-design`
   - Expand "Thompson Sampling State"
   - Verify 5 arms have `times_selected ≥ 1`
   - Check α/β values updated from 1.0 baseline

6. **Check quiz feedback:**
   - Go back to quiz and answer 1 more question
   - In feedback, verify "Why This Question?" appears
   - Note the reasoning matches selected topic

**Pass Criteria:**
- ✅ All 18 decisions logged (6 questions × 3 types)
- ✅ Audit dashboard shows all decisions correctly
- ✅ RL state viewer shows updated α/β values
- ✅ Decision explainer appears in quiz feedback

---

## Success Metrics

The RL system is **100% transparent** when:

1. **Every decision is logged:**
   - ✅ Arm selection (Thompson Sampling)
   - ✅ Reward calculation (all components)
   - ✅ Mastery update (EMA formula)
   - ✅ Data deletion (reset progress with snapshots)

2. **Audit trail is complete:**
   - ✅ Can replay any session
   - ✅ Can debug "Why did I get this question?"
   - ✅ Can verify reward calculations
   - ✅ Can audit what data was deleted and when

3. **User-facing transparency:**
   - ✅ Users see why questions were selected
   - ✅ Users can view current RL state
   - ✅ Admins can audit all decisions (including deletions)

4. **Data integrity:**
   - ✅ No missing decisions
   - ✅ Timestamps are sequential
   - ✅ All foreign keys valid
   - ✅ Deleted data snapshots preserved

---

## Next Steps

After verifying transparency:

1. **Monitor performance:**
   - Check decision log table size growth
   - Consider retention policy (e.g., keep 90 days)
   - Add indexes if queries are slow

2. **Add analytics:**
   - Track which arms are selected most often
   - Identify topics with consistently low rewards
   - Detect calibration issues (overconfident/underconfident users)

3. **Export for research:**
   - Use decision log for papers/analysis
   - Demonstrate RL algorithm effectiveness
   - A/B test different sampling strategies

4. **User education:**
   - Show users how RL works
   - Explain why adaptive learning is beneficial
   - Build trust through transparency

---

## Troubleshooting

If any test fails, check:

1. **Migration:** `\d rl_decision_log` in psql or check table schema in Supabase
2. **Data type fix:** Ensure `response_time_seconds` is DECIMAL(10,3), not INTEGER
   - Run: `SELECT data_type FROM information_schema.columns WHERE table_name = 'rl_decision_log' AND column_name = 'response_time_seconds';`
   - If returns 'integer', run `FIX_RESPONSE_TIME_TYPE.sql`
3. **Logging calls:** Check Vercel function logs for errors after answering questions
4. **API responses:** Check Network tab in DevTools for `/api/rl/*` endpoints
5. **Database permissions:** Verify RLS policies allow inserts/selects

**Common Error:** `invalid input syntax for type integer: "8.256"`
- **Cause:** `response_time_seconds` column is INTEGER instead of DECIMAL
- **Fix:** Run `FIX_RESPONSE_TIME_TYPE.sql` in Supabase SQL Editor

**Need help?** Check `TRANSPARENCY_IMPLEMENTATION.md` for implementation details.

---

## Conclusion

The RL system is now **100% transparent**. Every decision is logged, auditable, and explainable. Users can see why questions were selected, admins can debug issues, researchers can analyze the learning process, and all data deletions are tracked with full snapshots for recovery.

**Decision Types Logged:**
1. `arm_selection` - Thompson Sampling topic selection
2. `reward_calculation` - Reward component breakdown
3. `mastery_update` - Mastery score changes (EMA)
4. `data_deletion` - Progress resets with snapshots

**Happy testing!**
