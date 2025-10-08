-- Fix security definer view by removing it and creating a secure function instead
DROP VIEW IF EXISTS public.recent_phi_access;

-- Create a secure function to get recent PHI access (only for admins)
CREATE OR REPLACE FUNCTION public.get_recent_phi_access()
RETURNS TABLE (
  created_at TIMESTAMP WITH TIME ZONE,
  table_name TEXT,
  action TEXT,
  user_name TEXT,
  user_email TEXT,
  user_role TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow admins to view audit logs
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  RETURN QUERY
  SELECT 
    al.created_at,
    al.table_name,
    al.action,
    p.full_name as user_name,
    p.email as user_email,
    ur.role::TEXT as user_role
  FROM public.audit_logs al
  LEFT JOIN public.profiles p ON p.id = al.user_id
  LEFT JOIN public.user_roles ur ON ur.user_id = al.user_id
  WHERE al.created_at > NOW() - INTERVAL '30 days'
  ORDER BY al.created_at DESC;
END;
$$;

-- Fix search_path for the anonymize function
CREATE OR REPLACE FUNCTION public.anonymize_old_assessments()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- This function can be called periodically to anonymize assessments older than retention period
  -- Keeping structure for future implementation
  RAISE NOTICE 'Data retention policy - implement based on specific requirements';
END;
$$;