-- Migration: Feedback AI chain runs + student digest view
-- Created: 2026-01-23
-- Purpose: Store AI chain inputs/results and expose learner-safe digests

CREATE TABLE IF NOT EXISTS public.feedback_ai_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NULL,
  supervisor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  chain_id TEXT NOT NULL DEFAULT 'FEEDBACK_AI_CHAIN_V1',
  inputs JSONB NOT NULL,
  result JSONB NOT NULL,
  used_in_final_feedback BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS feedback_ai_runs_supervisor_idx ON public.feedback_ai_runs(supervisor_id);
CREATE INDEX IF NOT EXISTS feedback_ai_runs_student_idx ON public.feedback_ai_runs(student_id);
CREATE INDEX IF NOT EXISTS feedback_ai_runs_assessment_idx ON public.feedback_ai_runs(assessment_id);

ALTER TABLE public.feedback_ai_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS feedback_ai_runs_supervisor_read ON public.feedback_ai_runs;
CREATE POLICY feedback_ai_runs_supervisor_read
  ON public.feedback_ai_runs
  FOR SELECT
  TO authenticated
  USING (supervisor_id = auth.uid());

DROP POLICY IF EXISTS feedback_ai_runs_supervisor_insert ON public.feedback_ai_runs;
CREATE POLICY feedback_ai_runs_supervisor_insert
  ON public.feedback_ai_runs
  FOR INSERT
  TO authenticated
  WITH CHECK (supervisor_id = auth.uid());

DROP POLICY IF EXISTS feedback_ai_runs_supervisor_update ON public.feedback_ai_runs;
CREATE POLICY feedback_ai_runs_supervisor_update
  ON public.feedback_ai_runs
  FOR UPDATE
  TO authenticated
  USING (supervisor_id = auth.uid())
  WITH CHECK (supervisor_id = auth.uid());

DROP POLICY IF EXISTS feedback_ai_runs_admin_read ON public.feedback_ai_runs;
CREATE POLICY feedback_ai_runs_admin_read
  ON public.feedback_ai_runs
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE VIEW public.student_feedback_digests AS
SELECT
  id,
  student_id,
  assessment_id,
  created_at,
  result->'final'->'learner_digest' AS learner_digest
FROM public.feedback_ai_runs;

ALTER VIEW public.student_feedback_digests SET (security_barrier = true);

-- Note: views do not support RLS policies directly.
-- Access is governed by underlying table RLS on feedback_ai_runs.
