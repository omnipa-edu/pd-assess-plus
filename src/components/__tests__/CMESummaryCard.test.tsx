import { render, screen, waitFor } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { CMESummaryCard } from '@/components/cme/CMESummaryCard';
import { useAuth } from '@/hooks/useAuth';
import { getSupervisorCMESessions, calculateCMESummary } from '@/lib/cme-tracking';


// Mock dependencies
vi.mock('@/hooks/useAuth');
vi.mock('@/lib/cme-tracking');
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));

describe('CMESummaryCard', () => {
  const mockNavigate = vi.fn();
  const mockUser = { id: 'supervisor-1' };

  beforeEach(() => {
    vi.clearAllMocks();
    (useNavigate as any).mockReturnValue(mockNavigate);
    (useAuth as any).mockReturnValue({ user: mockUser });
  });

  it('should display total hours and session count correctly', async () => {
    const mockSessions = [
      {
        id: '1',
        supervisor_id: 'supervisor-1',
        org_id: 'org-1',
        source: 'auto_wba' as const,
        wba_id: 'wba-1',
        wba_type: 'epa',
        activity_type: 'direct_observation' as const,
        minutes: 60,
        description: 'Test',
        session_date: '2024-01-15',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      },
      {
        id: '2',
        supervisor_id: 'supervisor-1',
        org_id: 'org-1',
        source: 'auto_wba' as const,
        wba_id: 'wba-2',
        wba_type: 'direct_observation',
        activity_type: 'direct_observation' as const,
        minutes: 30,
        description: 'Test',
        session_date: '2024-01-16',
        created_at: '2024-01-16T10:00:00Z',
        updated_at: '2024-01-16T10:00:00Z',
      },
    ];

    const mockSummary = {
      totalMinutes: 90,
      totalHours: 1.5,
      totalSessions: 2,
      averageHoursPerWeek: 0.5,
      breakdownByActivity: {
        direct_observation: { minutes: 90, hours: 1.5, count: 2 },
        chart_review: { minutes: 0, hours: 0, count: 0 },
        end_of_rotation: { minutes: 0, hours: 0, count: 0 },
        narrative_feedback: { minutes: 0, hours: 0, count: 0 },
        group_teaching: { minutes: 0, hours: 0, count: 0 },
        other: { minutes: 0, hours: 0, count: 0 },
      },
    };

    (getSupervisorCMESessions as any).mockResolvedValue(mockSessions);
    (calculateCMESummary as any).mockReturnValue(mockSummary);

    render(<CMESummaryCard />);

    await waitFor(() => {
      expect(screen.getByText(/1\.5/)).toBeInTheDocument();
      expect(screen.getByText(/2/)).toBeInTheDocument();
    });
  });

  it('should render "0 hours" gracefully when there are no sessions', async () => {
    const mockSummary = {
      totalMinutes: 0,
      totalHours: 0,
      totalSessions: 0,
      averageHoursPerWeek: 0,
      breakdownByActivity: {
        direct_observation: { minutes: 0, hours: 0, count: 0 },
        chart_review: { minutes: 0, hours: 0, count: 0 },
        end_of_rotation: { minutes: 0, hours: 0, count: 0 },
        narrative_feedback: { minutes: 0, hours: 0, count: 0 },
        group_teaching: { minutes: 0, hours: 0, count: 0 },
        other: { minutes: 0, hours: 0, count: 0 },
      },
    };

    (getSupervisorCMESessions as any).mockResolvedValue([]);
    (calculateCMESummary as any).mockReturnValue(mockSummary);

    render(<CMESummaryCard />);

    await waitFor(() => {
      expect(screen.getByText(/0\.0/)).toBeInTheDocument();
      expect(screen.getByText(/0/)).toBeInTheDocument();
    });
  });

  it('should navigate to CME log when "View CME Log" button is clicked', async () => {
    const mockSessions: any[] = [];
    const mockSummary = {
      totalMinutes: 0,
      totalHours: 0,
      totalSessions: 0,
      averageHoursPerWeek: 0,
      breakdownByActivity: {
        direct_observation: { minutes: 0, hours: 0, count: 0 },
        chart_review: { minutes: 0, hours: 0, count: 0 },
        end_of_rotation: { minutes: 0, hours: 0, count: 0 },
        narrative_feedback: { minutes: 0, hours: 0, count: 0 },
        group_teaching: { minutes: 0, hours: 0, count: 0 },
        other: { minutes: 0, hours: 0, count: 0 },
      },
    };

    (getSupervisorCMESessions as any).mockResolvedValue(mockSessions);
    (calculateCMESummary as any).mockReturnValue(mockSummary);

    render(<CMESummaryCard />);

    await waitFor(() => {
      const button = screen.getByRole('button', { name: /view cme log/i });
      expect(button).toBeInTheDocument();
    });

    const button = screen.getByRole('button', { name: /view cme log/i });
    button.click();

    expect(mockNavigate).toHaveBeenCalledWith('/supervisor/cme-log');
  });

  it('should show loading state initially', () => {
    (getSupervisorCMESessions as any).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<CMESummaryCard />);

    // Should show loading skeleton
    expect(screen.getByRole('article')).toBeInTheDocument();
  });

  it('should not render if user is not logged in', () => {
    (useAuth as any).mockReturnValue({ user: null });

    const { container } = render(<CMESummaryCard />);

    // Component should not render content when no user
    expect(container.firstChild).toBeNull();
  });
});

