import { supabase } from "@/integrations/supabase/client";

import { getCompetencyFramework } from "@/lib/ai/feedbackChain/framework";
import { parseFunctionsInvokeError } from "@/lib/supabase/parseFunctionsInvokeError";
import { extractRunId, runFeedbackAIChain } from "@/lib/ai/feedbackChain/run";
import type { FeedbackAIChainResult } from "@/lib/ai/feedbackChain/types";

/**
 * Interface for vague phrase detection and suggestions
 */
export interface VaguePhrase {
  phrase: string;
  suggestion: string;
}

/**
 * Interface for the complete smart feedback analysis result
 */
export interface SmartFeedbackResult {
  improved_feedback: string;
  vague_phrases: VaguePhrase[];
  coaching_prompts: string[];
  tone_summary: string;
  tone_suggestions: string;
  run_id?: string;
}

/**
 * Optional context to provide to the feedback analyzer
 */
export interface FeedbackContext {
  role?: string;
  discipline?: string;
  epaName?: string;
  encounterType?: string;
  learnerLevel?: string;
  learner?: {
    level: string;
    role: string;
    specialty: string;
  };
  context?: {
    setting: string;
    case_type: string;
    complexity: string;
    risk_level: string;
  };
  rawFeedbackRating?: number | null;
  supervisorId?: string;
  studentId?: string;
  assessmentId?: string | null;
  learnerReflection?: string | null;
  priorGoals?: string[];
}

/**
 * Analyzes supervisor feedback using AI to provide suggestions for improvement
 * 
 * @param feedbackText - The supervisor's current feedback text
 * @param context - Optional context about the assessment (EPA name, learner level, etc.)
 * @returns Promise resolving to SmartFeedbackResult with suggestions
 * @throws Error if the API call fails
 */
export async function analyzeSupervisorFeedback(
  feedbackText: string,
  context?: FeedbackContext
): Promise<SmartFeedbackResult> {
  if (!feedbackText || feedbackText.trim().length === 0) {
    throw new Error('Feedback text is required');
  }

  try {
    const hasChainContext = Boolean(
      context?.learner &&
      context?.context &&
      context?.supervisorId &&
      context?.studentId
    );

    if (hasChainContext && context?.learner && context?.context) {
      try {
        const competencyFramework = await getCompetencyFramework(context.learner.specialty);
        const inputs = {
          learner: context.learner,
          context: context.context,
          competency_framework: competencyFramework,
          raw_feedback: [
            {
              rater_role: context.role || "supervisor",
              comment: feedbackText.trim(),
              rating: context.rawFeedbackRating ?? null,
              timestamp: new Date().toISOString(),
            },
          ],
          learner_reflection: context.learnerReflection ?? null,
          prior_goals: context.priorGoals ?? [],
        };

        const chainResult = await runFeedbackAIChain(inputs, {
          supervisorId: context.supervisorId,
          studentId: context.studentId,
          assessmentId: context.assessmentId ?? null,
        });

        return mapChainResultToSmartFeedback(chainResult, feedbackText.trim());
      } catch (chainError) {
        console.warn("Feedback AI chain failed, falling back", chainError);
      }
    }

    const { data, error } = await supabase.functions.invoke('analyze-feedback', {
      body: {
        feedbackText: feedbackText.trim(),
        context: context || {},
      },
    });

    // Check for error in data first (sometimes Supabase returns error in data for 500 responses)
    if (data?.error) {
      let errorMessage = data.error;
      
      // Provide helpful guidance for common issues
      if (errorMessage.includes('OPENAI_API_KEY') || errorMessage.includes('not configured')) {
        errorMessage = 'OpenAI API key is not configured in Supabase Edge Functions. Please contact your administrator to set the OPENAI_API_KEY secret in Project Settings → Edge Functions → Secrets.';
      }
      
      throw new Error(errorMessage);
    }

    if (error) {
      const fromBody = await parseFunctionsInvokeError(error);

      // Check for HTTP errors (500, etc.)
      if (
        error.message?.includes("non-2xx status code") ||
        error.message?.includes("500") ||
        fromBody
      ) {
        let errorMessage =
          fromBody ||
          "The feedback analyzer encountered an error. This usually means the OpenAI API key is not configured. Please contact your administrator to set the OPENAI_API_KEY secret in Supabase Edge Functions.";

        if (!fromBody && error.message) {
          errorMessage = error.message;
        }

        if (errorMessage.includes("OPENAI_API_KEY") || errorMessage.includes("not configured")) {
          errorMessage =
            "OpenAI API key is not configured in Supabase Edge Functions. Please contact your administrator to set the OPENAI_API_KEY secret in Project Settings → Edge Functions → Secrets.";
        }

        throw new Error(errorMessage);
      }
      throw error;
    }

    if (!data) {
      throw new Error('No response from feedback analyzer');
    }

    // Validate the response structure
    const result: SmartFeedbackResult = {
      improved_feedback: data.improved_feedback || feedbackText,
      vague_phrases: Array.isArray(data.vague_phrases) ? data.vague_phrases : [],
      coaching_prompts: Array.isArray(data.coaching_prompts) ? data.coaching_prompts : [],
      tone_summary: data.tone_summary || 'Unable to analyze tone',
      tone_suggestions: data.tone_suggestions || 'No specific suggestions',
    };

    return result;
  } catch (error: any) {
    console.error('Error analyzing feedback:', error);
    
    // Check if it's a CORS or function not found error
    const errorMessage = error?.message || '';
    const isFunctionNotFound = 
      errorMessage.includes('Failed to send a request to the Edge Function') ||
      errorMessage.includes('CORS') ||
      errorMessage.includes('ERR_FAILED') ||
      error?.code === 'FUNCTION_NOT_FOUND';
    
    if (isFunctionNotFound) {
      throw new Error(
        'Feedback improvement feature is not available. The Edge Function may not be deployed. ' +
        'Please contact your administrator or try again later.'
      );
    }
    
    throw error instanceof Error 
      ? error 
      : new Error('Failed to analyze feedback. Please try again.');
  }
}

function mapChainResultToSmartFeedback(
  chainResult: FeedbackAIChainResult,
  fallbackText: string
): SmartFeedbackResult {
  const rewrittenExamples = chainResult.final.rater_coaching.rewritten_examples || [];
  const improved = rewrittenExamples[0]?.after || fallbackText;
  const vaguePhrases = rewrittenExamples.map((example) => ({
    phrase: example.before,
    suggestion: example.after,
  }));

  return {
    improved_feedback: improved,
    vague_phrases: vaguePhrases,
    coaching_prompts: chainResult.final.rater_coaching.two_rater_tips || [],
    tone_summary:
      chainResult.rubric_eval.justifications?.tone_psych_safety ||
      chainResult.final.rater_coaching.quality_risks.join(" "),
    tone_suggestions: chainResult.rubric_eval.required_fixes?.join(" ") || "",
    run_id: extractRunId(chainResult) || undefined,
  };
}

/**
 * Checks if the Smart Feedback Assistant feature is enabled
 * 
 * @returns boolean indicating if the feature is enabled
 */
export function isSmartFeedbackEnabled(): boolean {
  // Check environment variable (defaults to true for development)
  const envValue = import.meta.env.VITE_ENABLE_SMART_FEEDBACK_ASSISTANT;
  
  // If explicitly set to 'false' or '0', disable
  if (envValue === 'false' || envValue === '0') {
    return false;
  }
  
  // Default to enabled (can be overridden with 'true' or '1')
  return envValue !== undefined ? envValue === 'true' || envValue === '1' : true;
}

