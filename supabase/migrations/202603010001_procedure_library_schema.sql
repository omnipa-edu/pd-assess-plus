-- Procedure Library + Builder + Program Assessment + Observations + Button system
-- Extends procedures, adds procedure_versions, procedure_audit_logs, program_procedures,
-- observations, button_definitions, button_sets, and mappings.

-- ============================================================================
-- ENUMS
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'observation_status') THEN
    CREATE TYPE observation_status AS ENUM ('draft', 'submitted');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'button_context_scope') THEN
    CREATE TYPE button_context_scope AS ENUM ('global', 'procedure', 'program', 'procedure_instance');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'button_context_type') THEN
    CREATE TYPE button_context_type AS ENUM ('card', 'form', 'workflow');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'procedure_audit_action') THEN
    CREATE TYPE procedure_audit_action AS ENUM ('created', 'updated', 'published', 'reverted', 'version_created');
  END IF;
END $$;

-- ============================================================================
-- EXTEND PROCEDURES
-- ============================================================================

ALTER TABLE public.procedures
  ADD COLUMN IF NOT EXISTS specialty_id UUID REFERENCES public.specialties(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS indications JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS contraindications JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_procedures_specialty ON public.procedures(specialty_id);
CREATE INDEX IF NOT EXISTS idx_procedures_created_by ON public.procedures(created_by);

-- ============================================================================
-- PROCEDURE_VERSIONS (immutable snapshots)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.procedure_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procedure_id UUID NOT NULL REFERENCES public.procedures(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  assessment_form JSONB NOT NULL DEFAULT '{"sections":[]}'::jsonb,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (procedure_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_procedure_versions_procedure ON public.procedure_versions(procedure_id);
CREATE INDEX IF NOT EXISTS idx_procedure_versions_created_at ON public.procedure_versions(created_at DESC);

ALTER TABLE public.procedures
  ADD COLUMN IF NOT EXISTS latest_version_id UUID REFERENCES public.procedure_versions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_procedures_latest_version ON public.procedures(latest_version_id);

ALTER TABLE public.procedure_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY procedure_versions_select ON public.procedure_versions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.procedures p WHERE p.id = procedure_versions.procedure_id AND (p.status = 'active' OR public.has_role(auth.uid(), 'admin')))
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY procedure_versions_admin ON public.procedure_versions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- PROCEDURE_AUDIT_LOGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.procedure_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procedure_id UUID NOT NULL REFERENCES public.procedures(id) ON DELETE CASCADE,
  procedure_version_id UUID REFERENCES public.procedure_versions(id) ON DELETE SET NULL,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action procedure_audit_action NOT NULL,
  diff JSONB,
  snapshot_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_procedure_audit_logs_procedure ON public.procedure_audit_logs(procedure_id);
CREATE INDEX IF NOT EXISTS idx_procedure_audit_logs_created_at ON public.procedure_audit_logs(created_at DESC);

ALTER TABLE public.procedure_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY procedure_audit_logs_admin_read ON public.procedure_audit_logs
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY procedure_audit_logs_insert ON public.procedure_audit_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- PROGRAM_PROCEDURES (many-to-many program_cohorts <-> procedures)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.program_procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_cohort_id UUID NOT NULL REFERENCES public.program_cohorts(id) ON DELETE CASCADE,
  procedure_id UUID NOT NULL REFERENCES public.procedures(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 0,
  override_settings JSONB DEFAULT '{}'::jsonb,
  added_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (program_cohort_id, procedure_id)
);

CREATE INDEX IF NOT EXISTS idx_program_procedures_cohort ON public.program_procedures(program_cohort_id);
CREATE INDEX IF NOT EXISTS idx_program_procedures_procedure ON public.program_procedures(procedure_id);

ALTER TABLE public.program_procedures ENABLE ROW LEVEL SECURITY;

CREATE POLICY program_procedures_select ON public.program_procedures
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor')
  );
CREATE POLICY program_procedures_admin_supervisor ON public.program_procedures
  FOR ALL USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor'));

-- ============================================================================
-- OBSERVATIONS (one per assessment run)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procedure_id UUID NOT NULL REFERENCES public.procedures(id) ON DELETE RESTRICT,
  procedure_version_id UUID NOT NULL REFERENCES public.procedure_versions(id) ON DELETE RESTRICT,
  program_cohort_id UUID REFERENCES public.program_cohorts(id) ON DELETE SET NULL,
  learner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  observer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  location_context TEXT,
  form_responses JSONB NOT NULL DEFAULT '{}'::jsonb,
  summary_ratings JSONB,
  comments TEXT,
  status observation_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_observations_procedure ON public.observations(procedure_id);
CREATE INDEX IF NOT EXISTS idx_observations_learner ON public.observations(learner_id);
CREATE INDEX IF NOT EXISTS idx_observations_observer ON public.observations(observer_id);
CREATE INDEX IF NOT EXISTS idx_observations_created_at ON public.observations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_observations_status ON public.observations(status);

DROP TRIGGER IF EXISTS update_observations_updated_at ON public.observations;
CREATE TRIGGER update_observations_updated_at
  BEFORE UPDATE ON public.observations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.observations ENABLE ROW LEVEL SECURITY;

CREATE POLICY observations_learner_own ON public.observations
  FOR SELECT USING (auth.uid() = learner_id);
CREATE POLICY observations_supervisor ON public.observations
  FOR SELECT USING (public.has_role(auth.uid(), 'supervisor') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY observations_supervisor_insert ON public.observations
  FOR INSERT WITH CHECK (
    (public.has_role(auth.uid(), 'supervisor') OR public.has_role(auth.uid(), 'admin')) AND observer_id = auth.uid()
  );
CREATE POLICY observations_supervisor_update ON public.observations
  FOR UPDATE USING (
    (public.has_role(auth.uid(), 'supervisor') OR public.has_role(auth.uid(), 'admin')) AND observer_id = auth.uid()
  );
CREATE POLICY observations_admin_all ON public.observations
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- BUTTON_DEFINITIONS (global)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.button_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  icon TEXT,
  variant TEXT DEFAULT 'default',
  size TEXT DEFAULT 'default',
  sort_order INTEGER NOT NULL DEFAULT 0,
  tooltip TEXT,
  confirm_title TEXT,
  confirm_body TEXT,
  confirm_label TEXT,
  cancel_label TEXT,
  visibility_rules JSONB DEFAULT '{}'::jsonb,
  action_type TEXT NOT NULL DEFAULT 'NAVIGATE',
  action_payload JSONB DEFAULT '{}'::jsonb,
  context_scope button_context_scope NOT NULL DEFAULT 'global',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_button_definitions_key ON public.button_definitions(key);
CREATE INDEX IF NOT EXISTS idx_button_definitions_context ON public.button_definitions(context_scope);

DROP TRIGGER IF EXISTS update_button_definitions_updated_at ON public.button_definitions;
CREATE TRIGGER update_button_definitions_updated_at
  BEFORE UPDATE ON public.button_definitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.button_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY button_definitions_admin ON public.button_definitions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY button_definitions_read ON public.button_definitions
  FOR SELECT USING (true);

-- ============================================================================
-- BUTTON_SETS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.button_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  context button_context_type NOT NULL DEFAULT 'card',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS update_button_sets_updated_at ON public.button_sets;
CREATE TRIGGER update_button_sets_updated_at
  BEFORE UPDATE ON public.button_sets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.button_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY button_sets_admin ON public.button_sets
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY button_sets_read ON public.button_sets
  FOR SELECT USING (true);

-- ============================================================================
-- BUTTON_SET_ITEMS (set <-> definition with order)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.button_set_items (
  button_set_id UUID NOT NULL REFERENCES public.button_sets(id) ON DELETE CASCADE,
  button_definition_id UUID NOT NULL REFERENCES public.button_definitions(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (button_set_id, button_definition_id)
);

ALTER TABLE public.button_set_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY button_set_items_admin ON public.button_set_items
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY button_set_items_read ON public.button_set_items
  FOR SELECT USING (true);

-- ============================================================================
-- PROCEDURE_BUTTON_SET (procedure-level override)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.procedure_button_set (
  procedure_id UUID NOT NULL REFERENCES public.procedures(id) ON DELETE CASCADE,
  context button_context_type NOT NULL,
  button_set_id UUID NOT NULL REFERENCES public.button_sets(id) ON DELETE CASCADE,
  PRIMARY KEY (procedure_id, context)
);

ALTER TABLE public.procedure_button_set ENABLE ROW LEVEL SECURITY;

CREATE POLICY procedure_button_set_admin ON public.procedure_button_set
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY procedure_button_set_read ON public.procedure_button_set
  FOR SELECT USING (true);

-- ============================================================================
-- PROGRAM_PROCEDURE_BUTTON_SET (program-procedure override)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.program_procedure_button_set (
  program_procedure_id UUID NOT NULL REFERENCES public.program_procedures(id) ON DELETE CASCADE,
  context button_context_type NOT NULL,
  button_set_id UUID NOT NULL REFERENCES public.button_sets(id) ON DELETE CASCADE,
  PRIMARY KEY (program_procedure_id, context)
);

ALTER TABLE public.program_procedure_button_set ENABLE ROW LEVEL SECURITY;

CREATE POLICY program_procedure_button_set_admin_supervisor ON public.program_procedure_button_set
  FOR ALL USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor'));
CREATE POLICY program_procedure_button_set_read ON public.program_procedure_button_set
  FOR SELECT USING (true);

COMMENT ON TABLE public.procedure_versions IS 'Immutable procedure form snapshots; procedure.latest_version_id points to current';
COMMENT ON TABLE public.procedure_audit_logs IS 'Audit trail for procedure edits (who, what, when)';
COMMENT ON TABLE public.program_procedures IS 'Procedures assigned to a program cohort with optional overrides';
COMMENT ON TABLE public.observations IS 'Assessment run records (form responses, observer, learner, version locked)';
COMMENT ON TABLE public.button_definitions IS 'Global button config (label, icon, action, visibility rules)';
COMMENT ON TABLE public.button_sets IS 'Named groups of buttons for card/form/workflow context';
