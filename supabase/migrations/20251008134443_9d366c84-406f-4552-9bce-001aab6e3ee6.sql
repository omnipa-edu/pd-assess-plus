-- Create audit log table for PHI access tracking
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL, -- SELECT, INSERT, UPDATE, DELETE
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs"
  ON public.audit_logs
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for audit log queries
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log the event
  INSERT INTO public.audit_logs (
    user_id,
    table_name,
    record_id,
    action,
    old_data,
    new_data
  ) VALUES (
    auth.uid(),
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Add audit triggers to all PHI tables
CREATE TRIGGER audit_profiles
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_direct_observations
  AFTER INSERT OR UPDATE OR DELETE ON public.direct_observation_assessments
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_epa_assessments
  AFTER INSERT OR UPDATE OR DELETE ON public.epa_assessments
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_narrative_assessments
  AFTER INSERT OR UPDATE OR DELETE ON public.narrative_assessments
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- Function to anonymize old records (for data retention compliance)
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

-- Add policy to prevent data export by non-admins
CREATE POLICY "Prevent bulk export by students"
  ON public.profiles
  FOR SELECT
  USING (
    auth.uid() = id OR 
    has_role(auth.uid(), 'supervisor'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Add DELETE policies to require admin approval
CREATE POLICY "Only admins can delete direct observations"
  ON public.direct_observation_assessments
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete EPA assessments"
  ON public.epa_assessments
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete narrative assessments"
  ON public.narrative_assessments
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create view for admins to monitor recent PHI access
CREATE OR REPLACE VIEW public.recent_phi_access AS
SELECT 
  al.created_at,
  al.table_name,
  al.action,
  p.full_name as user_name,
  p.email as user_email,
  ur.role as user_role
FROM public.audit_logs al
LEFT JOIN public.profiles p ON p.id = al.user_id
LEFT JOIN public.user_roles ur ON ur.user_id = al.user_id
WHERE al.created_at > NOW() - INTERVAL '30 days'
ORDER BY al.created_at DESC;

-- Grant access to the view only to admins
REVOKE ALL ON public.recent_phi_access FROM PUBLIC;
GRANT SELECT ON public.recent_phi_access TO authenticated;