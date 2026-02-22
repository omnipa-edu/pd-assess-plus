/**
 * Manage procedures for a program cohort (add from library, remove, configure overrides).
 */

import { useCallback, useEffect, useState } from "react";

import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { ProtectedAdminRoute } from "@/components/admin/ProtectedAdminRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface ProgramProcedureRow {
  id: string;
  program_cohort_id: string;
  procedure_id: string;
  display_order: number;
  procedure?: { code: string; title: string; status: string };
}

interface ProcedureOption {
  id: string;
  code: string;
  title: string;
  status: string;
}

const ProgramCohortAssessments = () => {
  const { cohortId } = useParams<{ cohortId: string }>();
  const [cohortName, setCohortName] = useState("");
  const [programProcedures, setProgramProcedures] = useState<ProgramProcedureRow[]>([]);
  const [allProcedures, setAllProcedures] = useState<ProcedureOption[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const load = useCallback(async () => {
    if (!cohortId) return;
    const { data: cohort } = await supabase
      .from("program_cohorts")
      .select("name")
      .eq("id", cohortId)
      .single();
    setCohortName((cohort as { name: string } | null)?.name ?? "");

    const { data: pp } = await supabase
      .from("program_procedures")
      .select("id, program_cohort_id, procedure_id, display_order")
      .eq("program_cohort_id", cohortId)
      .order("display_order");
    const list = (pp || []) as ProgramProcedureRow[];
    if (list.length > 0) {
      const { data: procs } = await supabase
        .from("procedures")
        .select("id, code, title, status")
        .in("id", list.map((p) => p.procedure_id));
      const byId = new Map((procs || []).map((p: ProcedureOption) => [p.id, p]));
      setProgramProcedures(
        list.map((p) => ({ ...p, procedure: byId.get(p.procedure_id) }))
      );
    } else {
      setProgramProcedures([]);
    }

    const { data: allP } = await supabase
      .from("procedures")
      .select("id, code, title, status")
      .eq("status", "active")
      .order("title");
    setAllProcedures((allP || []) as ProcedureOption[]);
  }, [cohortId]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const addProcedure = async (procedureId: string) => {
    if (!cohortId) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("program_procedures").insert({
        program_cohort_id: cohortId,
        procedure_id: procedureId,
        display_order: programProcedures.length,
        added_by: user?.id ?? null,
      });
      if (error) throw error;
      setAddOpen(false);
      load();
      toast({ title: "Added", description: "Procedure added to program." });
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to add",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const removeProcedure = async (programProcedureId: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("program_procedures")
        .delete()
        .eq("id", programProcedureId);
      if (error) throw error;
      load();
      toast({ title: "Removed", description: "Procedure removed from program." });
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to remove",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const alreadyAdded = new Set(programProcedures.map((p) => p.procedure_id));
  const available = allProcedures.filter((p) => !alreadyAdded.has(p.id));

  if (!cohortId) return null;

  return (
    <ProtectedAdminRoute>
      <AdminLayout>
        <div className="space-y-6">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/program-assessments">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to programs
            </Link>
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Procedures for {cohortName || "…"}</h1>
              <p className="mt-2 text-muted-foreground">
                Procedures in this program&apos;s assessment set. Supervisors can run these for learners in this program.
              </p>
            </div>
            <Button onClick={() => setAddOpen(true)} disabled={loading}>
              <Plus className="mr-2 h-4 w-4" />
              Add procedure
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Assessment set</CardTitle>
                <CardDescription>Procedures assigned to this program</CardDescription>
              </CardHeader>
              <CardContent>
                {programProcedures.length === 0 ? (
                  <p className="py-4 text-muted-foreground">No procedures yet. Add from the library.</p>
                ) : (
                  <ul className="space-y-2">
                    {programProcedures.map((pp) => (
                      <li
                        key={pp.id}
                        className="flex items-center justify-between rounded-md border p-3"
                      >
                        <div>
                          <p className="font-medium">{pp.procedure?.title ?? pp.procedure_id}</p>
                          <p className="text-sm text-muted-foreground">{pp.procedure?.code}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeProcedure(pp.id)}
                          disabled={saving}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add procedure</DialogTitle>
              <DialogDescription>
                Choose a procedure from the global library to add to this program.
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {available.length === 0 ? (
                <p className="text-muted-foreground">No active procedures left to add.</p>
              ) : (
                available.map((p) => (
                  <Button
                    key={p.id}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => addProcedure(p.id)}
                    disabled={saving}
                  >
                    {p.title} <span className="ml-2 text-muted-foreground">({p.code})</span>
                  </Button>
                ))
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </ProtectedAdminRoute>
  );
};

export default ProgramCohortAssessments;
