import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';

import { useAuth } from './useAuth';

interface EPAAssessment {
  id: string;
  created_at: string;
  epa_number: string;
  rating: string;
  feedback: string;
  observations: string;
  supervisor_id: string;
}

interface DirectObservationAssessment {
  id: string;
  created_at: string;
  procedure_type: string;
  performance_rating: string;
  feedback: string;
  supervisor_id: string;
}

interface NarrativeAssessment {
  id: string;
  created_at: string;
  assessment_period: string;
  strengths: string;
  areas_for_growth: string;
  overall_progression: string;
  supervisor_id: string;
}

export function useStudentAssessments() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['student-assessments', user?.id],
    queryFn: async () => {
      if (!user) return { epa: [], direct: [], narrative: [] };

      const [epaData, directData, narrativeData] = await Promise.all([
        supabase
          .from('epa_assessments')
          .select('id, created_at, epa_number, rating, feedback, observations, supervisor_id')
          .eq('student_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('direct_observation_assessments')
          .select('id, created_at, procedure_type, performance_rating, feedback, supervisor_id')
          .eq('student_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('narrative_assessments')
          .select('id, created_at, assessment_period, strengths, areas_for_growth, overall_progression, supervisor_id')
          .eq('student_id', user.id)
          .order('created_at', { ascending: false }),
      ]);

      return {
        epa: (epaData.data || []) as EPAAssessment[],
        direct: (directData.data || []) as DirectObservationAssessment[],
        narrative: (narrativeData.data || []) as NarrativeAssessment[],
      };
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}





