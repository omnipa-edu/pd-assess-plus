/**
 * Learner Personalization Rules Engine
 * Generates personalized recommendations for learners based on their EPA trajectories
 */

import { supabase } from '@/integrations/supabase/client';

import { getBenchmarkFor, type BenchmarkScope } from '../benchmarks';
import { logger } from '../logger';

import type { LearnerPersonalizationSummary, KeyEPA } from './types';

interface EPASummary {
  epa_code: string;
  current_level: number;
  assessment_count: number;
  latest_assessment_date: string;
  trend_slope: number;
  risk_flag: boolean;
  plateau_flag: boolean;
}

/**
 * Compute EPA summary for a learner
 */
async function computeEPASummary(learnerId: string): Promise<EPASummary[]> {
  try {
    const { data, error } = await supabase.rpc('compute_learner_epa_summary', {
      p_learner_id: learnerId,
      p_lookback_days: 180,
    });

    if (error) {
      logger.error('Error computing EPA summary', error);
      // Fallback: compute manually from assessments
      return await computeEPASummaryFallback(learnerId);
    }

    return (data || []) as EPASummary[];
  } catch (error) {
    logger.error('Unexpected error computing EPA summary', error);
    return await computeEPASummaryFallback(learnerId);
  }
}

/**
 * Fallback: Compute EPA summary manually from assessments
 */
async function computeEPASummaryFallback(learnerId: string): Promise<EPASummary[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 180);

  const { data: assessments, error } = await supabase
    .from('epa_assessments')
    .select('epa_number, rating, created_at')
    .eq('student_id', learnerId)
    .gte('created_at', cutoffDate.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Error fetching assessments for fallback', error);
    return [];
  }

  // Group by EPA
  const epaMap = new Map<string, Array<{ score: number; date: Date }>>();

  (assessments || []).forEach((a) => {
    const score = Number(a.rating);
    if (isNaN(score) || score < 1 || score > 5) return;

    const epaCode = a.epa_number;
    if (!epaMap.has(epaCode)) {
      epaMap.set(epaCode, []);
    }
    epaMap.get(epaCode)!.push({ score, date: new Date(a.created_at) });
  });

  // Compute summary for each EPA
  const summaries: EPASummary[] = [];

  epaMap.forEach((scores, epaCode) => {
    const sorted = [...scores].sort((a, b) => b.date.getTime() - a.date.getTime());
    const currentLevel = sorted.reduce((sum, s) => sum + s.score, 0) / sorted.length;
    const latestDate = sorted[0].date;

    // Compute trend: last 3 vs previous 3
    let trendSlope = 0;
    if (sorted.length >= 6) {
      const last3 = sorted.slice(0, 3).reduce((sum, s) => sum + s.score, 0) / 3;
      const prev3 = sorted.slice(3, 6).reduce((sum, s) => sum + s.score, 0) / 3;
      trendSlope = last3 - prev3;
    }

    const riskFlag = currentLevel < 2.5 || (Date.now() - latestDate.getTime()) > 60 * 24 * 60 * 60 * 1000;
    const plateauFlag = Math.abs(trendSlope) < 0.1 && currentLevel < 4;

    summaries.push({
      epa_code: epaCode,
      current_level: currentLevel,
      assessment_count: sorted.length,
      latest_assessment_date: latestDate.toISOString(),
      trend_slope: trendSlope,
      risk_flag: riskFlag,
      plateau_flag: plateauFlag,
    });
  });

  return summaries;
}

/**
 * Get EPA title from code
 */
async function getEPATitle(epaCode: string, specialtyId?: string): Promise<string> {
  try {
    let query = supabase
      .from('epas')
      .select('title, code')
      .eq('code', epaCode)
      .eq('status', 'active')
      .limit(1);

    if (specialtyId) {
      query = query.eq('specialty_id', specialtyId);
    }

    const { data, error } = await query.maybeSingle();

    if (error || !data) {
      return `EPA ${epaCode}`;
    }

    return data.title || `EPA ${epaCode}`;
  } catch (error) {
    return `EPA ${epaCode}`;
  }
}

/**
 * Generate learner personalization summary
 */
export async function generateLearnerPersonalizationSummary(
  learnerId: string,
  specialtyId?: string,
  cohortId?: string
): Promise<LearnerPersonalizationSummary> {
  try {
    // Step 1: Compute EPA summaries
    const epaSummaries = await computeEPASummary(learnerId);

    // Step 2: Get benchmark data and build key_epas
    const keyEPAs: KeyEPA[] = [];
    const priorityEPAs: EPASummary[] = [];

    // Prioritize: risk > plateau > near-target but below target
    const riskEPAs = epaSummaries.filter((e) => e.risk_flag);
    const plateauEPAs = epaSummaries.filter((e) => e.plateau_flag && !e.risk_flag);
    const belowTargetEPAs = epaSummaries.filter(
      (e) => !e.risk_flag && !e.plateau_flag && e.current_level < 4
    );

    priorityEPAs.push(...riskEPAs.slice(0, 3));
    priorityEPAs.push(...plateauEPAs.slice(0, 2));
    priorityEPAs.push(...belowTargetEPAs.slice(0, 2));

    // Limit to top 5
    const topEPAs = priorityEPAs.slice(0, 5);

    // Step 3: For each priority EPA, get benchmark and build KeyEPA
    for (const epaSummary of topEPAs) {
      const epaTitle = await getEPATitle(epaSummary.epa_code, specialtyId);

      // Get benchmark (default to current_cohort)
      const benchmark = await getBenchmarkFor('current_cohort', {
        learnerId,
        epaCode: epaSummary.epa_code,
      });

      const benchmarkDelta =
        benchmark && benchmark.expectedLevel !== null
          ? epaSummary.current_level - benchmark.expectedLevel
          : null;

      keyEPAs.push({
        epa_code: epaSummary.epa_code,
        epa_title: epaTitle,
        current_level: epaSummary.current_level,
        target_level: 4, // Default target
        risk_flag: epaSummary.risk_flag,
        plateau_flag: epaSummary.plateau_flag,
        benchmark_scope: 'current_cohort',
        benchmark_delta: benchmarkDelta,
      });
    }

    // Step 4: Generate priority actions
    const priorityActions: string[] = [];

    for (const epa of keyEPAs) {
      if (epa.risk_flag && epa.benchmark_delta !== null && epa.benchmark_delta < -0.5) {
        priorityActions.push(
          `Focus on ${epa.epa_title}: you are ${Math.abs(epa.benchmark_delta).toFixed(1)} levels below your cohort's expected level. Try to obtain 2-3 more supervised observations in the next 2 weeks.`
        );
      } else if (epa.plateau_flag) {
        priorityActions.push(
          `Plateau detected in ${epa.epa_title}: discuss with your supervisor which specific behaviors to target next.`
        );
      } else if (epa.current_level !== null && epa.current_level < 4) {
        priorityActions.push(
          `Continue building competency in ${epa.epa_title}: you're making progress toward the target level.`
        );
      }
    }

    // Limit to top 3-4 actions
    const topActions = priorityActions.slice(0, 4);

    // Step 5: Derive coaching tags
    const coachingTags: string[] = [];

    const riskCount = keyEPAs.filter((e) => e.risk_flag).length;
    const plateauCount = keyEPAs.filter((e) => e.plateau_flag).length;

    if (riskCount > 1 || plateauCount > 1) {
      coachingTags.push('theme:feedback_literacy_action');
      coachingTags.push('skill:ask_for_feedback');
    }

    // Check WBA volume
    const totalAssessments = epaSummaries.reduce((sum, e) => sum + e.assessment_count, 0);
    if (totalAssessments < 5) {
      coachingTags.push('topic:engagement');
      coachingTags.push('theme:feedback_literacy_appreciation');
    }

    // Check for low scores
    const hasLowScores = epaSummaries.some((e) => e.current_level < 2.5);
    if (hasLowScores) {
      coachingTags.push('topic:improvement');
      coachingTags.push('theme:feedback_literacy_action');
    }

    return {
      key_epas: keyEPAs,
      priority_actions: topActions,
      suggested_focus_window_weeks: 2,
      coaching_tags: [...new Set(coachingTags)], // Remove duplicates
    };
  } catch (error) {
    logger.error('Error generating learner personalization summary', error);
    // Return empty summary on error
    return {
      key_epas: [],
      priority_actions: [],
      suggested_focus_window_weeks: 2,
      coaching_tags: [],
    };
  }
}





