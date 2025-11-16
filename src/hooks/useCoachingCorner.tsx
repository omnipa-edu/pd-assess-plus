/**
 * useCoachingCorner Hook
 * Fetch and manage coaching corner content
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface CoachingItem {
  id: string;
  created_by: string;
  role_scope: 'admin' | 'supervisor';
  audience: 'all' | 'supervisors' | 'learners';
  title: string;
  content_type: 'text' | 'youtube' | 'instagram';
  body?: string;
  video_url?: string;
  start_at?: string;
  end_at?: string;
  pinned: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch active coaching items for current user
 */
export function useCoachingCorner() {
  const { user, roles } = useAuth();
  
  return useQuery({
    queryKey: ['coaching-corner', user?.id, roles],
    queryFn: async () => {
      if (!user) return [];
      
      const now = new Date().toISOString();
      
      // Determine audience filter based on user role
      let audienceFilter: string[] = ['all'];
      if (roles.includes('supervisor')) {
        audienceFilter.push('supervisors');
      }
      if (roles.includes('student')) {
        audienceFilter.push('learners');
      }
      
      // Fetch active coaching items
      const { data, error } = await supabase
        .from('coaching_corner')
        .select('*')
        .eq('is_active', true)
        .in('audience', audienceFilter)
        .or(`start_at.is.null,start_at.lte.${now}`)
        .or(`end_at.is.null,end_at.gte.${now}`)
        .order('pinned', { ascending: false })
        .order('start_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching coaching corner:', error);
        throw error;
      }
      
      // Fetch dismissed items for this user
      const { data: dismissedData } = await supabase
        .from('coaching_corner_dismissals')
        .select('coaching_id')
        .eq('user_id', user.id);
      
      const dismissedIds = new Set((dismissedData || []).map(d => d.coaching_id));
      
      // Filter out dismissed items
      const filtered = (data || []).filter(item => !dismissedIds.has(item.id));
      
      return filtered as CoachingItem[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch all coaching items (for admin/supervisor management)
 */
export function useCoachingCornerList() {
  const { user, hasRole } = useAuth();
  
  return useQuery({
    queryKey: ['coaching-corner-list', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from('coaching_corner')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Supervisors see only their own items
      if (!hasRole('admin')) {
        query = query.eq('created_by', user.id);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching coaching list:', error);
        throw error;
      }
      
      return (data || []) as CoachingItem[];
    },
    enabled: !!user && (hasRole('admin') || hasRole('supervisor')),
  });
}

/**
 * Create or update coaching item
 */
export function useUpsertCoaching() {
  const queryClient = useQueryClient();
  const { user, hasRole } = useAuth();
  
  return useMutation({
    mutationFn: async (item: Partial<CoachingItem> & { id?: string }) => {
      if (!user) throw new Error('Not authenticated');
      
      // Allow explicit role_scope, or auto-assign based on user role
      // Admins can create content at any scope
      const roleScope = item.role_scope || (hasRole('admin') ? 'admin' : 'supervisor');
      
      const payload = {
        ...item,
        created_by: item.created_by || user.id,
        role_scope: roleScope,
      };
      
      if (item.id) {
        // Update existing
        const { data, error } = await supabase
          .from('coaching_corner')
          .update(payload)
          .eq('id', item.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('coaching_corner')
          .insert(payload)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaching-corner'] });
      queryClient.invalidateQueries({ queryKey: ['coaching-corner-list'] });
    },
  });
}

/**
 * Delete coaching item
 */
export function useDeleteCoaching() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('coaching_corner')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaching-corner'] });
      queryClient.invalidateQueries({ queryKey: ['coaching-corner-list'] });
    },
  });
}

/**
 * Dismiss coaching item for current user
 */
export function useDismissCoaching() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (coachingId: string) => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('coaching_corner_dismissals')
        .insert({
          user_id: user.id,
          coaching_id: coachingId,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaching-corner'] });
    },
  });
}

/**
 * Simple hash function for deterministic selection
 * Strategy: Time-based rotation - one item per day per role
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Get primary (pinned or time-rotated) coaching item
 * Rotation Strategy: Deterministic selection based on current date + role
 * - Pinned items always appear first
 * - Otherwise, uses hash(date + role) mod feed.length to pick one item per day
 */
export function usePrimaryCoachingItem() {
  const { data: items, ...rest } = useCoachingCorner();
  const { roles } = useAuth();
  
  if (!items || items.length === 0) {
    return {
      item: null,
      ...rest,
    };
  }
  
  // Pinned items always take priority
  const pinnedItem = items.find(item => item.pinned);
  if (pinnedItem) {
    return {
      item: pinnedItem,
      ...rest,
    };
  }
  
  // Time-based rotation: use current date (YYYY-MM-DD) + role to pick deterministically
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const role = roles.includes('supervisor') ? 'supervisor' : 'learner';
  const seed = `${today}-${role}`;
  const index = simpleHash(seed) % items.length;
  const primaryItem = items[index] || items[0];
  
  return {
    item: primaryItem,
    ...rest,
  };
}

