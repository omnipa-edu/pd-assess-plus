/**
 * useCoachingCorner Hook
 * Fetch and manage coaching corner content
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import { getAdaptiveCoachingItem } from '@/lib/adaptive-coaching';

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
  tags?: string[] | null;
  priority?: number | null;
  start_at?: string | null;
  end_at?: string | null;
  pinned: boolean;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
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
      
      // Determine allowed audiences based on user role
      const allowedAudiences = new Set<string>(['all']);
      if (roles.includes('supervisor')) {
        allowedAudiences.add('supervisors');
      }
      if (roles.includes('student')) {
        allowedAudiences.add('learners');
      }
      
      // Fetch active coaching items
      // Note: Filter date range and audience in JavaScript to avoid PostgREST query syntax issues
      const { data, error } = await supabase
        .from('coaching_corner')
        .select('id, title, body, content_type, video_url, tags, priority, pinned, created_at, start_at, end_at, audience, is_active')
        .eq('is_active', true)
        .order('pinned', { ascending: false })
        .order('start_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching coaching corner:', error);
        throw error;
      }
      
      // Filter by date range and audience: (start_at IS NULL OR start_at <= now) AND (end_at IS NULL OR end_at >= now)
      // AND (audience === 'all' OR audience is in allowedAudiences)
      const dateFiltered = (data || []).filter((item: any) => {
        const startValid = !item.start_at || new Date(item.start_at) <= new Date(now);
        const endValid = !item.end_at || new Date(item.end_at) >= new Date(now);
        const audienceValid = allowedAudiences.has(item.audience);
        return startValid && endValid && audienceValid;
      });
      
      // Fetch dismissed items for this user
      const { data: dismissedData } = await supabase
        .from('coaching_corner_dismissals')
        .select('coaching_id')
        .eq('user_id', user.id);
      
      const dismissedIds = new Set((dismissedData || []).map(d => d.coaching_id));
      
      // Filter out dismissed items
      const filtered = dateFiltered.filter(item => !dismissedIds.has(item.id));
      
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
      
      try {
        // Build query step by step
        let query = supabase
          .from('coaching_corner')
          .select('*');
        
        // Supervisors see only their own items
        if (!hasRole('admin')) {
          query = query.eq('created_by', user.id);
        }
        
        // Order by created_at descending
        query = query.order('created_at', { ascending: false });
        
        const { data, error } = await query;
        
        if (error) {
          console.error('Error fetching coaching list:', error);
          console.error('Error details:', JSON.stringify(error, null, 2));
          console.error('Error code:', error.code);
          console.error('Error message:', error.message);
          console.error('Error hint:', error.hint);
          throw error;
        }
        
        return (data || []) as CoachingItem[];
      } catch (error: any) {
        console.error('Exception in useCoachingCornerList:', error);
        // Return empty array on error to prevent UI breakage
        return [];
      }
    },
    enabled: !!user && (hasRole('admin') || hasRole('supervisor')),
    retry: 1,
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
 * Get adaptive coaching item based on WBA activity
 * Uses rule-based selection engine to match content to user's recent activity
 */
export function usePrimaryCoachingItem() {
  const { user, roles } = useAuth();
  
  // Determine role and audience
  const isSupervisor = roles.includes('supervisor');
  const isLearner = roles.includes('student');
  const role: 'learner' | 'supervisor' = isSupervisor ? 'supervisor' : 'learner';
  const audience: 'learners' | 'supervisors' | 'all' = isLearner ? 'learners' : isSupervisor ? 'supervisors' : 'all';
  
  return useQuery({
    queryKey: ['adaptive-coaching', user?.id, role],
    queryFn: async () => {
      if (!user) return null;
      
      try {
        const item = await getAdaptiveCoachingItem(user.id, role, audience);
        
        // Convert to CoachingItem format
        if (!item) return null;
        
        return {
          id: item.id,
          created_by: '', // Not needed for display
          role_scope: 'admin' as const, // Not used in display
          audience: audience,
          title: item.title,
          content_type: item.content_type,
          body: item.body || undefined,
          video_url: item.video_url || undefined,
          start_at: undefined,
          end_at: undefined,
          pinned: item.pinned,
          is_active: true,
          created_at: item.created_at,
          updated_at: item.created_at,
        } as CoachingItem;
      } catch (error) {
        console.error('Error getting adaptive coaching item:', error);
        return null;
      }
    },
    enabled: !!user && (isSupervisor || isLearner),
    staleTime: 60 * 60 * 1000, // 1 hour (adaptive selection changes daily)
  });
}

