/**
 * CoachingCornerFeed Component
 * Displays a feed of coaching corner items filtered by role
 */
import { useEffect, useState } from 'react';

import { useQuery } from '@tanstack/react-query';

import { CoachingCornerCard, type CoachingItem } from '@/components/coaching/CoachingCornerCard';
import { useDismissCoaching, usePrimaryCoachingItem } from '@/hooks/useCoachingCorner';
import { getCoachingCornerItems, type CoachingRole } from '@/lib/coachingCorner';
import { processInstagramEmbeds } from '@/lib/embeds/instagram';

interface CoachingCornerFeedProps {
  role: CoachingRole;
  limit?: number;
  className?: string;
}

export function CoachingCornerFeed({ role, limit = 3, className }: CoachingCornerFeedProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const dismissCoaching = useDismissCoaching();
  const primaryCoaching = usePrimaryCoachingItem();

  const { data: items, isLoading } = useQuery({
    queryKey: ['coaching-corner-feed', role, limit],
    queryFn: () => getCoachingCornerItems(role, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Process Instagram embeds after items load
  useEffect(() => {
    const hasInstagram = (items && items.some(item => item.content_type === 'instagram'))
      || primaryCoaching.data?.content_type === 'instagram';
    if (hasInstagram) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        processInstagramEmbeds();
      }, 100);
    }
  }, [items, primaryCoaching.data]);

  const handleDismiss = async (id: string) => {
    try {
      await dismissCoaching.mutateAsync(id);
      setDismissedIds(prev => new Set(prev).add(id));
    } catch (error) {
      console.error('Error dismissing coaching item:', error);
    }
  };

  // Filter out dismissed items
  const visibleItems = items?.filter(item => !dismissedIds.has(item.id)) || [];

  if (isLoading || primaryCoaching.isLoading) {
    return (
      <div className={className}>
        <CoachingCornerCard item={null} />
      </div>
    );
  }

  const adaptiveItem = primaryCoaching.data && !dismissedIds.has(primaryCoaching.data.id)
    ? primaryCoaching.data
    : null;
  const primaryItem = adaptiveItem || visibleItems[0] || null;

  if (!primaryItem) {
    return (
      <div className={className}>
        <CoachingCornerCard item={null} />
      </div>
    );
  }

  const coachingItem: CoachingItem = 'body_text' in primaryItem
    ? {
        id: primaryItem.id,
        title: primaryItem.title,
        content_type: primaryItem.content_type as 'text' | 'youtube' | 'instagram' | 'link',
        body: primaryItem.body_text || undefined,
        video_url: primaryItem.video_url || undefined,
        url: primaryItem.url || undefined,
        creator_name: primaryItem.creator_name || undefined,
        creator_handle: primaryItem.creator_handle || undefined,
        creator_url: primaryItem.creator_url || undefined,
        source_platform: primaryItem.source_platform || undefined,
        source_url: primaryItem.source_url || undefined,
        license_note: primaryItem.license_note || undefined,
        pinned: primaryItem.pinned,
        start_at: primaryItem.start_at || undefined,
        end_at: primaryItem.end_at || undefined,
      }
    : primaryItem;

  return (
    <div className={className}>
      <CoachingCornerCard 
        item={coachingItem}
        onDismiss={handleDismiss}
      />
    </div>
  );
}

