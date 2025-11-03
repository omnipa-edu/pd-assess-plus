-- ============================================================================
-- ADMIN CONSOLE SETUP QUERIES
-- Run these queries in Supabase SQL Editor to fix issues and set up admin access
-- ============================================================================

-- ============================================================================
-- STEP 1: Check for duplicate user_roles
-- ============================================================================

-- See which users have duplicate roles
SELECT user_id, COUNT(*) as role_count
FROM public.user_roles
GROUP BY user_id
HAVING COUNT(*) > 1;

-- ============================================================================
-- STEP 2: Remove duplicate user_roles (keep most privileged)
-- ============================================================================

-- This removes duplicates, keeping the most privileged role per user
-- Priority: admin > supervisor > student

WITH ranked_roles AS (
  SELECT 
    id,
    user_id,
    role,
    ROW_NUMBER() OVER (
      PARTITION BY user_id 
      ORDER BY 
        CASE role
          WHEN 'admin' THEN 1
          WHEN 'supervisor' THEN 2
          WHEN 'student' THEN 3
        END,
        created_at DESC
    ) as rn
  FROM public.user_roles
)
DELETE FROM public.user_roles
WHERE id IN (
  SELECT id FROM ranked_roles WHERE rn > 1
);

-- ============================================================================
-- STEP 3: Add unique constraint (only after removing duplicates)
-- ============================================================================

-- Add unique constraint to prevent future duplicates
ALTER TABLE public.user_roles 
  DROP CONSTRAINT IF EXISTS user_roles_user_id_unique;

ALTER TABLE public.user_roles 
  ADD CONSTRAINT user_roles_user_id_unique UNIQUE (user_id);

-- ============================================================================
-- STEP 4: Find your user ID
-- ============================================================================

-- Find your user ID by email
SELECT id, email, created_at
FROM auth.users
ORDER BY created_at DESC;

-- ============================================================================
-- STEP 5: Assign admin role to yourself
-- ============================================================================

-- Replace 'YOUR_USER_ID_HERE' with the ID from Step 4
-- Replace 'YOUR_EMAIL_HERE' with your actual email

-- Option A: If you know your user_id
INSERT INTO public.user_roles (user_id, role)
VALUES ('YOUR_USER_ID_HERE', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- Option B: Using your email (easier)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'YOUR_EMAIL_HERE'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- ============================================================================
-- STEP 6: Verify admin access
-- ============================================================================

-- Check your role assignment
SELECT u.email, ur.role, ur.created_at
FROM auth.users u
JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'YOUR_EMAIL_HERE';

-- Should return:
-- email: your@email.com | role: admin | created_at: (timestamp)

-- ============================================================================
-- TROUBLESHOOTING: View all role assignments
-- ============================================================================

SELECT 
  u.email,
  ur.role,
  ur.created_at
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
ORDER BY ur.created_at DESC;

-- ============================================================================
-- ALTERNATIVE: Quick admin setup (all-in-one)
-- ============================================================================

-- Replace 'your.email@example.com' with your actual email
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get user ID by email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'your.email@example.com';
  
  -- Assign admin role
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'admin')
    ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
    
    RAISE NOTICE 'Admin role assigned to user %', v_user_id;
  ELSE
    RAISE EXCEPTION 'User with that email not found';
  END IF;
END $$;

