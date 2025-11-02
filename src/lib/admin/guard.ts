/**
 * Admin Guard Utilities
 * Provides role-based access control for admin routes and features
 */

import { supabase } from '@/integrations/supabase/client';

export interface AdminCheckResult {
  isAdmin: boolean;
  userId: string | null;
  error: string | null;
}

/**
 * Check if the current user has admin role
 */
export async function isAdmin(): Promise<AdminCheckResult> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        isAdmin: false,
        userId: null,
        error: 'Not authenticated'
      };
    }

    // Check user_roles table
    const { data: roles, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError) {
      return {
        isAdmin: false,
        userId: user.id,
        error: 'Could not verify role'
      };
    }

    return {
      isAdmin: roles?.role === 'admin',
      userId: user.id,
      error: null
    };
  } catch (error) {
    console.error('Error checking admin status:', error);
    return {
      isAdmin: false,
      userId: null,
      error: 'System error'
    };
  }
}

/**
 * Require admin role or throw
 */
export async function requireAdmin(): Promise<string> {
  const result = await isAdmin();
  
  if (!result.isAdmin) {
    throw new Error(result.error || 'Admin access required');
  }
  
  return result.userId!;
}

/**
 * Check if user has any of the specified roles
 */
export async function hasAnyRole(roles: string[]): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    return userRoles ? roles.includes(userRoles.role) : false;
  } catch (error) {
    console.error('Error checking roles:', error);
    return false;
  }
}

