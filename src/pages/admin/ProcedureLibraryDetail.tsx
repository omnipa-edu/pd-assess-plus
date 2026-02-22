/**
 * Procedure Library Detail – view current version, version history, audit log.
 * Actions: Duplicate as template, Revert to version.
 */

import { useEffect, useState } from "react";

import { ArrowLeft, Copy, Download, History, RotateCcw } from "lucide-react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { ProtectedAdminRoute } from "@/components/admin/ProtectedAdminRoute";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ProcedureRow {
  id: string;
  code: string;
  title: string;
  description: string | null;
  status: string;
  specialty_id: string | null;
  indications: unknown;
  contraindications: unknown;
  tags: unknown;
  latest_version_id: string | null;
  created_at: string;
  updated_at: string;
}

interface ProcedureVersionRow {
  id: string;
  procedure_id: string;
  version_number: number;
  assessment_form: unknown;
  created_at: string;
}

interface ProcedureAuditRow {
  id: string;
  procedure_id: string;
  procedure_version_id: string | null;
  actor_id: string | null;
  action: string;
  diff: unknown;
  snapshot_hash: string | null;
  created_at: string;
}

const ProcedureLibraryDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [procedure, setProcedure] = useState<ProcedureRow | null>(null);
  const [versions, setVersions] = useState<ProcedureVersionRow[]>([]);
  const [auditLogs, setAuditLogs] = useState<ProcedureAuditRow[]>([]);
  const [specialtyName, setSpecialtyName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reverting, setReverting] = useState<string | null>(null);
  const [duplicating, setDuplicating] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) loadProcedure();
  }, [id]);

  const loadProcedure = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const { data: proc, error: procError } = await supabase
        .from("procedures")
        .select("*")
        .eq("id", id)
        .single();

      if (procError || !proc) {
        toast({ title: "Not found", description: "Procedure not found.", variant: "destructive" });
        navigate("/admin/procedure-library");
        return;
      }

      setProcedure(proc as ProcedureRow);

      if ((proc as ProcedureRow).specialty_id) {
        const { data: spec } = await supabase
          .from("specialties")
          .select("name")
          .eq("id", (proc as ProcedureRow).specialty_id)
          .single();
        setSpecialtyName(spec?.name ?? null);
      }

      const { data: vers } = await supabase
        .from("procedure_versions")
        .select("id, procedure_id, version_number, assessment_form, created_at")
        .eq("procedure_id", id)
        .order("version_number", { ascending: false });
      setVersions((vers || []) as ProcedureVersionRow[]);

      const { data: audit } = await supabase
        .from("procedure_audit_logs")
        .select("id, procedure_id, procedure_version_id, actor_id, action, diff, snapshot_hash, created_at")
        .eq("procedure_id", id)
        .order("created_at", { ascending: false })
        .limit(50);
      setAuditLogs((audit || []) as ProcedureAuditRow[]);
    } catch (e) {
      console.error(e);
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to load procedure",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async () => {
    if (!procedure) return;
    setDuplicating(true);
    try {
      const { data: newProc, error: insertError } = await supabase
        .from("procedures")
        .insert({
          code: `${procedure.code}-copy-${Date.now().toString(36)}`,
          title: `${procedure.title} (copy)`,
          description: procedure.description,
          status: "draft",
          specialty_id: procedure.specialty_id,
          indications: procedure.indications,
          contraindications: procedure.contraindications,
          tags: procedure.tags,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const latestVersion = versions[0];
      if (latestVersion) {
        const { data: newVer } = await supabase
          .from("procedure_versions")
          .insert({
            procedure_id: newProc.id,
            version_number: 1,
            assessment_form: latestVersion.assessment_form,
          })
          .select()
          .single();
        if (newVer) {
          await supabase
            .from("procedures")
            .update({ latest_version_id: newVer.id })
            .eq("id", newProc.id);
        }
      }

      toast({ title: "Duplicated", description: "Procedure duplicated as draft." });
      navigate(`/admin/procedure-library/${newProc.id}/edit`);
    } catch (e) {
      console.error(e);
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to duplicate",
        variant: "destructive",
      });
    } finally {
      setDuplicating(false);
    }
  };

  const handleRevert = async (versionId: string) => {
    if (!procedure) return;
    setReverting(versionId);
    try {
      const ver = versions.find((v) => v.id === versionId);
      if (!ver) throw new Error("Version not found");

      const { data: newVer, error: verError } = await supabase
        .from("procedure_versions")
        .insert({
          procedure_id: procedure.id,
          version_number: versions.length + 1,
          assessment_form: ver.assessment_form,
        })
        .select()
        .single();

      if (verError) throw verError;

      await supabase
        .from("procedures")
        .update({ latest_version_id: newVer.id })
        .eq("id", procedure.id);

      await supabase.from("procedure_audit_logs").insert({
        procedure_id: procedure.id,
        procedure_version_id: newVer.id,
        actor_id: (await supabase.auth.getUser()).data.user?.id ?? null,
        action: "reverted",
        diff: { reverted_to_version: ver.version_number },
      });

      toast({ title: "Reverted", description: `Reverted to version ${ver.version_number}.` });
      loadProcedure();
    } catch (e) {
      console.error(e);
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to revert",
        variant: "destructive",
      });
    } finally {
      setReverting(null);
    }
  };

  if (loading || !procedure) {
    return (
      <ProtectedAdminRoute>
        <AdminLayout>
          <div className="flex justify-center py-12">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </AdminLayout>
      </ProtectedAdminRoute>
    );
  }

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    retired: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  };

  const defaultTab = tabParam === "versions" ? "versions" : tabParam === "audit" ? "audit" : "overview";

  return (
    <ProtectedAdminRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/procedure-library">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Library
              </Link>
            </Button>
          </div>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{procedure.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="font-mono">
                  {procedure.code}
                </Badge>
                <Badge className={statusColors[procedure.status] ?? ""}>{procedure.status}</Badge>
                {specialtyName && (
                  <span className="text-sm text-muted-foreground">{specialtyName}</span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleDuplicate} disabled={duplicating}>
                <Copy className="mr-2 h-4 w-4" />
                {duplicating ? "Duplicating…" : "Duplicate as template"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const latestVersion = versions.find((v) => v.id === procedure.latest_version_id);
                  const exportData = {
                    ...procedure,
                    assessment_form: latestVersion?.assessment_form ?? { sections: [] },
                    exported_at: new Date().toISOString(),
                  };
                  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
                  const a = document.createElement("a");
                  a.href = URL.createObjectURL(blob);
                  a.download = `procedure-${procedure.code}-${procedure.id.slice(0, 8)}.json`;
                  a.click();
                  URL.revokeObjectURL(a.href);
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Export JSON
              </Button>
              <Button variant="outline" asChild>
                <Link to={`/admin/procedure-library/${procedure.id}/edit`}>Edit / Builder</Link>
              </Button>
            </div>
          </div>

          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="versions">Version history</TabsTrigger>
              <TabsTrigger value="audit">Audit log</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Details</CardTitle>
                  <CardDescription>Procedure metadata and current form</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {procedure.description && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Description</p>
                      <p className="mt-1">{procedure.description}</p>
                    </div>
                  )}
                  {Array.isArray(procedure.indications) && (procedure.indications as unknown[]).length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Indications</p>
                      <ul className="mt-1 list-disc pl-5">
                        {(procedure.indications as string[]).map((i, idx) => (
                          <li key={idx}>{i}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {Array.isArray(procedure.contraindications) && (procedure.contraindications as unknown[]).length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Contraindications</p>
                      <ul className="mt-1 list-disc pl-5">
                        {(procedure.contraindications as string[]).map((c, idx) => (
                          <li key={idx}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {Array.isArray(procedure.tags) && (procedure.tags as unknown[]).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {(procedure.tags as string[]).map((t, idx) => (
                        <Badge key={idx} variant="secondary">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {versions.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Current version</p>
                      <p className="mt-1">Version {versions[0].version_number} (used for new assessments)</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="versions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Version history</CardTitle>
                  <CardDescription>Immutable snapshots. Revert to restore a previous form.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Version</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="w-[120px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {versions.map((v) => (
                        <TableRow key={v.id}>
                          <TableCell className="font-medium">{v.version_number}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(v.created_at).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {v.id !== procedure.latest_version_id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRevert(v.id)}
                                disabled={reverting === v.id}
                              >
                                <RotateCcw className="mr-1 h-3.5 w-3.5" />
                                {reverting === v.id ? "Reverting…" : "Revert to this"}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="audit" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Audit log</CardTitle>
                  <CardDescription>Who changed what and when</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>When</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Version</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell className="text-muted-foreground">
                            {new Date(a.created_at).toLocaleString()}
                          </TableCell>
                          <TableCell>{a.action}</TableCell>
                          <TableCell>{a.procedure_version_id ? "Yes" : "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {auditLogs.length === 0 && (
                    <p className="py-4 text-center text-sm text-muted-foreground">No audit entries yet.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </AdminLayout>
    </ProtectedAdminRoute>
  );
};

export default ProcedureLibraryDetail;
