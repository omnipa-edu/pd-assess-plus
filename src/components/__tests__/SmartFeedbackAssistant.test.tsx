import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { SmartFeedbackAssistant } from '@/components/feedback/SmartFeedbackAssistant';
import { type SmartFeedbackResult } from '@/lib/smartFeedback';

// Mock the analyzeSupervisorFeedback function
vi.mock('@/lib/smartFeedback', async () => {
  const actual = await vi.importActual('@/lib/smartFeedback');
  return {
    ...actual,
    analyzeSupervisorFeedback: vi.fn(),
  };
});

describe('SmartFeedbackAssistant', () => {
  const mockResult: SmartFeedbackResult = {
    improved_feedback: 'More specific, behavior-based feedback that highlights the clinical reasoning demonstrated and provides actionable next steps.',
    vague_phrases: [
      {
        phrase: 'good job',
        suggestion: 'You explained the differential diagnosis clearly and engaged the patient in shared decision-making.',
      },
    ],
    coaching_prompts: [
      'Next time, try summarizing the plan in your own words.',
      'Focus on organizing your physical exam findings by system.',
    ],
    tone_summary: 'Supportive but somewhat vague.',
    tone_suggestions: 'Mention specific behaviors and impact instead of general praise.',
  };

  const mockOnReplaceFeedback = vi.fn();
  const mockOnInsertText = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render rewrite suggestion', async () => {
    const { analyzeSupervisorFeedback } = await import('@/lib/smartFeedback');
    (analyzeSupervisorFeedback as any).mockResolvedValue(mockResult);

    render(
      <SmartFeedbackAssistant
        currentFeedback="good job"
        onReplaceFeedback={mockOnReplaceFeedback}
        onInsertText={mockOnInsertText}
      />
    );

    const improveButton = screen.getByRole('button', { name: /improve feedback/i });
    await userEvent.click(improveButton);

    await waitFor(() => {
      expect(screen.getByText(/smart feedback suggestions/i)).toBeInTheDocument();
    });

    // Check rewrite tab content
    expect(screen.getByText(mockResult.improved_feedback)).toBeInTheDocument();
  });

  it('should render vague phrases list with suggestions', async () => {
    const { analyzeSupervisorFeedback } = await import('@/lib/smartFeedback');
    (analyzeSupervisorFeedback as any).mockResolvedValue(mockResult);

    render(
      <SmartFeedbackAssistant
        currentFeedback="good job"
        onReplaceFeedback={mockOnReplaceFeedback}
        onInsertText={mockOnInsertText}
      />
    );

    const improveButton = screen.getByRole('button', { name: /improve feedback/i });
    await userEvent.click(improveButton);

    await waitFor(() => {
      expect(screen.getByText(/smart feedback suggestions/i)).toBeInTheDocument();
    });

    // Click on Specificity tab
    const specificityTab = screen.getByRole('tab', { name: /specificity/i });
    await userEvent.click(specificityTab);

    await waitFor(() => {
      expect(screen.getByText(/good job/i)).toBeInTheDocument();
      expect(screen.getByText(/You explained the differential/i)).toBeInTheDocument();
    });
  });

  it('should render coaching prompts as clickable items', async () => {
    const { analyzeSupervisorFeedback } = await import('@/lib/smartFeedback');
    (analyzeSupervisorFeedback as any).mockResolvedValue(mockResult);

    render(
      <SmartFeedbackAssistant
        currentFeedback="test feedback"
        onReplaceFeedback={mockOnReplaceFeedback}
        onInsertText={mockOnInsertText}
      />
    );

    const improveButton = screen.getByRole('button', { name: /improve feedback/i });
    await userEvent.click(improveButton);

    await waitFor(() => {
      expect(screen.getByText(/smart feedback suggestions/i)).toBeInTheDocument();
    });

    // Click on Coaching tab
    const coachingTab = screen.getByRole('tab', { name: /coaching/i });
    await userEvent.click(coachingTab);

    await waitFor(() => {
      expect(screen.getByText(/Next time, try summarizing/i)).toBeInTheDocument();
    });

    // Click insert button
    const insertButtons = screen.getAllByRole('button', { name: /insert/i });
    await userEvent.click(insertButtons[0]);

    expect(mockOnInsertText).toHaveBeenCalledWith('Next time, try summarizing the plan in your own words.');
  });

  it('should render tone summary and suggestions', async () => {
    const { analyzeSupervisorFeedback } = await import('@/lib/smartFeedback');
    (analyzeSupervisorFeedback as any).mockResolvedValue(mockResult);

    render(
      <SmartFeedbackAssistant
        currentFeedback="test feedback"
        onReplaceFeedback={mockOnReplaceFeedback}
        onInsertText={mockOnInsertText}
      />
    );

    const improveButton = screen.getByRole('button', { name: /improve feedback/i });
    await userEvent.click(improveButton);

    await waitFor(() => {
      expect(screen.getByText(/smart feedback suggestions/i)).toBeInTheDocument();
    });

    // Click on Tone tab
    const toneTab = screen.getByRole('tab', { name: /tone/i });
    await userEvent.click(toneTab);

    await waitFor(() => {
      expect(screen.getByText(/Supportive but somewhat vague/i)).toBeInTheDocument();
      expect(screen.getByText(/Mention specific behaviors/i)).toBeInTheDocument();
    });
  });

  it('should call onReplaceFeedback when "Replace my feedback" is clicked', async () => {
    const { analyzeSupervisorFeedback } = await import('@/lib/smartFeedback');
    (analyzeSupervisorFeedback as any).mockResolvedValue(mockResult);

    render(
      <SmartFeedbackAssistant
        currentFeedback="original feedback"
        onReplaceFeedback={mockOnReplaceFeedback}
        onInsertText={mockOnInsertText}
      />
    );

    const improveButton = screen.getByRole('button', { name: /improve feedback/i });
    await userEvent.click(improveButton);

    await waitFor(() => {
      expect(screen.getByText(/smart feedback suggestions/i)).toBeInTheDocument();
    });

    const replaceButton = screen.getByRole('button', { name: /replace my feedback/i });
    await userEvent.click(replaceButton);

    expect(mockOnReplaceFeedback).toHaveBeenCalledWith(mockResult.improved_feedback);
  });

  it('should disable button when feedback is empty', () => {
    render(
      <SmartFeedbackAssistant
        currentFeedback=""
        onReplaceFeedback={mockOnReplaceFeedback}
        onInsertText={mockOnInsertText}
      />
    );

    const improveButton = screen.getByRole('button', { name: /improve feedback/i });
    expect(improveButton).toBeDisabled();
  });

  it('should show error message when analysis fails', async () => {
    const { analyzeSupervisorFeedback } = await import('@/lib/smartFeedback');
    (analyzeSupervisorFeedback as any).mockRejectedValue(new Error('API error'));

    render(
      <SmartFeedbackAssistant
        currentFeedback="test feedback"
        onReplaceFeedback={mockOnReplaceFeedback}
        onInsertText={mockOnInsertText}
      />
    );

    const improveButton = screen.getByRole('button', { name: /improve feedback/i });
    await userEvent.click(improveButton);

    await waitFor(() => {
      expect(screen.getByText(/couldn't load suggestions/i)).toBeInTheDocument();
    });
  });

  it('should show loading state while analyzing', async () => {
    const { analyzeSupervisorFeedback } = await import('@/lib/smartFeedback');
    (analyzeSupervisorFeedback as any).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockResult), 100))
    );

    render(
      <SmartFeedbackAssistant
        currentFeedback="test feedback"
        onReplaceFeedback={mockOnReplaceFeedback}
        onInsertText={mockOnInsertText}
      />
    );

    const improveButton = screen.getByRole('button', { name: /improve feedback/i });
    await userEvent.click(improveButton);

    expect(screen.getByText(/analyzing/i)).toBeInTheDocument();
  });

  it('should allow closing the suggestions panel', async () => {
    const { analyzeSupervisorFeedback } = await import('@/lib/smartFeedback');
    (analyzeSupervisorFeedback as any).mockResolvedValue(mockResult);

    render(
      <SmartFeedbackAssistant
        currentFeedback="test feedback"
        onReplaceFeedback={mockOnReplaceFeedback}
        onInsertText={mockOnInsertText}
      />
    );

    const improveButton = screen.getByRole('button', { name: /improve feedback/i });
    await userEvent.click(improveButton);

    await waitFor(() => {
      expect(screen.getByText(/smart feedback suggestions/i)).toBeInTheDocument();
    });

    const closeButton = screen.getByRole('button', { name: /close suggestions/i });
    await userEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText(/smart feedback suggestions/i)).not.toBeInTheDocument();
    });
  });
});

