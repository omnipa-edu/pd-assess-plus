import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type GoalType = 'assessment_count' | 'oscore_target' | 'streak_days' | 'epa_readiness' | 'feedback_quality' | 'weekly_active' | 'custom';
export type GoalStatus = 'active' | 'completed' | 'paused' | 'cancelled';
export type GoalPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  type: GoalType;
  status: GoalStatus;
  target_value: number;
  current_value: number;
  unit: string | null;
  period: GoalPeriod | null;
  start_date: string;
  end_date: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface CreateGoalInput {
  title: string;
  description?: string;
  type: GoalType;
  target_value: number;
  unit?: string;
  period?: GoalPeriod;
  start_date?: string;
  end_date?: string;
  metadata?: Record<string, any>;
}

export function useGoals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all goals
  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['goals', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as Goal[];
    },
    enabled: !!user,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Active goals
  const activeGoals = goals.filter(g => g.status === 'active');
  
  // Completed goals
  const completedGoals = goals.filter(g => g.status === 'completed');

  // Create goal mutation
  const createGoalMutation = useMutation({
    mutationFn: async (input: CreateGoalInput) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          ...input,
          start_date: input.start_date || new Date().toISOString().split('T')[0],
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as Goal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', user?.id] });
    },
  });

  // Update goal mutation
  const updateGoalMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Goal> }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Goal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', user?.id] });
    },
  });

  // Delete goal mutation
  const deleteGoalMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', user?.id] });
    },
  });

  // Update goal progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: async ({ goalId, increment }: { goalId: string; increment?: number }) => {
      const { data, error } = await supabase.rpc('update_goal_progress', {
        p_goal_id: goalId,
        p_increment: increment || 1,
      });
      
      if (error) throw error;
      return data as boolean; // Returns true if goal was completed
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  return {
    goals,
    activeGoals,
    completedGoals,
    isLoading,
    createGoal: createGoalMutation.mutateAsync,
    updateGoal: updateGoalMutation.mutateAsync,
    deleteGoal: deleteGoalMutation.mutateAsync,
    updateProgress: updateProgressMutation.mutateAsync,
  };
}

