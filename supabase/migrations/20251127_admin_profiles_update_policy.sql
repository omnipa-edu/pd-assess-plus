-- Add RLS policy to allow admins to update all profiles
-- This is needed for the Admin Users page to update institution/department assignments

-- Drop policy if it exists (in case of re-running)
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Create policy with both USING and WITH CHECK clauses
-- USING: checks if the user can update the existing row
-- WITH CHECK: checks if the user can update to the new values
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
  );

