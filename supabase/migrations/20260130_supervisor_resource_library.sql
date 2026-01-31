-- Migration: Allow supervisors and admins to add library resources
-- Created: 2026-01-30
-- Purpose: Permit supervisors (and admins) to insert resources and tag mappings they own.
--          Uses inline user_roles check so it works even if has_role() is missing or differs.

-- Allow supervisors/admins to read resources they created (so insert ... returning works)
DROP POLICY IF EXISTS "resources_supervisor_select_own" ON public.resources;
CREATE POLICY "resources_supervisor_select_own"
  ON public.resources
  FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role::text IN ('supervisor', 'admin')
    )
  );

DROP POLICY IF EXISTS "resources_supervisor_insert" ON public.resources;
CREATE POLICY "resources_supervisor_insert"
  ON public.resources
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role::text IN ('supervisor', 'admin')
    )
  );

DROP POLICY IF EXISTS "resource_tag_map_supervisor_insert" ON public.resource_tag_map;
CREATE POLICY "resource_tag_map_supervisor_insert"
  ON public.resource_tag_map
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role::text IN ('supervisor', 'admin')
    )
    AND EXISTS (
      SELECT 1 FROM public.resources r
      WHERE r.id = resource_tag_map.resource_id
        AND r.created_by = auth.uid()
    )
  );

-- Allow supervisors/admins to delete tag mappings for resources they created (e.g. when replacing tags)
DROP POLICY IF EXISTS "resource_tag_map_supervisor_delete" ON public.resource_tag_map;
CREATE POLICY "resource_tag_map_supervisor_delete"
  ON public.resource_tag_map
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role::text IN ('supervisor', 'admin')
    )
    AND EXISTS (
      SELECT 1 FROM public.resources r
      WHERE r.id = resource_tag_map.resource_id
        AND r.created_by = auth.uid()
    )
  );
