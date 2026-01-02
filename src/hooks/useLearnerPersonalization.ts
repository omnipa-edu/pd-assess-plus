/**
 * React Hook for Learner Personalization Summary
 */

import { useQuery } from '@tanstack/react-query';

import { getLearnerSummary } from '@/lib/personalization/summary-generation';
import type { LearnerPersonalizationSummary } from '@/lib/personalization/types';

import { useAuth } from './useAuth';

export function useLearnerPersonalization() {
  const { user } = useAuth();

  return useQuery<LearnerPersonalizationSummary | null, Error>({
    queryKey: ['learner-personalization', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      return await getLearnerSummary(user.id);
    },
    enabled: !!user?.id,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
}





