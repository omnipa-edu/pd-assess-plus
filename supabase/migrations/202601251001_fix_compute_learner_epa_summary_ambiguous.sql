-- Fix ambiguous epa_code reference in compute_learner_epa_summary
CREATE OR REPLACE FUNCTION public.compute_learner_epa_summary(
  p_learner_id UUID,
  p_lookback_days INTEGER DEFAULT 180
)
RETURNS TABLE (
  epa_code TEXT,
  current_level NUMERIC,
  assessment_count INTEGER,
  latest_assessment_date TIMESTAMPTZ,
  trend_slope NUMERIC,
  risk_flag BOOLEAN,
  plateau_flag BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cutoff_date TIMESTAMPTZ;
BEGIN
  v_cutoff_date := NOW() - (p_lookback_days || ' days')::INTERVAL;
  
  RETURN QUERY
  WITH epa_scores AS (
    SELECT 
      ea.epa_number as epa_code,
      public.try_cast_numeric(ea.rating) as score,
      ea.created_at
    FROM epa_assessments ea
    WHERE ea.student_id = p_learner_id
      AND ea.created_at >= v_cutoff_date
      AND public.try_cast_numeric(ea.rating) IS NOT NULL
  ),
  epa_aggregates AS (
    SELECT 
      epa_scores.epa_code,
      AVG(epa_scores.score) as current_level,
      COUNT(*) as assessment_count,
      MAX(epa_scores.created_at) as latest_assessment_date,
      -- Simple trend: compare last 3 vs previous 3 assessments
      CASE 
        WHEN COUNT(*) >= 6 THEN
          (AVG(epa_scores.score) FILTER (WHERE epa_scores.created_at >= (SELECT MAX(es2.created_at) - INTERVAL '30 days' FROM epa_scores es2 WHERE es2.epa_code = epa_scores.epa_code))) -
          (AVG(epa_scores.score) FILTER (WHERE epa_scores.created_at < (SELECT MAX(es2.created_at) - INTERVAL '30 days' FROM epa_scores es2 WHERE es2.epa_code = epa_scores.epa_code)))
        ELSE 0
      END as trend_slope
    FROM epa_scores
    GROUP BY epa_scores.epa_code
  )
  SELECT 
    epa_aggregates.epa_code,
    COALESCE(epa_aggregates.current_level, 0)::NUMERIC,
    COALESCE(epa_aggregates.assessment_count, 0)::INTEGER,
    epa_aggregates.latest_assessment_date,
    COALESCE(epa_aggregates.trend_slope, 0)::NUMERIC,
    -- Risk flag: current level < 2.5 OR no assessments in last 60 days
    (COALESCE(epa_aggregates.current_level, 0) < 2.5 OR 
     epa_aggregates.latest_assessment_date < NOW() - INTERVAL '60 days')::BOOLEAN as risk_flag,
    -- Plateau flag: trend_slope near zero (between -0.1 and 0.1) AND current_level < 4
    (ABS(COALESCE(epa_aggregates.trend_slope, 0)) < 0.1 AND COALESCE(epa_aggregates.current_level, 0) < 4)::BOOLEAN as plateau_flag
  FROM epa_aggregates;
END;
$$;
