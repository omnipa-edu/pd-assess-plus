-- Personalization Engine
-- Migration: 20250119_personalization_engine.sql
-- Purpose: Add personalization summary tables for learners and supervisors

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Helper function for safe numeric casting (if not exists)
CREATE OR REPLACE FUNCTION public.try_cast_numeric(text_val TEXT)
RETURNS NUMERIC AS $$
BEGIN
  RETURN text_val::NUMERIC;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- LEARNER PERSONALIZATION SUMMARIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.learner_personalization_summaries (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id            UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  specialty_id          UUID REFERENCES public.specialties(id) ON DELETE SET NULL,
  cohort_id             UUID, -- FK constraint added conditionally below if program_cohorts exists
  
  -- JSON payload with structured suggestions
  summary               JSONB NOT NULL,
  
  generated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT learner_personalization_summaries_learner_unique UNIQUE (learner_id)
);

CREATE INDEX IF NOT EXISTS idx_learner_personalization_learner 
  ON public.learner_personalization_summaries(learner_id);
CREATE INDEX IF NOT EXISTS idx_learner_personalization_specialty 
  ON public.learner_personalization_summaries(specialty_id);
CREATE INDEX IF NOT EXISTS idx_learner_personalization_cohort 
  ON public.learner_personalization_summaries(cohort_id);
CREATE INDEX IF NOT EXISTS idx_learner_personalization_generated 
  ON public.learner_personalization_summaries(generated_at DESC);

-- Add foreign key constraint for cohort_id if program_cohorts table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'program_cohorts') THEN
    -- Add foreign key constraint if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_schema = 'public'
        AND constraint_name = 'learner_personalization_summaries_cohort_id_fkey'
        AND table_name = 'learner_personalization_summaries'
    ) THEN
      ALTER TABLE public.learner_personalization_summaries
        ADD CONSTRAINT learner_personalization_summaries_cohort_id_fkey
        FOREIGN KEY (cohort_id) REFERENCES public.program_cohorts(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- ============================================================================
-- SUPERVISOR PERSONALIZATION SUMMARIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.supervisor_personalization_summaries (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supervisor_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  specialty_id          UUID REFERENCES public.specialties(id) ON DELETE SET NULL,
  institution_id        UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
  
  -- JSON payload with structured suggestions
  summary               JSONB NOT NULL,
  
  generated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT supervisor_personalization_summaries_supervisor_unique UNIQUE (supervisor_id)
);

CREATE INDEX IF NOT EXISTS idx_supervisor_personalization_supervisor 
  ON public.supervisor_personalization_summaries(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_supervisor_personalization_specialty 
  ON public.supervisor_personalization_summaries(specialty_id);
CREATE INDEX IF NOT EXISTS idx_supervisor_personalization_institution 
  ON public.supervisor_personalization_summaries(institution_id);
CREATE INDEX IF NOT EXISTS idx_supervisor_personalization_generated 
  ON public.supervisor_personalization_summaries(generated_at DESC);

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS update_learner_personalization_updated_at 
  ON public.learner_personalization_summaries;
CREATE TRIGGER update_learner_personalization_updated_at 
  BEFORE UPDATE ON public.learner_personalization_summaries
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_supervisor_personalization_updated_at 
  ON public.supervisor_personalization_summaries;
CREATE TRIGGER update_supervisor_personalization_updated_at 
  BEFORE UPDATE ON public.supervisor_personalization_summaries
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE public.learner_personalization_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supervisor_personalization_summaries ENABLE ROW LEVEL SECURITY;

-- Learners can only see their own summary
DROP POLICY IF EXISTS learner_personalization_own ON public.learner_personalization_summaries;
CREATE POLICY learner_personalization_own ON public.learner_personalization_summaries
  FOR SELECT USING (learner_id = auth.uid());

-- Supervisors can see summaries for their assigned learners
DROP POLICY IF EXISTS learner_personalization_supervisor ON public.learner_personalization_summaries;
CREATE POLICY learner_personalization_supervisor ON public.learner_personalization_summaries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.supervisor_student_assignments
      WHERE student_id = learner_personalization_summaries.learner_id
        AND supervisor_id = auth.uid()
        AND is_active = true
    )
  );

-- Supervisors can only see their own summary
DROP POLICY IF EXISTS supervisor_personalization_own ON public.supervisor_personalization_summaries;
CREATE POLICY supervisor_personalization_own ON public.supervisor_personalization_summaries
  FOR SELECT USING (supervisor_id = auth.uid());

-- Admins can see all summaries
DROP POLICY IF EXISTS learner_personalization_admin ON public.learner_personalization_summaries;
CREATE POLICY learner_personalization_admin ON public.learner_personalization_summaries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS supervisor_personalization_admin ON public.supervisor_personalization_summaries;
CREATE POLICY supervisor_personalization_admin ON public.supervisor_personalization_summaries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to compute EPA trajectory summary for a learner
-- Note: This is a simplified version since epa_competency_trajectories table doesn't exist
-- We'll compute on-the-fly from assessments
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
      epa_code,
      AVG(score) as current_level,
      COUNT(*) as assessment_count,
      MAX(created_at) as latest_assessment_date,
      -- Simple trend: compare last 3 vs previous 3 assessments
      CASE 
        WHEN COUNT(*) >= 6 THEN
          (AVG(score) FILTER (WHERE created_at >= (SELECT MAX(created_at) - INTERVAL '30 days' FROM epa_scores es2 WHERE es2.epa_code = epa_scores.epa_code))) -
          (AVG(score) FILTER (WHERE created_at < (SELECT MAX(created_at) - INTERVAL '30 days' FROM epa_scores es2 WHERE es2.epa_code = epa_scores.epa_code)))
        ELSE 0
      END as trend_slope
    FROM epa_scores
    GROUP BY epa_code
  )
  SELECT 
    ea.epa_code,
    COALESCE(ea.current_level, 0)::NUMERIC,
    COALESCE(ea.assessment_count, 0)::INTEGER,
    ea.latest_assessment_date,
    COALESCE(ea.trend_slope, 0)::NUMERIC,
    -- Risk flag: current level < 2.5 OR no assessments in last 60 days
    (COALESCE(ea.current_level, 0) < 2.5 OR 
     ea.latest_assessment_date < NOW() - INTERVAL '60 days')::BOOLEAN as risk_flag,
    -- Plateau flag: trend_slope near zero (between -0.1 and 0.1) AND current_level < 4
    (ABS(COALESCE(ea.trend_slope, 0)) < 0.1 AND COALESCE(ea.current_level, 0) < 4)::BOOLEAN as plateau_flag
  FROM epa_aggregates ea;
END;
$$;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.learner_personalization_summaries TO authenticated;
GRANT SELECT ON public.supervisor_personalization_summaries TO authenticated;
GRANT EXECUTE ON FUNCTION public.compute_learner_epa_summary(UUID, INTEGER) TO authenticated;

COMMENT ON TABLE public.learner_personalization_summaries IS 'Cached personalization summaries for learners with key EPAs, priority actions, and coaching tags';
COMMENT ON TABLE public.supervisor_personalization_summaries IS 'Cached personalization summaries for supervisors with learners of interest, feedback quality, and coaching tags';
COMMENT ON FUNCTION public.compute_learner_epa_summary IS 'Computes EPA trajectory summary for a learner from assessment data';

