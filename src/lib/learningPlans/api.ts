/**
 * Learning Plan API Functions
 * Handles recommendation logging, status updates, and outcome tracking
 */

import { supabase } from '@/integrations/supabase/client';

import { logger } from '../logger';
import { getPersonalizedLearningPlan, type ScoredAction } from './engine';
import { buildLearnerStateSnapshot, type LearnerStateSnapshot } from './features';

/**
 * Get personalized learning plan with logging
 */
export async function getPersonalizedLearningPlanWithLogging(
  learnerId: string,
  limit: number = 3,
  modelName: string = 'rules_v1'
): Promise<ScoredAction[]> {
  try {
    // Build state snapshot for logging
    const state = await buildLearnerStateSnapshot(learnerId);

    // Get recommendations
    const recommendations = await getPersonalizedLearningPlan(learnerId, limit, modelName);

    // Log each recommendation
    const recommendationIds: string[] = [];
    for (let i = 0; i < recommendations.length; i++) {
      const rec = recommendations[i];
      const epaState = rec.epaCode ? state.epas[rec.epaCode] : null;

      // Build compact recommendation context (no PHI, only derived metrics)
      const recommendationContext = {
        epa_code: rec.epaCode,
        epa_id: rec.epaId,
        current_level: epaState?.currentLevel ?? null,
        risk_flag: epaState?.riskFlag ?? false,
        plateau_flag: epaState?.plateauFlag ?? false,
        benchmark_delta: epaState?.benchmarkDelta ?? null,
        exposures_last_30: epaState?.exposuresLast30 ?? 0,
        exposures_last_90: epaState?.exposuresLast90 ?? 0,
        feedback_quality_summary: epaState
          ? {
              avg_overall: epaState.feedbackQuality.avgOverallScore,
              clarity: epaState.feedbackQuality.clarity,
              specificity: epaState.feedbackQuality.specificity,
            }
          : null,
        learner_meta: {
          program: epaState?.learnerMeta.programId ?? null,
          cohort_id: epaState?.learnerMeta.cohortId ?? null,
          discipline_id: epaState?.learnerMeta.disciplineId ?? null,
          time_from_start_days: epaState?.learnerMeta.timeFromStartDays ?? null,
          level_label: epaState?.learnerMeta.levelLabel ?? null,
        },
      };

      // Insert recommendation log
      const { data: recData, error: recError } = await supabase
        .from('learning_plan_recommendations')
        .insert({
          learner_id: learnerId,
          epa_id: rec.epaId,
          action_id: rec.action.id,
          recommendation_context: recommendationContext,
          ranking_score: rec.score,
          rank_position: i + 1,
          source_model: modelName,
        })
        .select('id')
        .single();

      if (recError) {
        logger.error('Error logging recommendation', recError);
      } else if (recData) {
        recommendationIds.push(recData.id);

        // Sync to learner_action_status as 'pending'
        const { error: statusError } = await supabase
          .from('learner_action_status')
          .upsert(
            {
              learner_id: learnerId,
              action_id: rec.action.id,
              epa_id: rec.epaId,
              status: 'pending',
            },
            {
              onConflict: 'learner_id,action_id,epa_id',
            }
          );

        if (statusError) {
          logger.warn('Error syncing to learner_action_status', statusError);
        }
      }
    }

    return recommendations;
  } catch (error) {
    logger.error('Error getting personalized learning plan with logging', error);
    throw error;
  }
}

/**
 * Mark action as viewed
 */
export async function markActionViewed(recId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('learning_plan_recommendations')
      .update({ viewed_at: new Date().toISOString() })
      .eq('id', recId);

    if (error) {
      logger.error('Error marking action as viewed', error);
      throw error;
    }
  } catch (error) {
    logger.error('Error in markActionViewed', error);
    throw error;
  }
}

/**
 * Mark action as accepted
 */
export async function markActionAccepted(recId: string): Promise<void> {
  try {
    const { data: rec, error: fetchError } = await supabase
      .from('learning_plan_recommendations')
      .select('learner_id, action_id, epa_id')
      .eq('id', recId)
      .single();

    if (fetchError || !rec) {
      throw new Error('Recommendation not found');
    }

    // Update recommendation
    const { error: updateError } = await supabase
      .from('learning_plan_recommendations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', recId);

    if (updateError) {
      logger.error('Error marking action as accepted', updateError);
      throw updateError;
    }

    // Update status to in_progress
    const { error: statusError } = await supabase
      .from('learner_action_status')
      .update({ status: 'in_progress', updated_at: new Date().toISOString() })
      .eq('learner_id', rec.learner_id)
      .eq('action_id', rec.action_id)
      .eq('epa_id', rec.epa_id);

    if (statusError) {
      logger.warn('Error updating learner_action_status', statusError);
    }
  } catch (error) {
    logger.error('Error in markActionAccepted', error);
    throw error;
  }
}

/**
 * Mark action as completed
 */
export async function markActionCompleted(recId: string, notes?: string): Promise<void> {
  try {
    const { data: rec, error: fetchError } = await supabase
      .from('learning_plan_recommendations')
      .select('learner_id, action_id, epa_id')
      .eq('id', recId)
      .single();

    if (fetchError || !rec) {
      throw new Error('Recommendation not found');
    }

    // Update recommendation
    const { error: updateError } = await supabase
      .from('learning_plan_recommendations')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', recId);

    if (updateError) {
      logger.error('Error marking action as completed', updateError);
      throw updateError;
    }

    // Update status to completed
    const { error: statusError } = await supabase
      .from('learner_action_status')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString(),
        notes: notes || null,
      })
      .eq('learner_id', rec.learner_id)
      .eq('action_id', rec.action_id)
      .eq('epa_id', rec.epa_id);

    if (statusError) {
      logger.warn('Error updating learner_action_status', statusError);
    }
  } catch (error) {
    logger.error('Error in markActionCompleted', error);
    throw error;
  }
}

/**
 * Mark action as dismissed
 */
export async function markActionDismissed(recId: string, reason?: string): Promise<void> {
  try {
    const { data: rec, error: fetchError } = await supabase
      .from('learning_plan_recommendations')
      .select('learner_id, action_id, epa_id')
      .eq('id', recId)
      .single();

    if (fetchError || !rec) {
      throw new Error('Recommendation not found');
    }

    // Update recommendation with user feedback
    const userFeedback = reason ? { reason, dismissed_at: new Date().toISOString() } : null;

    const { error: updateError } = await supabase
      .from('learning_plan_recommendations')
      .update({
        dismissed_at: new Date().toISOString(),
        user_feedback: userFeedback,
      })
      .eq('id', recId);

    if (updateError) {
      logger.error('Error marking action as dismissed', updateError);
      throw updateError;
    }

    // Update status to dismissed
    const { error: statusError } = await supabase
      .from('learner_action_status')
      .update({
        status: 'dismissed',
        updated_at: new Date().toISOString(),
        notes: reason || null,
      })
      .eq('learner_id', rec.learner_id)
      .eq('action_id', rec.action_id)
      .eq('epa_id', rec.epa_id);

    if (statusError) {
      logger.warn('Error updating learner_action_status', statusError);
    }
  } catch (error) {
    logger.error('Error in markActionDismissed', error);
    throw error;
  }
}

/**
 * Get recommendation ID for a learner-action-EPA combination
 * (Helper for frontend to find recId when updating status)
 */
export async function getRecommendationId(
  learnerId: string,
  actionId: string,
  epaId: string | null
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('learning_plan_recommendations')
      .select('id')
      .eq('learner_id', learnerId)
      .eq('action_id', actionId)
      .eq('epa_id', epaId)
      .order('recommended_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return data.id;
  } catch (error) {
    logger.warn('Error getting recommendation ID', error);
    return null;
  }
}





