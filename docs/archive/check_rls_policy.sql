-- SQL queries to check RLS policy status
-- Run these in Supabase SQL Editor to diagnose the issue

-- 1. Check if the admin update policy exists
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles' AND policyname = 'Admins can update all profiles';

-- 2. Check all policies on profiles table
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 3. Check if has_role function exists and works
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name = 'has_role';

-- 4. Test has_role function (replace with your user ID)
-- First, get your user ID:
SELECT auth.uid() as current_user_id;

-- Then test has_role (replace YOUR_USER_ID):
-- SELECT public.has_role('YOUR_USER_ID'::uuid, 'admin'::app_role);

-- 5. Check your current roles
SELECT 
  ur.user_id,
  ur.role,
  p.email
FROM user_roles ur
JOIN profiles p ON p.id = ur.user_id
WHERE ur.user_id = auth.uid();

-- 6. If policy doesn't exist, create it:
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
  );

-- 7. Verify the policy was created
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles' AND policyname = 'Admins can update all profiles';

