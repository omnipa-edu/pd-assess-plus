import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';

import { useAuth } from './useAuth';

export interface EPAAssessment {
  id: string;
  created_at: string;
  epa_number: string;
  rating: string;
  feedback: string;
  observations: string;
  supervisor_id: string;
}

export interface DirectObservationAssessment {
  id: string;
  created_at: string;
  procedure_type: string;
  performance_rating: string;
  feedback: string;
  supervisor_id: string;
}

export interface NarrativeAssessment {
  id: string;
  created_at: string;
  assessment_period: string;
  strengths: string;
  areas_for_growth: string;
  overall_progression: string;
  supervisor_id: string;
}

export interface ProcedureObservation {
  id: string;
  created_at: string;
  status: string;
  procedure_id: string;
  observer_id: string;
  comments: string | null;
  submitted_at: string | null;
  procedure?: { code: string; title: string };
  observer?: { full_name: string | null };
}

export function useStudentAssessments() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['student-assessments', user?.id],
    queryFn: async () => {
      if (!user) return { epa: [], direct: [], narrative: [], procedure: [] };

      const [epaData, directData, narrativeData, procedureData] = await Promise.all([
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
        supabase
          .from('observations')
          .select('id, created_at, status, procedure_id, observer_id, comments, submitted_at')
          .eq('learner_id', user.id)
          .order('created_at', { ascending: false }),
      ]);

      const rawProcedure = (procedureData.data || []) as ProcedureObservation[];
      let procedure: ProcedureObservation[] = rawProcedure;
      if (rawProcedure.length > 0) {
        const procedureIds = [...new Set(rawProcedure.map((row) => row.procedure_id))];
        const observerIds = [...new Set(rawProcedure.map((row) => row.observer_id))];
        const [{ data: procedures }, { data: observers }] = await Promise.all([
          supabase.from('procedures').select('id, code, title').in('id', procedureIds),
          supabase.from('profiles').select('id, full_name').in('id', observerIds),
        ]);
        const procedureMap = new Map(
          (procedures || []).map((proc: { id: string; code: string; title: string }) => [proc.id, proc])
        );
        const observerMap = new Map(
          (observers || []).map((observer: { id: string; full_name: string | null }) => [observer.id, observer])
        );
        procedure = rawProcedure.map((row) => ({
          ...row,
          procedure: procedureMap.get(row.procedure_id),
          observer: observerMap.get(row.observer_id),
        }));
      }

      return {
        epa: (epaData.data || []) as EPAAssessment[],
        direct: (directData.data || []) as DirectObservationAssessment[],
        narrative: (narrativeData.data || []) as NarrativeAssessment[],
        procedure,
      };
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}





