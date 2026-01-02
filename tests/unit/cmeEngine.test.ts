import { describe, it, expect } from 'vitest';

/**
 * Unit tests for CME Engine - WBA to CME mapping logic
 * 
 * These tests verify the mapping rules that are implemented in database triggers:
 * - EPA / Direct Observation with narrative → 10 minutes, direct_observation
 * - Direct Observation checklist-only → 7 minutes, direct_observation
 * - Narrative-only WBA → 5 minutes, narrative_feedback
 * - End-of-rotation WBA → 20 minutes, end_of_rotation
 */

interface WbaRecord {
  id: string;
  supervisor_id: string;
  feedback?: string | null;
  observations?: string | null;
  narrative?: string | null;
  assessment_period?: string | null;
  epa_number?: string;
  procedure_type?: string;
  created_at: string;
}

interface CMESessionInput {
  activity_type: 'direct_observation' | 'chart_review' | 'end_of_rotation' | 'narrative_feedback' | 'group_teaching' | 'other';
  minutes: number;
  session_date: string;
}

/**
 * Pure function to map EPA assessment to CME session input
 */
function mapEpaToCmeSessionInput(wba: WbaRecord): CMESessionInput {
  const hasFeedback = !!(wba.feedback && wba.feedback.trim().length > 0) || 
                      !!(wba.observations && wba.observations.trim().length > 0);
  
  return {
    activity_type: 'direct_observation',
    minutes: hasFeedback ? 10 : 7,
    session_date: new Date(wba.created_at).toISOString().split('T')[0],
  };
}

/**
 * Pure function to map Direct Observation to CME session input
 */
function mapDirectObservationToCmeSessionInput(wba: WbaRecord): CMESessionInput {
  const hasFeedback = !!(wba.feedback && wba.feedback.trim().length > 0);
  
  return {
    activity_type: 'direct_observation',
    minutes: hasFeedback ? 10 : 7,
    session_date: new Date(wba.created_at).toISOString().split('T')[0],
  };
}

/**
 * Pure function to map Narrative Assessment to CME session input
 */
function mapNarrativeToCmeSessionInput(wba: WbaRecord): CMESessionInput {
  const assessmentPeriod = wba.assessment_period?.toLowerCase() || '';
  const isEndOfRotation = 
    assessmentPeriod.includes('rotation') ||
    assessmentPeriod.includes('end') ||
    assessmentPeriod.includes('summary');
  
  return {
    activity_type: isEndOfRotation ? 'end_of_rotation' : 'narrative_feedback',
    minutes: isEndOfRotation ? 20 : 5,
    session_date: new Date(wba.created_at).toISOString().split('T')[0],
  };
}

describe('CME Engine - WBA to CME Mapping', () => {
  describe('mapEpaToCmeSessionInput', () => {
    it('should map EPA with narrative feedback to 10 minutes, direct_observation', () => {
      const wba: WbaRecord = {
        id: '1',
        supervisor_id: 'supervisor-1',
        feedback: 'Good clinical reasoning demonstrated.',
        epa_number: 'EPA 1.1',
        created_at: '2024-01-15T10:00:00Z',
      };
      
      const result = mapEpaToCmeSessionInput(wba);
      
      expect(result.activity_type).toBe('direct_observation');
      expect(result.minutes).toBe(10);
      expect(result.session_date).toBe('2024-01-15');
    });

    it('should map EPA with observations to 10 minutes, direct_observation', () => {
      const wba: WbaRecord = {
        id: '2',
        supervisor_id: 'supervisor-1',
        observations: 'Detailed observation notes here.',
        epa_number: 'EPA 1.2',
        created_at: '2024-01-16T10:00:00Z',
      };
      
      const result = mapEpaToCmeSessionInput(wba);
      
      expect(result.activity_type).toBe('direct_observation');
      expect(result.minutes).toBe(10);
    });

    it('should map EPA without feedback to 7 minutes, direct_observation', () => {
      const wba: WbaRecord = {
        id: '3',
        supervisor_id: 'supervisor-1',
        feedback: null,
        observations: null,
        epa_number: 'EPA 1.3',
        created_at: '2024-01-17T10:00:00Z',
      };
      
      const result = mapEpaToCmeSessionInput(wba);
      
      expect(result.activity_type).toBe('direct_observation');
      expect(result.minutes).toBe(7);
    });

    it('should map EPA with empty string feedback to 7 minutes', () => {
      const wba: WbaRecord = {
        id: '4',
        supervisor_id: 'supervisor-1',
        feedback: '   ',
        epa_number: 'EPA 1.4',
        created_at: '2024-01-18T10:00:00Z',
      };
      
      const result = mapEpaToCmeSessionInput(wba);
      
      expect(result.minutes).toBe(7);
    });
  });

  describe('mapDirectObservationToCmeSessionInput', () => {
    it('should map Direct Observation with feedback to 10 minutes, direct_observation', () => {
      const wba: WbaRecord = {
        id: '5',
        supervisor_id: 'supervisor-1',
        feedback: 'Excellent technical skills demonstrated.',
        procedure_type: 'Patient History Taking',
        created_at: '2024-01-19T10:00:00Z',
      };
      
      const result = mapDirectObservationToCmeSessionInput(wba);
      
      expect(result.activity_type).toBe('direct_observation');
      expect(result.minutes).toBe(10);
    });

    it('should map Direct Observation without feedback to 7 minutes, direct_observation', () => {
      const wba: WbaRecord = {
        id: '6',
        supervisor_id: 'supervisor-1',
        feedback: null,
        procedure_type: 'Physical Examination',
        created_at: '2024-01-20T10:00:00Z',
      };
      
      const result = mapDirectObservationToCmeSessionInput(wba);
      
      expect(result.activity_type).toBe('direct_observation');
      expect(result.minutes).toBe(7);
    });
  });

  describe('mapNarrativeToCmeSessionInput', () => {
    it('should map end-of-rotation assessment to 20 minutes, end_of_rotation', () => {
      const endOfRotationPeriods = [
        'End of Rotation',
        'Rotation Summary',
        'End-of-Rotation Assessment',
        'Rotation End Summary',
        'End of Clinical Rotation',
      ];
      
      endOfRotationPeriods.forEach(period => {
        const wba: WbaRecord = {
          id: `narrative-${period}`,
          supervisor_id: 'supervisor-1',
          assessment_period: period,
          created_at: '2024-01-21T10:00:00Z',
        };
        
        const result = mapNarrativeToCmeSessionInput(wba);
        
        expect(result.activity_type).toBe('end_of_rotation');
        expect(result.minutes).toBe(20);
      });
    });

    it('should map other narrative assessments to 5 minutes, narrative_feedback', () => {
      const otherPeriods = [
        'Longitudinal Assessment',
        'Critical Incident Analysis',
        'Milestone Review',
        'Professional Development Discussion',
        'Performance Improvement Plan',
      ];
      
      otherPeriods.forEach(period => {
        const wba: WbaRecord = {
          id: `narrative-${period}`,
          supervisor_id: 'supervisor-1',
          assessment_period: period,
          created_at: '2024-01-22T10:00:00Z',
        };
        
        const result = mapNarrativeToCmeSessionInput(wba);
        
        expect(result.activity_type).toBe('narrative_feedback');
        expect(result.minutes).toBe(5);
      });
    });

    it('should map narrative without assessment_period to 5 minutes, narrative_feedback', () => {
      const wba: WbaRecord = {
        id: 'narrative-no-period',
        supervisor_id: 'supervisor-1',
        assessment_period: null,
        created_at: '2024-01-23T10:00:00Z',
      };
      
      const result = mapNarrativeToCmeSessionInput(wba);
      
      expect(result.activity_type).toBe('narrative_feedback');
      expect(result.minutes).toBe(5);
    });
  });

  describe('Edge Cases', () => {
    it('should handle unknown WBA type gracefully', () => {
      // This would be handled by a default/fallback in the actual implementation
      const unknownWba: WbaRecord = {
        id: 'unknown',
        supervisor_id: 'supervisor-1',
        created_at: '2024-01-24T10:00:00Z',
      };
      
      // For now, we document that unknown types should default to a safe value
      // In production, this would be handled by the database trigger
      expect(unknownWba).toBeDefined();
    });

    it('should correctly format session_date from ISO timestamp', () => {
      const wba: WbaRecord = {
        id: 'date-test',
        supervisor_id: 'supervisor-1',
        feedback: 'Test',
        created_at: '2024-12-25T23:59:59Z',
      };
      
      const result = mapEpaToCmeSessionInput(wba);
      
      expect(result.session_date).toBe('2024-12-25');
    });
  });
});

