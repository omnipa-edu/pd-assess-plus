import { useEffect } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/hooks/useAuth';

/**
 * Global keyboard shortcuts handler
 * Handles shortcuts that work across the entire app
 */
export function KeyboardShortcuts() {
  const navigate = useNavigate();
  const { hasRole, signOut } = useAuth();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs, textareas, or contenteditable elements
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Cmd/Ctrl + K opens command palette (handled by CommandPalette component)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        return; // Let CommandPalette handle this
      }

      // Cmd/Ctrl + N - New Assessment (supervisors only)
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        if (hasRole('supervisor')) {
          navigate('/dashboard');
        }
        return;
      }

      // Cmd/Ctrl + D - Dashboard
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault();
        navigate('/dashboard');
        return;
      }

      // Cmd/Ctrl + S - Student Dashboard (students only)
      if ((e.metaKey || e.ctrlKey) && e.key === 's' && !e.shiftKey) {
        e.preventDefault();
        if (hasRole('student')) {
          navigate('/student');
        }
        return;
      }

      // Cmd/Ctrl + V - Supervisor Dashboard (supervisors only)
      if ((e.metaKey || e.ctrlKey) && e.key === 'v' && !e.shiftKey) {
        e.preventDefault();
        if (hasRole('supervisor')) {
          navigate('/supervisor');
        }
        return;
      }

      // Cmd/Ctrl + A - Admin Dashboard (admins only)
      if ((e.metaKey || e.ctrlKey) && e.key === 'a' && !e.shiftKey) {
        e.preventDefault();
        if (hasRole('admin')) {
          navigate('/admin');
        }
        return;
      }

      // Escape - Close modals/dialogs (if needed, can be extended)
      if (e.key === 'Escape') {
        // This can be extended to close modals
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate, hasRole]);

  return null; // This component doesn't render anything
}

