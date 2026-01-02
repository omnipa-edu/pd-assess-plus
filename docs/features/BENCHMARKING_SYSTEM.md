# Competency Trajectory Benchmarking System

## Overview

The benchmarking system enables learners and supervisors to compare EPA competency trajectories against multiple scopes of peer groups. This provides context for understanding whether a learner's progress is ahead, on track, or at risk relative to their peers.

## Database Schema

### Tables

#### `program_cohorts`
Stores cohort information for grouping learners:
- `id` (UUID): Primary key
- `specialty_id` (UUID): References `specialties` (used as programs)
- `institution_id` (UUID): References `institutions`
- `department_id` (UUID, nullable): References `departments`
- `name` (TEXT): Cohort name (e.g., "PA Class of 2027")
- `start_date` (DATE): Cohort start date
- `end_date` (DATE, nullable): Cohort end date
- `is_active` (BOOLEAN): Whether the cohort is currently active

#### `epa_benchmarks`
Stores aggregated benchmark statistics:
- `id` (UUID): Primary key
- `scope` (benchmark_scope): The comparison scope
- `institution_id`, `department_id`, `specialty_id`, `cohort_id` (UUID, nullable): Scope identifiers
- `epa_code` (TEXT): EPA code (matches `epa_assessments.epa_number`)
- `epa_id` (UUID, nullable): Reference to `epas` table
- `time_from_start_days` (INTEGER): Days since cohort/program start
- `expected_level` (NUMERIC): Mean or median level
- `p25_level`, `p75_level` (NUMERIC, nullable): Percentile levels
- `n_learners` (INTEGER): Number of learners in benchmark
- `n_assessments` (INTEGER): Number of assessments aggregated

### Enum

#### `benchmark_scope`
Defines the scope of comparison:
- `current_cohort`: Compare against current cohort
- `previous_cohorts_program`: Compare against previous cohorts in same program
- `all_cohorts_program`: Compare against all cohorts in same program
- `all_cohorts_department`: Compare against all cohorts in same department
- `all_cohorts_institution`: Compare against all cohorts at same institution
- `all_cohorts_discipline`: Compare against all cohorts in same discipline (cross-institution)

## Populating Benchmarks

### Overview

Benchmarks should be populated by a scheduled job (Supabase Edge Function, cron, or server script) that aggregates assessment data. The aggregation logic is not implemented in this pass but should:

1. Group assessments by scope (cohort, program, department, institution, discipline)
2. Calculate statistics (mean, median, percentiles) per EPA and time bucket
3. Store results in `epa_benchmarks` table

### Example Aggregation Logic (Stub)

```sql
-- Example: Aggregate benchmarks for current_cohort scope
-- This is a placeholder - implement full aggregation based on your trajectory calculation

INSERT INTO epa_benchmarks (
  scope, cohort_id, specialty_id, institution_id, department_id,
  epa_code, epa_id, time_from_start_days,
  expected_level, p25_level, p75_level, n_learners, n_assessments
)
SELECT 
  'current_cohort'::benchmark_scope,
  pc.id as cohort_id,
  pc.specialty_id,
  pc.institution_id,
  pc.department_id,
  ea.epa_number as epa_code,
  e.id as epa_id,
  compute_time_from_start(pc.start_date, ea.created_at::date) as time_from_start_days,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY try_cast(ea.rating as numeric)) as expected_level,
  PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY try_cast(ea.rating as numeric)) as p25_level,
  PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY try_cast(ea.rating as numeric)) as p75_level,
  COUNT(DISTINCT ea.student_id) as n_learners,
  COUNT(*) as n_assessments
FROM epa_assessments ea
JOIN profiles p ON ea.student_id = p.id
JOIN program_cohorts pc ON p.cohort_id = pc.id
LEFT JOIN epas e ON e.code = ea.epa_number AND e.specialty_id = pc.specialty_id
WHERE pc.is_active = true
GROUP BY pc.id, pc.specialty_id, pc.institution_id, pc.department_id, 
         ea.epa_number, e.id, time_from_start_days;
```

### Time Buckets

Consider using time buckets (e.g., 0, 30, 60, 90, 120, 180, 365 days) to reduce data volume and improve query performance. The `getBenchmarkFor` function will find the nearest bucket ≤ the requested time.

## Frontend Components

### Learner View

**Location**: `StudentDashboard.tsx` → EPA Assessments tab

**Features**:
- "View Trajectory & Benchmark" button on each EPA assessment card
- `EpaTrajectoryView` component displays:
  - Benchmark scope selector dropdown
  - Current level vs benchmark comparison
  - Status indicator (Ahead / On Track / At Risk)
  - Benchmark statistics (median, P25, P75)

### Supervisor View

**Location**: `SupervisorDashboard.tsx`

**Features**:
- `SupervisorBenchmarkView` component with scope selector
- Ready for integration with learner lists to show status indicators

**Future Enhancement**: Add `LearnerBenchmarkStatus` badges to student lists/tables showing "On track / Ahead / At risk" based on selected scope.

## API & Hooks

### `useEpaBenchmark` Hook

```typescript
const { data: benchmark, isLoading, error } = useEpaBenchmark({
  scope: 'current_cohort',
  learnerId: user?.id,
  epaCode: '1.1',
  snapshotDate: new Date(),
});
```

### `getBenchmarkFor` Function

```typescript
const benchmark = await getBenchmarkFor('current_cohort', {
  learnerId: '...',
  epaCode: '1.1',
  snapshotDate: new Date(),
});
```

## Status Calculation

The system uses a simple threshold-based approach:

- **Ahead**: `learnerLevel >= expectedLevel + 0.5`
- **At Risk**: `learnerLevel <= expectedLevel - 0.5`
- **On Track**: Otherwise

Threshold is configurable (default: 0.5) in `compareToBenchmark()` function.

## Security & Privacy

### RLS Policies

- **Current Cohort**: Users can only see benchmarks for their own cohort
- **Program Scopes**: Users can see benchmarks for their program/specialty
- **Department/Institution**: Users can see benchmarks within their organization
- **Discipline**: All authenticated users can see cross-institution aggregated data
- **Admin**: Full access to all benchmarks

### Privacy Protection

- Benchmark data is aggregated only (no individual learner identity)
- Cross-institution scope (`all_cohorts_discipline`) ensures no institution-specific data leaks
- RLS policies prevent unauthorized access

## Migration

Run the migration:

```bash
supabase migration up 20250118_competency_benchmarking
```

Or apply manually via Supabase dashboard.

## Next Steps

1. **Populate Benchmarks**: Implement aggregation job/function to populate `epa_benchmarks` table
2. **Time Buckets**: Consider implementing time bucket strategy for better performance
3. **Chart Visualization**: Add trajectory chart with benchmark overlay (using recharts or similar)
4. **Batch Status**: Add batch benchmark status display for supervisor student lists
5. **Historical Trends**: Extend to show benchmark trends over time

## Testing

### Manual Testing

1. Create a cohort and assign learners
2. Create sample benchmark data for different scopes
3. Test scope selector on learner dashboard
4. Verify RLS policies prevent unauthorized access
5. Test status calculation (ahead/on track/at risk)

### Database Testing

```sql
-- Test cohort creation
INSERT INTO program_cohorts (specialty_id, institution_id, name, start_date)
VALUES (
  (SELECT id FROM specialties LIMIT 1),
  (SELECT id FROM institutions LIMIT 1),
  'Test Cohort 2027',
  '2024-09-01'
);

-- Test benchmark insertion
INSERT INTO epa_benchmarks (
  scope, specialty_id, epa_code, time_from_start_days,
  expected_level, p25_level, p75_level, n_learners, n_assessments
)
VALUES (
  'all_cohorts_program'::benchmark_scope,
  (SELECT id FROM specialties LIMIT 1),
  '1.1',
  90,
  3.2,
  2.8,
  3.6,
  25,
  150
);
```

