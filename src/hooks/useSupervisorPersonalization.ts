/**
 * React Hook for Supervisor Personalization Summary
 */

import { useQuery } from '@tanstack/react-query';

import { getSupervisorSummary } from '@/lib/personalization/summary-generation';
import type { SupervisorPersonalizationSummary } from '@/lib/personalization/types';

import { useAuth } from './useAuth';

export function useSupervisorPersonalization() {
  const { user } = useAuth();

  return useQuery<SupervisorPersonalizationSummary | null, Error>({
    queryKey: ['supervisor-personalization', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      return await getSupervisorSummary(user.id);
    },
    enabled: !!user?.id,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
}





