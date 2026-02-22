/**
 * Supervisor assessment form: load procedure + latest version, render form from assessment_form,
 * create/update observation (draft or submitted).
 */

import { useCallback, useEffect, useState } from "react";

import { ArrowLeft } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import { AssessmentFormRenderer, type FormSection } from "@/components/assessments/AssessmentFormRenderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface ProcedureVersion {
  id: string;
  procedure_id: string;
  version_number: number;
  assessment_form: { sections?: FormSection[] };
}

interface ProcedureRow {
  id: string;
  title: string;
  code: string;
  latest_version_id: string | null;
}

interface ObservationRow {
  id: string;
  form_responses: Record<string, unknown>;
  status: string;
}

const SupervisorAssessmentForm = () => {
  const [searchParams] = useSearchParams();
  const cohortId = searchParams.get("cohortId");
  const procedureId = searchParams.get("procedureId");
  const learnerId = searchParams.get("learnerId");
  const { user } = useAuth();
  const { toast } = useToast();

  const [procedure, setProcedure] = useState<ProcedureRow | null>(null);
  const [version, setVersion] = useState<ProcedureVersion | null>(null);
  const [observation, setObservation] = useState<ObservationRow | null>(null);
  const [learnerName, setLearnerName] = useState<string>("");
  const [formResponses, setFormResponses] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!procedureId || !learnerId || !user) return;
    try {
      const { data: proc, error: procErr } = await supabase
        .from("procedures")
        .select("id, title, code, latest_version_id")
        .eq("id", procedureId)
        .single();
      if (procErr || !proc) throw procErr || new Error("Procedure not found");
      setProcedure(proc as ProcedureRow);

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", learnerId)
        .single();
      setLearnerName((profile as { full_name: string } | null)?.full_name ?? "Learner");

      const vid = (proc as ProcedureRow).latest_version_id;
      if (!vid) throw new Error("Procedure has no form version");
      const { data: ver, error: verErr } = await supabase
        .from("procedure_versions")
        .select("id, procedure_id, version_number, assessment_form")
        .eq("id", vid)
        .single();
      if (verErr || !ver) throw verErr || new Error("Version not found");
      setVersion(ver as ProcedureVersion);

      const { data: existing } = await supabase
        .from("observations")
        .select("id, form_responses, status")
        .eq("procedure_id", procedureId)
        .eq("learner_id", learnerId)
        .eq("observer_id", user.id)
        .eq("status", "draft")
        .maybeSingle();
      if (existing) {
        setObservation(existing as ObservationRow);
        setFormResponses((existing as ObservationRow).form_responses ?? {});
      } else {
        const { data: inserted, error: insErr } = await supabase
          .from("observations")
          .insert({
            procedure_id: procedureId,
            procedure_version_id: vid,
            program_cohort_id: cohortId || null,
            learner_id: learnerId,
            observer_id: user.id,
            form_responses: {},
            status: "draft",
          })
          .select("id, form_responses, status")
          .single();
        if (insErr) throw insErr;
        setObservation(inserted as ObservationRow);
      }
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to load",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [procedureId, learnerId, user, cohortId, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleChange = (itemId: string, value: unknown) => {
    setFormResponses((prev) => ({ ...prev, [itemId]: value }));
  };

  const saveDraft = async () => {
    if (!observation?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("observations")
        .update({ form_responses: formResponses, status: "draft", updated_at: new Date().toISOString() })
        .eq("id", observation.id);
      if (error) throw error;
      toast({ title: "Saved", description: "Draft saved." });
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to save",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const submit = async () => {
    if (!observation?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("observations")
        .update({
          form_responses: formResponses,
          status: "submitted",
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", observation.id);
      if (error) throw error;
      setObservation((o) => (o ? { ...o, status: "submitted" } : null));
      toast({ title: "Submitted", description: "Assessment submitted." });
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to submit",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !procedure || !version) {
    return (
      <div className="container max-w-3xl py-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const sections = version.assessment_form?.sections ?? [];

  return (
    <div className="container max-w-3xl space-y-6 py-8">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/supervisor/run-assessment">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to run assessment
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{procedure.title}</CardTitle>
          <CardDescription>
            Assessing {learnerName} · {procedure.code} · v{version.version_number}
            {observation?.status === "submitted" && " · Submitted"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <AssessmentFormRenderer
            sections={sections}
            formResponses={formResponses}
            onChange={handleChange}
            disabled={observation?.status === "submitted"}
          />
          {observation?.status !== "submitted" && (
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={saveDraft} disabled={saving}>
                Save draft
              </Button>
              <Button onClick={submit} disabled={saving}>
                Submit assessment
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SupervisorAssessmentForm;
