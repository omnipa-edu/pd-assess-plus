/**
 * Feature Pipeline for Learning Plan Engine
 * Builds learner state snapshots for recommendation engine and ML training
 */

import { supabase } from '@/integrations/supabase/client';

import { getBenchmarkFor } from '../benchmarks';
import { logger } from '../logger';

export interface LearnerEpaState {
  learnerId: string;
  epaId: string | null;
  epaCode: string;
  currentLevel: number | null;
  targetLevel: number | null;
  trendSlope: number | null;
  plateauFlag: boolean;
  riskFlag: boolean;
  observationsCount: number;
  confidence: number | null;
  benchmarkScope: string | null;
  benchmarkDelta: number | null; // learner_level - expected_level
  exposuresLast30: number;
  exposuresLast90: number;
  settingDistribution: Record<string, number>; // normalized
  supervisorDistribution: Record<string, number>; // normalized or summary index
  longestGapDays: number | null;
  feedbackQuality: {
    avgOverallScore: number | null;
    clarity: number | null;
    specificity: number | null;
    actionability: number | null;
    balance: number | null;
    engagement: number | null;
    tone: number | null;
  };
  learnerMeta: {
    programId: string | null;
    cohortId: string | null;
    disciplineId: string | null;
    timeFromStartDays: number | null;
    levelLabel: string | null; // e.g. 'PA-S2'
  };
}

export interface LearnerStateSnapshot {
  learnerId: string;
  generatedAt: Date;
  epas: Record<string, LearnerEpaState>;
}

/**
 * Build a comprehensive learner state snapshot for recommendation engine
 */
export async function buildLearnerStateSnapshot(
  learnerId: string
): Promise<LearnerStateSnapshot> {
  const generatedAt = new Date();
  const epas: Record<string, LearnerEpaState> = {};

  try {
    // Step 1: Get learner profile and context
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, program, year_of_training, cohort_id, institution_id, department_id')
      .eq('id', learnerId)
      .single();

    if (profileError || !profile) {
      logger.error('Error fetching learner profile', profileError);
      throw new Error('Learner profile not found');
    }

    // Get cohort info for time_from_start calculation
    let cohortStartDate: Date | null = null;
    let specialtyId: string | null = null;
    if (profile.cohort_id) {
      const { data: cohort } = await supabase
        .from('program_cohorts')
        .select('start_date, specialty_id')
        .eq('id', profile.cohort_id)
        .single();
      
      if (cohort) {
        cohortStartDate = new Date(cohort.start_date);
        specialtyId = cohort.specialty_id;
      }
    }

    const timeFromStartDays = cohortStartDate
      ? Math.max(0, Math.floor((generatedAt.getTime() - cohortStartDate.getTime()) / (1000 * 60 * 60 * 24)))
      : null;

    // Step 2: Compute EPA trajectory summary using existing function
    const { data: epaSummary, error: summaryError } = await supabase.rpc(
      'compute_learner_epa_summary',
      {
        p_learner_id: learnerId,
        p_lookback_days: 180,
      }
    );

    if (summaryError) {
      logger.error('Error computing EPA summary', summaryError);
      // Continue with empty array - we can still build state from assessments
    }

    const epaSummaryData = (epaSummary || []) as Array<{
      epa_code: string;
      current_level: number;
      assessment_count: number;
      latest_assessment_date: string;
      trend_slope: number;
      risk_flag: boolean;
      plateau_flag: boolean;
    }>;

    // Step 3: Get all EPA assessments for exposure and distribution calculations
    const cutoff30 = new Date();
    cutoff30.setDate(cutoff30.getDate() - 30);
    const cutoff90 = new Date();
    cutoff90.setDate(cutoff90.getDate() - 90);

    const { data: allAssessments, error: assessmentsError } = await supabase
      .from('epa_assessments')
      .select('id, epa_number, rating, clinical_setting, supervisor_id, created_at')
      .eq('student_id', learnerId)
      .order('created_at', { ascending: false });

    if (assessmentsError) {
      logger.error('Error fetching assessments', assessmentsError);
    }

    const assessments = allAssessments || [];

    // If no EPA summary data and no assessments, return empty snapshot
    if (epaSummaryData.length === 0 && assessments.length === 0) {
      return {
        learnerId,
        generatedAt,
        epas: {},
      };
    }
    const assessmentIds = assessments.map((a) => a.id);

    // Step 4: Get feedback quality scores for this learner's assessments only
    const feedbackMap = new Map<string, {
      assessment_id: string;
      overall_score: number;
      clarity_score: number;
      specificity_score: number;
      actionability_score: number;
      balance_score: number;
      learner_engagement_score: number;
      tone_professionalism_score: number;
    }>();

    if (assessmentIds.length > 0) {
      const { data: feedbackScores, error: feedbackError } = await supabase
        .from('feedback_quality_scores')
        .select('assessment_id, overall_score, clarity_score, specificity_score, actionability_score, balance_score, learner_engagement_score, tone_professionalism_score')
        .eq('assessment_type', 'epa')
        .in('assessment_id', assessmentIds);

      if (feedbackError) {
        logger.warn('Error fetching feedback quality scores', feedbackError);
      } else if (feedbackScores) {
        feedbackScores.forEach((score) => {
          feedbackMap.set(score.assessment_id, score);
        });
      }
    }

    // Step 5: Get EPA IDs for each EPA code
    const epaCodes = new Set(epaSummaryData.map((e) => e.epa_code));
    const epaIdMap = new Map<string, string>();

    if (epaCodes.size > 0 && specialtyId) {
      const { data: epasData } = await supabase
        .from('epas')
        .select('id, code')
        .eq('specialty_id', specialtyId)
        .in('code', Array.from(epaCodes));

      (epasData || []).forEach((epa) => {
        epaIdMap.set(epa.code, epa.id);
      });
    }

    // Step 6: Build state for each EPA
    // Process EPAs from summary data (which includes trajectory info)
    for (const summary of epaSummaryData) {
      const epaCode = summary.epa_code;
      const epaId = epaIdMap.get(epaCode) || null;

      // Filter assessments for this EPA
      const epaAssessments = assessments.filter((a) => a.epa_number === epaCode);
      
      // Compute exposures
      const exposuresLast30 = epaAssessments.filter(
        (a) => new Date(a.created_at) >= cutoff30
      ).length;
      const exposuresLast90 = epaAssessments.filter(
        (a) => new Date(a.created_at) >= cutoff90
      ).length;

      // Compute setting distribution
      const settingCounts: Record<string, number> = {};
      epaAssessments.forEach((a) => {
        const setting = a.clinical_setting || 'unknown';
        settingCounts[setting] = (settingCounts[setting] || 0) + 1;
      });
      const totalSettings = Object.values(settingCounts).reduce((sum, count) => sum + count, 0);
      const settingDistribution: Record<string, number> = {};
      Object.entries(settingCounts).forEach(([setting, count]) => {
        settingDistribution[setting] = totalSettings > 0 ? count / totalSettings : 0;
      });

      // Compute supervisor distribution
      const supervisorCounts: Record<string, number> = {};
      epaAssessments.forEach((a) => {
        const supervisor = a.supervisor_id || 'unknown';
        supervisorCounts[supervisor] = (supervisorCounts[supervisor] || 0) + 1;
      });
      const totalSupervisors = Object.values(supervisorCounts).reduce((sum, count) => sum + count, 0);
      const supervisorDistribution: Record<string, number> = {};
      Object.entries(supervisorCounts).forEach(([supervisor, count]) => {
        supervisorDistribution[supervisor] = totalSupervisors > 0 ? count / totalSupervisors : 0;
      });

      // Compute longest gap between assessments
      let longestGapDays: number | null = null;
      if (epaAssessments.length > 1) {
        const sortedDates = epaAssessments
          .map((a) => new Date(a.created_at))
          .sort((a, b) => a.getTime() - b.getTime());
        
        for (let i = 1; i < sortedDates.length; i++) {
          const gap = Math.floor(
            (sortedDates[i].getTime() - sortedDates[i - 1].getTime()) / (1000 * 60 * 60 * 24)
          );
          if (longestGapDays === null || gap > longestGapDays) {
            longestGapDays = gap;
          }
        }
      }

      // Compute feedback quality for this EPA
      const epaFeedbackScores = epaAssessments
        .map((a) => feedbackMap.get(a.id))
        .filter((f): f is NonNullable<typeof f> => f !== undefined);

      const feedbackQuality = {
        avgOverallScore:
          epaFeedbackScores.length > 0
            ? epaFeedbackScores.reduce((sum, f) => sum + f.overall_score, 0) / epaFeedbackScores.length
            : null,
        clarity:
          epaFeedbackScores.length > 0
            ? epaFeedbackScores.reduce((sum, f) => sum + f.clarity_score, 0) / epaFeedbackScores.length
            : null,
        specificity:
          epaFeedbackScores.length > 0
            ? epaFeedbackScores.reduce((sum, f) => sum + f.specificity_score, 0) / epaFeedbackScores.length
            : null,
        actionability:
          epaFeedbackScores.length > 0
            ? epaFeedbackScores.reduce((sum, f) => sum + f.actionability_score, 0) / epaFeedbackScores.length
            : null,
        balance:
          epaFeedbackScores.length > 0
            ? epaFeedbackScores.reduce((sum, f) => sum + f.balance_score, 0) / epaFeedbackScores.length
            : null,
        engagement:
          epaFeedbackScores.length > 0
            ? epaFeedbackScores.reduce((sum, f) => sum + f.learner_engagement_score, 0) / epaFeedbackScores.length
            : null,
        tone:
          epaFeedbackScores.length > 0
            ? epaFeedbackScores.reduce((sum, f) => sum + f.tone_professionalism_score, 0) / epaFeedbackScores.length
            : null,
      };

      // Get benchmark for this EPA (using current_cohort as default)
      let benchmarkDelta: number | null = null;
      let benchmarkScope: string | null = null;
      try {
        const benchmark = await getBenchmarkFor('current_cohort', {
          learnerId,
          epaCode,
          snapshotDate: generatedAt,
        });

        if (benchmark && benchmark.expectedLevel !== null && summary.current_level !== null) {
          benchmarkDelta = summary.current_level - benchmark.expectedLevel;
          benchmarkScope = 'current_cohort';
        }
      } catch (error) {
        logger.warn('Error fetching benchmark', { epaCode, error });
      }

      // Compute confidence (based on assessment count and recency)
      let confidence: number | null = null;
      if (summary.assessment_count > 0) {
        const recencyDays = summary.latest_assessment_date
          ? Math.floor(
              (generatedAt.getTime() - new Date(summary.latest_assessment_date).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : 999;
        // Confidence increases with more assessments and decreases with recency
        // Formula: (assessment_count / 10) * (1 - recency_days / 180)
        // Clamped between 0 and 1
        confidence = Math.min(
          1.0,
          Math.max(0.0, (summary.assessment_count / 10) * Math.max(0, 1 - recencyDays / 180))
        );
      }

      // Target level (default to 4.0, can be customized)
      const targetLevel = 4.0;

      epas[epaCode] = {
        learnerId,
        epaId,
        epaCode,
        currentLevel: summary.current_level,
        targetLevel,
        trendSlope: summary.trend_slope,
        plateauFlag: summary.plateau_flag,
        riskFlag: summary.risk_flag,
        observationsCount: summary.assessment_count,
        confidence,
        benchmarkScope,
        benchmarkDelta,
        exposuresLast30,
        exposuresLast90,
        settingDistribution,
        supervisorDistribution,
        longestGapDays,
        feedbackQuality,
        learnerMeta: {
          programId: profile.program || null,
          cohortId: profile.cohort_id || null,
          disciplineId: specialtyId,
          timeFromStartDays,
          levelLabel: profile.year_of_training || null,
        },
      };
    }

    return {
      learnerId,
      generatedAt,
      epas,
    };
  } catch (error) {
    logger.error('Error building learner state snapshot', error);
    throw error;
  }
}

