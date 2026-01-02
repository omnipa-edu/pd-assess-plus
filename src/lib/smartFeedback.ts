import { supabase } from "@/integrations/supabase/client";

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
      // Check for HTTP errors (500, etc.)
      if (error.message?.includes('non-2xx status code') || error.message?.includes('500')) {
        // Try to extract error message from the response
        let errorMessage = 'The feedback analyzer encountered an error. This usually means the OpenAI API key is not configured. Please contact your administrator to set the OPENAI_API_KEY secret in Supabase Edge Functions.';
        
        // Try to get error details from various possible locations
        const errorContext = (error as any).context;
        if (errorContext?.body?.error) {
          errorMessage = errorContext.body.error;
        } else if (errorContext?.message) {
          errorMessage = errorContext.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        // Provide helpful guidance for common issues
        if (errorMessage.includes('OPENAI_API_KEY') || errorMessage.includes('not configured')) {
          errorMessage = 'OpenAI API key is not configured in Supabase Edge Functions. Please contact your administrator to set the OPENAI_API_KEY secret in Project Settings → Edge Functions → Secrets.';
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

