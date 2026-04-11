/**
 * Adaptive Coaching Selection Engine
 * 
 * Rule-based selection of coaching content based on:
 * - User role (learner vs supervisor)
 * - Recent WBA activity (EPA scores, narrative feedback length, WBA volume)
 * - Content tags matching activity patterns
 * 
 * Strategy:
 * 1. Build candidate list from coaching_corner (is_active, audience, tags)
 * 2. Apply rules to determine preferred tags
 * 3. Filter candidates by tags if matches found
 * 4. Fall back to priority/date-based selection if no tag matches
 * 5. Use deterministic hash for consistent daily selection
 */

import { supabase } from '@/integrations/supabase/client';
import { fetchCoachingCornerActiveRows } from '@/lib/coachingCornerQuery';

export interface WBAActivity {
  // EPA assessments
  epaAssessments: Array<{
    id: string;
    epa_number: string;
    rating: string | null; // O-SCORE as string "1"-"5"
    feedback: string | null;
    created_at: string;
  }>;
  // Direct observations
  directObservations: Array<{
    id: string;
    feedback: string | null;
    created_at: string;
  }>;
  // Narrative assessments
  narrativeAssessments: Array<{
    id: string;
    assessment_period: string | null;
    overall_progression: string | null;
    created_at: string;
  }>;
}

export interface CoachingCandidate {
  id: string;
  title: string;
  body: string | null;
  content_type: 'text' | 'youtube' | 'instagram';
  video_url: string | null;
  tags: string[];
  priority: number;
  pinned: boolean;
  created_at: string;
}

/**
 * Fetch recent WBA activity for a user
 */
export async function fetchWBAActivity(
  userId: string,
  role: 'learner' | 'supervisor',
  days: number = 30
): Promise<WBAActivity> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoffISO = cutoffDate.toISOString();

  if (role === 'learner') {
    // For learners: fetch their own assessments
    const [epaResult, directResult, narrativeResult] = await Promise.all([
      supabase
        .from('epa_assessments')
        .select('id, epa_number, rating, feedback, created_at')
        .eq('student_id', userId)
        .gte('created_at', cutoffISO)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('direct_observation_assessments')
        .select('id, feedback, created_at')
        .eq('student_id', userId)
        .gte('created_at', cutoffISO)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('narrative_assessments')
        .select('id, assessment_period, overall_progression, created_at')
        .eq('student_id', userId)
        .gte('created_at', cutoffISO)
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

    return {
      epaAssessments: epaResult.data || [],
      directObservations: directResult.data || [],
      narrativeAssessments: narrativeResult.data || [],
    };
  } else {
    // For supervisors: fetch assessments they created
    const [epaResult, directResult, narrativeResult] = await Promise.all([
      supabase
        .from('epa_assessments')
        .select('id, epa_number, rating, feedback, created_at')
        .eq('supervisor_id', userId)
        .gte('created_at', cutoffISO)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('direct_observation_assessments')
        .select('id, feedback, created_at')
        .eq('supervisor_id', userId)
        .gte('created_at', cutoffISO)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('narrative_assessments')
        .select('id, assessment_period, overall_progression, created_at')
        .eq('supervisor_id', userId)
        .gte('created_at', cutoffISO)
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

    return {
      epaAssessments: epaResult.data || [],
      directObservations: directResult.data || [],
      narrativeAssessments: narrativeResult.data || [],
    };
  }
}

/**
 * Analyze WBA activity and determine preferred tags
 * Returns array of tag strings that should be preferred
 */
export function analyzeActivityForTags(
  activity: WBAActivity,
  role: 'learner' | 'supervisor'
): string[] {
  const preferredTags: string[] = [];
  const now = new Date();
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  if (role === 'learner') {
    // Rule 1: If learner has no WBAs in last 14 days
    const recentWBAs = [
      ...activity.epaAssessments.filter(a => new Date(a.created_at) >= fourteenDaysAgo),
      ...activity.directObservations.filter(a => new Date(a.created_at) >= fourteenDaysAgo),
      ...activity.narrativeAssessments.filter(a => new Date(a.created_at) >= fourteenDaysAgo),
    ];
    if (recentWBAs.length === 0) {
      preferredTags.push('topic:engagement');
    }

    // Rule 2: If learner has recent O-SCORE ≤ 2 on a specific EPA
    const lowScores = activity.epaAssessments.filter(a => {
      const score = a.rating ? parseInt(a.rating) : null;
      return score !== null && score <= 2 && new Date(a.created_at) >= fourteenDaysAgo;
    });
    for (const assessment of lowScores) {
      preferredTags.push(`epa:${assessment.epa_number}`);
      preferredTags.push('topic:improvement');
      preferredTags.push('level:low');
    }

    // Rule 3: If learner has mostly mid-range O-SCOREs (3–4) and improving trend
    const recentEPAs = activity.epaAssessments.filter(a => new Date(a.created_at) >= fourteenDaysAgo);
    if (recentEPAs.length >= 3) {
      const scores = recentEPAs
        .map(a => a.rating ? parseInt(a.rating) : null)
        .filter((s): s is number => s !== null);
      const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
      const isMidRange = avgScore >= 3 && avgScore <= 4;
      
      // Check for improving trend (last 3 vs previous 3)
      if (scores.length >= 6) {
        const last3 = scores.slice(0, 3);
        const prev3 = scores.slice(3, 6);
        const lastAvg = last3.reduce((sum, s) => sum + s, 0) / last3.length;
        const prevAvg = prev3.reduce((sum, s) => sum + s, 0) / prev3.length;
        const isImproving = lastAvg > prevAvg;
        
        if (isMidRange && isImproving) {
          preferredTags.push('topic:self-assessment');
        }
      }
    }
  } else {
    // Supervisor rules
    // Rule 1: If supervisor has low WBA volume over last 30 days
    const recentWBAs = [
      ...activity.epaAssessments.filter(a => new Date(a.created_at) >= thirtyDaysAgo),
      ...activity.directObservations.filter(a => new Date(a.created_at) >= thirtyDaysAgo),
      ...activity.narrativeAssessments.filter(a => new Date(a.created_at) >= thirtyDaysAgo),
    ];
    if (recentWBAs.length < 5) {
      preferredTags.push('topic:engagement');
    }

    // Rule 2: If narrative feedback tends to be very short or vague
    const recentNarratives = activity.narrativeAssessments.filter(
      a => new Date(a.created_at) >= thirtyDaysAgo
    );
    if (recentNarratives.length > 0) {
      const avgLength = recentNarratives.reduce((sum, n) => {
        const text = n.overall_progression || '';
        return sum + text.length;
      }, 0) / recentNarratives.length;
      if (avgLength < 200) {
        preferredTags.push('topic:feedback_quality');
        // Evidence-based tags for short/vague feedback
        preferredTags.push('theme:educator_behaviours');
        preferredTags.push('skill:focus_on_behaviour');
      }
    }
    
    // Rule 2b: Check for feedback that might lack dialogue/invitation
    const recentFeedback = [
      ...activity.epaAssessments.filter(a => new Date(a.created_at) >= thirtyDaysAgo),
      ...activity.directObservations.filter(a => new Date(a.created_at) >= thirtyDaysAgo),
    ];
    if (recentFeedback.length > 0) {
      // Simple heuristic: if feedback is very short or doesn't contain question marks, suggest dialogue
      const hasDialogue = recentFeedback.some(f => {
        const text = f.feedback || '';
        return text.includes('?') || text.toLowerCase().includes('how do you think') || 
               text.toLowerCase().includes('what would you');
      });
      if (!hasDialogue && recentFeedback.length >= 3) {
        preferredTags.push('theme:feedback_literacy_judgement');
        preferredTags.push('skill:ask_for_feedback');
      }
    }

    // Rule 3: If supervisor is heavily involved in a specific EPA (high volume)
    const epaCounts = new Map<string, number>();
    activity.epaAssessments.forEach(a => {
      const count = epaCounts.get(a.epa_number) || 0;
      epaCounts.set(a.epa_number, count + 1);
    });
    for (const [epaNumber, count] of epaCounts.entries()) {
      if (count >= 5) {
        preferredTags.push(`epa:${epaNumber}`);
        preferredTags.push('topic:calibration');
      }
    }
  }

  return preferredTags;
}

/**
 * Fetch coaching candidates matching audience and optionally tags
 */
export async function fetchCoachingCandidates(
  audience: 'learners' | 'supervisors' | 'all',
  preferredTags?: string[]
): Promise<CoachingCandidate[]> {
  const now = new Date().toISOString();
  const rows = await fetchCoachingCornerActiveRows();

  const candidates: CoachingCandidate[] = rows
    .filter((item) => {
      const startValid = !item.start_at || new Date(item.start_at) <= new Date(now);
      const endValid = !item.end_at || new Date(item.end_at) >= new Date(now);
      const audienceValid = item.audience === 'all' || item.audience === audience;
      return startValid && endValid && audienceValid;
    })
    .map((item) => ({
      id: item.id,
      title: item.title,
      body: item.body,
      content_type: item.content_type,
      video_url: item.video_url,
      tags: item.tags ?? [],
      priority: item.priority ?? 0,
      pinned: item.pinned,
      created_at: item.created_at,
    }));

  if (preferredTags && preferredTags.length > 0) {
    const matching = candidates.filter((candidate) => {
      if (!candidate.tags || candidate.tags.length === 0) return false;
      return preferredTags.some((tag) => candidate.tags.includes(tag));
    });
    return matching.length > 0 ? matching : candidates;
  }

  return candidates;
}

/**
 * Simple hash function for deterministic selection
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Select the best coaching item from candidates
 * Strategy:
 * 1. Pinned items always take priority
 * 2. Sort by priority (desc), then created_at (desc)
 * 3. Use deterministic hash (date + user_id) to pick one item per day
 */
export function selectCoachingItem(
  candidates: CoachingCandidate[],
  userId: string
): CoachingCandidate | null {
  if (candidates.length === 0) return null;

  // Pinned items always take priority
  const pinned = candidates.find(c => c.pinned);
  if (pinned) return pinned;

  // Sort by priority (desc), then created_at (desc)
  const sorted = [...candidates].sort((a, b) => {
    if (a.priority !== b.priority) {
      return b.priority - a.priority;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Deterministic selection: one item per day per user
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const seed = `${today}-${userId}`;
  const index = simpleHash(seed) % sorted.length;
  
  return sorted[index] || sorted[0];
}

/**
 * Main function: Get adaptive coaching item for a user
 * Enhanced to use personalization summaries for better tag matching
 */
export async function getAdaptiveCoachingItem(
  userId: string,
  role: 'learner' | 'supervisor',
  audience: 'learners' | 'supervisors' | 'all' = role === 'learner' ? 'learners' : 'supervisors'
): Promise<CoachingCandidate | null> {
  try {
    // Step 1: Try to get personalization summary tags first (more accurate)
    let preferredTags: string[] = [];
    
    try {
      if (role === 'learner') {
        const { getLearnerSummary } = await import('./personalization/summary-generation');
        const summary = await getLearnerSummary(userId);
        if (summary && summary.coaching_tags && summary.coaching_tags.length > 0) {
          preferredTags = summary.coaching_tags;
        }
      } else {
        const { getSupervisorSummary } = await import('./personalization/summary-generation');
        const summary = await getSupervisorSummary(userId);
        if (summary && summary.coaching_tags && summary.coaching_tags.length > 0) {
          preferredTags = summary.coaching_tags;
        }
      }
    } catch (summaryError) {
      // If personalization summary fails, fall back to activity-based tags
      console.warn('Error fetching personalization summary, using activity-based tags', summaryError);
    }
    
    // Step 2: If no personalization tags, use activity-based analysis (fallback)
    if (preferredTags.length === 0) {
      const activity = await fetchWBAActivity(userId, role);
      preferredTags = analyzeActivityForTags(activity, role);
    }
    
    // Step 3: Fetch coaching candidates (filtered by tags if available)
    const candidates = await fetchCoachingCandidates(audience, preferredTags);
    
    // Step 4: Select the best item
    return selectCoachingItem(candidates, userId);
  } catch (error) {
    console.error('Error getting adaptive coaching item:', error);
    // Fallback: fetch all candidates without tag filtering
    try {
      const candidates = await fetchCoachingCandidates(audience);
      return selectCoachingItem(candidates, userId);
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      return null;
    }
  }
}

