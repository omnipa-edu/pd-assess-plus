import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UserStreak {
  id: string;
  user_id: string;
  streak_type: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  streak_start_date: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export function useStreaks() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all streaks
  const { data: streaks = [], isLoading } = useQuery({
    queryKey: ['streaks', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user.id)
        .order('current_streak', { ascending: false });
      
      if (error) throw error;
      return (data || []) as UserStreak[];
    },
    enabled: !!user,
    staleTime: 60 * 1000, // 1 minute
  });

  // Get specific streak
  const getStreak = (type: string) => {
    return streaks.find(s => s.streak_type === type);
  };

  // Get assessment streak (most common)
  const assessmentStreak = getStreak('assessment') || {
    current_streak: 0,
    longest_streak: 0,
    streak_type: 'assessment',
  };

  // Log activity mutation (updates streak)
  const logActivityMutation = useMutation({
    mutationFn: async (activityType: string = 'assessment') => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase.rpc('log_user_activity', {
        p_user_id: user.id,
        p_activity_type: activityType,
      });
      
      if (error) throw error;
      return data as number; // Returns new streak count
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streaks', user?.id] });
    },
  });

  return {
    streaks,
    assessmentStreak,
    isLoading,
    getStreak,
    logActivity: logActivityMutation.mutateAsync,
  };
}

