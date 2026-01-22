-- ML-Ready Personalized Learning Plan Engine
-- Migration: 20250120_learning_plan_engine.sql
-- Purpose: Create tables for learning action library, recommendations, and status tracking

-- ============================================================================
-- LEARNING ACTIONS LIBRARY
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.learning_actions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT NOT NULL UNIQUE,
  label           TEXT NOT NULL,
  description     TEXT NOT NULL,
  epa_id          UUID REFERENCES public.epas(id) ON DELETE SET NULL,
  discipline_id   UUID REFERENCES public.specialties(id) ON DELETE SET NULL,
  intensity       INTEGER NOT NULL DEFAULT 1 CHECK (intensity >= 1 AND intensity <= 3),
  action_type     TEXT NOT NULL CHECK (action_type IN (
    'increase_exposure',
    'micro_module',
    'reflection',
    'feedback_request',
    'simulation',
    'peer_learning',
    'self_study',
    'supervised_practice'
  )),
  dimension_tags  TEXT[] NOT NULL DEFAULT '{}',
  learning_mode_tags TEXT[] NOT NULL DEFAULT '{}',
  prerequisites   JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT learning_actions_code_check CHECK (char_length(code) >= 3 AND char_length(code) <= 100),
  CONSTRAINT learning_actions_label_check CHECK (char_length(label) >= 5 AND char_length(label) <= 200),
  CONSTRAINT learning_actions_description_check CHECK (char_length(description) >= 10 AND char_length(description) <= 2000)
);

CREATE INDEX IF NOT EXISTS idx_learning_actions_epa ON public.learning_actions(epa_id) WHERE epa_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_learning_actions_discipline ON public.learning_actions(discipline_id) WHERE discipline_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_learning_actions_active ON public.learning_actions(is_active);
CREATE INDEX IF NOT EXISTS idx_learning_actions_type ON public.learning_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_learning_actions_dimension_tags ON public.learning_actions USING gin(dimension_tags);
CREATE INDEX IF NOT EXISTS idx_learning_actions_learning_mode_tags ON public.learning_actions USING gin(learning_mode_tags);

-- ============================================================================
-- LEARNING PLAN RECOMMENDATIONS (ML TRAINING DATA)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.learning_plan_recommendations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  epa_id              UUID REFERENCES public.epas(id) ON DELETE SET NULL,
  action_id           UUID NOT NULL REFERENCES public.learning_actions(id) ON DELETE RESTRICT,
  recommended_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  recommendation_context JSONB NOT NULL,
  ranking_score       NUMERIC(6,3),
  rank_position       INTEGER NOT NULL,
  source_model        TEXT NOT NULL DEFAULT 'rules_v1',
  
  -- Interaction / outcome fields
  viewed_at           TIMESTAMPTZ,
  accepted_at         TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  dismissed_at        TIMESTAMPTZ,
  user_feedback       JSONB,
  outcome_window_days INTEGER,
  outcome_metrics     JSONB,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT learning_plan_recommendations_rank_check CHECK (rank_position >= 1),
  CONSTRAINT learning_plan_recommendations_score_check CHECK (ranking_score IS NULL OR (ranking_score >= -1000 AND ranking_score <= 1000))
);

CREATE INDEX IF NOT EXISTS idx_learning_plan_recommendations_learner 
  ON public.learning_plan_recommendations(learner_id, recommended_at DESC);
CREATE INDEX IF NOT EXISTS idx_learning_plan_recommendations_epa 
  ON public.learning_plan_recommendations(epa_id) WHERE epa_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_learning_plan_recommendations_action 
  ON public.learning_plan_recommendations(action_id);
CREATE INDEX IF NOT EXISTS idx_learning_plan_recommendations_source_model 
  ON public.learning_plan_recommendations(source_model);
CREATE INDEX IF NOT EXISTS idx_learning_plan_recommendations_outcome 
  ON public.learning_plan_recommendations(outcome_window_days) WHERE outcome_window_days IS NULL;
CREATE INDEX IF NOT EXISTS idx_learning_plan_recommendations_status 
  ON public.learning_plan_recommendations(learner_id, viewed_at, completed_at, dismissed_at);

-- ============================================================================
-- LEARNER ACTION STATUS (UI CONVENIENCE)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.learner_action_status (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_id       UUID NOT NULL REFERENCES public.learning_actions(id) ON DELETE CASCADE,
  epa_id          UUID REFERENCES public.epas(id) ON DELETE SET NULL,
  status          TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'dismissed')),
  assigned_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes           TEXT,
  
  UNIQUE (learner_id, action_id, epa_id)
);

CREATE INDEX IF NOT EXISTS idx_learner_action_status_learner 
  ON public.learner_action_status(learner_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_learner_action_status_action 
  ON public.learner_action_status(action_id);
CREATE INDEX IF NOT EXISTS idx_learner_action_status_epa 
  ON public.learner_action_status(epa_id) WHERE epa_id IS NOT NULL;

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS update_learning_actions_updated_at ON public.learning_actions;
CREATE TRIGGER update_learning_actions_updated_at 
  BEFORE UPDATE ON public.learning_actions
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_learner_action_status_updated_at ON public.learner_action_status;
CREATE TRIGGER update_learner_action_status_updated_at 
  BEFORE UPDATE ON public.learner_action_status
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE public.learning_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_plan_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learner_action_status ENABLE ROW LEVEL SECURITY;

-- Learning Actions: Read-only for authenticated users
DROP POLICY IF EXISTS learning_actions_read ON public.learning_actions;
CREATE POLICY learning_actions_read ON public.learning_actions
  FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = true);

-- Admins can manage learning actions
DROP POLICY IF EXISTS learning_actions_admin ON public.learning_actions;
CREATE POLICY learning_actions_admin ON public.learning_actions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Recommendations: Learners can see their own
DROP POLICY IF EXISTS learning_plan_recommendations_own ON public.learning_plan_recommendations;
CREATE POLICY learning_plan_recommendations_own ON public.learning_plan_recommendations
  FOR SELECT USING (learner_id = auth.uid());

-- Recommendations: Learners can update their own (viewed, accepted, completed, dismissed)
DROP POLICY IF EXISTS learning_plan_recommendations_update_own ON public.learning_plan_recommendations;
CREATE POLICY learning_plan_recommendations_update_own ON public.learning_plan_recommendations
  FOR UPDATE USING (learner_id = auth.uid())
  WITH CHECK (learner_id = auth.uid());

-- Supervisors can see recommendations for their assigned learners
DROP POLICY IF EXISTS learning_plan_recommendations_supervisor ON public.learning_plan_recommendations;
CREATE POLICY learning_plan_recommendations_supervisor ON public.learning_plan_recommendations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.supervisor_student_assignments
      WHERE student_id = learning_plan_recommendations.learner_id
        AND supervisor_id = auth.uid()
        AND is_active = true
    )
  );

-- Admins can see all recommendations
DROP POLICY IF EXISTS learning_plan_recommendations_admin ON public.learning_plan_recommendations;
CREATE POLICY learning_plan_recommendations_admin ON public.learning_plan_recommendations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- System can insert recommendations (via service role or function)
DROP POLICY IF EXISTS learning_plan_recommendations_insert ON public.learning_plan_recommendations;
CREATE POLICY learning_plan_recommendations_insert ON public.learning_plan_recommendations
  FOR INSERT WITH CHECK (
    learner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'supervisor')
    )
  );

-- Learner Action Status: Learners can see and update their own
DROP POLICY IF EXISTS learner_action_status_own ON public.learner_action_status;
CREATE POLICY learner_action_status_own ON public.learner_action_status
  FOR ALL USING (learner_id = auth.uid())
  WITH CHECK (learner_id = auth.uid());

-- Supervisors can see status for their assigned learners
DROP POLICY IF EXISTS learner_action_status_supervisor ON public.learner_action_status;
CREATE POLICY learner_action_status_supervisor ON public.learner_action_status
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.supervisor_student_assignments
      WHERE student_id = learner_action_status.learner_id
        AND supervisor_id = auth.uid()
        AND is_active = true
    )
  );

-- Admins can see all statuses
DROP POLICY IF EXISTS learner_action_status_admin ON public.learner_action_status;
CREATE POLICY learner_action_status_admin ON public.learner_action_status
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.learning_actions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.learning_plan_recommendations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.learner_action_status TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.learning_actions IS 'Reusable library of learning actions that can be recommended to learners';
COMMENT ON TABLE public.learning_plan_recommendations IS 'Log of all recommendations with context, scores, and outcomes for ML training';
COMMENT ON TABLE public.learner_action_status IS 'UI convenience table tracking learner progress on assigned actions';





