-- Procedure competency evaluations (e.g. Rigid Nasal Endoscopy)
-- Stores structured form payload in evaluation_data JSONB.

CREATE TABLE IF NOT EXISTS public.procedure_competency_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  supervisor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  procedure_code TEXT NOT NULL,
  evaluation_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_procedure_competency_student
  ON public.procedure_competency_evaluations(student_id);
CREATE INDEX IF NOT EXISTS idx_procedure_competency_supervisor
  ON public.procedure_competency_evaluations(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_procedure_competency_procedure_code
  ON public.procedure_competency_evaluations(procedure_code);
CREATE INDEX IF NOT EXISTS idx_procedure_competency_created_at
  ON public.procedure_competency_evaluations(created_at DESC);

ALTER TABLE public.procedure_competency_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own procedure competency evaluations"
  ON public.procedure_competency_evaluations FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Supervisors can view all procedure competency evaluations"
  ON public.procedure_competency_evaluations FOR SELECT
  USING (public.has_role(auth.uid(), 'supervisor') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Supervisors can create procedure competency evaluations"
  ON public.procedure_competency_evaluations FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'supervisor') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Supervisors can update procedure competency evaluations"
  ON public.procedure_competency_evaluations FOR UPDATE
  USING (public.has_role(auth.uid(), 'supervisor') OR public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_procedure_competency_evaluations_updated_at ON public.procedure_competency_evaluations;
CREATE TRIGGER update_procedure_competency_evaluations_updated_at
  BEFORE UPDATE ON public.procedure_competency_evaluations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.procedure_competency_evaluations IS 'Procedure-specific competency evaluations (e.g. Rigid Nasal Endoscopy); payload in evaluation_data';
