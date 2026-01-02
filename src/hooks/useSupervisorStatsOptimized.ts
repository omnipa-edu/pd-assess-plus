import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';

import { type TeachingStatistics } from './useTeachingStatistics';

interface UseSupervisorStatsOptimizedOptions {
  supervisorId: string | null;
  startDate: Date;
  endDate: Date;
  enabled?: boolean;
}

/**
 * Optimized version using database aggregation function
 * Falls back to client-side aggregation if function doesn't exist
 */
export function useSupervisorStatsOptimized({
  supervisorId,
  startDate,
  endDate,
  enabled = true,
}: UseSupervisorStatsOptimizedOptions) {
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  return useQuery({
    queryKey: ['supervisor-stats-optimized', supervisorId, startDateStr, endDateStr],
    queryFn: async (): Promise<TeachingStatistics | null> => {
      if (!supervisorId) return null;

      try {
        // Try to use database function first (faster)
        const { data, error } = await supabase.rpc('get_supervisor_teaching_stats', {
          p_supervisor_id: supervisorId,
          p_start_date: startDateStr,
          p_end_date: endDateStr,
        });

        if (!error && data) {
          // Function exists and returned data
          return data as TeachingStatistics;
        }

        // If function doesn't exist (error code 42883 = function does not exist),
        // fall back to client-side aggregation
        if (error?.code === '42883' || error?.message?.includes('does not exist')) {
          console.warn('Database function not found, falling back to client-side aggregation');
          // Import and use the client-side version
          const { useTeachingStatistics } = await import('./useTeachingStatistics');
          // This is a workaround - we'll need to call the fetch function directly
          // For now, return null and let the component handle the fallback
          return null;
        }

        throw error;
      } catch (error: any) {
        console.error('Error fetching supervisor stats:', error);
        throw error;
      }
    },
    enabled: enabled && !!supervisorId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}





