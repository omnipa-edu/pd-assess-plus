-- Migration: Student-Supervisor Assignments (Enhanced)
-- Created: 2025-11-17
-- Purpose: Track student-supervisor relationships with institution, program, and primary supervisor designation

-- ============================================================================
-- STUDENT-SUPERVISOR ASSIGNMENTS TABLE
-- ============================================================================

-- Note: This table extends the simpler supervisor_student_assignments with
-- institution, program, primary supervisor, and date tracking
CREATE TABLE IF NOT EXISTS public.student_supervisor_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  supervisor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE RESTRICT,
  program_id UUID REFERENCES public.specialties(id) ON DELETE SET NULL, -- Using specialties as programs
  is_primary BOOLEAN NOT NULL DEFAULT false,
  start_date DATE,
  end_date DATE,
  note TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Prevent exact duplicates
  CONSTRAINT student_supervisor_unique UNIQUE (student_id, supervisor_id, institution_id, program_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_student_supervisor_assignments_supervisor 
  ON public.student_supervisor_assignments(supervisor_id, institution_id, program_id);
CREATE INDEX IF NOT EXISTS idx_student_supervisor_assignments_student 
  ON public.student_supervisor_assignments(student_id, is_primary);
CREATE INDEX IF NOT EXISTS idx_student_supervisor_assignments_institution 
  ON public.student_supervisor_assignments(institution_id);
CREATE INDEX IF NOT EXISTS idx_student_supervisor_assignments_program 
  ON public.student_supervisor_assignments(program_id);
CREATE INDEX IF NOT EXISTS idx_student_supervisor_assignments_dates 
  ON public.student_supervisor_assignments(start_date, end_date);

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================

DROP TRIGGER IF EXISTS update_student_supervisor_assignments_updated_at 
  ON public.student_supervisor_assignments;
CREATE TRIGGER update_student_supervisor_assignments_updated_at 
  BEFORE UPDATE ON public.student_supervisor_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE public.student_supervisor_assignments ENABLE ROW LEVEL SECURITY;

-- Supervisors can view their own assignments
DROP POLICY IF EXISTS student_supervisor_assignments_view_own ON public.student_supervisor_assignments;
CREATE POLICY student_supervisor_assignments_view_own ON public.student_supervisor_assignments
  FOR SELECT USING (
    supervisor_id = auth.uid() OR
    student_id = auth.uid()
  );

-- Supervisors can insert assignments where they are the supervisor
DROP POLICY IF EXISTS student_supervisor_assignments_insert_own ON public.student_supervisor_assignments;
CREATE POLICY student_supervisor_assignments_insert_own ON public.student_supervisor_assignments
  FOR INSERT WITH CHECK (
    supervisor_id = auth.uid() AND
    created_by = auth.uid() AND
    -- Ensure supervisor belongs to the institution
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
        AND institution_id = student_supervisor_assignments.institution_id
    )
  );

-- Supervisors can update their own assignment rows
DROP POLICY IF EXISTS student_supervisor_assignments_update_own ON public.student_supervisor_assignments;
CREATE POLICY student_supervisor_assignments_update_own ON public.student_supervisor_assignments
  FOR UPDATE USING (
    supervisor_id = auth.uid() OR
    created_by = auth.uid()
  );

-- Admins can view all assignments for their org
DROP POLICY IF EXISTS student_supervisor_assignments_admin_view ON public.student_supervisor_assignments;
CREATE POLICY student_supervisor_assignments_admin_view ON public.student_supervisor_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can manage all assignments
DROP POLICY IF EXISTS student_supervisor_assignments_admin_manage ON public.student_supervisor_assignments;
CREATE POLICY student_supervisor_assignments_admin_manage ON public.student_supervisor_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- HELPER FUNCTION: Get active assignments for a supervisor
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_supervisor_students(
  p_supervisor_id UUID,
  p_institution_id UUID DEFAULT NULL,
  p_program_id UUID DEFAULT NULL,
  p_active_only BOOLEAN DEFAULT true
)
RETURNS TABLE (
  assignment_id UUID,
  student_id UUID,
  student_name TEXT,
  student_email TEXT,
  institution_id UUID,
  institution_name TEXT,
  program_id UUID,
  program_name TEXT,
  is_primary BOOLEAN,
  start_date DATE,
  end_date DATE,
  note TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ssa.id AS assignment_id,
    ssa.student_id,
    p.full_name AS student_name,
    p.email AS student_email,
    ssa.institution_id,
    i.name AS institution_name,
    ssa.program_id,
    sp.name AS program_name,
    ssa.is_primary,
    ssa.start_date,
    ssa.end_date,
    ssa.note
  FROM public.student_supervisor_assignments ssa
  JOIN public.profiles p ON p.id = ssa.student_id
  LEFT JOIN public.institutions i ON i.id = ssa.institution_id
  LEFT JOIN public.specialties sp ON sp.id = ssa.program_id
  WHERE ssa.supervisor_id = p_supervisor_id
    AND (p_institution_id IS NULL OR ssa.institution_id = p_institution_id)
    AND (p_program_id IS NULL OR ssa.program_id = p_program_id)
    AND (
      NOT p_active_only OR
      ssa.end_date IS NULL OR
      ssa.end_date >= CURRENT_DATE
    )
  ORDER BY ssa.start_date DESC NULLS LAST, p.full_name;
$$;

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT ALL ON public.student_supervisor_assignments TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_supervisor_students(UUID, UUID, UUID, BOOLEAN) TO authenticated;

