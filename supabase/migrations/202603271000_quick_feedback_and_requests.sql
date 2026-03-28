-- Quick feedback: nullable EPA on epa_assessments; supervisor feedback requests; analytics guards; CME description fix

-- ============================================================================
-- SUPERVISOR FEEDBACK REQUESTS
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'supervisor_feedback_request_status') THEN
    CREATE TYPE public.supervisor_feedback_request_status AS ENUM ('open', 'fulfilled', 'cancelled');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.supervisor_feedback_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  supervisor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT,
  status public.supervisor_feedback_request_status NOT NULL DEFAULT 'open',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supervisor_feedback_requests_supervisor_status
  ON public.supervisor_feedback_requests(supervisor_id, status);
CREATE INDEX IF NOT EXISTS idx_supervisor_feedback_requests_student
  ON public.supervisor_feedback_requests(student_id, created_at DESC);

DROP TRIGGER IF EXISTS update_supervisor_feedback_requests_updated_at ON public.supervisor_feedback_requests;
CREATE TRIGGER update_supervisor_feedback_requests_updated_at
  BEFORE UPDATE ON public.supervisor_feedback_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.supervisor_feedback_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS supervisor_feedback_requests_student_select ON public.supervisor_feedback_requests;
CREATE POLICY supervisor_feedback_requests_student_select
  ON public.supervisor_feedback_requests FOR SELECT
  USING (student_id = auth.uid() OR supervisor_id = auth.uid());

DROP POLICY IF EXISTS supervisor_feedback_requests_supervisor_update ON public.supervisor_feedback_requests;
CREATE POLICY supervisor_feedback_requests_supervisor_update
  ON public.supervisor_feedback_requests FOR UPDATE
  USING (supervisor_id = auth.uid())
  WITH CHECK (supervisor_id = auth.uid());

DROP POLICY IF EXISTS supervisor_feedback_requests_student_update ON public.supervisor_feedback_requests;
CREATE POLICY supervisor_feedback_requests_student_update
  ON public.supervisor_feedback_requests FOR UPDATE
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- Idempotent email send log (edge function)
CREATE TABLE IF NOT EXISTS public.feedback_request_email_log (
  feedback_request_id UUID PRIMARY KEY REFERENCES public.supervisor_feedback_requests(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivery_status TEXT NOT NULL DEFAULT 'sent'
    CHECK (delivery_status IN ('sent', 'skipped_user_prefs', 'skipped_no_provider', 'failed'))
);

ALTER TABLE public.feedback_request_email_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS feedback_request_email_log_no_client ON public.feedback_request_email_log;
CREATE POLICY feedback_request_email_log_no_client ON public.feedback_request_email_log FOR ALL USING (false);

GRANT SELECT ON public.supervisor_feedback_requests TO authenticated;
GRANT UPDATE ON public.supervisor_feedback_requests TO authenticated;

-- ============================================================================
-- RPC: create request + in-app notification (validated assignment)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_supervisor_feedback_request(
  p_supervisor_id UUID,
  p_message TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id UUID := auth.uid();
  v_request_id UUID;
  v_student_name TEXT;
  v_msg TEXT := NULLIF(trim(COALESCE(p_message, '')), '');
BEGIN
  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.supervisor_student_assignments ssa
    WHERE ssa.student_id = v_student_id
      AND ssa.supervisor_id = p_supervisor_id
      AND ssa.is_active = true
  ) THEN
    RAISE EXCEPTION 'no_active_supervisor_assignment';
  END IF;

  INSERT INTO public.supervisor_feedback_requests (student_id, supervisor_id, message, status)
  VALUES (v_student_id, p_supervisor_id, v_msg, 'open')
  RETURNING id INTO v_request_id;

  SELECT full_name INTO v_student_name FROM public.profiles WHERE id = v_student_id;

  INSERT INTO public.notifications (
    user_id, type, title, message, priority, action_url, action_label, metadata
  ) VALUES (
    p_supervisor_id,
    'feedback_requested'::public.notification_type,
    'Feedback requested',
    COALESCE(v_student_name, 'A learner') || ' asked for feedback.' ||
      CASE WHEN v_msg IS NOT NULL THEN ' Message: ' || left(v_msg, 200) ELSE '' END,
    'high',
    '/supervisor/feedback-requests',
    'View requests',
    jsonb_build_object('feedback_request_id', v_request_id, 'student_id', v_student_id)
  );

  RETURN jsonb_build_object('id', v_request_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_supervisor_feedback_request(UUID, TEXT) TO authenticated;

-- ============================================================================
-- Nullable EPA for quick feedback rows
-- ============================================================================

ALTER TABLE public.epa_assessments
  ALTER COLUMN epa_number DROP NOT NULL;

-- ============================================================================
-- CME trigger: tolerate NULL epa_number
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_epa_assessment_cme()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_activity_type public.cme_activity_type;
  v_minutes INTEGER;
  v_description TEXT;
  v_epa_label TEXT;
BEGIN
  IF NEW.supervisor_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_epa_label := COALESCE(NEW.epa_number, 'Quick feedback');

  IF NEW.feedback IS NOT NULL AND LENGTH(TRIM(NEW.feedback)) > 0 THEN
    v_activity_type := 'direct_observation';
    v_minutes := 10;
    v_description := 'EPA ' || v_epa_label || ' observation with feedback';
  ELSE
    v_activity_type := 'direct_observation';
    v_minutes := 7;
    v_description := 'EPA ' || v_epa_label || ' observation';
  END IF;

  PERFORM public.upsert_cme_session_from_wba(
    NEW.supervisor_id,
    NEW.id,
    'epa',
    v_activity_type,
    v_minutes,
    v_description,
    NEW.created_at::DATE
  );

  RETURN NEW;
END;
$$;

-- ============================================================================
-- EPA trajectory: exclude NULL epa_number from aggregates
-- ============================================================================

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
      ea.epa_number AS epa_code,
      public.try_cast_numeric(ea.rating) AS score,
      ea.created_at
    FROM public.epa_assessments ea
    WHERE ea.student_id = p_learner_id
      AND ea.created_at >= v_cutoff_date
      AND ea.epa_number IS NOT NULL
      AND public.try_cast_numeric(ea.rating) IS NOT NULL
  ),
  epa_aggregates AS (
    SELECT
      epa_scores.epa_code,
      AVG(epa_scores.score) AS current_level,
      COUNT(*) AS assessment_count,
      MAX(epa_scores.created_at) AS latest_assessment_date,
      CASE
        WHEN COUNT(*) >= 6 THEN
          (AVG(epa_scores.score) FILTER (WHERE epa_scores.created_at >= (SELECT MAX(es2.created_at) - INTERVAL '30 days' FROM epa_scores es2 WHERE es2.epa_code = epa_scores.epa_code))) -
          (AVG(epa_scores.score) FILTER (WHERE epa_scores.created_at < (SELECT MAX(es2.created_at) - INTERVAL '30 days' FROM epa_scores es2 WHERE es2.epa_code = epa_scores.epa_code)))
        ELSE 0
      END AS trend_slope
    FROM epa_scores
    GROUP BY epa_scores.epa_code
  )
  SELECT
    epa_aggregates.epa_code,
    COALESCE(epa_aggregates.current_level, 0)::NUMERIC,
    COALESCE(epa_aggregates.assessment_count, 0)::INTEGER,
    epa_aggregates.latest_assessment_date,
    COALESCE(epa_aggregates.trend_slope, 0)::NUMERIC,
    (COALESCE(epa_aggregates.current_level, 0) < 2.5 OR
     epa_aggregates.latest_assessment_date < NOW() - INTERVAL '60 days')::BOOLEAN AS risk_flag,
    (ABS(COALESCE(epa_aggregates.trend_slope, 0)) < 0.1 AND COALESCE(epa_aggregates.current_level, 0) < 4)::BOOLEAN AS plateau_flag
  FROM epa_aggregates;
END;
$$;

-- Readiness / calibration views
CREATE OR REPLACE VIEW public.readiness_metrics AS
SELECT
  ea.student_id,
  ea.epa_number AS epa_code,
  date_trunc('month', now()) AS computed_at,
  count(*) FILTER (WHERE ea.created_at >= now() - interval '6 months') AS total_in_window,
  count(*) FILTER (
    WHERE ea.created_at >= now() - interval '6 months'
      AND (
        CASE WHEN ea.rating ~ '^\d+$' THEN ea.rating::int END
      ) >= 4
  ) AS high_score_count,
  count(DISTINCT ea.supervisor_id) FILTER (WHERE ea.created_at >= now() - interval '6 months') AS distinct_supervisors,
  max(
    CASE WHEN ea.rating ~ '^\d+$' THEN ea.rating::int END
  ) FILTER (WHERE ea.created_at >= now() - interval '6 months') AS latest_score,
  max(ea.created_at) FILTER (WHERE ea.created_at >= now() - interval '6 months') AS latest_at
FROM public.epa_assessments ea
WHERE ea.epa_number IS NOT NULL
GROUP BY ea.student_id, ea.epa_number;

CREATE OR REPLACE VIEW public.supervisor_calibration_base AS
SELECT
  ea.supervisor_id,
  ea.epa_number AS epa_code,
  CASE WHEN ea.rating ~ '^\d+$' THEN ea.rating::int END AS score
FROM public.epa_assessments ea
WHERE ea.epa_number IS NOT NULL
  AND (CASE WHEN ea.rating ~ '^\d+$' THEN ea.rating::int END) BETWEEN 1 AND 5;

COMMENT ON TABLE public.supervisor_feedback_requests IS 'Learner-initiated feedback requests to assigned supervisors';
