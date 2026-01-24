-- Readiness metrics per learner and EPA within a recency window
-- Note: adjust table/column names if different in production schema
create or replace view public.readiness_metrics as
select
  ea.student_id,
  ea.epa_number as epa_code,
  date_trunc('month', now()) as computed_at,
  count(*) filter (where ea.created_at >= now() - interval '6 months') as total_in_window,
  count(*) filter (
    where ea.created_at >= now() - interval '6 months'
      and (
        case when ea.rating ~ '^\d+$' then ea.rating::int end
      ) >= 4
  ) as high_score_count,
  count(distinct ea.supervisor_id) filter (where ea.created_at >= now() - interval '6 months') as distinct_supervisors,
  max(
    case when ea.rating ~ '^\d+$' then ea.rating::int end
  ) filter (where ea.created_at >= now() - interval '6 months') as latest_score,
  max(ea.created_at) filter (where ea.created_at >= now() - interval '6 months') as latest_at
from public.epa_assessments ea
group by ea.student_id, ea.epa_number;

comment on view public.readiness_metrics is 'Aggregated readiness inputs per learner/EPA for last 6 months.';

-- Supervisor calibration metrics (counts per score)
create or replace view public.supervisor_calibration_base as
select
  ea.supervisor_id,
  ea.epa_number as epa_code,
  case when ea.rating ~ '^\d+$' then ea.rating::int end as score
from public.epa_assessments ea
where (case when ea.rating ~ '^\d+$' then ea.rating::int end) between 1 and 5;

-- Helper: cohort median per EPA
create or replace view public.supervisor_calibration_cohort as
select
  epa_code,
  percentile_cont(0.5) within group (order by score) as cohort_median
from public.supervisor_calibration_base
group by epa_code;

-- Final rollup per supervisor/EPA
create or replace view public.supervisor_calibration_metrics as
select
  b.supervisor_id,
  b.epa_code,
  count(*) as wba_count,
  avg(score) as mean_score,
  percentile_cont(0.5) within group (order by score) as median_score,
  c.cohort_median,
  sum(case when score = 1 then 1 else 0 end) as s1,
  sum(case when score = 2 then 1 else 0 end) as s2,
  sum(case when score = 3 then 1 else 0 end) as s3,
  sum(case when score = 4 then 1 else 0 end) as s4,
  sum(case when score = 5 then 1 else 0 end) as s5
from public.supervisor_calibration_base b
join public.supervisor_calibration_cohort c using (epa_code)
group by b.supervisor_id, b.epa_code, c.cohort_median;

comment on view public.supervisor_calibration_metrics is 'Per-supervisor calibration metrics with cohort medians and score distribution';
