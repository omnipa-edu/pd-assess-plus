/**
 * Tests for useProfileProgress hook
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useProfileProgress } from '../useProfileProgress';
import { useAuth } from '../useAuth';
import { supabase } from '@/integrations/supabase/client';

// Mock dependencies
vi.mock('../useAuth');
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn()
  }
}));

describe('useProfileProgress', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com'
  };

  const mockProgress = {
    id: 'progress-id',
    user_id: 'test-user-id',
    onboarding_dismissed: false,
    completed_tasks: ['task1'],
    first_login_at: '2025-01-01T00:00:00Z',
    onboarding_completed_at: null,
    dismissed_empty_states: [],
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch progress when user is authenticated', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser as any,
      session: null,
      profile: null,
      roles: [],
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signInWithGoogle: vi.fn(),
      signInWithMagicLink: vi.fn(),
      signOut: vi.fn(),
      hasRole: vi.fn()
    });

    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: mockProgress,
          error: null
        })
      })
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect
    } as any);

    const { result } = renderHook(() => useProfileProgress());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.progress).toEqual(mockProgress);
    expect(mockSelect).toHaveBeenCalledWith('*');
  });

  it('should return null progress when user is not authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      session: null,
      profile: null,
      roles: [],
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signInWithGoogle: vi.fn(),
      signInWithMagicLink: vi.fn(),
      signOut: vi.fn(),
      hasRole: vi.fn()
    });

    const { result } = renderHook(() => useProfileProgress());

    expect(result.current.progress).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('should mark task as completed', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser as any,
      session: null,
      profile: null,
      roles: [],
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signInWithGoogle: vi.fn(),
      signInWithMagicLink: vi.fn(),
      signOut: vi.fn(),
      hasRole: vi.fn()
    });

    const updatedProgress = {
      ...mockProgress,
      completed_tasks: ['task1', 'task2']
    };

    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: updatedProgress,
            error: null
          })
        })
      })
    });

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'profile_progress') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockProgress,
                error: null
              })
            })
          }),
          update: mockUpdate
        } as any;
      }
      return {} as any;
    });

    const { result } = renderHook(() => useProfileProgress());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.completeTask('task2');

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith({
        completed_tasks: ['task1', 'task2']
      });
    });
  });

  it('should check if task is completed', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser as any,
      session: null,
      profile: null,
      roles: [],
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signInWithGoogle: vi.fn(),
      signInWithMagicLink: vi.fn(),
      signOut: vi.fn(),
      hasRole: vi.fn()
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockProgress,
            error: null
          })
        })
      })
    } as any);

    const { result } = renderHook(() => useProfileProgress());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isTaskCompleted('task1')).toBe(true);
    expect(result.current.isTaskCompleted('task2')).toBe(false);
  });

  it('should dismiss onboarding', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser as any,
      session: null,
      profile: null,
      roles: [],
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signInWithGoogle: vi.fn(),
      signInWithMagicLink: vi.fn(),
      signOut: vi.fn(),
      hasRole: vi.fn()
    });

    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { ...mockProgress, onboarding_dismissed: true },
            error: null
          })
        })
      })
    });

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'profile_progress') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockProgress,
                error: null
              })
            })
          }),
          update: mockUpdate
        } as any;
      }
      return {} as any;
    });

    const { result } = renderHook(() => useProfileProgress());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.dismissOnboarding();

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  it('should determine if onboarding should be shown', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser as any,
      session: null,
      profile: null,
      roles: [],
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signInWithGoogle: vi.fn(),
      signInWithMagicLink: vi.fn(),
      signOut: vi.fn(),
      hasRole: vi.fn()
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockProgress,
            error: null
          })
        })
      })
    } as any);

    const { result } = renderHook(() => useProfileProgress());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.shouldShowOnboarding).toBe(true);
  });
});



