/**
 * React Hook for Personalized Learning Plan
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  getPersonalizedLearningPlanWithLogging,
  markActionViewed,
  markActionAccepted,
  markActionCompleted,
  markActionDismissed,
  getRecommendationId,
} from '@/lib/learningPlans/api';
import type { ScoredAction } from '@/lib/learningPlans/engine';
import { logger } from '@/lib/logger';

import { useAuth } from './useAuth';

export function useLearningPlan(limit: number = 3) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery<ScoredAction[], Error>({
    queryKey: ['learning-plan', user?.id, limit],
    queryFn: async () => {
      if (!user?.id) {
        return [];
      }

      try {
        return await getPersonalizedLearningPlanWithLogging(user.id, limit);
      } catch (error) {
        logger.error('Error fetching learning plan', error);
        throw error;
      }
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const markViewed = useMutation({
    mutationFn: async (actionId: string) => {
      if (!user?.id) return;
      const recId = await getRecommendationId(user.id, actionId, null);
      if (recId) {
        await markActionViewed(recId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-plan'] });
    },
  });

  const markAccepted = useMutation({
    mutationFn: async (actionId: string, epaId: string | null) => {
      if (!user?.id) return;
      const recId = await getRecommendationId(user.id, actionId, epaId);
      if (recId) {
        await markActionAccepted(recId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-plan'] });
    },
  });

  const markCompleted = useMutation({
    mutationFn: async (actionId: string, epaId: string | null, notes?: string) => {
      if (!user?.id) return;
      const recId = await getRecommendationId(user.id, actionId, epaId);
      if (recId) {
        await markActionCompleted(recId, notes);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-plan'] });
    },
  });

  const markDismissed = useMutation({
    mutationFn: async (actionId: string, epaId: string | null, reason?: string) => {
      if (!user?.id) return;
      const recId = await getRecommendationId(user.id, actionId, epaId);
      if (recId) {
        await markActionDismissed(recId, reason);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-plan'] });
    },
  });

  return {
    ...query,
    markViewed,
    markAccepted,
    markCompleted,
    markDismissed,
  };
}





