-- Migration: Enhanced Admin Access for Coaching Corner
-- Created: 2025-11-05
-- Purpose: Allow admins full access to all coaching content at all levels

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can insert admin-scoped coaching" ON public.coaching_corner;
DROP POLICY IF EXISTS "Supervisors can insert supervisor-scoped coaching" ON public.coaching_corner;
DROP POLICY IF EXISTS "Users can update their own coaching" ON public.coaching_corner;
DROP POLICY IF EXISTS "Users can delete their own coaching" ON public.coaching_corner;
DROP POLICY IF EXISTS "Admins can manage all coaching" ON public.coaching_corner;

-- NEW: Admins can create content at ANY scope (admin OR supervisor)
CREATE POLICY "Admins can create any scoped coaching"
  ON public.coaching_corner FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
  );

-- Supervisors can create coaching items with supervisor scope only
CREATE POLICY "Supervisors can create supervisor-scoped coaching"
  ON public.coaching_corner FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'supervisor')
    AND role_scope = 'supervisor'
    AND created_by = auth.uid()
  );

-- Admins can update ALL coaching items (regardless of creator or scope)
CREATE POLICY "Admins can update all coaching"
  ON public.coaching_corner FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Supervisors can update their own coaching items
CREATE POLICY "Supervisors can update their own coaching"
  ON public.coaching_corner FOR UPDATE
  USING (
    created_by = auth.uid()
    AND public.has_role(auth.uid(), 'supervisor')
  );

-- Admins can delete ALL coaching items
CREATE POLICY "Admins can delete all coaching"
  ON public.coaching_corner FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Supervisors can delete their own coaching items
CREATE POLICY "Supervisors can delete their own coaching"
  ON public.coaching_corner FOR DELETE
  USING (
    created_by = auth.uid()
    AND public.has_role(auth.uid(), 'supervisor')
  );

-- Admins can SELECT all coaching items (including inactive/scheduled)
CREATE POLICY "Admins can view all coaching"
  ON public.coaching_corner FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Enhanced scope management for admins
DROP POLICY IF EXISTS "Creators can manage coaching scope" ON public.coaching_corner_scope;

-- Admins can manage ALL coaching scopes
CREATE POLICY "Admins can manage all coaching scopes"
  ON public.coaching_corner_scope FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Creators can manage their own coaching scopes
CREATE POLICY "Creators can manage their coaching scopes"
  ON public.coaching_corner_scope FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.coaching_corner
      WHERE id = coaching_id 
        AND created_by = auth.uid()
        AND public.has_role(auth.uid(), 'supervisor')
    )
  );

-- Optional: Add institution_id for multi-org support (commented out by default)
-- Uncomment if you want institution-specific coaching:
/*
ALTER TABLE public.coaching_corner 
ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_coaching_institution 
ON public.coaching_corner(institution_id);

COMMENT ON COLUMN public.coaching_corner.institution_id 
IS 'Optional: Limit coaching content to specific institution. NULL = system-wide';
*/

COMMENT ON TABLE public.coaching_corner IS 'Stores coaching content. Admins have full access to all levels; supervisors can manage their own supervisor-scoped items';

