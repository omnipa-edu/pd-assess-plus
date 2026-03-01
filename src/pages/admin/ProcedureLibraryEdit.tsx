/**
 * Procedure Builder – edit metadata and assessment form (sections/items).
 */

import { useCallback, useEffect, useState } from "react";

import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { ProcedureFormBuilder } from "@/components/assessments/ProcedureFormBuilder";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ProtectedAdminRoute } from "@/components/admin/ProtectedAdminRoute";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type ItemType =
  | "checklist"
  | "free_text"
  | "likert"
  | "entrustment"
  | "numeric_score"
  | "file_attachment_stub"
  | "epa_milestone_metadata"
  | "custom_button_set";

interface FormItem {
  id: string;
  type: ItemType;
  label: string;
  required: boolean;
  config: Record<string, unknown>;
}

interface FormSection {
  id: string;
  title: string;
  collapsible: boolean;
  order: number;
  items: FormItem[];
}

const ITEM_TYPES: { value: ItemType; label: string }[] = [
  { value: "checklist", label: "Checklist" },
  { value: "free_text", label: "Free text" },
  { value: "likert", label: "Likert scale" },
  { value: "entrustment", label: "Entrustment scale" },
  { value: "numeric_score", label: "Numeric score" },
  { value: "file_attachment_stub", label: "File attachment (stub)" },
  { value: "epa_milestone_metadata", label: "EPA/milestone" },
  { value: "custom_button_set", label: "Custom button set" },
];

function generateId() {
  return `_${Math.random().toString(36).slice(2, 11)}`;
}

const ProcedureLibraryEdit = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [procedure, setProcedure] = useState<{
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
  } | null>(null);
  const [specialties, setSpecialties] = useState<{ id: string; name: string }[]>([]);
  const [sections, setSections] = useState<FormSection[]>([]);
  const { toast } = useToast();

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const { data: proc, error: procError } = await supabase
        .from("procedures")
        .select("id, code, title, description, status, specialty_id, indications, contraindications, tags, latest_version_id")
        .eq("id", id)
        .single();
      if (procError || !proc) throw procError || new Error("Not found");
      setProcedure(proc as typeof procedure);

      const { data: specs } = await supabase
        .from("specialties")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      setSpecialties((specs as { id: string; name: string }[]) || []);

      if ((proc as { latest_version_id: string | null }).latest_version_id) {
        const { data: ver } = await supabase
          .from("procedure_versions")
          .select("assessment_form")
          .eq("id", (proc as { latest_version_id: string }).latest_version_id)
          .single();
        const form = (ver as { assessment_form: { sections?: FormSection[] } } | null)?.assessment_form;
        if (form?.sections?.length) {
          setSections(
            form.sections.map((s, i) => ({
              ...s,
              order: s.order ?? i,
              items: (s.items || []).map((it) => ({
                id: it.id || generateId(),
                type: (it.type || "free_text") as ItemType,
                label: it.label || "",
                required: !!it.required,
                config: (it.config as Record<string, unknown>) || {},
              })),
            }))
          );
        }
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
  }, [id, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const updateProcedure = (updates: Partial<NonNullable<typeof procedure>>) => {
    setProcedure((p) => (p ? { ...p, ...updates } : null));
  };

  const addSection = () => {
    setSections((prev) => [
      ...prev,
      {
        id: generateId(),
        title: "New section",
        collapsible: false,
        order: prev.length,
        items: [],
      },
    ]);
  };

  const updateSection = (sectionId: string, updates: Partial<FormSection>) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, ...updates } : s))
    );
  };

  const removeSection = (sectionId: string) => {
    setSections((prev) => prev.filter((s) => s.id !== sectionId));
  };

  const moveSection = (index: number, dir: "up" | "down") => {
    const next = [...sections];
    const swap = dir === "up" ? index - 1 : index + 1;
    if (swap < 0 || swap >= next.length) return;
    [next[index], next[swap]] = [next[swap], next[index]];
    next.forEach((s, i) => (s.order = i));
    setSections(next);
  };

  const addItem = (sectionId: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              items: [
                ...s.items,
                {
                  id: generateId(),
                  type: "free_text",
                  label: "New item",
                  required: false,
                  config: {},
                },
              ],
            }
          : s
      )
    );
  };

  const updateItem = (sectionId: string, itemId: string, updates: Partial<FormItem>) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              items: s.items.map((it) =>
                it.id === itemId ? { ...it, ...updates } : it
              ),
            }
          : s
      )
    );
  };

  const removeItem = (sectionId: string, itemId: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? { ...s, items: s.items.filter((it) => it.id !== itemId) }
          : s
      )
    );
  };

  const moveItem = (sectionId: string, itemIndex: number, dir: "up" | "down") => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s;
        const items = [...s.items];
        const swap = dir === "up" ? itemIndex - 1 : itemIndex + 1;
        if (swap < 0 || swap >= items.length) return s;
        [items[itemIndex], items[swap]] = [items[swap], items[itemIndex]];
        return { ...s, items };
      })
    );
  };

  const save = async () => {
    if (!procedure || !id) return;
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from("procedure_versions")
        .select("version_number")
        .eq("procedure_id", id)
        .order("version_number", { ascending: false })
        .limit(1)
        .maybeSingle();
      const nextVersion = ((existing as { version_number: number } | null)?.version_number ?? 0) + 1;

      const { data: newVer, error: verError } = await supabase
        .from("procedure_versions")
        .insert({
          procedure_id: id,
          version_number: nextVersion,
          assessment_form: { sections },
          created_by: user?.id ?? null,
        })
        .select()
        .single();

      if (verError) throw verError;

      const { error: upErr } = await supabase
        .from("procedures")
        .update({
          code: procedure.code,
          title: procedure.title,
          description: procedure.description || null,
          specialty_id: procedure.specialty_id || null,
          indications: procedure.indications,
          contraindications: procedure.contraindications,
          tags: procedure.tags,
          latest_version_id: newVer.id,
        })
        .eq("id", id);

      if (upErr) throw upErr;

      await supabase.from("procedure_audit_logs").insert({
        procedure_id: id,
        procedure_version_id: newVer.id,
        actor_id: user?.id ?? null,
        action: "version_created",
        diff: { sections_count: sections.length },
      });

      toast({ title: "Saved", description: "New version created." });
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

  const publish = async () => {
    if (!id) return;
    setPublishing(true);
    try {
      const { error } = await supabase
        .from("procedures")
        .update({ status: "active" })
        .eq("id", id);
      if (error) throw error;
      setProcedure((p) => (p ? { ...p, status: "active" } : null));
      toast({ title: "Published", description: "Procedure is now active." });
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to publish",
        variant: "destructive",
      });
    } finally {
      setPublishing(false);
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

  const indicationsStr = Array.isArray(procedure.indications)
    ? (procedure.indications as string[]).join("\n")
    : "";
  const contraindicationsStr = Array.isArray(procedure.contraindications)
    ? (procedure.contraindications as string[]).join("\n")
    : "";
  const tagsStr = Array.isArray(procedure.tags)
    ? (procedure.tags as string[]).join(", ")
    : "";

  return (
    <ProtectedAdminRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to={`/admin/procedure-library/${id}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={save} disabled={saving}>
                {saving ? "Saving…" : "Save new version"}
              </Button>
              {procedure.status !== "active" && (
                <Button onClick={publish} disabled={publishing}>
                  {publishing ? "Publishing…" : "Publish"}
                </Button>
              )}
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
              <CardDescription>Procedure name, specialty, description, indications, contraindications, tags</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Code</Label>
                  <Input
                    value={procedure.code}
                    onChange={(e) => updateProcedure({ code: e.target.value })}
                    maxLength={64}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={procedure.title}
                    onChange={(e) => updateProcedure({ title: e.target.value })}
                    maxLength={200}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={procedure.description || ""}
                  onChange={(e) => updateProcedure({ description: e.target.value || null })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Specialty</Label>
                <Select
                  value={procedure.specialty_id || "__none__"}
                  onValueChange={(v) => updateProcedure({ specialty_id: v === "__none__" ? null : v })}
                >
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {specialties
                      .filter((s) => s.id != null && String(s.id).trim() !== "")
                      .map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Indications (one per line)</Label>
                <Textarea
                  value={indicationsStr}
                  onChange={(e) =>
                    updateProcedure({
                      indications: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Contraindications (one per line)</Label>
                <Textarea
                  value={contraindicationsStr}
                  onChange={(e) =>
                    updateProcedure({
                      contraindications: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Tags (comma separated)</Label>
                <Input
                  value={tagsStr}
                  onChange={(e) =>
                    updateProcedure({
                      tags: e.target.value.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean),
                    })
                  }
                />
              </div>
              <div className="flex items-center gap-2">
                <Label>Status</Label>
                <Badge>{procedure.status}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Assessment form</CardTitle>
              <CardDescription>
                Build the form with a live preview. Add sections and items, then click in the preview to edit.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProcedureFormBuilder
                sections={sections}
                addSection={addSection}
                addItem={addItem}
                updateSection={updateSection}
                updateItem={updateItem}
                removeSection={removeSection}
                removeItem={removeItem}
                moveSection={moveSection}
                moveItem={moveItem}
              />
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </ProtectedAdminRoute>
  );
};

export default ProcedureLibraryEdit;
