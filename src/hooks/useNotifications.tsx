import { useState, useEffect, useCallback } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Notification {
  id: string;
  user_id: string;
  type: 'assessment_received' | 'assessment_overdue' | 'milestone_achieved' | 'score_improvement' | 'new_student_assigned' | 'feedback_requested' | 'weekly_summary' | 'system_announcement';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  action_url?: string | null;
  action_label?: string | null;
  read_at?: string | null;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_assessment_received: boolean;
  email_assessment_overdue: boolean;
  email_milestone_achieved: boolean;
  email_score_improvement: boolean;
  email_new_student_assigned: boolean;
  email_feedback_requested: boolean;
  email_weekly_summary: boolean;
  email_system_announcement: boolean;
  in_app_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return (data || []) as Notification[];
    },
    enabled: !!user,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Unread count
  const unreadCount = notifications.filter(n => !n.read_at).length;

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase.rpc('mark_notification_read', {
        p_notification_id: notificationId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('mark_all_notifications_read');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  // Fetch preferences
  const { data: preferences } = useQuery({
    queryKey: ['notification_preferences', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      // Create default preferences if none exist
      if (!data) {
        const { data: newPrefs, error: insertError } = await supabase
          .from('notification_preferences')
          .insert({ user_id: user.id })
          .select()
          .single();
        
        if (insertError) throw insertError;
        return newPrefs as NotificationPreferences;
      }
      
      return data as NotificationPreferences;
    },
    enabled: !!user,
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (updates: Partial<NotificationPreferences>) => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('notification_preferences')
        .update(updates)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification_preferences', user?.id] });
    },
  });

  return {
    notifications,
    isLoading,
    unreadCount,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    preferences,
    updatePreferences: updatePreferencesMutation.mutate,
  };
}

// Hook to create notifications (for use in other parts of the app)
export function useCreateNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      userId: string;
      type: Notification['type'];
      title: string;
      message: string;
      priority?: Notification['priority'];
      actionUrl?: string;
      actionLabel?: string;
      metadata?: Record<string, any>;
    }) => {
      const { data, error } = await supabase.rpc('create_notification', {
        p_user_id: params.userId,
        p_type: params.type,
        p_title: params.title,
        p_message: params.message,
        p_priority: params.priority || 'medium',
        p_action_url: params.actionUrl || null,
        p_action_label: params.actionLabel || null,
        p_metadata: params.metadata || {},
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notifications', variables.userId] });
    },
  });
}

