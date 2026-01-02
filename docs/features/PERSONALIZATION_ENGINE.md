# Personalization Engine

## Overview

The Personalization Engine provides individualized recommendations and insights for both learners and supervisors based on their assessment data, EPA trajectories, feedback quality, and benchmark comparisons.

## Database Schema

### Tables

#### `learner_personalization_summaries`
Stores cached personalization summaries for learners:
- `id` (UUID): Primary key
- `learner_id` (UUID): References `profiles`
- `specialty_id` (UUID, nullable): References `specialties`
- `cohort_id` (UUID, nullable): References `program_cohorts`
- `summary` (JSONB): Structured personalization data
- `generated_at` (TIMESTAMPTZ): When summary was generated
- `updated_at` (TIMESTAMPTZ): Last update timestamp

#### `supervisor_personalization_summaries`
Stores cached personalization summaries for supervisors:
- `id` (UUID): Primary key
- `supervisor_id` (UUID): References `profiles`
- `specialty_id` (UUID, nullable): References `specialties`
- `institution_id` (UUID, nullable): References `institutions`
- `summary` (JSONB): Structured personalization data
- `generated_at` (TIMESTAMPTZ): When summary was generated
- `updated_at` (TIMESTAMPTZ): Last update timestamp

### Helper Functions

#### `compute_learner_epa_summary(learner_id, lookback_days)`
Computes EPA trajectory summary for a learner from assessment data:
- Returns: `epa_code`, `current_level`, `assessment_count`, `latest_assessment_date`, `trend_slope`, `risk_flag`, `plateau_flag`
- Risk flag: `current_level < 2.5` OR no assessments in last 60 days
- Plateau flag: `trend_slope` near zero AND `current_level < 4`

## Rule Engine

### Learner Rules

1. **EPA Prioritization**:
   - Risk EPAs (risk_flag = true OR significantly below benchmark)
   - Plateau EPAs (plateau_flag = true OR trend near zero while below target)
   - Below-target EPAs (current_level < target_level)

2. **Priority Actions Generation**:
   - Risk EPAs: "Focus on [EPA]: you are X levels below cohort. Try to obtain 2-3 more observations in next 2 weeks."
   - Plateau EPAs: "Plateau detected in [EPA]: discuss with supervisor which behaviors to target next."
   - Below-target EPAs: "Continue building competency in [EPA]: you're making progress."

3. **Coaching Tags**:
   - Multiple risk/plateau EPAs → `theme:feedback_literacy_action`, `skill:ask_for_feedback`
   - Low WBA volume (< 5 in 30 days) → `topic:engagement`, `theme:feedback_literacy_appreciation`
   - Low scores (< 2.5) → `topic:improvement`, `theme:feedback_literacy_action`

### Supervisor Rules

1. **Learners of Interest**:
   - Find learners supervised in last 12 weeks
   - Flag learners with any EPA having `risk_flag` or `plateau_flag`
   - Include up to 3 key EPAs per learner

2. **Feedback Quality Analysis**:
   - Compute average overall score (0-100)
   - Identify strengths: dimensions consistently ≥ 3
   - Identify improvement areas: dimensions consistently ≤ 2
   - Compute AI usage rate: fraction using smart feedback assistant

3. **CME Teaching Snapshot**:
   - Sum CME hours for current calendar year
   - Count sessions for current calendar year

4. **Coaching Tags**:
   - Low specificity → `theme:educator_behaviours`, `topic:feedback_specificity`
   - Many learners with plateaus → `theme:feedback_literacy_action`, `topic:coaching_strategies`
   - Low AI usage + low quality → `topic:smart_feedback_usage`
   - Low engagement score → `theme:feedback_literacy_judgement`, `skill:ask_for_feedback`

## API & Functions

### Client-Side Functions

#### `generateAndSaveLearnerSummary(learnerId)`
Generates and caches learner personalization summary.

#### `generateAndSaveSupervisorSummary(supervisorId)`
Generates and caches supervisor personalization summary.

#### `getLearnerSummary(learnerId)`
Retrieves cached learner summary (generates on-demand if missing).

#### `getSupervisorSummary(supervisorId)`
Retrieves cached supervisor summary (generates on-demand if missing).

### Edge Function

#### `generate-personalization-summaries`
Supabase Edge Function for batch generation:
- **Endpoint**: `POST /functions/v1/generate-personalization-summaries`
- **Query Params**:
  - `role`: `learner` | `supervisor` (optional)
  - `userId`: Specific user UUID (optional)
  - `batchSize`: Number of users per batch (default: 50)
- **Usage**: Schedule via Supabase cron or external scheduler

## React Hooks

### `useLearnerPersonalization()`
Fetches and caches learner personalization summary:
```typescript
const { data: summary, isLoading, error } = useLearnerPersonalization();
```

### `useSupervisorPersonalization()`
Fetches and caches supervisor personalization summary:
```typescript
const { data: summary, isLoading, error } = useSupervisorPersonalization();
```

## UI Components

### Learner Dashboard

#### `LearnerPersonalizedPlan`
Displays:
- **Key EPAs**: List of prioritized EPAs with:
  - EPA title and code
  - Current level vs target level
  - Risk/Plateau/On Track badges
  - Benchmark comparison (delta vs cohort)
- **Priority Actions**: Bullet list of actionable suggestions
- **Suggested Focus Window**: Number of weeks to focus

**Location**: `StudentDashboard.tsx` (above Coaching Corner)

### Supervisor Dashboard

#### `SupervisorPersonalizedView`
Displays:
- **Learners Needing Attention**: Cards showing:
  - Learner name
  - Flagged EPAs with risk/plateau indicators
  - Benchmark deltas
- **Feedback & Teaching Snapshot**:
  - Average feedback quality score (0-100) with label
  - Strengths (bullet list)
  - Improvement areas (bullet list)
  - AI usage rate
  - CME hours and sessions (year to date)
  - Tooltip explaining developmental nature

**Location**: `SupervisorDashboard.tsx` (below Benchmark Comparison)

## Adaptive Coaching Corner Integration

The Coaching Corner selection has been enhanced to use personalization summaries:

1. **Primary**: Uses `coaching_tags` from personalization summary
2. **Fallback**: Uses activity-based tag analysis (existing logic)
3. **Final Fallback**: Generic items without tag filtering

**File**: `src/lib/adaptive-coaching.ts` → `getAdaptiveCoachingItem()`

## Update Strategy

### Scheduled Updates

1. **Nightly Job**: Run Edge Function to refresh all summaries
2. **On-Demand**: Call `refreshLearnerSummary()` or `refreshSupervisorSummary()`
3. **Automatic**: Summaries generated on-demand when missing

### When to Refresh

- After new assessments are submitted
- After feedback quality scores are updated
- After CME sessions are logged
- Nightly batch update (recommended)

## Security & Privacy

### RLS Policies

- **Learners**: Can only see their own summary
- **Supervisors**: Can see summaries for their assigned learners + their own summary
- **Admins**: Full access to all summaries

### Privacy Protection

- Summaries contain aggregated data only
- No PHI beyond what exists in assessments
- Benchmark comparisons use aggregated peer data

## Testing

### Manual Testing

1. **Generate Summary**:
   ```typescript
   const summary = await generateAndSaveLearnerSummary(userId);
   ```

2. **Verify UI**:
   - Check learner dashboard shows "My Focus Areas"
   - Check supervisor dashboard shows "Learners Needing Attention"
   - Verify Coaching Corner uses personalization tags

3. **Test Edge Function**:
   ```bash
   curl -X POST https://<project>.supabase.co/functions/v1/generate-personalization-summaries \
     -H "Authorization: Bearer <service_role_key>" \
     -H "Content-Type: application/json" \
     -d '{"role": "learner", "batchSize": 10}'
   ```

### Database Testing

```sql
-- Test learner summary generation
SELECT * FROM learner_personalization_summaries WHERE learner_id = '<uuid>';

-- Test supervisor summary generation
SELECT * FROM supervisor_personalization_summaries WHERE supervisor_id = '<uuid>';

-- Test EPA summary computation
SELECT * FROM compute_learner_epa_summary('<learner_uuid>', 180);
```

## Migration

Run the migration:

```bash
supabase migration up 20250119_personalization_engine
```

Or apply manually via Supabase dashboard.

## Next Steps

1. **Schedule Nightly Updates**: Set up Supabase cron or external scheduler
2. **Monitor Performance**: Track summary generation time and optimize if needed
3. **Refine Rules**: Adjust thresholds based on user feedback
4. **Add Notifications**: Alert learners/supervisors when new summaries are generated
5. **Historical Tracking**: Store summary history for trend analysis

## Notes

- The system computes EPA trajectories on-the-fly from assessments (no separate trajectory table required)
- Summaries are cached for performance (30-minute stale time in React Query)
- Edge Function includes placeholder logic - implement full rule engine server-side for production
- All rule thresholds are configurable in the rule engine files

