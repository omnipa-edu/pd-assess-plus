/**
 * Role Management Utilities
 * Functions for assigning, removing, and requesting user roles
 */

import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'student' | 'supervisor' | 'admin';

export interface UserWithRoles {
  user_id: string;
  email: string;
  full_name: string | null;
  roles: string[];
  created_at: string;
}

export interface RoleRequest {
  id: string;
  user_id: string;
  requested_role: UserRole;
  justification: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

/**
 * Assign a role to a user (admin only)
 */
export async function assignUserRole(
  targetUserId: string,
  role: UserRole
): Promise<{ error: any }> {
  try {
    const { error } = await supabase.rpc('assign_user_role', {
      target_user_id: targetUserId,
      new_role: role,
    });

    return { error };
  } catch (error) {
    return { error };
  }
}

/**
 * Remove a role from a user (admin only)
 */
export async function removeUserRole(
  targetUserId: string,
  role: UserRole
): Promise<{ error: any }> {
  try {
    const { error } = await supabase.rpc('remove_user_role', {
      target_user_id: targetUserId,
      role_to_remove: role,
    });

    return { error };
  } catch (error) {
    return { error };
  }
}

/**
 * Get all users with their roles (admin only)
 */
export async function getUsersWithRoles(): Promise<{
  data: UserWithRoles[] | null;
  error: any;
}> {
  try {
    const { data, error } = await supabase.rpc('get_users_with_roles');

    return { data: data as UserWithRoles[], error };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Submit a role request (any authenticated user)
 */
export async function submitRoleRequest(
  requestedRole: UserRole,
  justification?: string
): Promise<{ error: any }> {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) {
      return { error: new Error('Not authenticated') };
    }

    const { error } = await supabase.from('role_requests').insert({
      user_id: user.user.id,
      requested_role: requestedRole,
      justification: justification || null,
    });

    return { error };
  } catch (error) {
    return { error };
  }
}

/**
 * Get pending role requests (admin only)
 */
export async function getPendingRoleRequests(): Promise<{
  data: RoleRequest[] | null;
  error: any;
}> {
  try {
    const { data, error } = await supabase
      .from('role_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Approve a role request (admin only)
 */
export async function approveRoleRequest(
  requestId: string,
  userId: string,
  role: UserRole
): Promise<{ error: any }> {
  try {
    const { data: currentUser } = await supabase.auth.getUser();
    
    if (!currentUser.user) {
      return { error: new Error('Not authenticated') };
    }

    // Assign the role
    const { error: assignError } = await assignUserRole(userId, role);
    if (assignError) return { error: assignError };

    // Update the request status
    const { error: updateError } = await supabase
      .from('role_requests')
      .update({
        status: 'approved',
        reviewed_by: currentUser.user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    return { error: updateError };
  } catch (error) {
    return { error };
  }
}

/**
 * Reject a role request (admin only)
 */
export async function rejectRoleRequest(requestId: string): Promise<{ error: any }> {
  try {
    const { data: currentUser } = await supabase.auth.getUser();
    
    if (!currentUser.user) {
      return { error: new Error('Not authenticated') };
    }

    const { error } = await supabase
      .from('role_requests')
      .update({
        status: 'rejected',
        reviewed_by: currentUser.user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    return { error };
  } catch (error) {
    return { error };
  }
}

