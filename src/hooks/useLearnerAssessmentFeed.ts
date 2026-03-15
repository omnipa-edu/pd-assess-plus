import { useMemo } from "react";

import {
  type DirectObservationAssessment,
  type EPAAssessment,
  type NarrativeAssessment,
  type ProcedureObservation,
  useStudentAssessments,
} from "@/hooks/useStudentAssessments";

export type LearnerAssessmentType = "epa" | "direct" | "narrative" | "procedure";

export interface LearnerAssessmentFeedItem {
  id: string;
  type: LearnerAssessmentType;
  created_at: string;
  title: string;
  subtitle: string;
  statusOrRating?: string;
  observerName?: string;
  summaryText?: string;
  detailHref?: string;
}

interface LearnerAssessmentSource {
  epa: EPAAssessment[];
  direct: DirectObservationAssessment[];
  narrative: NarrativeAssessment[];
  procedure: ProcedureObservation[];
}

export function buildLearnerAssessmentFeed(data?: Partial<LearnerAssessmentSource>): LearnerAssessmentFeedItem[] {
  const source = {
    epa: data?.epa ?? [],
    direct: data?.direct ?? [],
    narrative: data?.narrative ?? [],
    procedure: data?.procedure ?? [],
  };

  return [
    ...source.epa.map((assessment) => ({
      id: assessment.id,
      type: "epa" as const,
      created_at: assessment.created_at,
      title: `EPA ${assessment.epa_number}`,
      subtitle: "EPA assessment",
      statusOrRating: assessment.rating,
      observerName: assessment.supervisor_id,
      summaryText: assessment.feedback || assessment.observations || "",
    })),
    ...source.direct.map((assessment) => ({
      id: assessment.id,
      type: "direct" as const,
      created_at: assessment.created_at,
      title: assessment.procedure_type,
      subtitle: "Direct observation",
      statusOrRating: assessment.performance_rating,
      observerName: assessment.supervisor_id,
      summaryText: assessment.feedback || "",
    })),
    ...source.narrative.map((assessment) => ({
      id: assessment.id,
      type: "narrative" as const,
      created_at: assessment.created_at,
      title: `Narrative (${assessment.assessment_period})`,
      subtitle: "Narrative assessment",
      observerName: assessment.supervisor_id,
      summaryText:
        assessment.strengths && assessment.areas_for_growth
          ? `Strengths: ${assessment.strengths} | Growth: ${assessment.areas_for_growth}`
          : assessment.overall_progression || assessment.strengths || assessment.areas_for_growth || "",
    })),
    ...source.procedure.map((assessment) => ({
      id: assessment.id,
      type: "procedure" as const,
      created_at: assessment.created_at,
      title: assessment.procedure?.title ?? assessment.procedure_id,
      subtitle: assessment.procedure?.code ? `Procedure ${assessment.procedure.code}` : "Procedure observation",
      statusOrRating: assessment.status,
      observerName: assessment.observer?.full_name ?? assessment.observer_id,
      summaryText: assessment.comments || "",
      detailHref: `/student/observations/${assessment.id}`,
    })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function useLearnerAssessmentFeed() {
  const assessmentsQuery = useStudentAssessments();
  const feed = useMemo(
    () =>
      buildLearnerAssessmentFeed({
        epa: assessmentsQuery.data?.epa,
        direct: assessmentsQuery.data?.direct,
        narrative: assessmentsQuery.data?.narrative,
        procedure: assessmentsQuery.data?.procedure,
      }),
    [assessmentsQuery.data]
  );

  return {
    ...assessmentsQuery,
    feed,
  };
}
