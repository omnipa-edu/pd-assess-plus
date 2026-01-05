/**
 * Learning Plan Recommendation Engine
 * Rule-based scoring with ML-ready interface for future model integration
 */

import { supabase } from '@/integrations/supabase/client';

import { logger } from '../logger';
import { buildLearnerStateSnapshot } from './features';

import type { LearnerStateSnapshot, LearnerEpaState } from './features';

export interface LearningAction {
  id: string;
  code: string;
  label: string;
  description: string;
  epa_id: string | null;
  discipline_id: string | null;
  intensity: number; // 1=low, 2=medium, 3=high
  action_type: string;
  dimension_tags: string[];
  learning_mode_tags: string[];
  prerequisites: Record<string, any>;
  is_active: boolean;
}

export interface CandidateAction {
  action: LearningAction;
  epaId: string | null;
  epaCode: string | null;
  basePriority: number;
}

export interface ScoredAction {
  action: LearningAction;
  epaId: string | null;
  epaCode: string | null;
  score: number;
  reason: string; // Human-readable explanation
}

export interface LearningPlanModel {
  name: string; // e.g., 'rules_v1', 'ml_v1'
  score(
    state: LearnerStateSnapshot,
    candidates: CandidateAction[]
  ): Promise<ScoredAction[]>;
}

/**
 * Check if prerequisites are met for an action given learner state
 */
function checkPrerequisites(
  prerequisites: Record<string, any>,
  epaState: LearnerEpaState | null
): boolean {
  if (!epaState) {
    // For global actions (no EPA), check only non-EPA prerequisites
    if (prerequisites.min_assessments !== undefined) {
      // Would need total assessment count, skip for now
      return true;
    }
    return true;
  }

  // Check min_level / max_level
  if (prerequisites.min_level !== undefined) {
    if (epaState.currentLevel === null || epaState.currentLevel < prerequisites.min_level) {
      return false;
    }
  }
  if (prerequisites.max_level !== undefined) {
    if (epaState.currentLevel !== null && epaState.currentLevel > prerequisites.max_level) {
      return false;
    }
  }

  // Check risk_flag requirement
  if (prerequisites.require_risk_flag === true && !epaState.riskFlag) {
    return false;
  }

  // Check plateau_flag requirement
  if (prerequisites.require_plateau_flag === true && !epaState.plateauFlag) {
    return false;
  }

  // Check exposure requirements
  if (prerequisites.min_exposures_last_30 !== undefined) {
    if (epaState.exposuresLast30 < prerequisites.min_exposures_last_30) {
      return false;
    }
  }
  if (prerequisites.max_exposures_last_30 !== undefined) {
    if (epaState.exposuresLast30 > prerequisites.max_exposures_last_30) {
      return false;
    }
  }

  // Check min_assessments
  if (prerequisites.min_assessments !== undefined) {
    if (epaState.observationsCount < prerequisites.min_assessments) {
      return false;
    }
  }

  // Check require_recent_assessment
  if (prerequisites.require_recent_assessment === true) {
    if (epaState.observationsCount === 0) {
      return false;
    }
  }

  // Check require_benchmark_data
  if (prerequisites.require_benchmark_data === true) {
    if (epaState.benchmarkDelta === null) {
      return false;
    }
  }

  return true;
}

/**
 * Get candidate actions for a learner based on their state
 */
export async function getCandidateActionsForLearner(
  state: LearnerStateSnapshot
): Promise<CandidateAction[]> {
  try {
    // Fetch all active learning actions
    const { data: actions, error } = await supabase
      .from('learning_actions')
      .select('*')
      .eq('is_active', true);

    if (error) {
      logger.error('Error fetching learning actions', error);
      return [];
    }

    const candidates: CandidateAction[] = [];

    // For each EPA in state, find matching actions
    for (const [epaCode, epaState] of Object.entries(state.epas)) {
      for (const action of actions || []) {
        // Action applies if:
        // 1. action.epa_id matches epaState.epaId, OR
        // 2. action.epa_id is null (global action)
        const appliesToEpa =
          action.epa_id === null || (epaState.epaId !== null && action.epa_id === epaState.epaId);

        if (!appliesToEpa) continue;

        // Check prerequisites
        if (!checkPrerequisites(action.prerequisites, epaState)) {
          continue;
        }

        // Set base priority based on EPA flags
        let basePriority = 1;
        if (epaState.riskFlag) {
          basePriority = 10; // Highest priority for risk EPAs
        } else if (epaState.plateauFlag) {
          basePriority = 7; // High priority for plateau EPAs
        } else if (epaState.benchmarkDelta !== null && epaState.benchmarkDelta < -0.5) {
          basePriority = 5; // Medium-high for below benchmark
        } else if (
          epaState.currentLevel !== null &&
          epaState.targetLevel !== null &&
          epaState.currentLevel < epaState.targetLevel
        ) {
          basePriority = 3; // Medium for below target
        }

        candidates.push({
          action: action as LearningAction,
          epaId: epaState.epaId,
          epaCode: epaCode, // Use the epaCode from the state
          basePriority,
        });
      }
    }

    // Also add global actions (no EPA)
    for (const action of actions || []) {
      if (action.epa_id !== null) continue; // Skip EPA-specific actions

      // Check global prerequisites
      if (!checkPrerequisites(action.prerequisites, null)) {
        continue;
      }

      // Global actions get lower base priority
      candidates.push({
        action: action as LearningAction,
        epaId: null,
        epaCode: null,
        basePriority: 2,
      });
    }

    // Deduplicate by action.id + epaId
    const seen = new Set<string>();
    return candidates.filter((c) => {
      const key = `${c.action.id}-${c.epaId || 'global'}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  } catch (error) {
    logger.error('Error getting candidate actions', error);
    return [];
  }
}

/**
 * Score candidate actions using rule-based logic
 */
export function scoreCandidateActions(
  state: LearnerStateSnapshot,
  candidates: CandidateAction[]
): ScoredAction[] {
  const scored: ScoredAction[] = [];

  for (const candidate of candidates) {
    const { action, epaId, epaCode, basePriority } = candidate;
    const epaState = epaCode ? state.epas[epaCode] : null;

    let score = basePriority;
    const reasons: string[] = [];

    // Risk flag boost
    if (epaState?.riskFlag) {
      score += 50;
      reasons.push('EPA is flagged as high risk');
    }

    // Plateau flag boost
    if (epaState?.plateauFlag) {
      score += 30;
      reasons.push('EPA shows plateau in progress');
    }

    // Benchmark delta boost (below cohort)
    if (epaState && epaState.benchmarkDelta !== null && epaState.benchmarkDelta < -0.5) {
      score += 25;
      reasons.push(`Below cohort benchmark by ${epaState.benchmarkDelta.toFixed(1)}`);
    }

    // Dimension tag alignment with feedback quality weaknesses
    if (epaState) {
      const weakDimensions: string[] = [];
      if (epaState.feedbackQuality.clarity !== null && epaState.feedbackQuality.clarity < 2.5) {
        weakDimensions.push('communication');
      }
      if (epaState.feedbackQuality.specificity !== null && epaState.feedbackQuality.specificity < 2.5) {
        weakDimensions.push('communication');
      }
      if (epaState.feedbackQuality.actionability !== null && epaState.feedbackQuality.actionability < 2.5) {
        weakDimensions.push('clinical_reasoning');
      }

      const matchingDimensions = action.dimension_tags.filter((tag) =>
        weakDimensions.includes(tag)
      );
      if (matchingDimensions.length > 0) {
        score += 15 * matchingDimensions.length;
        reasons.push(`Addresses weak dimensions: ${matchingDimensions.join(', ')}`);
      }
    }

    // Penalize if learner already has high exposure and is at/above target
    if (
      epaState &&
      epaState.exposuresLast30 >= 5 &&
      epaState.currentLevel !== null &&
      epaState.targetLevel !== null &&
      epaState.currentLevel >= epaState.targetLevel
    ) {
      score -= 20;
      reasons.push('Already has sufficient exposure and is at target level');
    }

    // Penalize high-intensity actions if learner has many active high-intensity actions
    // (Would need to check learner_action_status, simplified for now)
    if (action.intensity >= 3) {
      score -= 5; // Small penalty for high intensity
    }

    // Boost actions that match preferred setting (if specified in prerequisites)
    if (epaState && action.prerequisites.preferred_setting) {
      const preferredSetting = action.prerequisites.preferred_setting;
      const settingDist = epaState.settingDistribution[preferredSetting] || 0;
      if (settingDist < 0.3) {
        // Low exposure in preferred setting
        score += 10;
        reasons.push(`Increases exposure in ${preferredSetting}`);
      }
    }

    // Boost actions that increase supervisor diversity
    if (action.code.includes('SUPERVISOR_DIVERSITY') || action.code.includes('DIVERSITY')) {
      if (epaState) {
        const supervisorCount = Object.keys(epaState.supervisorDistribution).length;
        if (supervisorCount < 3) {
          score += 15;
          reasons.push('Increases supervisor diversity');
        }
      }
    }

    // Ensure score is non-negative
    score = Math.max(0, score);

    scored.push({
      action,
      epaId,
      epaCode,
      score,
      reason: reasons.length > 0 ? reasons.join('; ') : 'Recommended based on your current progress',
    });
  }

  // Sort by score descending
  return scored.sort((a, b) => b.score - a.score);
}

/**
 * Rules-based model implementation
 */
export class RulesModel implements LearningPlanModel {
  name = 'rules_v1';

  async score(
    state: LearnerStateSnapshot,
    candidates: CandidateAction[]
  ): Promise<ScoredAction[]> {
    return scoreCandidateActions(state, candidates);
  }
}

/**
 * Get personalized learning plan for a learner
 */
export async function getPersonalizedLearningPlan(
  learnerId: string,
  limit: number = 3,
  modelName: string = 'rules_v1'
): Promise<ScoredAction[]> {
  try {
    // Build learner state snapshot
    const state = await buildLearnerStateSnapshot(learnerId);

    // Get candidate actions
    const candidates = await getCandidateActionsForLearner(state);

    if (candidates.length === 0) {
      return [];
    }

    // Score using selected model
    let model: LearningPlanModel;
    if (modelName === 'rules_v1') {
      model = new RulesModel();
    } else {
      logger.warn('Unknown model, falling back to rules_v1', { modelName });
      model = new RulesModel();
    }

    const scored = await model.score(state, candidates);

    // Take top N
    return scored.slice(0, limit);
  } catch (error) {
    logger.error('Error getting personalized learning plan', error);
    throw error;
  }
}

