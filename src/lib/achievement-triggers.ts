/**
 * Achievement and Notification Triggers
 * 
 * This file contains utility functions to trigger achievements and notifications
 * based on user actions throughout the app.
 * 
 * These functions should be called from components that have access to the hooks.
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Trigger achievement progress update
 * Call this from components that have access to useUpdateAchievementProgress hook
 */
export async function updateAchievementProgress(
  userId: string,
  achievementCode: string,
  increment: number = 1
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('update_achievement_progress', {
      p_user_id: userId,
      p_achievement_code: achievementCode,
      p_increment: increment,
    });
    
    if (error) {
      console.error('Error updating achievement progress:', error);
      return false;
    }
    
    return data as boolean; // Returns true if achievement was unlocked
  } catch (error) {
    console.error('Error updating achievement progress:', error);
    return false;
  }
}

/**
 * Create a notification
 * Call this from components that have access to useCreateNotification hook
 */
export async function createNotification(params: {
  userId: string;
  type: 'assessment_received' | 'assessment_overdue' | 'milestone_achieved' | 'score_improvement' | 'new_student_assigned' | 'feedback_requested' | 'weekly_summary' | 'system_announcement';
  title: string;
  message: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
}): Promise<string | null> {
  try {
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
    
    if (error) {
      console.error('Error creating notification:', error);
      return null;
    }
    
    return data as string;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

/**
 * Helper to trigger assessment completion flow
 * This should be called after an assessment is successfully submitted
 */
export async function triggerAssessmentCompleted(
  userId: string,
  assessmentType: 'epa' | 'direct' | 'narrative'
): Promise<void> {
  // Log activity and update streak
  const newStreak = await logActivityAndUpdateStreaks(userId, 'assessment');
  
  // Update assessment count progress (this will check all milestone achievements)
  const unlocked = await updateAchievementProgress(userId, 'assessments_10', 1);
  
  // Check for first assessment
  const firstUnlocked = await updateAchievementProgress(userId, 'first_assessment', 1);
  
  // Update assessment-related goals
  await updateAssessmentGoals(userId);
  
  // Create notifications
  if (firstUnlocked) {
    await createNotification({
      userId,
      type: 'milestone_achieved',
      title: 'First Assessment Complete!',
      message: 'You\'ve completed your first assessment. Keep up the great work!',
      priority: 'high',
      actionUrl: '/student',
      actionLabel: 'View Dashboard',
    });
  } else if (unlocked) {
    await createNotification({
      userId,
      type: 'milestone_achieved',
      title: 'Achievement Unlocked!',
      message: 'You\'ve reached a new milestone!',
      priority: 'high',
      actionUrl: '/student',
      actionLabel: 'View Achievements',
    });
  }
  
  // Notify about streak milestones
  if (newStreak > 0 && (newStreak === 3 || newStreak === 7 || newStreak === 30)) {
    await createNotification({
      userId,
      type: 'milestone_achieved',
      title: `🔥 ${newStreak}-Day Streak!`,
      message: `Amazing! You've maintained a ${newStreak}-day assessment streak!`,
      priority: 'high',
      actionUrl: '/student',
      actionLabel: 'View Progress',
    });
  }
}

/**
 * Helper to trigger profile completion
 */
export async function triggerProfileCompleted(userId: string): Promise<void> {
  try {
    const { data, error } = await supabase.rpc('unlock_achievement', {
      p_user_id: userId,
      p_achievement_code: 'profile_complete',
    });
    
    if (!error && data) {
      await createNotification({
        userId,
        type: 'milestone_achieved',
        title: 'Profile Complete!',
        message: 'You\'ve completed your profile. Great job!',
        priority: 'medium',
      });
    }
  } catch (error) {
    console.error('Error triggering profile completion:', error);
  }
}

/**
 * Log user activity and update streaks
 */
export async function logActivityAndUpdateStreaks(
  userId: string,
  activityType: string = 'assessment'
): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('log_user_activity', {
      p_user_id: userId,
      p_activity_type: activityType,
    });
    
    if (error) {
      console.error('Error logging activity:', error);
      return 0;
    }
    
    return data as number; // Returns new streak count
  } catch (error) {
    console.error('Error logging activity:', error);
    return 0;
  }
}

/**
 * Update goal progress for assessment-related goals
 */
export async function updateAssessmentGoals(userId: string): Promise<void> {
  try {
    // Get all active assessment_count goals
    const { data: goals, error } = await supabase
      .from('goals')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .eq('type', 'assessment_count');
    
    if (error) {
      console.error('Error fetching goals:', error);
      return;
    }
    
    // Update each goal
    for (const goal of goals || []) {
      const { data: completed } = await supabase.rpc('update_goal_progress', {
        p_goal_id: goal.id,
        p_increment: 1,
      });
      
      // If goal was completed, create notification
      if (completed) {
        const { data: goalData } = await supabase
          .from('goals')
          .select('title')
          .eq('id', goal.id)
          .single();
        
        if (goalData) {
          await createNotification({
            userId,
            type: 'milestone_achieved',
            title: 'Goal Completed! 🎉',
            message: `Congratulations! You've completed your goal: ${goalData.title}`,
            priority: 'high',
            actionUrl: '/student',
            actionLabel: 'View Goals',
          });
        }
      }
    }
  } catch (error) {
    console.error('Error updating assessment goals:', error);
  }
}

