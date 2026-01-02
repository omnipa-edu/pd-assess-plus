import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  analyzeActivityForTags,
  selectCoachingItem,
  type WBAActivity,
  type CoachingCandidate,
} from '../adaptive-coaching';

describe('analyzeActivityForTags', () => {
  describe('for learners', () => {
    it('should return topic:engagement if no WBAs in last 14 days', () => {
      const activity: WBAActivity = {
        epaAssessments: [],
        directObservations: [],
        narrativeAssessments: [],
      };
      
      const tags = analyzeActivityForTags(activity, 'learner');
      expect(tags).toContain('topic:engagement');
    });

    it('should return epa tag and improvement tags for low O-SCOREs', () => {
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 10);
      
      const activity: WBAActivity = {
        epaAssessments: [
          {
            id: '1',
            epa_number: 'ENT-1',
            rating: '2',
            feedback: 'Needs improvement',
            created_at: fourteenDaysAgo.toISOString(),
          },
        ],
        directObservations: [],
        narrativeAssessments: [],
      };
      
      const tags = analyzeActivityForTags(activity, 'learner');
      expect(tags).toContain('epa:ENT-1');
      expect(tags).toContain('topic:improvement');
      expect(tags).toContain('level:low');
    });

    it('should return topic:self-assessment for mid-range improving scores', () => {
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 5);
      
      const activity: WBAActivity = {
        epaAssessments: [
          { id: '1', epa_number: 'ENT-1', rating: '3', feedback: null, created_at: fourteenDaysAgo.toISOString() },
          { id: '2', epa_number: 'ENT-2', rating: '3', feedback: null, created_at: new Date(fourteenDaysAgo.getTime() - 1000).toISOString() },
          { id: '3', epa_number: 'ENT-3', rating: '3', feedback: null, created_at: new Date(fourteenDaysAgo.getTime() - 2000).toISOString() },
          { id: '4', epa_number: 'ENT-4', rating: '2', feedback: null, created_at: new Date(fourteenDaysAgo.getTime() - 3000).toISOString() },
          { id: '5', epa_number: 'ENT-5', rating: '2', feedback: null, created_at: new Date(fourteenDaysAgo.getTime() - 4000).toISOString() },
          { id: '6', epa_number: 'ENT-6', rating: '2', feedback: null, created_at: new Date(fourteenDaysAgo.getTime() - 5000).toISOString() },
        ],
        directObservations: [],
        narrativeAssessments: [],
      };
      
      const tags = analyzeActivityForTags(activity, 'learner');
      expect(tags).toContain('topic:self-assessment');
    });
  });

  describe('for supervisors', () => {
    it('should return topic:engagement if low WBA volume', () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 20);
      
      const activity: WBAActivity = {
        epaAssessments: [
          { id: '1', epa_number: 'ENT-1', rating: '3', feedback: null, created_at: thirtyDaysAgo.toISOString() },
        ],
        directObservations: [],
        narrativeAssessments: [],
      };
      
      const tags = analyzeActivityForTags(activity, 'supervisor');
      expect(tags).toContain('topic:engagement');
    });

    it('should return topic:feedback_quality for short narrative feedback', () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 10);
      
      const activity: WBAActivity = {
        epaAssessments: [],
        directObservations: [],
        narrativeAssessments: [
          {
            id: '1',
            assessment_period: 'Rotation 1',
            overall_progression: 'Good work.', // Short feedback
            created_at: thirtyDaysAgo.toISOString(),
          },
        ],
      };
      
      const tags = analyzeActivityForTags(activity, 'supervisor');
      expect(tags).toContain('topic:feedback_quality');
    });

    it('should return epa tag and calibration tag for high EPA volume', () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 10);
      
      const activity: WBAActivity = {
        epaAssessments: Array.from({ length: 6 }, (_, i) => ({
          id: `epa-${i}`,
          epa_number: 'ENT-1',
          rating: '3',
          feedback: null,
          created_at: new Date(thirtyDaysAgo.getTime() - i * 1000).toISOString(),
        })),
        directObservations: [],
        narrativeAssessments: [],
      };
      
      const tags = analyzeActivityForTags(activity, 'supervisor');
      expect(tags).toContain('epa:ENT-1');
      expect(tags).toContain('topic:calibration');
    });
  });
});

describe('selectCoachingItem', () => {
  it('should return null for empty candidates', () => {
    expect(selectCoachingItem([], 'user-1')).toBeNull();
  });

  it('should return pinned item if available', () => {
    const candidates: CoachingCandidate[] = [
      {
        id: '1',
        title: 'Regular Item',
        body: 'Content',
        content_type: 'text',
        video_url: null,
        tags: [],
        priority: 0,
        pinned: false,
        created_at: new Date().toISOString(),
      },
      {
        id: '2',
        title: 'Pinned Item',
        body: 'Pinned Content',
        content_type: 'text',
        video_url: null,
        tags: [],
        priority: 0,
        pinned: true,
        created_at: new Date().toISOString(),
      },
    ];
    
    const selected = selectCoachingItem(candidates, 'user-1');
    expect(selected?.id).toBe('2');
    expect(selected?.pinned).toBe(true);
  });

  it('should sort by priority when no pinned items', () => {
    const candidates: CoachingCandidate[] = [
      {
        id: '1',
        title: 'Low Priority',
        body: 'Content',
        content_type: 'text',
        video_url: null,
        tags: [],
        priority: 1,
        pinned: false,
        created_at: new Date().toISOString(),
      },
      {
        id: '2',
        title: 'High Priority',
        body: 'Content',
        content_type: 'text',
        video_url: null,
        tags: [],
        priority: 10,
        pinned: false,
        created_at: new Date().toISOString(),
      },
    ];
    
    const selected = selectCoachingItem(candidates, 'user-1');
    expect(selected?.id).toBe('2'); // Higher priority selected
  });

  it('should use deterministic hash for consistent daily selection', () => {
    const candidates: CoachingCandidate[] = Array.from({ length: 5 }, (_, i) => ({
      id: `item-${i}`,
      title: `Item ${i}`,
      body: 'Content',
      content_type: 'text' as const,
      video_url: null,
      tags: [],
      priority: 0,
      pinned: false,
      created_at: new Date().toISOString(),
    }));
    
    // Same user, same day should get same item
    const selected1 = selectCoachingItem(candidates, 'user-1');
    const selected2 = selectCoachingItem(candidates, 'user-1');
    expect(selected1?.id).toBe(selected2?.id);
    
    // Different user should potentially get different item
    const selected3 = selectCoachingItem(candidates, 'user-2');
    // May or may not be different, but should be deterministic
    expect(selected3).not.toBeNull();
  });
});

