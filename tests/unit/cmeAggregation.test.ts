import { describe, it, expect } from 'vitest';

import { calculateCMESummary } from '@/lib/cme-tracking';
import type { CMESession } from '@/lib/cme-tracking';

/**
 * Unit tests for CME aggregation helpers
 */

describe('CME Aggregation', () => {
  const mockSessions: CMESession[] = [
    {
      id: '1',
      supervisor_id: 'supervisor-1',
      org_id: 'org-1',
      source: 'auto_wba',
      wba_id: 'wba-1',
      wba_type: 'epa',
      activity_type: 'direct_observation',
      minutes: 10,
      description: 'EPA observation',
      session_date: '2024-01-15',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
    },
    {
      id: '2',
      supervisor_id: 'supervisor-1',
      org_id: 'org-1',
      source: 'auto_wba',
      wba_id: 'wba-2',
      wba_type: 'direct_observation',
      activity_type: 'direct_observation',
      minutes: 7,
      description: 'Direct observation',
      session_date: '2024-01-16',
      created_at: '2024-01-16T10:00:00Z',
      updated_at: '2024-01-16T10:00:00Z',
    },
    {
      id: '3',
      supervisor_id: 'supervisor-1',
      org_id: 'org-1',
      source: 'manual',
      wba_id: null,
      wba_type: null,
      activity_type: 'chart_review',
      minutes: 15,
      description: 'Chart review',
      session_date: '2024-01-17',
      created_at: '2024-01-17T10:00:00Z',
      updated_at: '2024-01-17T10:00:00Z',
    },
    {
      id: '4',
      supervisor_id: 'supervisor-1',
      org_id: 'org-1',
      source: 'auto_wba',
      wba_id: 'wba-3',
      wba_type: 'narrative',
      activity_type: 'end_of_rotation',
      minutes: 20,
      description: 'End of rotation',
      session_date: '2024-01-18',
      created_at: '2024-01-18T10:00:00Z',
      updated_at: '2024-01-18T10:00:00Z',
    },
    {
      id: '5',
      supervisor_id: 'supervisor-1',
      org_id: 'org-1',
      source: 'auto_wba',
      wba_id: 'wba-4',
      wba_type: 'narrative',
      activity_type: 'narrative_feedback',
      minutes: 5,
      description: 'Narrative feedback',
      session_date: '2024-01-19',
      created_at: '2024-01-19T10:00:00Z',
      updated_at: '2024-01-19T10:00:00Z',
    },
  ];

  describe('calculateCMESummary', () => {
    it('should calculate correct total minutes and hours', () => {
      const summary = calculateCMESummary(mockSessions);
      
      expect(summary.totalMinutes).toBe(57); // 10 + 7 + 15 + 20 + 5
      expect(summary.totalHours).toBeCloseTo(0.95, 2); // 57 / 60
      expect(summary.totalSessions).toBe(5);
    });

    it('should correctly aggregate by activity type', () => {
      const summary = calculateCMESummary(mockSessions);
      
      // Direct observation: 10 + 7 = 17 minutes, 2 sessions
      expect(summary.breakdownByActivity.direct_observation.minutes).toBe(17);
      expect(summary.breakdownByActivity.direct_observation.count).toBe(2);
      
      // Chart review: 15 minutes, 1 session
      expect(summary.breakdownByActivity.chart_review.minutes).toBe(15);
      expect(summary.breakdownByActivity.chart_review.count).toBe(1);
      
      // End of rotation: 20 minutes, 1 session
      expect(summary.breakdownByActivity.end_of_rotation.minutes).toBe(20);
      expect(summary.breakdownByActivity.end_of_rotation.count).toBe(1);
      
      // Narrative feedback: 5 minutes, 1 session
      expect(summary.breakdownByActivity.narrative_feedback.minutes).toBe(5);
      expect(summary.breakdownByActivity.narrative_feedback.count).toBe(1);
      
      // Group teaching and other: 0
      expect(summary.breakdownByActivity.group_teaching.minutes).toBe(0);
      expect(summary.breakdownByActivity.group_teaching.count).toBe(0);
      expect(summary.breakdownByActivity.other.minutes).toBe(0);
      expect(summary.breakdownByActivity.other.count).toBe(0);
    });

    it('should calculate average hours per week correctly', () => {
      const summary = calculateCMESummary(mockSessions);
      
      // Sessions span from Jan 15 to Jan 19 = ~4 days = ~0.57 weeks
      // Total hours: 0.95, so average should be ~1.67 hours/week
      expect(summary.averageHoursPerWeek).toBeGreaterThan(0);
      expect(summary.averageHoursPerWeek).toBeLessThan(10);
    });

    it('should filter by year correctly', () => {
      const sessions2024 = mockSessions.filter(s => s.session_date.startsWith('2024'));
      const summary = calculateCMESummary(sessions2024, 2024);
      
      expect(summary.totalSessions).toBe(5);
      expect(summary.totalMinutes).toBe(57);
    });

    it('should return zero values for empty sessions array', () => {
      const summary = calculateCMESummary([]);
      
      expect(summary.totalMinutes).toBe(0);
      expect(summary.totalHours).toBe(0);
      expect(summary.totalSessions).toBe(0);
      expect(summary.averageHoursPerWeek).toBe(0);
      
      // All activity types should be zero
      Object.values(summary.breakdownByActivity).forEach(activity => {
        expect(activity.minutes).toBe(0);
        expect(activity.hours).toBe(0);
        expect(activity.count).toBe(0);
      });
    });

    it('should handle sessions spanning multiple years', () => {
      const multiYearSessions: CMESession[] = [
        ...mockSessions,
        {
          id: '6',
          supervisor_id: 'supervisor-1',
          org_id: 'org-1',
          source: 'auto_wba',
          wba_id: 'wba-5',
          wba_type: 'epa',
          activity_type: 'direct_observation',
          minutes: 10,
          description: 'EPA 2025',
          session_date: '2025-01-15',
          created_at: '2025-01-15T10:00:00Z',
          updated_at: '2025-01-15T10:00:00Z',
        },
      ];
      
      const summary2024 = calculateCMESummary(multiYearSessions, 2024);
      expect(summary2024.totalSessions).toBe(5);
      
      const summary2025 = calculateCMESummary(multiYearSessions, 2025);
      expect(summary2025.totalSessions).toBe(1);
      expect(summary2025.totalMinutes).toBe(10);
    });

    it('should correctly calculate hours for each activity type', () => {
      const summary = calculateCMESummary(mockSessions);
      
      expect(summary.breakdownByActivity.direct_observation.hours).toBeCloseTo(17 / 60, 2);
      expect(summary.breakdownByActivity.chart_review.hours).toBeCloseTo(15 / 60, 2);
      expect(summary.breakdownByActivity.end_of_rotation.hours).toBeCloseTo(20 / 60, 2);
      expect(summary.breakdownByActivity.narrative_feedback.hours).toBeCloseTo(5 / 60, 2);
    });
  });
});

