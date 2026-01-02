-- Competency Trajectory Benchmarking System
-- Migration: 20250118_competency_benchmarking.sql
-- Purpose: Add cohort-based benchmarking at multiple scopes

-- ============================================================================
-- TYPE DEFINITIONS
-- ============================================================================

-- Benchmark scope enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'benchmark_scope') THEN
    CREATE TYPE benchmark_scope AS ENUM (
      'current_cohort',
      'previous_cohorts_program',
      'all_cohorts_program',
      'all_cohorts_department',
      'all_cohorts_institution',
      'all_cohorts_discipline'
    );
  END IF;
END $$;

-- ============================================================================
-- PROGRAM COHORTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.program_cohorts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialty_id    UUID NOT NULL REFERENCES public.specialties(id) ON DELETE RESTRICT,
  institution_id  UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  department_id   UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  start_date      DATE NOT NULL,
  end_date        DATE,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT program_cohorts_name_check CHECK (char_length(name) >= 2 AND char_length(name) <= 200),
  CONSTRAINT program_cohorts_date_check CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_program_cohorts_specialty ON public.program_cohorts(specialty_id);
CREATE INDEX IF NOT EXISTS idx_program_cohorts_institution ON public.program_cohorts(institution_id);
CREATE INDEX IF NOT EXISTS idx_program_cohorts_department ON public.program_cohorts(department_id);
CREATE INDEX IF NOT EXISTS idx_program_cohorts_active ON public.program_cohorts(is_active);
CREATE INDEX IF NOT EXISTS idx_program_cohorts_dates ON public.program_cohorts(start_date, end_date);

-- ============================================================================
-- ADD COHORT_ID TO PROFILES
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'cohort_id'
  ) THEN
    ALTER TABLE public.profiles 
      ADD COLUMN cohort_id UUID REFERENCES public.program_cohorts(id) ON DELETE SET NULL;
    
    CREATE INDEX IF NOT EXISTS idx_profiles_cohort ON public.profiles(cohort_id);
  END IF;
END $$;

-- ============================================================================
-- EPA BENCHMARKS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.epa_benchmarks (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope                 benchmark_scope NOT NULL,
  
  -- Scope identifiers (nullable depending on scope)
  institution_id        UUID REFERENCES public.institutions(id) ON DELETE CASCADE,
  department_id         UUID REFERENCES public.departments(id) ON DELETE CASCADE,
  specialty_id          UUID REFERENCES public.specialties(id) ON DELETE CASCADE,
  cohort_id             UUID REFERENCES public.program_cohorts(id) ON DELETE CASCADE,
  learner_level         TEXT, -- e.g. 'PA-S1', 'PA-S2', 'PGY1' (optional)
  
  -- EPA reference (using epa_number TEXT to match epa_assessments structure)
  epa_code              TEXT NOT NULL,
  epa_id                UUID REFERENCES public.epas(id) ON DELETE CASCADE,
  
  -- Timeline anchor: days since start (cohort or program-specific)
  time_from_start_days  INTEGER NOT NULL,
  
  -- Benchmark statistics
  expected_level        NUMERIC(4,2) NOT NULL,    -- mean or median
  p25_level             NUMERIC(4,2),
  p75_level             NUMERIC(4,2),
  n_learners            INTEGER NOT NULL DEFAULT 0,
  n_assessments         INTEGER NOT NULL DEFAULT 0,
  
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT epa_benchmarks_time_check CHECK (time_from_start_days >= 0),
  CONSTRAINT epa_benchmarks_level_check CHECK (expected_level >= 0 AND expected_level <= 5),
  CONSTRAINT epa_benchmarks_p25_check CHECK (p25_level IS NULL OR (p25_level >= 0 AND p25_level <= 5)),
  CONSTRAINT epa_benchmarks_p75_check CHECK (p75_level IS NULL OR (p75_level >= 0 AND p75_level <= 5)),
  CONSTRAINT epa_benchmarks_n_check CHECK (n_learners >= 0 AND n_assessments >= 0)
);

CREATE INDEX IF NOT EXISTS idx_epa_benchmarks_scope_epa_time 
  ON public.epa_benchmarks (scope, epa_code, time_from_start_days);
CREATE INDEX IF NOT EXISTS idx_epa_benchmarks_scope_institution 
  ON public.epa_benchmarks (scope, institution_id) WHERE institution_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_epa_benchmarks_scope_department 
  ON public.epa_benchmarks (scope, department_id) WHERE department_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_epa_benchmarks_scope_specialty 
  ON public.epa_benchmarks (scope, specialty_id) WHERE specialty_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_epa_benchmarks_scope_cohort 
  ON public.epa_benchmarks (scope, cohort_id) WHERE cohort_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_epa_benchmarks_epa_id 
  ON public.epa_benchmarks (epa_id) WHERE epa_id IS NOT NULL;

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS update_program_cohorts_updated_at ON public.program_cohorts;
CREATE TRIGGER update_program_cohorts_updated_at 
  BEFORE UPDATE ON public.program_cohorts
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_epa_benchmarks_updated_at ON public.epa_benchmarks;
CREATE TRIGGER update_epa_benchmarks_updated_at 
  BEFORE UPDATE ON public.epa_benchmarks
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE public.program_cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.epa_benchmarks ENABLE ROW LEVEL SECURITY;

-- Program Cohorts: Learners can see their own cohort, supervisors/admins see all relevant cohorts
DROP POLICY IF EXISTS program_cohorts_own ON public.program_cohorts;
CREATE POLICY program_cohorts_own ON public.program_cohorts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND cohort_id = program_cohorts.id
    )
  );

DROP POLICY IF EXISTS program_cohorts_supervisor_admin ON public.program_cohorts;
CREATE POLICY program_cohorts_supervisor_admin ON public.program_cohorts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('supervisor', 'admin')
    )
  );

DROP POLICY IF EXISTS program_cohorts_admin_all ON public.program_cohorts;
CREATE POLICY program_cohorts_admin_all ON public.program_cohorts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- EPA Benchmarks: Read-only access for authenticated users within relevant scope
-- For current_cohort: user must be in that cohort
DROP POLICY IF EXISTS epa_benchmarks_current_cohort ON public.epa_benchmarks;
CREATE POLICY epa_benchmarks_current_cohort ON public.epa_benchmarks
  FOR SELECT USING (
    scope = 'current_cohort' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND cohort_id = epa_benchmarks.cohort_id
    )
  );

-- For previous_cohorts_program and all_cohorts_program: user must be in same specialty
DROP POLICY IF EXISTS epa_benchmarks_program_scopes ON public.epa_benchmarks;
CREATE POLICY epa_benchmarks_program_scopes ON public.epa_benchmarks
  FOR SELECT USING (
    scope IN ('previous_cohorts_program', 'all_cohorts_program') AND
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.program_cohorts pc ON p.cohort_id = pc.id
      WHERE p.id = auth.uid() 
        AND pc.specialty_id = epa_benchmarks.specialty_id
    )
  );

-- For all_cohorts_department: user must be in same department
DROP POLICY IF EXISTS epa_benchmarks_department_scope ON public.epa_benchmarks;
CREATE POLICY epa_benchmarks_department_scope ON public.epa_benchmarks
  FOR SELECT USING (
    scope = 'all_cohorts_department' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND department_id = epa_benchmarks.department_id
    )
  );

-- For all_cohorts_institution: user must be in same institution
DROP POLICY IF EXISTS epa_benchmarks_institution_scope ON public.epa_benchmarks;
CREATE POLICY epa_benchmarks_institution_scope ON public.epa_benchmarks
  FOR SELECT USING (
    scope = 'all_cohorts_institution' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND institution_id = epa_benchmarks.institution_id
    )
  );

-- For all_cohorts_discipline: all authenticated users (cross-institution, aggregated)
DROP POLICY IF EXISTS epa_benchmarks_discipline_scope ON public.epa_benchmarks;
CREATE POLICY epa_benchmarks_discipline_scope ON public.epa_benchmarks
  FOR SELECT USING (
    scope = 'all_cohorts_discipline' AND
    auth.uid() IS NOT NULL
  );

-- Admin full access
DROP POLICY IF EXISTS epa_benchmarks_admin_all ON public.epa_benchmarks;
CREATE POLICY epa_benchmarks_admin_all ON public.epa_benchmarks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get learner's context for benchmark lookup
CREATE OR REPLACE FUNCTION public.get_learner_benchmark_context(p_learner_id UUID)
RETURNS TABLE (
  cohort_id UUID,
  cohort_start_date DATE,
  specialty_id UUID,
  department_id UUID,
  institution_id UUID
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.cohort_id,
    pc.start_date,
    pc.specialty_id,
    p.department_id,
    p.institution_id
  FROM public.profiles p
  LEFT JOIN public.program_cohorts pc ON p.cohort_id = pc.id
  WHERE p.id = p_learner_id;
END;
$$;

-- Function to compute time_from_start_days
CREATE OR REPLACE FUNCTION public.compute_time_from_start(
  p_start_date DATE,
  p_snapshot_date DATE DEFAULT CURRENT_DATE
)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT GREATEST(0, (p_snapshot_date - p_start_date)::INTEGER);
$$;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.program_cohorts TO authenticated;
GRANT SELECT ON public.epa_benchmarks TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_learner_benchmark_context(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.compute_time_from_start(DATE, DATE) TO authenticated;

COMMENT ON TABLE public.program_cohorts IS 'Represents cohorts of learners within a program/specialty';
COMMENT ON TABLE public.epa_benchmarks IS 'Aggregated benchmark statistics for EPA competency trajectories at various scopes';
COMMENT ON TYPE benchmark_scope IS 'Defines the scope of comparison for competency benchmarks';





