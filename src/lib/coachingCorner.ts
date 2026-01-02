/**
 * Coaching Corner Data Fetching
 * Fetches coaching corner items with role-based filtering
 */

import { supabase } from '@/integrations/supabase/client';

export interface CoachingCornerItem {
  id: string;
  title: string;
  content_type: 'text' | 'youtube' | 'instagram' | 'link';
  audience: 'learners' | 'supervisors' | 'all';
  
  // Core content
  body_text?: string | null;
  url?: string | null;
  video_url?: string | null; // Legacy field, maps to url
  
  // Attribution (required for embeds)
  creator_name?: string | null;
  creator_handle?: string | null;
  creator_url?: string | null;
  source_platform?: string | null;
  source_url?: string | null;
  license_note?: string | null;
  
  // Personalization
  tags?: string[] | null;
  priority?: number | null;
  is_active: boolean;
  
  // Metadata
  created_by?: string | null;
  created_at: string;
  updated_at?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  pinned: boolean;
}

export type CoachingRole = 'learner' | 'supervisor';

/**
 * Get coaching corner items for a specific role
 */
export async function getCoachingCornerItems(
  role: CoachingRole,
  limit: number = 3
): Promise<CoachingCornerItem[]> {
  try {
    const now = new Date().toISOString();
    
    // Determine audience filter based on role
    const audienceFilter = role === 'learner' 
      ? ['all', 'learners']
      : ['all', 'supervisors'];
    
    // Build query
    // Note: Supabase doesn't support chaining multiple .or() calls
    // We need to combine date filters into a single condition or use separate filters
    const query = supabase
      .from('coaching_corner')
      .select('*')
      .eq('is_active', true)
      .in('audience', audienceFilter);
    
    // Apply date filters - items must be within their active date range
    // We'll filter in JavaScript after fetching, or use a more complex query
    // For now, let's fetch and filter client-side to avoid complex Supabase query syntax
    const { data: coachingData, error } = await query
      .order('pinned', { ascending: false })
      .order('priority', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(limit * 2); // Fetch more to account for date filtering
    
    if (error) {
      console.error('Error fetching coaching corner items:', error);
      throw error;
    }
    
    // Filter by date range client-side
    const filteredItems = (coachingData || []).filter((item: any) => {
      const startAt = item.start_at ? new Date(item.start_at) : null;
      const endAt = item.end_at ? new Date(item.end_at) : null;
      const nowDate = new Date(now);
      
      // Item is active if:
      // - start_at is null or start_at <= now
      // - end_at is null or end_at >= now
      const isAfterStart = !startAt || startAt <= nowDate;
      const isBeforeEnd = !endAt || endAt >= nowDate;
      
      return isAfterStart && isBeforeEnd;
    }).slice(0, limit); // Take only the requested limit
    
    // Map legacy video_url to url if needed
    const items = filteredItems.map((item: any) => ({
      ...item,
      url: item.url || item.video_url, // Use url if available, fallback to video_url
    }));
    
    return items as CoachingCornerItem[];
  } catch (error) {
    console.error('Error in getCoachingCornerItems:', error);
    return [];
  }
}

