-- Migration: Password Reset Audit Table
-- Created: 2025-12-29
-- Purpose: Track admin-initiated password resets for security and compliance

-- ============================================================================
-- PASSWORD RESET AUDIT TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.password_reset_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Actor (admin who triggered the reset)
  actor_admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  
  -- Target (user whose password is being reset)
  target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  target_email TEXT NOT NULL,
  
  -- Reset details
  reason TEXT, -- Optional free-text reason for the reset
  status TEXT NOT NULL DEFAULT 'sent', -- 'sent', 'failed'
  error_message TEXT, -- Optional error message on failure
  
  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  
  -- Timestamps
  triggered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.password_reset_audit ENABLE ROW LEVEL SECURITY;

-- RLS Policies (idempotent - drop if exists, then create)
DROP POLICY IF EXISTS "Admins can view password reset audit" ON public.password_reset_audit;
CREATE POLICY "Admins can view password reset audit"
  ON public.password_reset_audit FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can insert password reset audit" ON public.password_reset_audit;
CREATE POLICY "Admins can insert password reset audit"
  ON public.password_reset_audit FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role = 'admin'
    )
    AND actor_admin_id = auth.uid()
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_password_reset_audit_actor ON public.password_reset_audit(actor_admin_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_audit_target ON public.password_reset_audit(target_user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_audit_triggered_at ON public.password_reset_audit(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_password_reset_audit_status ON public.password_reset_audit(status);

-- ============================================================================
-- HELPER FUNCTION: Admin-triggered password reset
-- ============================================================================

CREATE OR REPLACE FUNCTION public.admin_send_password_reset(
  p_target_user_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id UUID;
  v_target_email TEXT;
  v_result JSONB;
  v_audit_id UUID;
BEGIN
  -- Verify actor is admin
  v_actor_id := auth.uid();
  
  IF v_actor_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Not authenticated'
    );
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = v_actor_id
      AND role = 'admin'
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unauthorized: Admin role required'
    );
  END IF;
  
  -- Get target user email
  SELECT email INTO v_target_email
  FROM auth.users
  WHERE id = p_target_user_id;
  
  IF v_target_email IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;
  
  -- Create audit log entry (before attempting reset)
  INSERT INTO public.password_reset_audit (
    actor_admin_id,
    target_user_id,
    target_email,
    reason,
    status,
    metadata
  ) VALUES (
    v_actor_id,
    p_target_user_id,
    v_target_email,
    p_reason,
    'sent',
    jsonb_build_object(
      'triggered_by', 'admin',
      'method', 'email_reset'
    )
  )
  RETURNING id INTO v_audit_id;
  
  -- Note: Actual password reset email is sent via Supabase Admin API
  -- This function just creates the audit log
  -- The actual reset email sending should be done via Edge Function or
  -- Supabase Admin API client in the application layer
  
  RETURN jsonb_build_object(
    'success', true,
    'audit_id', v_audit_id,
    'target_email', v_target_email,
    'message', 'Password reset email will be sent'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Update audit log with error
    UPDATE public.password_reset_audit
    SET status = 'failed',
        error_message = SQLERRM
    WHERE id = v_audit_id;
    
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant permissions
GRANT SELECT, INSERT ON public.password_reset_audit TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_send_password_reset TO authenticated;

-- Comments
COMMENT ON TABLE public.password_reset_audit IS 'Audit log for admin-initiated password resets';
COMMENT ON FUNCTION public.admin_send_password_reset IS 'Admin function to trigger password reset for a user (creates audit log)';

