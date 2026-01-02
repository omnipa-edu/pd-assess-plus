import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  calculateCMESummary,
  getActivityTypeLabel,
  formatDateRange,
  exportSessionsToCSV,
} from '../cme-tracking';

import type { CMESession } from '../cme-tracking';

describe('CME Tracking Functions', () => {
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
      description: 'EPA observation with feedback',
      session_date: '2024-01-15',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
    },
    {
      id: '2',
      supervisor_id: 'supervisor-1',
      org_id: 'org-1',
      source: 'manual',
      wba_id: null,
      wba_type: null,
      activity_type: 'chart_review',
      minutes: 15,
      description: 'Chart review session',
      session_date: '2024-01-20',
      created_at: '2024-01-20T14:00:00Z',
      updated_at: '2024-01-20T14:00:00Z',
    },
    {
      id: '3',
      supervisor_id: 'supervisor-1',
      org_id: 'org-1',
      source: 'auto_wba',
      wba_id: 'wba-2',
      wba_type: 'narrative',
      activity_type: 'end_of_rotation',
      minutes: 20,
      description: 'End-of-rotation assessment',
      session_date: '2024-02-01',
      created_at: '2024-02-01T09:00:00Z',
      updated_at: '2024-02-01T09:00:00Z',
    },
  ];

  describe('calculateCMESummary', () => {
    it('should calculate correct totals', () => {
      const summary = calculateCMESummary(mockSessions);
      
      expect(summary.totalMinutes).toBe(45);
      expect(summary.totalHours).toBe(0.75);
      expect(summary.totalSessions).toBe(3);
    });

    it('should calculate breakdown by activity type', () => {
      const summary = calculateCMESummary(mockSessions);
      
      expect(summary.breakdownByActivity.direct_observation.minutes).toBe(10);
      expect(summary.breakdownByActivity.direct_observation.count).toBe(1);
      expect(summary.breakdownByActivity.chart_review.minutes).toBe(15);
      expect(summary.breakdownByActivity.chart_review.count).toBe(1);
      expect(summary.breakdownByActivity.end_of_rotation.minutes).toBe(20);
      expect(summary.breakdownByActivity.end_of_rotation.count).toBe(1);
    });

    it('should calculate average hours per week', () => {
      const summary = calculateCMESummary(mockSessions);
      
      // Sessions span from Jan 15 to Feb 1 = ~2.5 weeks
      expect(summary.averageHoursPerWeek).toBeGreaterThan(0);
      expect(summary.averageHoursPerWeek).toBeLessThan(1);
    });

    it('should filter by year correctly', () => {
      const sessions2024 = mockSessions.filter(s => s.session_date.startsWith('2024'));
      const summary = calculateCMESummary(sessions2024, 2024);
      
      expect(summary.totalSessions).toBe(3);
    });

    it('should return zero values for empty sessions', () => {
      const summary = calculateCMESummary([]);
      
      expect(summary.totalMinutes).toBe(0);
      expect(summary.totalHours).toBe(0);
      expect(summary.totalSessions).toBe(0);
      expect(summary.averageHoursPerWeek).toBe(0);
    });
  });

  describe('getActivityTypeLabel', () => {
    it('should return correct labels for all activity types', () => {
      expect(getActivityTypeLabel('direct_observation')).toBe('Direct Observation');
      expect(getActivityTypeLabel('chart_review')).toBe('Chart Review');
      expect(getActivityTypeLabel('end_of_rotation')).toBe('End-of-Rotation');
      expect(getActivityTypeLabel('narrative_feedback')).toBe('Narrative Feedback');
      expect(getActivityTypeLabel('group_teaching')).toBe('Group Teaching');
      expect(getActivityTypeLabel('other')).toBe('Other');
    });
  });

  describe('formatDateRange', () => {
    it('should format date range correctly', () => {
      const start = new Date('2024-01-15');
      const end = new Date('2024-02-01');
      const formatted = formatDateRange(start, end);
      
      expect(formatted).toContain('Jan');
      expect(formatted).toContain('Feb');
      expect(formatted).toContain('2024');
    });
  });

  describe('exportSessionsToCSV', () => {
    it('should generate valid CSV content', () => {
      const csv = exportSessionsToCSV(mockSessions);
      
      expect(csv).toContain('Date');
      expect(csv).toContain('Activity Type');
      expect(csv).toContain('Minutes');
      expect(csv).toContain('Description');
      expect(csv).toContain('Source');
      expect(csv).toContain('WBA ID');
    });

    it('should include all session data', () => {
      const csv = exportSessionsToCSV(mockSessions);
      
      expect(csv).toContain('2024-01-15');
      expect(csv).toContain('Direct Observation');
      expect(csv).toContain('10');
      expect(csv).toContain('Auto');
      expect(csv).toContain('Manual');
    });

    it('should handle empty sessions', () => {
      const csv = exportSessionsToCSV([]);
      
      expect(csv).toContain('Date');
      expect(csv.split('\n').length).toBe(2); // Header + empty line
    });

    it('should escape quotes in descriptions', () => {
      const sessionWithQuotes: CMESession = {
        ...mockSessions[0],
        description: 'Session with "quotes" in description',
      };
      const csv = exportSessionsToCSV([sessionWithQuotes]);
      
      expect(csv).toContain('""quotes""');
    });
  });
});


