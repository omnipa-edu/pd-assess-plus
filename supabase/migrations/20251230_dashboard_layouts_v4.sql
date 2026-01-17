-- Migration: Dashboard Layouts v4 - Column-Based Layout System
-- Created: 2025-12-30
-- Purpose: Upgrade dashboard_layouts to v4 schema with column-based layouts, add audit and recommendations tables

-- Update dashboard_layouts table to support v4
-- Note: Existing data will be migrated by application code
ALTER TABLE IF EXISTS public.dashboard_layouts 
  ALTER COLUMN version SET DEFAULT 4;

-- Create dashboard_layout_audit table
CREATE TABLE IF NOT EXISTS public.dashboard_layout_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dashboard_type TEXT NOT NULL CHECK (dashboard_type IN ('learner', 'supervisor', 'admin')),
  action TEXT NOT NULL CHECK (action IN (
    'save', 'reset', 'apply_ai', 'change_columns', 
    'move_widget', 'resize_widget', 'hide_widget', 'add_widget'
  )),
  previous_layout JSONB,
  new_layout JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for audit lookups
CREATE INDEX IF NOT EXISTS idx_dashboard_layout_audit_user_type 
  ON public.dashboard_layout_audit(user_id, dashboard_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dashboard_layout_audit_created_at 
  ON public.dashboard_layout_audit(created_at DESC);

-- Enable RLS on audit table
ALTER TABLE public.dashboard_layout_audit ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit table
DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.dashboard_layout_audit;
CREATE POLICY "Users can view their own audit logs"
  ON public.dashboard_layout_audit FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own audit logs" ON public.dashboard_layout_audit;
CREATE POLICY "Users can insert their own audit logs"
  ON public.dashboard_layout_audit FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all audit logs
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.dashboard_layout_audit;
CREATE POLICY "Admins can view all audit logs"
  ON public.dashboard_layout_audit FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create dashboard_layout_recommendations table
CREATE TABLE IF NOT EXISTS public.dashboard_layout_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_type TEXT NOT NULL CHECK (dashboard_type IN ('learner', 'supervisor', 'admin')),
  role TEXT NOT NULL CHECK (role IN ('learner', 'supervisor', 'admin')),
  recommendation_json JSONB NOT NULL,
  rationale TEXT,
  usage_patterns JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for recommendations
CREATE INDEX IF NOT EXISTS idx_dashboard_layout_recommendations_type_role 
  ON public.dashboard_layout_recommendations(dashboard_type, role, is_active);

-- Enable RLS on recommendations table
ALTER TABLE public.dashboard_layout_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recommendations (all authenticated users can read active recommendations)
DROP POLICY IF EXISTS "Authenticated users can view active recommendations" ON public.dashboard_layout_recommendations;
CREATE POLICY "Authenticated users can view active recommendations"
  ON public.dashboard_layout_recommendations FOR SELECT
  USING (is_active = true AND auth.role() = 'authenticated');

-- Admins can manage recommendations
DROP POLICY IF EXISTS "Admins can manage recommendations" ON public.dashboard_layout_recommendations;
CREATE POLICY "Admins can manage recommendations"
  ON public.dashboard_layout_recommendations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Trigger for updated_at on recommendations
DROP TRIGGER IF EXISTS update_dashboard_layout_recommendations_updated_at ON public.dashboard_layout_recommendations;
CREATE TRIGGER update_dashboard_layout_recommendations_updated_at
  BEFORE UPDATE ON public.dashboard_layout_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Grant permissions
GRANT SELECT, INSERT ON public.dashboard_layout_audit TO authenticated;
GRANT SELECT ON public.dashboard_layout_recommendations TO authenticated;
GRANT ALL ON public.dashboard_layout_recommendations TO authenticated; -- Admins only via RLS

-- Comments
COMMENT ON TABLE public.dashboard_layout_audit IS 'Audit log for all dashboard layout changes';
COMMENT ON COLUMN public.dashboard_layout_audit.action IS 'Type of action: save, reset, apply_ai, change_columns, move_widget, resize_widget, hide_widget, add_widget';
COMMENT ON TABLE public.dashboard_layout_recommendations IS 'AI-recommended dashboard layouts per role and dashboard type';
COMMENT ON COLUMN public.dashboard_layout_recommendations.recommendation_json IS 'Complete v4 layout JSON with column structure';



