-- Migration: Set views to SECURITY INVOKER
-- Created: 2026-01-31
-- Purpose: Fix Supabase linter security_definer_view (0010). Views should run with
--          the querying user's permissions so RLS applies correctly.
--          Requires PostgreSQL 15+.

ALTER VIEW IF EXISTS public.supervisor_calibration_base SET (security_invoker = on);
ALTER VIEW IF EXISTS public.readiness_metrics SET (security_invoker = on);
ALTER VIEW IF EXISTS public.supervisor_calibration_metrics SET (security_invoker = on);
ALTER VIEW IF EXISTS public.supervisor_calibration_cohort SET (security_invoker = on);
ALTER VIEW IF EXISTS public.student_feedback_digests SET (security_invoker = on);
