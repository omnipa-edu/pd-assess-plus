-- Migration: Dashboard Layouts Customization
-- Created: 2025-12-29
-- Purpose: Store per-user dashboard widget layouts and preferences

-- Create dashboard_layouts table
CREATE TABLE IF NOT EXISTS public.dashboard_layouts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dashboard_type  TEXT NOT NULL CHECK (dashboard_type IN ('learner', 'supervisor', 'admin')),
  version         INTEGER NOT NULL DEFAULT 1,
  layout_json     JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, dashboard_type)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_dashboard_layouts_user_type 
ON public.dashboard_layouts(user_id, dashboard_type);

-- Enable RLS
ALTER TABLE public.dashboard_layouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own dashboard layouts" ON public.dashboard_layouts;
CREATE POLICY "Users can view their own dashboard layouts"
  ON public.dashboard_layouts FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own dashboard layouts" ON public.dashboard_layouts;
CREATE POLICY "Users can insert their own dashboard layouts"
  ON public.dashboard_layouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own dashboard layouts" ON public.dashboard_layouts;
CREATE POLICY "Users can update their own dashboard layouts"
  ON public.dashboard_layouts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own dashboard layouts" ON public.dashboard_layouts;
CREATE POLICY "Users can delete their own dashboard layouts"
  ON public.dashboard_layouts FOR DELETE
  USING (auth.uid() = user_id);

-- Optional: Admins can view all layouts (for support/debugging)
DROP POLICY IF EXISTS "Admins can view all dashboard layouts" ON public.dashboard_layouts;
CREATE POLICY "Admins can view all dashboard layouts"
  ON public.dashboard_layouts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_dashboard_layouts_updated_at ON public.dashboard_layouts;
CREATE TRIGGER update_dashboard_layouts_updated_at
  BEFORE UPDATE ON public.dashboard_layouts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dashboard_layouts TO authenticated;

-- Comments
COMMENT ON TABLE public.dashboard_layouts IS 'Stores per-user dashboard widget layouts and customization preferences';
COMMENT ON COLUMN public.dashboard_layouts.dashboard_type IS 'Type of dashboard: learner, supervisor, or admin';
COMMENT ON COLUMN public.dashboard_layouts.layout_json IS 'JSONB structure containing widget list, order, visibility, and collapse states';
COMMENT ON COLUMN public.dashboard_layouts.version IS 'Layout schema version for future migrations';

