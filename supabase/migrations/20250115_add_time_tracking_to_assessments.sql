-- Migration: Add Time Tracking to Assessments
-- Created: 2025-01-15
-- Purpose: Allow supervisors to indicate observation time and feedback time for all assessment types

-- ============================================================================
-- ENSURE CME TYPES EXIST (if CME tracking migration hasn't been run)
-- ============================================================================

-- Activity type enum (create if doesn't exist)
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

-- Source enum (create if doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cme_source') THEN
    CREATE TYPE cme_source AS ENUM ('auto_wba', 'manual');
  END IF;
END $$;

-- ============================================================================
-- ADD TIME TRACKING COLUMNS TO ASSESSMENT TABLES
-- ============================================================================

-- Add columns to EPA assessments
ALTER TABLE public.epa_assessments
  ADD COLUMN IF NOT EXISTS observation_time_minutes INTEGER CHECK (observation_time_minutes IS NULL OR (observation_time_minutes >= 0 AND observation_time_minutes <= 1440)),
  ADD COLUMN IF NOT EXISTS feedback_time_minutes INTEGER CHECK (feedback_time_minutes IS NULL OR (feedback_time_minutes >= 0 AND feedback_time_minutes <= 1440));

-- Add columns to direct observation assessments
ALTER TABLE public.direct_observation_assessments
  ADD COLUMN IF NOT EXISTS observation_time_minutes INTEGER CHECK (observation_time_minutes IS NULL OR (observation_time_minutes >= 0 AND observation_time_minutes <= 1440)),
  ADD COLUMN IF NOT EXISTS feedback_time_minutes INTEGER CHECK (feedback_time_minutes IS NULL OR (feedback_time_minutes >= 0 AND feedback_time_minutes <= 1440));

-- Add columns to narrative assessments
ALTER TABLE public.narrative_assessments
  ADD COLUMN IF NOT EXISTS observation_time_minutes INTEGER CHECK (observation_time_minutes IS NULL OR (observation_time_minutes >= 0 AND observation_time_minutes <= 1440)),
  ADD COLUMN IF NOT EXISTS feedback_time_minutes INTEGER CHECK (feedback_time_minutes IS NULL OR (feedback_time_minutes >= 0 AND feedback_time_minutes <= 1440));

-- ============================================================================
-- ENSURE CME HELPER FUNCTION EXISTS (if CME tracking migration hasn't been run)
-- ============================================================================

-- Function to get supervisor's org_id from profile (create if doesn't exist)
-- This may already exist from the CME tracking migration
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
-- This will work whether or not the CME tracking migration has been run
-- If the table doesn't exist, it will be created when the CME migration runs
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
  -- Check if supervisor_cme_sessions table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'supervisor_cme_sessions'
  ) THEN
    -- Table doesn't exist yet (CME tracking migration not run), just return NULL
    -- The trigger will still work, it just won't create CME sessions
    RETURN NULL;
  END IF;

  -- Get org_id from supervisor profile (may be NULL)
  BEGIN
    SELECT institution_id INTO v_org_id FROM public.profiles WHERE id = p_supervisor_id;
  EXCEPTION
    WHEN OTHERS THEN
      v_org_id := NULL;
  END;
  
  -- Use provided date or default to today
  v_date := COALESCE(p_session_date, CURRENT_DATE);
  
  -- Check if session already exists for this WBA
  BEGIN
    SELECT id INTO v_session_id
    FROM public.supervisor_cme_sessions
    WHERE wba_id = p_wba_id 
      AND wba_type = p_wba_type 
      AND source = 'auto_wba'::cme_source
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
        'auto_wba'::cme_source,
        p_wba_id,
        p_wba_type,
        p_activity_type,
        p_minutes,
        p_description,
        v_date
      )
      RETURNING id INTO v_session_id;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      -- If anything fails (permissions, etc.), just return NULL
      -- This allows the trigger to complete successfully even if CME tracking fails
      RETURN NULL;
  END;
  
  RETURN v_session_id;
END;
$$;

-- ============================================================================
-- UPDATE CME TRIGGER FUNCTIONS TO USE ACTUAL TIMES
-- ============================================================================

-- Update EPA assessment CME trigger function
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
  v_observation_minutes INTEGER;
  v_feedback_minutes INTEGER;
BEGIN
  -- Only process if supervisor_id is present
  IF NEW.supervisor_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get actual times from assessment, defaulting to 0 if not provided
  v_observation_minutes := COALESCE(NEW.observation_time_minutes, 0);
  v_feedback_minutes := COALESCE(NEW.feedback_time_minutes, 0);
  
  -- Calculate total minutes (observation + feedback)
  -- If both are 0 or NULL, use default values based on whether feedback exists
  IF v_observation_minutes = 0 AND v_feedback_minutes = 0 THEN
    IF NEW.feedback IS NOT NULL AND LENGTH(TRIM(NEW.feedback)) > 0 THEN
      v_minutes := 10; -- Default: 7 min observation + 3 min feedback
      v_observation_minutes := 7;
      v_feedback_minutes := 3;
    ELSE
      v_minutes := 7; -- Default observation time
      v_observation_minutes := 7;
      v_feedback_minutes := 0;
    END IF;
  ELSE
    -- Use actual times provided by supervisor
    v_minutes := v_observation_minutes + v_feedback_minutes;
  END IF;
  
  -- Ensure minimum of 1 minute for CME tracking
  IF v_minutes < 1 THEN
    v_minutes := 1;
  END IF;
  
  -- Determine activity type
  v_activity_type := 'direct_observation';
  
  -- Build description
  IF v_observation_minutes > 0 AND v_feedback_minutes > 0 THEN
    v_description := 'EPA ' || NEW.epa_number || ' - Observation: ' || v_observation_minutes || ' min, Feedback: ' || v_feedback_minutes || ' min';
  ELSIF v_observation_minutes > 0 THEN
    v_description := 'EPA ' || NEW.epa_number || ' - Observation: ' || v_observation_minutes || ' min';
  ELSIF v_feedback_minutes > 0 THEN
    v_description := 'EPA ' || NEW.epa_number || ' - Feedback: ' || v_feedback_minutes || ' min';
  ELSE
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

-- Update direct observation assessment CME trigger function
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
  v_observation_minutes INTEGER;
  v_feedback_minutes INTEGER;
BEGIN
  IF NEW.supervisor_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get actual times from assessment
  v_observation_minutes := COALESCE(NEW.observation_time_minutes, 0);
  v_feedback_minutes := COALESCE(NEW.feedback_time_minutes, 0);
  
  -- Calculate total minutes
  IF v_observation_minutes = 0 AND v_feedback_minutes = 0 THEN
    IF NEW.feedback IS NOT NULL AND LENGTH(TRIM(NEW.feedback)) > 0 THEN
      v_minutes := 10; -- Default: 7 min observation + 3 min feedback
      v_observation_minutes := 7;
      v_feedback_minutes := 3;
    ELSE
      v_minutes := 7; -- Default observation time
      v_observation_minutes := 7;
      v_feedback_minutes := 0;
    END IF;
  ELSE
    v_minutes := v_observation_minutes + v_feedback_minutes;
  END IF;
  
  -- Ensure minimum of 1 minute
  IF v_minutes < 1 THEN
    v_minutes := 1;
  END IF;
  
  v_activity_type := 'direct_observation';
  
  -- Build description
  IF v_observation_minutes > 0 AND v_feedback_minutes > 0 THEN
    v_description := 'Direct observation: ' || NEW.procedure_type || ' - Observation: ' || v_observation_minutes || ' min, Feedback: ' || v_feedback_minutes || ' min';
  ELSIF v_observation_minutes > 0 THEN
    v_description := 'Direct observation: ' || NEW.procedure_type || ' - Observation: ' || v_observation_minutes || ' min';
  ELSIF v_feedback_minutes > 0 THEN
    v_description := 'Direct observation: ' || NEW.procedure_type || ' - Feedback: ' || v_feedback_minutes || ' min';
  ELSE
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

-- Update narrative assessment CME trigger function
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
  v_observation_minutes INTEGER;
  v_feedback_minutes INTEGER;
BEGIN
  IF NEW.supervisor_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get actual times from assessment
  v_observation_minutes := COALESCE(NEW.observation_time_minutes, 0);
  v_feedback_minutes := COALESCE(NEW.feedback_time_minutes, 0);
  
  -- Calculate total minutes
  IF v_observation_minutes = 0 AND v_feedback_minutes = 0 THEN
    -- Check if this looks like an end-of-rotation assessment
    IF NEW.assessment_period IS NOT NULL 
       AND (LOWER(NEW.assessment_period) LIKE '%rotation%' 
            OR LOWER(NEW.assessment_period) LIKE '%end%'
            OR LOWER(NEW.assessment_period) LIKE '%summary%') THEN
      v_minutes := 20; -- Default for end-of-rotation
      v_observation_minutes := 10;
      v_feedback_minutes := 10;
    ELSE
      v_minutes := 5; -- Default for narrative feedback
      v_observation_minutes := 0;
      v_feedback_minutes := 5;
    END IF;
  ELSE
    v_minutes := v_observation_minutes + v_feedback_minutes;
  END IF;
  
  -- Ensure minimum of 1 minute
  IF v_minutes < 1 THEN
    v_minutes := 1;
  END IF;
  
  -- Determine activity type based on assessment period
  IF NEW.assessment_period IS NOT NULL 
     AND (LOWER(NEW.assessment_period) LIKE '%rotation%' 
          OR LOWER(NEW.assessment_period) LIKE '%end%'
          OR LOWER(NEW.assessment_period) LIKE '%summary%') THEN
    v_activity_type := 'end_of_rotation';
  ELSE
    v_activity_type := 'narrative_feedback';
  END IF;
  
  -- Build description
  IF v_observation_minutes > 0 AND v_feedback_minutes > 0 THEN
    v_description := COALESCE(NEW.assessment_period, 'Narrative feedback') || ' - Observation: ' || v_observation_minutes || ' min, Feedback: ' || v_feedback_minutes || ' min';
  ELSIF v_observation_minutes > 0 THEN
    v_description := COALESCE(NEW.assessment_period, 'Narrative feedback') || ' - Observation: ' || v_observation_minutes || ' min';
  ELSIF v_feedback_minutes > 0 THEN
    v_description := COALESCE(NEW.assessment_period, 'Narrative feedback') || ' - Feedback: ' || v_feedback_minutes || ' min';
  ELSE
    v_description := COALESCE(NEW.assessment_period, 'Narrative feedback assessment');
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

