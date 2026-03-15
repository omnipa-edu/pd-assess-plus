/**
 * Learner observation detail: metadata and form responses (read-only).
 */

import { useEffect, useState } from "react";

import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { AssessmentFormRenderer, type FormSection } from "@/components/assessments/AssessmentFormRenderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface ObservationDetailRow {
  id: string;
  procedure_id: string;
  procedure_version_id: string;
  program_cohort_id: string | null;
  learner_id: string;
  observer_id: string;
  status: string;
  form_responses: Record<string, unknown>;
  comments: string | null;
  created_at: string;
  submitted_at: string | null;
  procedure?: { code: string; title: string };
  learner?: { full_name: string | null };
  observer?: { full_name: string | null };
  version?: { version_number: number; assessment_form: { sections?: FormSection[] } };
}

const LearnerObservationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [observation, setObservation] = useState<ObservationDetailRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    supabase
      .from("observations")
      .select(
        "id, procedure_id, procedure_version_id, program_cohort_id, learner_id, observer_id, status, form_responses, comments, created_at, submitted_at"
      )
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setObservation(null);
          setLoading(false);
          return;
        }

        const row = data as ObservationDetailRow;
        Promise.all([
          supabase.from("procedures").select("code, title").eq("id", row.procedure_id).single(),
          supabase.from("profiles").select("full_name").eq("id", row.learner_id).single(),
          supabase.from("profiles").select("full_name").eq("id", row.observer_id).single(),
          supabase
            .from("procedure_versions")
            .select("version_number, assessment_form")
            .eq("id", row.procedure_version_id)
            .single(),
        ]).then(([procedure, learner, observer, version]) => {
          setObservation({
            ...row,
            procedure: (procedure.data as { code: string; title: string } | null) ?? undefined,
            learner: (learner.data as { full_name: string | null } | null) ?? undefined,
            observer: (observer.data as { full_name: string | null } | null) ?? undefined,
            version: (version.data as { version_number: number; assessment_form: { sections?: FormSection[] } } | null) ?? undefined,
          });
        });
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="container max-w-3xl py-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!observation) {
    return (
      <div className="container max-w-3xl py-8">
        <p className="text-muted-foreground">Observation not found.</p>
        <Button variant="link" asChild>
          <Link to="/student/observations">Back to list</Link>
        </Button>
      </div>
    );
  }

  const sections = observation.version?.assessment_form?.sections ?? [];

  return (
    <div className="container max-w-3xl space-y-6 py-8">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/student/observations">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to observations
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{observation.procedure?.title ?? observation.procedure_id}</CardTitle>
          <CardDescription className="flex flex-wrap items-center gap-2">
            <span>{observation.learner?.full_name ?? observation.learner_id}</span>
            <span>·</span>
            <span>{observation.procedure?.code ?? ""}</span>
            <span>·</span>
            {observation.version && <span>v{observation.version.version_number}</span>}
            <span>·</span>
            <Badge variant={observation.status === "submitted" ? "default" : "secondary"}>{observation.status}</Badge>
            <span>·</span>
            <span>Observed by {observation.observer?.full_name ?? observation.observer_id}</span>
            <span>·</span>
            <span>{format(new Date(observation.created_at), "PPp")}</span>
            {observation.submitted_at && (
              <>
                <span>·</span>
                <span>Submitted {format(new Date(observation.submitted_at), "PPp")}</span>
              </>
            )}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {sections.length > 0 ? (
            <AssessmentFormRenderer
              sections={sections}
              formResponses={observation.form_responses ?? {}}
              onChange={() => {}}
              disabled
            />
          ) : (
            <pre className="overflow-auto rounded bg-muted p-4 text-sm">
              {JSON.stringify(observation.form_responses, null, 2)}
            </pre>
          )}

          {observation.comments && (
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium text-muted-foreground">Comments</p>
              <p className="mt-1">{observation.comments}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LearnerObservationDetail;
