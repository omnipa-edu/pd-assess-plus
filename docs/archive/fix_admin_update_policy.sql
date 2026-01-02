-- ============================================================================
-- FIX: Allow admins to update all profiles
-- ============================================================================
-- Run this SQL in Supabase SQL Editor to fix the RLS policy issue
-- This allows admins to update institution_id and department_id for any user

-- Step 1: Drop the policy if it exists (safe to run multiple times)
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Step 2: Create the admin update policy
-- This policy allows users with admin role to update any profile
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
  );

-- Step 3: Verify the policy was created
-- You should see the policy listed after running this
SELECT 
  policyname,
  cmd,
  qual as using_clause,
  with_check
FROM pg_policies
WHERE tablename = 'profiles' 
  AND cmd = 'UPDATE'
ORDER BY policyname;

-- Expected output should show:
-- 1. "Users can update their own profile" (for users updating themselves)
-- 2. "Admins can update all profiles" (for admins updating any user)

