import { supabase } from '@/integrations/supabase/client';

export interface FeedbackQualityScores {
  overall_score: number; // 0-100
  clarity_score: number; // 0-4
  specificity_score: number; // 0-4
  actionability_score: number; // 0-4
  balance_score: number; // 0-4
  learner_engagement_score: number; // 0-4
  tone_professionalism_score: number; // 0-4
  scoring_rationale?: {
    clarity?: string;
    specificity?: string;
    actionability?: string;
    balance?: string;
    learner_engagement?: string;
    tone?: string;
  };
}

export interface ScoreFeedbackOptions {
  feedbackText: string;
  assessmentType: 'epa' | 'direct_observation' | 'narrative';
  context?: {
    epaName?: string;
    encounterType?: string;
    learnerLevel?: string;
  };
}

/**
 * Score feedback using the LLM-based scoring Edge Function
 */
export async function scoreFeedback(
  options: ScoreFeedbackOptions
): Promise<FeedbackQualityScores> {
  const { feedbackText, assessmentType, context } = options;

  if (!feedbackText || feedbackText.trim().length === 0) {
    throw new Error('Feedback text is required');
  }

  try {
    const { data, error } = await supabase.functions.invoke('score-feedback', {
      body: {
        feedbackText: feedbackText.trim(),
        assessmentType,
        context: context || {},
      },
    });

    if (error) {
      // Check for HTTP errors (500, etc.)
      if (error.message?.includes('non-2xx status code') || error.message?.includes('500')) {
        let errorMessage = 'The feedback scorer encountered an error. This usually means the OpenAI API key is not configured.';
        
        const errorContext = (error as any).context;
        if (errorContext?.body?.error) {
          errorMessage = errorContext.body.error;
        } else if (errorContext?.message) {
          errorMessage = errorContext.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        if (errorMessage.includes('OPENAI_API_KEY') || errorMessage.includes('not configured')) {
          errorMessage = 'OpenAI API key is not configured in Supabase Edge Functions. Please contact your administrator to set the OPENAI_API_KEY secret in Project Settings → Edge Functions → Secrets.';
        }

        throw new Error(errorMessage);
      }
      throw error;
    }

    if (!data) {
      throw new Error('No response from feedback scorer');
    }

    // Check for error in data (sometimes Supabase returns error in data for 500 responses)
    if (data?.error) {
      throw new Error(data.error);
    }

    // Validate the response structure
    const result: FeedbackQualityScores = {
      overall_score: data.overall_score ?? 0,
      clarity_score: data.clarity_score ?? 0,
      specificity_score: data.specificity_score ?? 0,
      actionability_score: data.actionability_score ?? 0,
      balance_score: data.balance_score ?? 0,
      learner_engagement_score: data.learner_engagement_score ?? 0,
      tone_professionalism_score: data.tone_professionalism_score ?? 0,
      scoring_rationale: data.scoring_rationale || {},
    };

    return result;
  } catch (error: any) {
    console.error('Error scoring feedback:', error);

    // Check if it's a CORS or function not found error
    const errorMessage = error?.message || '';
    const isFunctionNotFound =
      errorMessage.includes('Failed to send a request to the Edge Function') ||
      errorMessage.includes('CORS') ||
      errorMessage.includes('ERR_FAILED') ||
      error?.code === 'FUNCTION_NOT_FOUND';

    if (isFunctionNotFound) {
      throw new Error(
        'Feedback scoring feature is not available. The Edge Function may not be deployed. ' +
        'Please contact your administrator or try again later.'
      );
    }

    throw error instanceof Error
      ? error
      : new Error('Failed to score feedback. Please try again.');
  }
}

/**
 * Save feedback quality scores to the database
 */
export async function saveFeedbackQualityScore(
  assessmentId: string,
  assessmentType: 'epa' | 'direct_observation' | 'narrative',
  supervisorId: string,
  scores: FeedbackQualityScores,
  usedAIAssistant: boolean
): Promise<void> {
  const { error } = await supabase.rpc('upsert_feedback_quality_score', {
    p_assessment_id: assessmentId,
    p_assessment_type: assessmentType,
    p_supervisor_id: supervisorId,
    p_overall_score: scores.overall_score,
    p_clarity_score: scores.clarity_score,
    p_specificity_score: scores.specificity_score,
    p_actionability_score: scores.actionability_score,
    p_balance_score: scores.balance_score,
    p_learner_engagement_score: scores.learner_engagement_score,
    p_tone_professionalism_score: scores.tone_professionalism_score,
    p_used_ai_assistant: usedAIAssistant,
    p_scoring_rationale: scores.scoring_rationale || null,
  });

  if (error) {
    console.error('Error saving feedback quality score:', error);
    throw error;
  }
}

