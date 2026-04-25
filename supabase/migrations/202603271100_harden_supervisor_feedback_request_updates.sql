-- Harden client updates to learner-initiated supervisor feedback requests.
--
-- The creation RPC validates that a learner can only request feedback from an
-- assigned supervisor. Without an update guard, either participant could later
-- change assignment fields through PostgREST and bypass that invariant.

CREATE OR REPLACE FUNCTION public.enforce_supervisor_feedback_request_client_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  -- Service-role/admin maintenance may not carry an end-user JWT. RLS still
  -- controls normal client access; this guard constrains authenticated users.
  IF v_uid IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.student_id IS DISTINCT FROM OLD.student_id
    OR NEW.supervisor_id IS DISTINCT FROM OLD.supervisor_id
    OR NEW.message IS DISTINCT FROM OLD.message
    OR NEW.metadata IS DISTINCT FROM OLD.metadata
    OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'supervisor_feedback_request_immutable_fields';
  END IF;

  IF OLD.student_id = v_uid AND OLD.supervisor_id <> v_uid THEN
    IF OLD.status IS DISTINCT FROM 'open'::public.supervisor_feedback_request_status
      OR NEW.status IS DISTINCT FROM 'cancelled'::public.supervisor_feedback_request_status THEN
      RAISE EXCEPTION 'students_may_only_cancel_open_feedback_requests';
    END IF;
  ELSIF OLD.supervisor_id = v_uid THEN
    -- Supervisors may move requests between valid workflow statuses only.
    NULL;
  ELSE
    RAISE EXCEPTION 'not_authorized';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_supervisor_feedback_request_client_update
  ON public.supervisor_feedback_requests;
CREATE TRIGGER enforce_supervisor_feedback_request_client_update
  BEFORE UPDATE ON public.supervisor_feedback_requests
  FOR EACH ROW EXECUTE FUNCTION public.enforce_supervisor_feedback_request_client_update();

DROP POLICY IF EXISTS supervisor_feedback_requests_student_update
  ON public.supervisor_feedback_requests;
CREATE POLICY supervisor_feedback_requests_student_update
  ON public.supervisor_feedback_requests FOR UPDATE
  USING (student_id = auth.uid())
  WITH CHECK (
    student_id = auth.uid()
    AND status = 'cancelled'::public.supervisor_feedback_request_status
  );
