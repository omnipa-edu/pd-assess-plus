/**
 * React Hook for EPA Benchmark Data
 * Fetches and manages benchmark data for a learner and EPA
 */

import { useQuery, useQueries } from '@tanstack/react-query';

import {
  getBenchmarkFor,
  type BenchmarkScope,
  type BenchmarkContext,
  type BenchmarkResult,
} from '@/lib/benchmarks';
import { logger } from '@/lib/logger';

interface UseEpaBenchmarkOptions {
  scope: BenchmarkScope;
  learnerId: string | null;
  epaCode: string;
  snapshotDate?: Date;
  enabled?: boolean;
}

export function useEpaBenchmark({
  scope,
  learnerId,
  epaCode,
  snapshotDate,
  enabled = true,
}: UseEpaBenchmarkOptions) {
  return useQuery<BenchmarkResult | null, Error>({
    queryKey: ['epa-benchmark', scope, learnerId, epaCode, snapshotDate?.toISOString()],
    queryFn: async () => {
      if (!learnerId || !epaCode) {
        return null;
      }

      try {
        const result = await getBenchmarkFor(scope, {
          learnerId,
          epaCode,
          snapshotDate,
        });

        return result;
      } catch (error) {
        logger.error('Error in useEpaBenchmark', error);
        throw error;
      }
    },
    enabled: enabled && !!learnerId && !!epaCode,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for multiple benchmark scopes (for comparison)
 */
export function useEpaBenchmarks(
  scopes: BenchmarkScope[],
  learnerId: string | null,
  epaCode: string,
  snapshotDate?: Date,
  enabled: boolean = true
) {
  const queries = useQueries({
    queries: scopes.map((scope) => ({
      queryKey: ['epa-benchmark', scope, learnerId, epaCode, snapshotDate?.toISOString()],
      queryFn: async () => {
        if (!learnerId || !epaCode) {
          return null;
        }

        try {
          const result = await getBenchmarkFor(scope, {
            learnerId,
            epaCode,
            snapshotDate,
          });

          return result;
        } catch (error) {
          logger.error('Error in useEpaBenchmarks', error);
          throw error;
        }
      },
      enabled: enabled && !!learnerId && !!epaCode,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    })),
  });

  const isLoading = queries.some((q) => q.isLoading);
  const isError = queries.some((q) => q.isError);
  const error = queries.find((q) => q.error)?.error;

  const results = new Map<BenchmarkScope, BenchmarkResult | null>();
  scopes.forEach((scope, index) => {
    results.set(scope, queries[index].data || null);
  });

  return {
    results,
    isLoading,
    isError,
    error,
    refetch: () => {
      queries.forEach((q) => q.refetch());
    },
  };
}

