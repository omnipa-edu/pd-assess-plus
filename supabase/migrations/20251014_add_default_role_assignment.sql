-- Migration: Add automatic default role assignment and role management functionality
-- Created: 2025-10-14

-- Update the handle_new_user function to assign a default 'student' role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  
  -- Assign default 'student' role
  -- Check if a role was specified in metadata, otherwise default to student
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::app_role,
      'student'::app_role
    )
  );
  
  RETURN NEW;
END;
$$;

-- Create a function for admins to assign roles to users
CREATE OR REPLACE FUNCTION public.assign_user_role(
  target_user_id UUID,
  new_role app_role
)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the caller is an admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Permission denied. Only admins can assign roles.';
  END IF;
  
  -- Insert the role (will fail if already exists due to UNIQUE constraint)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, new_role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- Create a function for admins to remove roles from users
CREATE OR REPLACE FUNCTION public.remove_user_role(
  target_user_id UUID,
  role_to_remove app_role
)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the caller is an admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Permission denied. Only admins can remove roles.';
  END IF;
  
  -- Don't allow removing admin role from the last admin
  IF role_to_remove = 'admin' THEN
    IF (SELECT COUNT(*) FROM public.user_roles WHERE role = 'admin') <= 1 THEN
      RAISE EXCEPTION 'Cannot remove the last admin user.';
    END IF;
  END IF;
  
  -- Remove the role
  DELETE FROM public.user_roles
  WHERE user_id = target_user_id AND role = role_to_remove;
END;
$$;

-- Create a function to get all users with their roles (admin only)
CREATE OR REPLACE FUNCTION public.get_users_with_roles()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  roles TEXT[],
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the caller is an admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Permission denied. Only admins can view all users.';
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id as user_id,
    p.email,
    p.full_name,
    COALESCE(ARRAY_AGG(ur.role::TEXT) FILTER (WHERE ur.role IS NOT NULL), ARRAY[]::TEXT[]) as roles,
    p.created_at
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON p.id = ur.user_id
  GROUP BY p.id, p.email, p.full_name, p.created_at
  ORDER BY p.created_at DESC;
END;
$$;

-- Add a table for pending role requests (optional - for approval workflow)
CREATE TABLE IF NOT EXISTS public.role_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  requested_role app_role NOT NULL,
  justification TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on role_requests
ALTER TABLE public.role_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own role requests
CREATE POLICY "Users can view their own role requests"
  ON public.role_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create role requests
CREATE POLICY "Users can create role requests"
  ON public.role_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all role requests
CREATE POLICY "Admins can view all role requests"
  ON public.role_requests FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update role requests
CREATE POLICY "Admins can update role requests"
  ON public.role_requests FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Add trigger for role_requests updated_at
CREATE TRIGGER update_role_requests_updated_at
  BEFORE UPDATE ON public.role_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.assign_user_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_user_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_users_with_roles TO authenticated;

