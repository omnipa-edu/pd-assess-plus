-- Migration: Supervisor CME Tracking
-- Created: 2025-11-15
-- Purpose: Track supervisor coaching time for CME documentation (Category II CME / NCCPA Category II)

-- ============================================================================
-- TYPE DEFINITIONS
-- ============================================================================

-- Activity type enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cme_activity_type') THEN
    CREATE TYPE cme_activity_type AS ENUM (
      'direct_observation',
      'chart_review',
      'end_of_rotation',
      'narrative_feedback',
      'group_teaching',
      'other'
    );
  END IF;
END $$;

-- Source enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cme_source') THEN
    CREATE TYPE cme_source AS ENUM ('auto_wba', 'manual');
  END IF;
END $$;

-- ============================================================================
-- SUPERVISOR CME SESSIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.supervisor_cme_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supervisor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  org_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
  source cme_source NOT NULL,
  wba_id UUID, -- References epa_assessments, direct_observation_assessments, or narrative_assessments
  wba_type TEXT, -- 'epa', 'direct_observation', 'narrative'
  activity_type cme_activity_type NOT NULL,
  minutes INTEGER NOT NULL CHECK (minutes > 0 AND minutes <= 1440),
  description TEXT,
  session_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_supervisor_cme_sessions_supervisor_date 
  ON public.supervisor_cme_sessions(supervisor_id, session_date DESC);
CREATE INDEX IF NOT EXISTS idx_supervisor_cme_sessions_org_date 
  ON public.supervisor_cme_sessions(org_id, session_date DESC);
CREATE INDEX IF NOT EXISTS idx_supervisor_cme_sessions_wba 
  ON public.supervisor_cme_sessions(wba_id, wba_type) 
  WHERE wba_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_supervisor_cme_sessions_source 
  ON public.supervisor_cme_sessions(source);
CREATE INDEX IF NOT EXISTS idx_supervisor_cme_sessions_activity 
  ON public.supervisor_cme_sessions(activity_type);

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================

DROP TRIGGER IF EXISTS update_supervisor_cme_sessions_updated_at ON public.supervisor_cme_sessions;
CREATE TRIGGER update_supervisor_cme_sessions_updated_at 
  BEFORE UPDATE ON public.supervisor_cme_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE public.supervisor_cme_sessions ENABLE ROW LEVEL SECURITY;

-- Supervisors can manage their own sessions
DROP POLICY IF EXISTS supervisor_cme_sessions_own ON public.supervisor_cme_sessions;
CREATE POLICY supervisor_cme_sessions_own ON public.supervisor_cme_sessions
  FOR ALL USING (supervisor_id = auth.uid());

-- Admins can view all sessions for their org
DROP POLICY IF EXISTS supervisor_cme_sessions_admin_view ON public.supervisor_cme_sessions;
CREATE POLICY supervisor_cme_sessions_admin_view ON public.supervisor_cme_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get supervisor's org_id from profile
CREATE OR REPLACE FUNCTION public.get_supervisor_org_id(p_supervisor_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT institution_id FROM public.profiles WHERE id = p_supervisor_id;
$$;

-- Function to create or update CME session from WBA
-- This prevents duplicates when a WBA is updated
CREATE OR REPLACE FUNCTION public.upsert_cme_session_from_wba(
  p_supervisor_id UUID,
  p_wba_id UUID,
  p_wba_type TEXT,
  p_activity_type cme_activity_type,
  p_minutes INTEGER,
  p_description TEXT DEFAULT NULL,
  p_session_date DATE DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id UUID;
  v_org_id UUID;
  v_date DATE;
BEGIN
  -- Get org_id from supervisor profile
  SELECT get_supervisor_org_id(p_supervisor_id) INTO v_org_id;
  
  -- Use provided date or default to today
  v_date := COALESCE(p_session_date, CURRENT_DATE);
  
  -- Check if session already exists for this WBA
  SELECT id INTO v_session_id
  FROM public.supervisor_cme_sessions
  WHERE wba_id = p_wba_id 
    AND wba_type = p_wba_type 
    AND source = 'auto_wba'
    AND supervisor_id = p_supervisor_id;
  
  IF v_session_id IS NOT NULL THEN
    -- Update existing session
    UPDATE public.supervisor_cme_sessions
    SET 
      activity_type = p_activity_type,
      minutes = p_minutes,
      description = COALESCE(p_description, description),
      session_date = v_date,
      updated_at = now()
    WHERE id = v_session_id;
  ELSE
    -- Insert new session
    INSERT INTO public.supervisor_cme_sessions (
      supervisor_id,
      org_id,
      source,
      wba_id,
      wba_type,
      activity_type,
      minutes,
      description,
      session_date
    )
    VALUES (
      p_supervisor_id,
      v_org_id,
      'auto_wba',
      p_wba_id,
      p_wba_type,
      p_activity_type,
      p_minutes,
      p_description,
      v_date
    )
    RETURNING id INTO v_session_id;
  END IF;
  
  RETURN v_session_id;
END;
$$;

-- ============================================================================
-- TRIGGERS FOR AUTO-GENERATION FROM WBAs
-- ============================================================================

-- Trigger function for EPA assessments
-- Mapping: EPA with narrative = direct_observation, 10 minutes
--          EPA without narrative = direct_observation, 7 minutes
CREATE OR REPLACE FUNCTION public.handle_epa_assessment_cme()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_activity_type cme_activity_type;
  v_minutes INTEGER;
  v_description TEXT;
BEGIN
  -- Only process if supervisor_id is present
  IF NEW.supervisor_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Determine activity type and minutes based on WBA content
  IF NEW.feedback IS NOT NULL AND LENGTH(TRIM(NEW.feedback)) > 0 THEN
    v_activity_type := 'direct_observation';
    v_minutes := 10;
    v_description := 'EPA ' || NEW.epa_number || ' observation with feedback';
  ELSE
    v_activity_type := 'direct_observation';
    v_minutes := 7;
    v_description := 'EPA ' || NEW.epa_number || ' observation';
  END IF;
  
  -- Create or update CME session
  PERFORM upsert_cme_session_from_wba(
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

-- Trigger for EPA assessments
DROP TRIGGER IF EXISTS trigger_epa_assessment_cme ON public.epa_assessments;
CREATE TRIGGER trigger_epa_assessment_cme
  AFTER INSERT OR UPDATE ON public.epa_assessments
  FOR EACH ROW
  WHEN (NEW.supervisor_id IS NOT NULL)
  EXECUTE FUNCTION public.handle_epa_assessment_cme();

-- Trigger function for direct observation assessments
-- Mapping: Direct observation with feedback = direct_observation, 10 minutes
--          Direct observation without feedback = direct_observation, 7 minutes
CREATE OR REPLACE FUNCTION public.handle_direct_observation_cme()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_activity_type cme_activity_type;
  v_minutes INTEGER;
  v_description TEXT;
BEGIN
  IF NEW.supervisor_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  IF NEW.feedback IS NOT NULL AND LENGTH(TRIM(NEW.feedback)) > 0 THEN
    v_activity_type := 'direct_observation';
    v_minutes := 10;
    v_description := 'Direct observation: ' || NEW.procedure_type || ' with feedback';
  ELSE
    v_activity_type := 'direct_observation';
    v_minutes := 7;
    v_description := 'Direct observation: ' || NEW.procedure_type;
  END IF;
  
  PERFORM upsert_cme_session_from_wba(
    NEW.supervisor_id,
    NEW.id,
    'direct_observation',
    v_activity_type,
    v_minutes,
    v_description,
    NEW.created_at::DATE
  );
  
  RETURN NEW;
END;
$$;

-- Trigger for direct observation assessments
DROP TRIGGER IF EXISTS trigger_direct_observation_cme ON public.direct_observation_assessments;
CREATE TRIGGER trigger_direct_observation_cme
  AFTER INSERT OR UPDATE ON public.direct_observation_assessments
  FOR EACH ROW
  WHEN (NEW.supervisor_id IS NOT NULL)
  EXECUTE FUNCTION public.handle_direct_observation_cme();

-- Trigger function for narrative assessments
-- Mapping: End-of-rotation assessment = end_of_rotation, 20 minutes
--          Other narrative = narrative_feedback, 5 minutes
CREATE OR REPLACE FUNCTION public.handle_narrative_assessment_cme()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_activity_type cme_activity_type;
  v_minutes INTEGER;
  v_description TEXT;
BEGIN
  IF NEW.supervisor_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Check if this looks like an end-of-rotation assessment
  IF NEW.assessment_period IS NOT NULL 
     AND (LOWER(NEW.assessment_period) LIKE '%rotation%' 
          OR LOWER(NEW.assessment_period) LIKE '%end%'
          OR LOWER(NEW.assessment_period) LIKE '%summary%') THEN
    v_activity_type := 'end_of_rotation';
    v_minutes := 20;
    v_description := 'End-of-rotation assessment: ' || COALESCE(NEW.assessment_period, 'Narrative feedback');
  ELSE
    v_activity_type := 'narrative_feedback';
    v_minutes := 5;
    v_description := 'Narrative feedback assessment';
  END IF;
  
  PERFORM upsert_cme_session_from_wba(
    NEW.supervisor_id,
    NEW.id,
    'narrative',
    v_activity_type,
    v_minutes,
    v_description,
    NEW.created_at::DATE
  );
  
  RETURN NEW;
END;
$$;

-- Trigger for narrative assessments
DROP TRIGGER IF EXISTS trigger_narrative_assessment_cme ON public.narrative_assessments;
CREATE TRIGGER trigger_narrative_assessment_cme
  AFTER INSERT OR UPDATE ON public.narrative_assessments
  FOR EACH ROW
  WHEN (NEW.supervisor_id IS NOT NULL)
  EXECUTE FUNCTION public.handle_narrative_assessment_cme();

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.supervisor_cme_sessions TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_supervisor_org_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_cme_session_from_wba(UUID, UUID, TEXT, cme_activity_type, INTEGER, TEXT, DATE) TO authenticated;


