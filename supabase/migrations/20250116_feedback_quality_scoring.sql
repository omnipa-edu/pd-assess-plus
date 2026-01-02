-- Migration: Feedback Quality Scoring & AI Usage Tracking
-- Created: 2025-01-16
-- Purpose: Track feedback quality scores and AI assistant usage for supervisor assessments

-- ============================================================================
-- ADD AI USAGE COLUMNS TO ASSESSMENT TABLES
-- ============================================================================

-- Add AI usage tracking to EPA assessments
ALTER TABLE public.epa_assessments
  ADD COLUMN IF NOT EXISTS used_smart_feedback BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS smart_feedback_applied BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS smart_feedback_version TEXT;

-- Add AI usage tracking to direct observation assessments
ALTER TABLE public.direct_observation_assessments
  ADD COLUMN IF NOT EXISTS used_smart_feedback BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS smart_feedback_applied BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS smart_feedback_version TEXT;

-- Add AI usage tracking to narrative assessments
ALTER TABLE public.narrative_assessments
  ADD COLUMN IF NOT EXISTS used_smart_feedback BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS smart_feedback_applied BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS smart_feedback_version TEXT;

-- ============================================================================
-- FEEDBACK QUALITY SCORES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.feedback_quality_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL,
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('epa', 'direct_observation', 'narrative')),
  supervisor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  org_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
  
  -- Overall score (0-100)
  overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  
  -- Per-dimension scores (0-4 scale)
  clarity_score INTEGER NOT NULL CHECK (clarity_score >= 0 AND clarity_score <= 4),
  specificity_score INTEGER NOT NULL CHECK (specificity_score >= 0 AND specificity_score <= 4),
  actionability_score INTEGER NOT NULL CHECK (actionability_score >= 0 AND actionability_score <= 4),
  balance_score INTEGER NOT NULL CHECK (balance_score >= 0 AND balance_score <= 4),
  learner_engagement_score INTEGER NOT NULL CHECK (learner_engagement_score >= 0 AND learner_engagement_score <= 4),
  tone_professionalism_score INTEGER NOT NULL CHECK (tone_professionalism_score >= 0 AND tone_professionalism_score <= 4),
  
  -- AI usage flag (copied from assessment)
  used_ai_assistant BOOLEAN NOT NULL DEFAULT false,
  
  -- Optional: brief rationale (stored as JSONB for flexibility)
  scoring_rationale JSONB,
  
  -- Timestamps
  scored_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Ensure one score per assessment
  CONSTRAINT feedback_quality_scores_assessment_unique UNIQUE (assessment_id, assessment_type)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_feedback_quality_scores_supervisor 
  ON public.feedback_quality_scores(supervisor_id, scored_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_quality_scores_org 
  ON public.feedback_quality_scores(org_id, scored_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_quality_scores_assessment 
  ON public.feedback_quality_scores(assessment_id, assessment_type);
CREATE INDEX IF NOT EXISTS idx_feedback_quality_scores_overall 
  ON public.feedback_quality_scores(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_quality_scores_ai_usage 
  ON public.feedback_quality_scores(used_ai_assistant);

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================

DROP TRIGGER IF EXISTS update_feedback_quality_scores_updated_at ON public.feedback_quality_scores;
CREATE TRIGGER update_feedback_quality_scores_updated_at 
  BEFORE UPDATE ON public.feedback_quality_scores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE public.feedback_quality_scores ENABLE ROW LEVEL SECURITY;

-- Supervisors can view their own scores
DROP POLICY IF EXISTS feedback_quality_scores_own ON public.feedback_quality_scores;
CREATE POLICY feedback_quality_scores_own ON public.feedback_quality_scores
  FOR SELECT USING (supervisor_id = auth.uid());

-- Admins can view all scores in their org
DROP POLICY IF EXISTS feedback_quality_scores_admin_view ON public.feedback_quality_scores;
CREATE POLICY feedback_quality_scores_admin_view ON public.feedback_quality_scores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- System can insert scores (via service role or function)
-- Note: In production, you may want to restrict this further
DROP POLICY IF EXISTS feedback_quality_scores_insert ON public.feedback_quality_scores;
CREATE POLICY feedback_quality_scores_insert ON public.feedback_quality_scores
  FOR INSERT WITH CHECK (
    supervisor_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- HELPER FUNCTION: Get supervisor's org_id
-- ============================================================================

-- This function may already exist from CME tracking migration
CREATE OR REPLACE FUNCTION public.get_supervisor_org_id(p_supervisor_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT institution_id FROM public.profiles WHERE id = p_supervisor_id;
$$;

-- ============================================================================
-- FUNCTION: Upsert feedback quality score
-- ============================================================================

CREATE OR REPLACE FUNCTION public.upsert_feedback_quality_score(
  p_assessment_id UUID,
  p_assessment_type TEXT,
  p_supervisor_id UUID,
  p_overall_score INTEGER,
  p_clarity_score INTEGER,
  p_specificity_score INTEGER,
  p_actionability_score INTEGER,
  p_balance_score INTEGER,
  p_learner_engagement_score INTEGER,
  p_tone_professionalism_score INTEGER,
  p_used_ai_assistant BOOLEAN,
  p_scoring_rationale JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_score_id UUID;
  v_org_id UUID;
BEGIN
  -- Get org_id from supervisor profile
  SELECT get_supervisor_org_id(p_supervisor_id) INTO v_org_id;
  
  -- Check if score already exists
  SELECT id INTO v_score_id
  FROM public.feedback_quality_scores
  WHERE assessment_id = p_assessment_id 
    AND assessment_type = p_assessment_type;
  
  IF v_score_id IS NOT NULL THEN
    -- Update existing score
    UPDATE public.feedback_quality_scores
    SET 
      overall_score = p_overall_score,
      clarity_score = p_clarity_score,
      specificity_score = p_specificity_score,
      actionability_score = p_actionability_score,
      balance_score = p_balance_score,
      learner_engagement_score = p_learner_engagement_score,
      tone_professionalism_score = p_tone_professionalism_score,
      used_ai_assistant = p_used_ai_assistant,
      scoring_rationale = COALESCE(p_scoring_rationale, scoring_rationale),
      scored_at = now()
    WHERE id = v_score_id;
  ELSE
    -- Insert new score
    INSERT INTO public.feedback_quality_scores (
      assessment_id,
      assessment_type,
      supervisor_id,
      org_id,
      overall_score,
      clarity_score,
      specificity_score,
      actionability_score,
      balance_score,
      learner_engagement_score,
      tone_professionalism_score,
      used_ai_assistant,
      scoring_rationale
    )
    VALUES (
      p_assessment_id,
      p_assessment_type,
      p_supervisor_id,
      v_org_id,
      p_overall_score,
      p_clarity_score,
      p_specificity_score,
      p_actionability_score,
      p_balance_score,
      p_learner_engagement_score,
      p_tone_professionalism_score,
      p_used_ai_assistant,
      p_scoring_rationale
    )
    RETURNING id INTO v_score_id;
  END IF;
  
  RETURN v_score_id;
END;
$$;

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.feedback_quality_scores TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_feedback_quality_score(UUID, TEXT, UUID, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, BOOLEAN, JSONB) TO authenticated;

