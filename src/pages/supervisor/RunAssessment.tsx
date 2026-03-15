/**
 * Supervisor: Run assessment – select program (cohort), procedure, learner, then open assessment form.
 */

import { useCallback, useEffect, useState } from "react";

import { ArrowLeft, ArrowRight, ClipboardList } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { getSupervisorStudentAssignments } from "@/lib/student-assignments";
import { supabase } from "@/integrations/supabase/client";

interface Cohort {
  id: string;
  name: string;
  institution_id: string;
  specialty_id: string;
  is_active: boolean;
}

interface ProgramProcedure {
  id: string;
  procedure_id: string;
  procedure?: { id: string; code: string; title: string; latest_version_id: string | null };
}

interface LearnerOption {
  student_id: string;
  student_name: string;
  student_email: string;
  institution_id: string;
  program_id: string | null;
}

const RunAssessment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [procedures, setProcedures] = useState<ProgramProcedure[]>([]);
  const [learners, setLearners] = useState<LearnerOption[]>([]);
  const [cohortId, setCohortId] = useState<string>("");
  const [procedureId, setProcedureId] = useState<string>("");
  const [learnerId, setLearnerId] = useState<string>("");
  const [loadingCohorts, setLoadingCohorts] = useState(true);
  const [loadingProcedures, setLoadingProcedures] = useState(false);
  const [loadingLearners, setLoadingLearners] = useState(false);

  // Pre-select learner and/or cohort from URL (e.g. from AssessmentDashboard "Direct observation" tab)
  useEffect(() => {
    const learnerIdParam = searchParams.get("learnerId");
    const cohortIdParam = searchParams.get("cohortId");
    if (learnerIdParam) setLearnerId(learnerIdParam);
    if (cohortIdParam) setCohortId(cohortIdParam);
  }, [searchParams]);

  useEffect(() => {
    supabase
      .from("program_cohorts")
      .select("id, name, institution_id, specialty_id, is_active")
      .eq("is_active", true)
      .order("name")
      .then(({ data, error }) => {
        if (error) {
          console.error(error);
          setCohorts([]);
        } else {
          setCohorts((data as Cohort[]) || []);
        }
      })
      .finally(() => setLoadingCohorts(false));
  }, []);

  const selectedCohort = cohorts.find((c) => c.id === cohortId);

  useEffect(() => {
    if (!cohortId) {
      setProcedures([]);
      setProcedureId("");
      return;
    }
    setLoadingProcedures(true);
    supabase
      .from("program_procedures")
      .select("id, procedure_id")
      .eq("program_cohort_id", cohortId)
      .order("display_order")
      .then(({ data: ppData }) => {
        const list = (ppData || []) as { id: string; procedure_id: string }[];
        if (list.length === 0) {
          setProcedures([]);
          setProcedureId("");
          setLoadingProcedures(false);
          return;
        }
        supabase
          .from("procedures")
          .select("id, code, title, latest_version_id")
          .in("id", list.map((p) => p.procedure_id))
          .eq("status", "active")
          .then(({ data: procs }) => {
            const byId = new Map(
              (procs || []).map((p: { id: string; code: string; title: string; latest_version_id: string | null }) => [
                p.id,
                p,
              ])
            );
            setProcedures(
              list.map((pp) => ({
                id: pp.id,
                procedure_id: pp.procedure_id,
                procedure: byId.get(pp.procedure_id),
              }))
            );
            setProcedureId("");
          });
      })
      .finally(() => setLoadingProcedures(false));
  }, [cohortId]);

  const loadLearners = useCallback(() => {
    if (!user || !selectedCohort) {
      setLearners([]);
      setLearnerId("");
      return;
    }
    setLoadingLearners(true);
    getSupervisorStudentAssignments(user.id, {
      institutionId: selectedCohort.institution_id,
      programId: selectedCohort.specialty_id,
      status: "active",
    }).then((assignments) => {
      const opts: LearnerOption[] = assignments.map((a: { student_id: string; student_name?: string; student_email?: string; institution_id: string; program_id?: string | null }) => ({
        student_id: a.student_id,
        student_name: a.student_name ?? "Unknown",
        student_email: a.student_email ?? "",
        institution_id: a.institution_id,
        program_id: a.program_id ?? null,
      }));
      setLearners(opts);
      setLearnerId("");
    }).finally(() => setLoadingLearners(false));
  }, [user, selectedCohort]);

  useEffect(() => {
    if (cohortId && selectedCohort) loadLearners();
    else setLearners([]);
  }, [cohortId, selectedCohort, loadLearners]);

  const selectedProcedure = procedures.find((p) => p.procedure_id === procedureId);
  const canStart = cohortId && procedureId && learnerId && selectedProcedure?.procedure?.latest_version_id;

  const handleStartAssessment = () => {
    if (!canStart || !selectedProcedure) return;
    const params = new URLSearchParams({
      cohortId,
      procedureId,
      learnerId,
    });
    navigate(`/supervisor/assessment/new?${params.toString()}`);
  };

  return (
    <div className="container max-w-2xl space-y-8 py-8">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/supervisor">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to dashboard
        </Link>
      </Button>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ClipboardList className="h-8 w-8" />
          Run assessment
        </h1>
        <p className="text-muted-foreground">
          Select program, procedure, and learner to open the assessment form.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select program and procedure</CardTitle>
          <CardDescription>Choose the program cohort, then the procedure and learner.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Program (cohort)</Label>
            <Select value={cohortId} onValueChange={setCohortId} disabled={loadingCohorts}>
              <SelectTrigger>
                <SelectValue placeholder="Select program..." />
              </SelectTrigger>
              <SelectContent>
                {cohorts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Procedure</Label>
            <Select
              value={procedureId}
              onValueChange={setProcedureId}
              disabled={!cohortId || loadingProcedures}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select procedure..." />
              </SelectTrigger>
              <SelectContent>
                {procedures.map((p) => (
                  <SelectItem key={p.id} value={p.procedure_id}>
                    {p.procedure?.title ?? p.procedure_id} ({p.procedure?.code ?? ""})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Learner</Label>
            <Select
              value={learnerId}
              onValueChange={setLearnerId}
              disabled={!cohortId || loadingLearners}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select learner..." />
              </SelectTrigger>
              <SelectContent>
                {learners.map((l) => (
                  <SelectItem key={l.student_id} value={l.student_id}>
                    {l.student_name} {l.student_email ? `(${l.student_email})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleStartAssessment}
            disabled={!canStart}
            className="w-full sm:w-auto"
          >
            Open assessment form
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default RunAssessment;
