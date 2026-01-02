import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { CoachingCornerCard } from '@/components/coaching/CoachingCornerCard';
import type { CoachingItem } from '@/components/coaching/CoachingCornerCard';

describe('CoachingCornerCard', () => {
  describe('Text content', () => {
    it('should render title and body text for text content type', () => {
      const item: CoachingItem = {
        id: '1',
        title: 'Test Coaching Title',
        content_type: 'text',
        body: 'This is the body text of the coaching content.',
        pinned: false,
      };

      render(<CoachingCornerCard item={item} />);

      expect(screen.getByText('Test Coaching Title')).toBeInTheDocument();
      expect(screen.getByText('This is the body text of the coaching content.')).toBeInTheDocument();
    });

    it('should show "Read more" button for long text content', () => {
      const longBody = 'A'.repeat(400); // Longer than 300 chars
      const item: CoachingItem = {
        id: '2',
        title: 'Long Content',
        content_type: 'text',
        body: longBody,
        pinned: false,
      };

      render(<CoachingCornerCard item={item} />);

      expect(screen.getByText(/read more/i)).toBeInTheDocument();
    });

    it('should expand and collapse long text content', async () => {
      const user = userEvent.setup();
      const longBody = 'A'.repeat(400);
      const item: CoachingItem = {
        id: '3',
        title: 'Expandable Content',
        content_type: 'text',
        body: longBody,
        pinned: false,
      };

      render(<CoachingCornerCard item={item} />);

      const readMoreButton = screen.getByText(/read more/i);
      await user.click(readMoreButton);

      expect(screen.getByText(/show less/i)).toBeInTheDocument();

      const showLessButton = screen.getByText(/show less/i);
      await user.click(showLessButton);

      expect(screen.getByText(/read more/i)).toBeInTheDocument();
    });
  });

  describe('YouTube content', () => {
    it('should render iframe with correct attributes for YouTube video', () => {
      const item: CoachingItem = {
        id: '4',
        title: 'YouTube Video',
        content_type: 'youtube',
        video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        pinned: false,
      };

      render(<CoachingCornerCard item={item} />);

      const iframe = screen.getByTitle('YouTube Video');
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute('loading', 'lazy');
      expect(iframe).toHaveAttribute(
        'allow',
        'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
      );
      expect(iframe).toHaveAttribute('referrerPolicy', 'no-referrer');
    });
  });

  describe('Pinned items', () => {
    it('should display pinned badge for pinned items', () => {
      const item: CoachingItem = {
        id: '5',
        title: 'Pinned Item',
        content_type: 'text',
        body: 'This is a pinned coaching item.',
        pinned: true,
      };

      render(<CoachingCornerCard item={item} />);

      expect(screen.getByText(/pinned/i)).toBeInTheDocument();
    });

    it('should not display pinned badge for non-pinned items', () => {
      const item: CoachingItem = {
        id: '6',
        title: 'Regular Item',
        content_type: 'text',
        body: 'This is a regular coaching item.',
        pinned: false,
      };

      render(<CoachingCornerCard item={item} />);

      expect(screen.queryByText(/pinned/i)).not.toBeInTheDocument();
    });
  });

  describe('Dismiss functionality', () => {
    it('should call onDismiss when dismiss button is clicked', async () => {
      const user = userEvent.setup();
      const onDismiss = vi.fn();
      const item: CoachingItem = {
        id: '7',
        title: 'Dismissible Item',
        content_type: 'text',
        body: 'This item can be dismissed.',
        pinned: false,
      };

      render(<CoachingCornerCard item={item} onDismiss={onDismiss} />);

      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      await user.click(dismissButton);

      expect(onDismiss).toHaveBeenCalledWith('7');
    });

    it('should not show dismiss button when onDismiss is not provided', () => {
      const item: CoachingItem = {
        id: '8',
        title: 'Non-dismissible Item',
        content_type: 'text',
        body: 'This item cannot be dismissed.',
        pinned: false,
      };

      render(<CoachingCornerCard item={item} />);

      expect(screen.queryByRole('button', { name: /dismiss/i })).not.toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('should render empty state when no item is provided', () => {
      render(<CoachingCornerCard item={null} />);

      expect(screen.getByText(/coaching corner/i)).toBeInTheDocument();
      // Should show empty state message (check your strings.ts for exact text)
    });
  });

  describe('Date range display', () => {
    it('should display start and end dates when provided', () => {
      const item: CoachingItem = {
        id: '9',
        title: 'Time-limited Item',
        content_type: 'text',
        body: 'This item has a date range.',
        pinned: false,
        start_at: '2024-01-01T00:00:00Z',
        end_at: '2024-12-31T23:59:59Z',
      };

      render(<CoachingCornerCard item={item} />);

      expect(screen.getByText(/from/i)).toBeInTheDocument();
      expect(screen.getByText(/until/i)).toBeInTheDocument();
    });
  });
});

