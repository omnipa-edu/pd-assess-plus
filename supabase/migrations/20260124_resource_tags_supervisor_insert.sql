-- Migration: Allow supervisors to insert recommendation tags
-- Created: 2026-01-24
-- Purpose: Permit supervisors to add resource tags when recommending links

DROP POLICY IF EXISTS "resource_tags_supervisor_insert" ON public.resource_tags;
CREATE POLICY "resource_tags_supervisor_insert"
  ON public.resource_tags
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'supervisor'));
