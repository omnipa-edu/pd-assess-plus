import { describe, it, expect, vi, beforeEach } from 'vitest';

import { supabase } from '@/integrations/supabase/client';

import { analyzeSupervisorFeedback, isSmartFeedbackEnabled, type SmartFeedbackResult, type FeedbackContext } from '../smartFeedback';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

describe('smartFeedback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('analyzeSupervisorFeedback', () => {
    it('should successfully analyze feedback and return structured result', async () => {
      const mockResult: SmartFeedbackResult = {
        improved_feedback: 'You demonstrated clear clinical reasoning by developing a differential diagnosis and explaining your thought process to the patient.',
        vague_phrases: [
          {
            phrase: 'good job',
            suggestion: 'You demonstrated clear clinical reasoning by developing a differential diagnosis.',
          },
        ],
        coaching_prompts: [
          'Next time, try to explain your diagnostic reasoning to the patient.',
          'One thing to focus on is developing a more comprehensive differential.',
        ],
        tone_summary: 'Supportive and professional',
        tone_suggestions: 'The tone is appropriate for clinical education.',
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: mockResult,
        error: null,
      });

      const result = await analyzeSupervisorFeedback('good job');

      expect(result).toEqual(mockResult);
      expect(supabase.functions.invoke).toHaveBeenCalledWith('analyze-feedback', {
        body: {
          feedbackText: 'good job',
          context: {},
        },
      });
    });

    it('should pass context to the API', async () => {
      const mockResult: SmartFeedbackResult = {
        improved_feedback: 'test',
        vague_phrases: [],
        coaching_prompts: [],
        tone_summary: 'test',
        tone_suggestions: 'test',
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: mockResult,
        error: null,
      });

      const context: FeedbackContext = {
        epaName: 'EPA 1.1',
        learnerLevel: 'novice',
        discipline: 'PA',
      };

      await analyzeSupervisorFeedback('test feedback', context);

      expect(supabase.functions.invoke).toHaveBeenCalledWith('analyze-feedback', {
        body: {
          feedbackText: 'test feedback',
          context,
        },
      });
    });

    it('should throw error if feedback text is empty', async () => {
      await expect(analyzeSupervisorFeedback('')).rejects.toThrow('Feedback text is required');
      await expect(analyzeSupervisorFeedback('   ')).rejects.toThrow('Feedback text is required');
    });

    it('should throw error if API call fails', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: null,
        error: { message: 'API error' },
      });

      await expect(analyzeSupervisorFeedback('test')).rejects.toThrow();
    });

    it('should handle API errors gracefully', async () => {
      vi.mocked(supabase.functions.invoke).mockRejectedValue(new Error('Network error'));

      await expect(analyzeSupervisorFeedback('test')).rejects.toThrow('Network error');
    });

    it('should handle malformed API response', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { error: 'Invalid response' },
        error: null,
      });

      await expect(analyzeSupervisorFeedback('test')).rejects.toThrow('Invalid response');
    });

    it('should handle missing fields in response with defaults', async () => {
      const partialResult = {
        improved_feedback: 'test',
        // Missing other fields
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: partialResult,
        error: null,
      });

      const result = await analyzeSupervisorFeedback('test');

      expect(result.improved_feedback).toBe('test');
      expect(result.vague_phrases).toEqual([]);
      expect(result.coaching_prompts).toEqual([]);
      expect(result.tone_summary).toBe('Unable to analyze tone');
      expect(result.tone_suggestions).toBe('No specific suggestions');
    });
  });

  describe('isSmartFeedbackEnabled', () => {
    it('should return true by default when env var is not set', () => {
      // Save original env
      const originalEnv = import.meta.env.VITE_ENABLE_SMART_FEEDBACK_ASSISTANT;
      
      // Mock env to be undefined
      delete (import.meta.env as any).VITE_ENABLE_SMART_FEEDBACK_ASSISTANT;
      
      // Since we can't easily mock import.meta.env in vitest, we'll test the logic
      // The function defaults to true when env is undefined
      expect(isSmartFeedbackEnabled()).toBe(true);
      
      // Restore if possible
      if (originalEnv !== undefined) {
        (import.meta.env as any).VITE_ENABLE_SMART_FEEDBACK_ASSISTANT = originalEnv;
      }
    });

    it('should return false when env var is "false"', () => {
      const originalEnv = import.meta.env.VITE_ENABLE_SMART_FEEDBACK_ASSISTANT;
      (import.meta.env as any).VITE_ENABLE_SMART_FEEDBACK_ASSISTANT = 'false';
      
      expect(isSmartFeedbackEnabled()).toBe(false);
      
      if (originalEnv !== undefined) {
        (import.meta.env as any).VITE_ENABLE_SMART_FEEDBACK_ASSISTANT = originalEnv;
      }
    });

    it('should return false when env var is "0"', () => {
      const originalEnv = import.meta.env.VITE_ENABLE_SMART_FEEDBACK_ASSISTANT;
      (import.meta.env as any).VITE_ENABLE_SMART_FEEDBACK_ASSISTANT = '0';
      
      expect(isSmartFeedbackEnabled()).toBe(false);
      
      if (originalEnv !== undefined) {
        (import.meta.env as any).VITE_ENABLE_SMART_FEEDBACK_ASSISTANT = originalEnv;
      }
    });

    it('should return true when env var is "true"', () => {
      const originalEnv = import.meta.env.VITE_ENABLE_SMART_FEEDBACK_ASSISTANT;
      (import.meta.env as any).VITE_ENABLE_SMART_FEEDBACK_ASSISTANT = 'true';
      
      expect(isSmartFeedbackEnabled()).toBe(true);
      
      if (originalEnv !== undefined) {
        (import.meta.env as any).VITE_ENABLE_SMART_FEEDBACK_ASSISTANT = originalEnv;
      }
    });

    it('should return true when env var is "1"', () => {
      const originalEnv = import.meta.env.VITE_ENABLE_SMART_FEEDBACK_ASSISTANT;
      (import.meta.env as any).VITE_ENABLE_SMART_FEEDBACK_ASSISTANT = '1';
      
      expect(isSmartFeedbackEnabled()).toBe(true);
      
      if (originalEnv !== undefined) {
        (import.meta.env as any).VITE_ENABLE_SMART_FEEDBACK_ASSISTANT = originalEnv;
      }
    });
  });
});

