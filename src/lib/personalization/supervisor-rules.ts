/**
 * Supervisor Personalization Rules Engine
 * Generates personalized recommendations for supervisors based on their supervisees and feedback quality
 */

import { supabase } from '@/integrations/supabase/client';

import { getBenchmarkFor } from '../benchmarks';
import { logger } from '../logger';

import type {
  SupervisorPersonalizationSummary,
  LearnerOfInterest,
  FeedbackQuality,
  CMETeachingSnapshot,
} from './types';

/**
 * Get learners supervised by this supervisor in the last X weeks
 */
async function getSupervisedLearners(
  supervisorId: string,
  weeks: number = 12
): Promise<Array<{ id: string; name: string | null }>> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - weeks * 7);

  // Try supervisor_student_assignments first
  try {
    const { data: assignments, error } = await supabase
      .from('supervisor_student_assignments')
      .select('student_id, student:profiles!supervisor_student_assignments_student_id_fkey(id, full_name)')
      .eq('supervisor_id', supervisorId)
      .eq('is_active', true);

    if (!error && assignments && assignments.length > 0) {
      return assignments
        .map((a: any) => ({
          id: a.student_id,
          name: a.student?.full_name || null,
        }))
        .filter((l) => l.id);
    }
  } catch (error) {
    logger.warn('Error fetching from supervisor_student_assignments, trying fallback', error);
  }

  // Fallback: get from assessments
  const { data: assessments, error } = await supabase
    .from('epa_assessments')
    .select('student_id, student:profiles!epa_assessments_student_id_fkey(id, full_name)')
    .eq('supervisor_id', supervisorId)
    .gte('created_at', cutoffDate.toISOString());

  if (error) {
    logger.error('Error fetching supervised learners', error);
    return [];
  }

  const learnerMap = new Map<string, string | null>();
  (assessments || []).forEach((a: any) => {
    if (a.student_id && !learnerMap.has(a.student_id)) {
      learnerMap.set(a.student_id, a.student?.full_name || null);
    }
  });

  return Array.from(learnerMap.entries()).map(([id, name]) => ({ id, name }));
}

/**
 * Get EPA summary for a learner (reuse from learner-rules)
 */
async function getLearnerEPASummary(learnerId: string): Promise<
  Array<{
    epa_code: string;
    current_level: number;
    risk_flag: boolean;
    plateau_flag: boolean;
  }>
> {
  try {
    const { data, error } = await supabase.rpc('compute_learner_epa_summary', {
      p_learner_id: learnerId,
      p_lookback_days: 180,
    });

    if (error) {
      logger.warn('Error computing EPA summary, using fallback', error);
      return [];
    }

    return (data || []).map((e: any) => ({
      epa_code: e.epa_code,
      current_level: e.current_level,
      risk_flag: e.risk_flag,
      plateau_flag: e.plateau_flag,
    }));
  } catch (error) {
    logger.error('Unexpected error computing EPA summary', error);
    return [];
  }
}

/**
 * Get EPA title from code
 */
async function getEPATitle(epaCode: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('epas')
      .select('title, code')
      .eq('code', epaCode)
      .eq('status', 'active')
      .limit(1)
      .single();

    if (error || !data) {
      return `EPA ${epaCode}`;
    }

    return data.title || `EPA ${epaCode}`;
  } catch (error) {
    return `EPA ${epaCode}`;
  }
}

/**
 * Analyze feedback quality for supervisor
 */
async function analyzeFeedbackQuality(
  supervisorId: string,
  months: number = 6
): Promise<FeedbackQuality> {
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - months);

  try {
    const { data: scores, error } = await supabase
      .from('feedback_quality_scores')
      .select(
        'overall_score, clarity_score, specificity_score, actionability_score, balance_score, learner_engagement_score, tone_professionalism_score, used_ai_assistant'
      )
      .eq('supervisor_id', supervisorId)
      .gte('scored_at', cutoffDate.toISOString());

    if (error) {
      logger.warn('Error fetching feedback quality scores', error);
      return {
        avg_overall_score: null,
        strengths: [],
        improvement_areas: [],
        ai_usage_rate: null,
      };
    }

    if (!scores || scores.length === 0) {
      return {
        avg_overall_score: null,
        strengths: [],
        improvement_areas: [],
        ai_usage_rate: null,
      };
    }

    // Compute averages
    const avgOverall =
      scores.reduce((sum, s) => sum + (s.overall_score || 0), 0) / scores.length;

    const avgClarity =
      scores.reduce((sum, s) => sum + (s.clarity_score || 0), 0) / scores.length;
    const avgSpecificity =
      scores.reduce((sum, s) => sum + (s.specificity_score || 0), 0) / scores.length;
    const avgActionability =
      scores.reduce((sum, s) => sum + (s.actionability_score || 0), 0) / scores.length;
    const avgBalance =
      scores.reduce((sum, s) => sum + (s.balance_score || 0), 0) / scores.length;
    const avgEngagement =
      scores.reduce((sum, s) => sum + (s.learner_engagement_score || 0), 0) / scores.length;
    const avgTone =
      scores.reduce((sum, s) => sum + (s.tone_professionalism_score || 0), 0) / scores.length;

    // Identify strengths (≥3) and improvement areas (≤2)
    const strengths: string[] = [];
    const improvementAreas: string[] = [];

    if (avgClarity >= 3) strengths.push('clarity');
    else if (avgClarity <= 2) improvementAreas.push('clarity');

    if (avgSpecificity >= 3) strengths.push('specificity');
    else if (avgSpecificity <= 2) improvementAreas.push('specificity');

    if (avgActionability >= 3) strengths.push('actionability');
    else if (avgActionability <= 2) improvementAreas.push('actionability');

    if (avgBalance >= 3) strengths.push('balanced tone');
    else if (avgBalance <= 2) improvementAreas.push('balanced tone');

    if (avgEngagement >= 3) strengths.push('inviting learner reflection');
    else if (avgEngagement <= 2) improvementAreas.push('inviting learner reflection');

    if (avgTone >= 3) strengths.push('professional tone');
    else if (avgTone <= 2) improvementAreas.push('professional tone');

    // Compute AI usage rate
    const aiUsageCount = scores.filter((s) => s.used_ai_assistant).length;
    const aiUsageRate = scores.length > 0 ? aiUsageCount / scores.length : null;

    return {
      avg_overall_score: avgOverall,
      strengths,
      improvement_areas: improvementAreas,
      ai_usage_rate: aiUsageRate,
    };
  } catch (error) {
    logger.error('Error analyzing feedback quality', error);
    return {
      avg_overall_score: null,
      strengths: [],
      improvement_areas: [],
      ai_usage_rate: null,
    };
  }
}

/**
 * Get CME teaching snapshot
 */
async function getCMETeachingSnapshot(supervisorId: string): Promise<CMETeachingSnapshot> {
  const yearStart = new Date();
  yearStart.setMonth(0, 1);
  yearStart.setHours(0, 0, 0, 0);

  try {
    const { data: sessions, error } = await supabase
      .from('supervisor_cme_sessions')
      .select('minutes')
      .eq('supervisor_id', supervisorId)
      .gte('session_date', yearStart.toISOString().split('T')[0]);

    if (error) {
      logger.warn('Error fetching CME sessions', error);
      return {
        total_cme_hours_year_to_date: 0,
        sessions_count_year_to_date: 0,
      };
    }

    const totalMinutes = (sessions || []).reduce((sum, s) => sum + (s.minutes || 0), 0);
    const totalHours = totalMinutes / 60;

    return {
      total_cme_hours_year_to_date: totalHours,
      sessions_count_year_to_date: sessions?.length || 0,
    };
  } catch (error) {
    logger.error('Error computing CME teaching snapshot', error);
    return {
      total_cme_hours_year_to_date: 0,
      sessions_count_year_to_date: 0,
    };
  }
}

/**
 * Generate supervisor personalization summary
 */
export async function generateSupervisorPersonalizationSummary(
  supervisorId: string
): Promise<SupervisorPersonalizationSummary> {
  try {
    // Step 1: Get supervised learners
    const learners = await getSupervisedLearners(supervisorId, 12);

    // Step 2: Identify learners of interest (with risk/plateau flags)
    const learnersOfInterest: LearnerOfInterest[] = [];

    for (const learner of learners) {
      const epaSummary = await getLearnerEPASummary(learner.id);
      const flaggedEPAs = epaSummary.filter((e) => e.risk_flag || e.plateau_flag);

      if (flaggedEPAs.length > 0) {
        // Get benchmark data and build key EPAs
        const keyEPAs = await Promise.all(
          flaggedEPAs.slice(0, 3).map(async (epa) => {
            const benchmark = await getBenchmarkFor('current_cohort', {
              learnerId: learner.id,
              epaCode: epa.epa_code,
            });

            const benchmarkDelta =
              benchmark && benchmark.expectedLevel !== null
                ? epa.current_level - benchmark.expectedLevel
                : null;

            const epaTitle = await getEPATitle(epa.epa_code);

            return {
              epa_code: epa.epa_code,
              epa_title: epaTitle,
              risk_flag: epa.risk_flag,
              plateau_flag: epa.plateau_flag,
              benchmark_delta: benchmarkDelta,
            };
          })
        );

        learnersOfInterest.push({
          learner_id: learner.id,
          learner_name: learner.name,
          key_epas: keyEPAs,
        });
      }
    }

    // Step 3: Analyze feedback quality
    const feedbackQuality = await analyzeFeedbackQuality(supervisorId, 6);

    // Step 4: Get CME teaching snapshot
    const cmeSnapshot = await getCMETeachingSnapshot(supervisorId);

    // Step 5: Derive coaching tags
    const coachingTags: string[] = [];

    // Low specificity → educator behaviors
    if (feedbackQuality.improvement_areas.includes('specificity')) {
      coachingTags.push('theme:educator_behaviours');
      coachingTags.push('topic:feedback_specificity');
    }

    // Many learners with plateaus → coaching strategies
    if (learnersOfInterest.length > 2) {
      coachingTags.push('theme:feedback_literacy_action');
      coachingTags.push('topic:coaching_strategies');
    }

    // Low AI usage but low quality → nudge to use smart feedback
    if (
      feedbackQuality.ai_usage_rate !== null &&
      feedbackQuality.ai_usage_rate < 0.3 &&
      feedbackQuality.avg_overall_score !== null &&
      feedbackQuality.avg_overall_score < 70
    ) {
      coachingTags.push('topic:smart_feedback_usage');
    }

    // Low engagement score → invite reflection
    if (feedbackQuality.improvement_areas.includes('inviting learner reflection')) {
      coachingTags.push('theme:feedback_literacy_judgement');
      coachingTags.push('skill:ask_for_feedback');
    }

    return {
      learners_of_interest: learnersOfInterest,
      feedback_quality: feedbackQuality,
      cme_teaching_snapshot: cmeSnapshot,
      coaching_tags: [...new Set(coachingTags)], // Remove duplicates
    };
  } catch (error) {
    logger.error('Error generating supervisor personalization summary', error);
    // Return empty summary on error
    return {
      learners_of_interest: [],
      feedback_quality: {
        avg_overall_score: null,
        strengths: [],
        improvement_areas: [],
        ai_usage_rate: null,
      },
      cme_teaching_snapshot: {
        total_cme_hours_year_to_date: 0,
        sessions_count_year_to_date: 0,
      },
      coaching_tags: [],
    };
  }
}





