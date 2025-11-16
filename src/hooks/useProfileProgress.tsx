/**
 * Hook for managing user onboarding and progress tracking
 */
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface ProfileProgress {
  id: string;
  user_id: string;
  onboarding_dismissed: boolean;
  completed_tasks: string[];
  first_login_at: string | null;
  onboarding_completed_at: string | null;
  dismissed_empty_states: string[];
  created_at: string;
  updated_at: string;
}

export const useProfileProgress = () => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<ProfileProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (user) {
      fetchProgress();
    } else {
      setProgress(null);
      setLoading(false);
    }
  }, [user]);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profile_progress')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        setProgress(data as ProfileProgress);
      } else if (user) {
        // Create progress record if it doesn't exist
        await initializeProgress();
      }
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching profile progress:', err);
    } finally {
      setLoading(false);
    }
  };

  const initializeProgress = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profile_progress')
        .insert({
          user_id: user.id,
          first_login_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      setProgress(data as ProfileProgress);
    } catch (err) {
      console.error('Error initializing progress:', err);
      throw err;
    }
  };

  const completeTask = async (taskId: string) => {
    if (!user || !progress) return;

    const updatedTasks = [...progress.completed_tasks];
    if (!updatedTasks.includes(taskId)) {
      updatedTasks.push(taskId);
    }

    try {
      const { data, error } = await supabase
        .from('profile_progress')
        .update({ completed_tasks: updatedTasks })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      setProgress(data as ProfileProgress);
    } catch (err) {
      console.error('Error completing task:', err);
      throw err;
    }
  };

  const dismissOnboarding = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profile_progress')
        .update({ 
          onboarding_dismissed: true,
          onboarding_completed_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      setProgress(data as ProfileProgress);
    } catch (err) {
      console.error('Error dismissing onboarding:', err);
      throw err;
    }
  };

  const showOnboarding = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profile_progress')
        .update({ onboarding_dismissed: false })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      setProgress(data as ProfileProgress);
    } catch (err) {
      console.error('Error showing onboarding:', err);
      throw err;
    }
  };

  const dismissEmptyState = async (emptyStateId: string) => {
    if (!user || !progress) return;

    const updatedStates = [...progress.dismissed_empty_states];
    if (!updatedStates.includes(emptyStateId)) {
      updatedStates.push(emptyStateId);
    }

    try {
      const { data, error } = await supabase
        .from('profile_progress')
        .update({ dismissed_empty_states: updatedStates })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      setProgress(data as ProfileProgress);
    } catch (err) {
      console.error('Error dismissing empty state:', err);
      throw err;
    }
  };

  return {
    progress,
    loading,
    error,
    completeTask,
    dismissOnboarding,
    showOnboarding,
    dismissEmptyState,
    isTaskCompleted: (taskId: string) => progress?.completed_tasks.includes(taskId) ?? false,
    isEmptyStateDismissed: (stateId: string) => progress?.dismissed_empty_states.includes(stateId) ?? false,
    shouldShowOnboarding: !progress?.onboarding_dismissed,
  };
};



