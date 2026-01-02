-- Migration: Supervisor-Student Assignments
-- Created: 2025-11-16
-- Purpose: Track which supervisors are assigned to which students

-- ============================================================================
-- SUPERVISOR-STUDENT ASSIGNMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.supervisor_student_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supervisor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Prevent duplicate assignments
  CONSTRAINT supervisor_student_unique UNIQUE (supervisor_id, student_id)
);

-- Indexes (use IF NOT EXISTS to avoid errors if they already exist)
CREATE INDEX IF NOT EXISTS idx_supervisor_assignments_supervisor 
  ON public.supervisor_student_assignments(supervisor_id, is_active);
CREATE INDEX IF NOT EXISTS idx_supervisor_assignments_student 
  ON public.supervisor_student_assignments(student_id, is_active);

-- ============================================================================
-- UPDATED_AT TRIGGER FUNCTION (create if doesn't exist)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================

DROP TRIGGER IF EXISTS update_supervisor_student_assignments_updated_at 
  ON public.supervisor_student_assignments;
CREATE TRIGGER update_supervisor_student_assignments_updated_at 
  BEFORE UPDATE ON public.supervisor_student_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE public.supervisor_student_assignments ENABLE ROW LEVEL SECURITY;

-- Supervisors can view their own assignments
DROP POLICY IF EXISTS supervisor_assignments_view_own ON public.supervisor_student_assignments;
CREATE POLICY supervisor_assignments_view_own ON public.supervisor_student_assignments
  FOR SELECT USING (
    supervisor_id = auth.uid() OR
    student_id = auth.uid()
  );

-- Admins can view all assignments
DROP POLICY IF EXISTS supervisor_assignments_admin_view ON public.supervisor_student_assignments;
CREATE POLICY supervisor_assignments_admin_view ON public.supervisor_student_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can manage all assignments
DROP POLICY IF EXISTS supervisor_assignments_admin_manage ON public.supervisor_student_assignments;
CREATE POLICY supervisor_assignments_admin_manage ON public.supervisor_student_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT ALL ON public.supervisor_student_assignments TO authenticated;

