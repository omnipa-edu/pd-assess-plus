/**
 * Personalization Summary Generation
 * Main functions to generate and cache personalization summaries
 */

import { supabase } from '@/integrations/supabase/client';

import { logger } from '../logger';
import { generateLearnerPersonalizationSummary } from './learner-rules';
import { generateSupervisorPersonalizationSummary } from './supervisor-rules';

import type {
  LearnerPersonalizationSummary,
  SupervisorPersonalizationSummary,
} from './types';

/**
 * Generate and save learner personalization summary
 */
export async function generateAndSaveLearnerSummary(
  learnerId: string
): Promise<LearnerPersonalizationSummary | null> {
  try {
    // Get learner context
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, cohort_id, specialty_id')
      .eq('id', learnerId)
      .single();

    if (profileError || !profile) {
      logger.error('Error fetching learner profile', profileError);
      return null;
    }

    // Generate summary
    const summary = await generateLearnerPersonalizationSummary(
      learnerId,
      profile.specialty_id || undefined,
      profile.cohort_id || undefined
    );

    // Upsert into database
    const { error: upsertError } = await supabase
      .from('learner_personalization_summaries')
      .upsert(
        {
          learner_id: learnerId,
          specialty_id: profile.specialty_id || null,
          cohort_id: profile.cohort_id || null,
          summary: summary as any,
        },
        {
          onConflict: 'learner_id',
        }
      );

    if (upsertError) {
      logger.error('Error saving learner personalization summary', upsertError);
      return summary; // Return summary even if save fails
    }

    return summary;
  } catch (error) {
    logger.error('Unexpected error generating learner summary', error);
    return null;
  }
}

/**
 * Generate and save supervisor personalization summary
 */
export async function generateAndSaveSupervisorSummary(
  supervisorId: string
): Promise<SupervisorPersonalizationSummary | null> {
  try {
    // Get supervisor context
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, institution_id, specialty_id')
      .eq('id', supervisorId)
      .single();

    if (profileError || !profile) {
      logger.error('Error fetching supervisor profile', profileError);
      return null;
    }

    // Generate summary
    const summary = await generateSupervisorPersonalizationSummary(supervisorId);

    // Upsert into database
    const { error: upsertError } = await supabase
      .from('supervisor_personalization_summaries')
      .upsert(
        {
          supervisor_id: supervisorId,
          specialty_id: profile.specialty_id || null,
          institution_id: profile.institution_id || null,
          summary: summary as any,
        },
        {
          onConflict: 'supervisor_id',
        }
      );

    if (upsertError) {
      logger.error('Error saving supervisor personalization summary', upsertError);
      return summary; // Return summary even if save fails
    }

    return summary;
  } catch (error) {
    logger.error('Unexpected error generating supervisor summary', error);
    return null;
  }
}

/**
 * Get cached learner personalization summary
 */
export async function getLearnerSummary(
  learnerId: string
): Promise<LearnerPersonalizationSummary | null> {
  try {
    const { data, error } = await supabase
      .from('learner_personalization_summaries')
      .select('summary, generated_at')
      .eq('learner_id', learnerId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found - generate on demand
        return await generateAndSaveLearnerSummary(learnerId);
      }
      logger.error('Error fetching learner summary', error);
      return null;
    }

    return data?.summary as LearnerPersonalizationSummary | null;
  } catch (error) {
    logger.error('Unexpected error fetching learner summary', error);
    return null;
  }
}

/**
 * Get cached supervisor personalization summary
 */
export async function getSupervisorSummary(
  supervisorId: string
): Promise<SupervisorPersonalizationSummary | null> {
  try {
    const { data, error } = await supabase
      .from('supervisor_personalization_summaries')
      .select('summary, generated_at')
      .eq('supervisor_id', supervisorId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found - generate on demand
        return await generateAndSaveSupervisorSummary(supervisorId);
      }
      logger.error('Error fetching supervisor summary', error);
      return null;
    }

    return data?.summary as SupervisorPersonalizationSummary | null;
  } catch (error) {
    logger.error('Unexpected error fetching supervisor summary', error);
    return null;
  }
}

/**
 * Refresh learner summary (force regeneration)
 */
export async function refreshLearnerSummary(learnerId: string): Promise<LearnerPersonalizationSummary | null> {
  return await generateAndSaveLearnerSummary(learnerId);
}

/**
 * Refresh supervisor summary (force regeneration)
 */
export async function refreshSupervisorSummary(supervisorId: string): Promise<SupervisorPersonalizationSummary | null> {
  return await generateAndSaveSupervisorSummary(supervisorId);
}





