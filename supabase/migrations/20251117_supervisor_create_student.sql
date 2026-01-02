-- Migration: Supervisor Create Student Function
-- Created: 2025-11-17
-- Purpose: Allow supervisors to create student accounts

-- ============================================================================
-- FUNCTION: create_student_account
-- ============================================================================
-- Allows supervisors to create student accounts by:
-- 1. Creating a profile entry (will be linked when student signs up)
-- 2. Assigning student role (will be linked when student signs up)
-- 3. Optionally setting institution_id
--
-- Note: The actual auth user will be created when the student signs up.
-- This function creates a "pending" profile that gets linked via email matching.

CREATE OR REPLACE FUNCTION public.create_student_account(
  p_email TEXT,
  p_full_name TEXT DEFAULT NULL,
  p_institution_id UUID DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  student_id UUID
)
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_existing_profile_id UUID;
  v_supervisor_id UUID;
BEGIN
  -- Get current user (supervisor)
  v_supervisor_id := auth.uid();
  
  -- Check if caller is a supervisor or admin
  IF NOT (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = v_supervisor_id AND role = 'supervisor') OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = v_supervisor_id AND role = 'admin')
  ) THEN
    RETURN QUERY SELECT false, 'Permission denied. Only supervisors and admins can create student accounts.'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Validate email
  IF p_email IS NULL OR p_email = '' OR NOT (p_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$') THEN
    RETURN QUERY SELECT false, 'Invalid email address.'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Check if profile already exists
  SELECT id INTO v_existing_profile_id
  FROM public.profiles
  WHERE email = LOWER(TRIM(p_email));

  IF v_existing_profile_id IS NOT NULL THEN
    -- Profile exists - check if it has student role, if not add it
    IF NOT EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = v_existing_profile_id AND role = 'student'
    ) THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (v_existing_profile_id, 'student')
      ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
    
    -- Update institution if provided
    IF p_institution_id IS NOT NULL THEN
      UPDATE public.profiles
      SET institution_id = p_institution_id
      WHERE id = v_existing_profile_id;
    END IF;
    
    RETURN QUERY SELECT true, 'Student account already exists. Role assigned if needed.'::TEXT, v_existing_profile_id;
    RETURN;
  END IF;

  -- Check if auth user exists (but profile doesn't)
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = LOWER(TRIM(p_email));

  IF v_user_id IS NOT NULL THEN
    -- Auth user exists but no profile - create profile
    INSERT INTO public.profiles (id, email, full_name, institution_id)
    VALUES (v_user_id, LOWER(TRIM(p_email)), p_full_name, p_institution_id)
    ON CONFLICT (id) DO UPDATE
    SET 
      full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
      institution_id = COALESCE(EXCLUDED.institution_id, profiles.institution_id);
    
    -- Assign student role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'student')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RETURN QUERY SELECT true, 'Student account created successfully.'::TEXT, v_user_id;
    RETURN;
  END IF;

  -- No existing user or profile - we can't create auth user from here
  -- Return a message indicating the student needs to sign up
  RETURN QUERY SELECT false, 'Student account does not exist. The student must sign up first, or use the invitation system.'::TEXT, NULL::UUID;
  
END;
$$;

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.create_student_account(TEXT, TEXT, UUID) TO authenticated;

-- ============================================================================
-- COMMENT
-- ============================================================================

COMMENT ON FUNCTION public.create_student_account IS 
'Allows supervisors and admins to create student accounts. If the student already exists, assigns the student role. If auth user exists but no profile, creates profile. Otherwise, returns a message that the student needs to sign up.';

