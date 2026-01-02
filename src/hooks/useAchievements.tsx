import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface AchievementDefinition {
  id: string;
  code: string;
  name: string;
  description: string;
  category: 'first_steps' | 'consistency' | 'quality' | 'milestone' | 'engagement' | 'excellence';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  icon: string | null;
  color: string | null;
  criteria: Record<string, any>;
  is_active: boolean;
}

export interface UserAchievement {
  achievement_id: string;
  code: string;
  name: string;
  description: string;
  category: AchievementDefinition['category'];
  rarity: AchievementDefinition['rarity'];
  icon: string | null;
  color: string | null;
  unlocked_at: string | null;
}

export interface AchievementProgress {
  id: string;
  user_id: string;
  achievement_code: string;
  current_value: number;
  target_value: number;
  last_updated_at: string;
}

export function useAchievements() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user achievements
  const { data: achievements = [], isLoading } = useQuery({
    queryKey: ['achievements', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase.rpc('get_user_achievements', {
        p_user_id: user.id,
      });
      
      if (error) throw error;
      return (data || []) as UserAchievement[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch achievement progress
  const { data: progress = [] } = useQuery({
    queryKey: ['achievement_progress', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('achievement_progress')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return (data || []) as AchievementProgress[];
    },
    enabled: !!user,
  });

  // Unlocked achievements
  const unlocked = achievements.filter(a => a.unlocked_at !== null);
  
  // Locked achievements
  const locked = achievements.filter(a => a.unlocked_at === null);

  // Get achievement by code
  const getAchievement = (code: string) => {
    return achievements.find(a => a.code === code);
  };

  // Check if achievement is unlocked
  const isUnlocked = (code: string) => {
    return unlocked.some(a => a.code === code);
  };

  // Get progress for an achievement
  const getProgress = (code: string) => {
    return progress.find(p => p.achievement_code === code);
  };

  return {
    achievements,
    unlocked,
    locked,
    progress,
    isLoading,
    getAchievement,
    isUnlocked,
    getProgress,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['achievements', user?.id] }),
  };
}

// Hook to update achievement progress
export function useUpdateAchievementProgress() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: {
      achievementCode: string;
      increment?: number;
    }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase.rpc('update_achievement_progress', {
        p_user_id: user.id,
        p_achievement_code: params.achievementCode,
        p_increment: params.increment || 1,
      });
      
      if (error) throw error;
      return data as boolean; // Returns true if achievement was unlocked
    },
    onSuccess: (unlocked, variables) => {
      queryClient.invalidateQueries({ queryKey: ['achievements', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['achievement_progress', user?.id] });
      
      // If achievement was unlocked, create a notification
      if (unlocked && user) {
        // This will be handled by the notification system
        queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
      }
    },
  });
}

// Hook to unlock achievement directly
export function useUnlockAchievement() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (achievementCode: string) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase.rpc('unlock_achievement', {
        p_user_id: user.id,
        p_achievement_code: achievementCode,
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievements', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });
}

