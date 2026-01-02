/**
 * Benchmark Utilities
 * Helper functions for fetching and computing EPA competency benchmarks
 */

import { supabase } from '@/integrations/supabase/client';

import { logger } from './logger';

export type BenchmarkScope =
  | 'current_cohort'
  | 'previous_cohorts_program'
  | 'all_cohorts_program'
  | 'all_cohorts_department'
  | 'all_cohorts_institution'
  | 'all_cohorts_discipline';

export interface BenchmarkContext {
  learnerId: string;
  epaCode: string; // Using epa_code (TEXT) to match epa_assessments structure
  snapshotDate?: Date; // Defaults to today
}

export interface BenchmarkResult {
  scope: BenchmarkScope;
  expectedLevel: number | null;
  p25Level: number | null;
  p75Level: number | null;
  nLearners: number;
  nAssessments: number;
  timeFromStartDays: number | null;
}

/**
 * Get benchmark for a specific scope and context
 */
export async function getBenchmarkFor(
  scope: BenchmarkScope,
  context: BenchmarkContext
): Promise<BenchmarkResult | null> {
  try {
    const snapshotDate = context.snapshotDate || new Date();
    const snapshotDateStr = snapshotDate.toISOString().split('T')[0];

    // Step 1: Get learner's context (cohort, program, institution, department, discipline)
    const { data: learnerContext, error: contextError } = await supabase.rpc(
      'get_learner_benchmark_context',
      { p_learner_id: context.learnerId }
    );

    if (contextError) {
      logger.error('Error fetching learner context', contextError);
      return null;
    }

    if (!learnerContext || learnerContext.length === 0) {
      logger.warn('No learner context found', { learnerId: context.learnerId });
      return null;
    }

    const contextData = learnerContext[0];
    const {
      cohort_id,
      cohort_start_date,
      specialty_id,
      department_id,
      institution_id,
    } = contextData;

    // Step 2: Compute time_from_start_days
    let timeFromStartDays: number | null = null;
    let startDate: Date | null = null;

    if (scope === 'current_cohort' && cohort_start_date) {
      startDate = new Date(cohort_start_date);
    } else if (
      (scope === 'previous_cohorts_program' || scope === 'all_cohorts_program') &&
      cohort_start_date
    ) {
      // For program scopes, use cohort start date as reference
      startDate = new Date(cohort_start_date);
    } else if (cohort_start_date) {
      // Default to cohort start date if available
      startDate = new Date(cohort_start_date);
    }

    if (startDate) {
      try {
        const { data: timeData, error: timeError } = await supabase.rpc(
          'compute_time_from_start',
          {
            p_start_date: startDate.toISOString().split('T')[0],
            p_snapshot_date: snapshotDateStr,
          }
        );

        if (!timeError && timeData !== null && timeData !== undefined) {
          timeFromStartDays = Number(timeData);
        } else if (timeError) {
          // Fallback: compute manually if RPC doesn't exist
          const diffTime = snapshotDate.getTime() - startDate.getTime();
          timeFromStartDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
        }
      } catch (error) {
        // Fallback: compute manually
        const diffTime = snapshotDate.getTime() - startDate.getTime();
        timeFromStartDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
      }
    }

    // Step 3: Build query based on scope
    let query = supabase
      .from('epa_benchmarks')
      .select('*')
      .eq('scope', scope)
      .eq('epa_code', context.epaCode);

    // Add scope-specific filters
    switch (scope) {
      case 'current_cohort':
        if (!cohort_id) {
          logger.warn('No cohort_id for current_cohort scope', { learnerId: context.learnerId });
          return null;
        }
        query = query.eq('cohort_id', cohort_id);
        break;

      case 'previous_cohorts_program':
      case 'all_cohorts_program':
        if (!specialty_id) {
          logger.warn('No specialty_id for program scope', { learnerId: context.learnerId });
          return null;
        }
        query = query.eq('specialty_id', specialty_id);
        if (scope === 'previous_cohorts_program' && cohort_id) {
          // Exclude current cohort
          query = query.neq('cohort_id', cohort_id);
        }
        break;

      case 'all_cohorts_department':
        if (!department_id) {
          logger.warn('No department_id for department scope', { learnerId: context.learnerId });
          return null;
        }
        query = query.eq('department_id', department_id);
        break;

      case 'all_cohorts_institution':
        if (!institution_id) {
          logger.warn('No institution_id for institution scope', { learnerId: context.learnerId });
          return null;
        }
        query = query.eq('institution_id', institution_id);
        break;

      case 'all_cohorts_discipline':
        if (!specialty_id) {
          logger.warn('No specialty_id for discipline scope', { learnerId: context.learnerId });
          return null;
        }
        query = query.eq('specialty_id', specialty_id);
        // institution_id should be NULL for cross-institution scope
        break;
    }

    // Step 4: Find nearest time_from_start_days
    if (timeFromStartDays !== null) {
      // Get the closest benchmark (≤ given days, or nearest if none)
      query = query
        .lte('time_from_start_days', timeFromStartDays)
        .order('time_from_start_days', { ascending: false })
        .limit(1);
    } else {
      // If no time calculation, get most recent or default
      query = query.order('time_from_start_days', { ascending: false }).limit(1);
    }

    const { data, error } = await query.single();

    if (error) {
      // Not found is OK - return null
      if (error.code === 'PGRST116') {
        return null;
      }
      logger.error('Error fetching benchmark', error);
      return null;
    }

    if (!data) {
      return null;
    }

    return {
      scope,
      expectedLevel: data.expected_level ? Number(data.expected_level) : null,
      p25Level: data.p25_level ? Number(data.p25_level) : null,
      p75Level: data.p75_level ? Number(data.p75_level) : null,
      nLearners: data.n_learners || 0,
      nAssessments: data.n_assessments || 0,
      timeFromStartDays: data.time_from_start_days || null,
    };
  } catch (error) {
    logger.error('Unexpected error in getBenchmarkFor', error);
    return null;
  }
}

/**
 * Get multiple benchmarks for different scopes (for comparison)
 */
export async function getBenchmarksForScopes(
  scopes: BenchmarkScope[],
  context: BenchmarkContext
): Promise<Map<BenchmarkScope, BenchmarkResult | null>> {
  const results = new Map<BenchmarkScope, BenchmarkResult | null>();

  await Promise.all(
    scopes.map(async (scope) => {
      const result = await getBenchmarkFor(scope, context);
      results.set(scope, result);
    })
  );

  return results;
}

/**
 * Determine learner status relative to benchmark
 * Returns: 'ahead' | 'on_track' | 'at_risk'
 */
export function compareToBenchmark(
  learnerLevel: number,
  benchmark: BenchmarkResult | null,
  threshold: number = 0.5
): 'ahead' | 'on_track' | 'at_risk' | 'unknown' {
  if (!benchmark || benchmark.expectedLevel === null) {
    return 'unknown';
  }

  const diff = learnerLevel - benchmark.expectedLevel;

  if (diff >= threshold) {
    return 'ahead';
  } else if (diff <= -threshold) {
    return 'at_risk';
  } else {
    return 'on_track';
  }
}

/**
 * Get benchmark scope display label
 */
export function getBenchmarkScopeLabel(scope: BenchmarkScope): string {
  const labels: Record<BenchmarkScope, string> = {
    current_cohort: 'My current cohort',
    previous_cohorts_program: 'Previous cohorts in my program',
    all_cohorts_program: 'All cohorts in my program',
    all_cohorts_department: 'All cohorts in my department',
    all_cohorts_institution: 'All cohorts at my institution',
    all_cohorts_discipline: 'All cohorts in my discipline (all institutions)',
  };

  return labels[scope] || scope;
}

