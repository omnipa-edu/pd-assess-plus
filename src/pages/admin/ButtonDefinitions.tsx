/**
 * Admin: CRUD button_definitions.
 */

import { useCallback, useEffect, useState } from "react";

import { Pencil, Plus, Trash2 } from "lucide-react";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ButtonDefRow {
  id: string;
  key: string;
  label: string;
  icon: string | null;
  variant: string;
  size: string;
  sort_order: number;
  tooltip: string | null;
  action_type: string;
  context_scope: string;
}

const ACTION_TYPES = ["NAVIGATE", "OPEN_MODAL", "SET_FIELD_VALUE", "CUSTOM"];
const CONTEXT_SCOPES = ["global", "procedure", "program", "procedure_instance"];

const ButtonDefinitions = () => {
  const [list, setList] = useState<ButtonDefRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    key: "",
    label: "",
    icon: "",
    variant: "default",
    size: "default",
    sort_order: 0,
    tooltip: "",
    action_type: "NAVIGATE",
    action_payload: "{}",
    context_scope: "procedure" as string,
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("button_definitions")
      .select("*")
      .order("sort_order");
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setList((data as ButtonDefRow[]) || []);
  }, [toast]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const openNew = () => {
    setEditingId(null);
    setForm({
      key: "",
      label: "",
      icon: "",
      variant: "default",
      size: "default",
      sort_order: list.length * 10,
      tooltip: "",
      action_type: "NAVIGATE",
      action_payload: "{}",
      context_scope: "procedure",
    });
    setOpen(true);
  };

  const openEdit = (row: ButtonDefRow) => {
    setEditingId(row.id);
    setForm({
      key: row.key,
      label: row.label,
      icon: row.icon ?? "",
      variant: row.variant ?? "default",
      size: row.size ?? "default",
      sort_order: row.sort_order ?? 0,
      tooltip: row.tooltip ?? "",
      action_type: (row as { action_type?: string }).action_type ?? "NAVIGATE",
      action_payload: "{}",
      context_scope: row.context_scope ?? "procedure",
    });
    setOpen(true);
  };

  const save = async () => {
    let payload: Record<string, unknown> = {};
    try {
      payload = JSON.parse(form.action_payload || "{}");
    } catch {
      toast({ title: "Invalid JSON", description: "action_payload must be valid JSON", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from("button_definitions")
          .update({
            key: form.key,
            label: form.label,
            icon: form.icon || null,
            variant: form.variant,
            size: form.size,
            sort_order: form.sort_order,
            tooltip: form.tooltip || null,
            action_type: form.action_type,
            action_payload: payload,
            context_scope: form.context_scope,
          })
          .eq("id", editingId);
        if (error) throw error;
        toast({ title: "Updated", description: "Button definition updated." });
      } else {
        const { error } = await supabase.from("button_definitions").insert({
          key: form.key,
          label: form.label,
          icon: form.icon || null,
          variant: form.variant,
          size: form.size,
          sort_order: form.sort_order,
          tooltip: form.tooltip || null,
          action_type: form.action_type,
          action_payload: payload,
          context_scope: form.context_scope,
        });
        if (error) throw error;
        toast({ title: "Created", description: "Button definition created." });
      }
      setOpen(false);
      load();
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

  const remove = async (id: string) => {
    if (!confirm("Delete this button definition?")) return;
    const { error } = await supabase.from("button_definitions").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Deleted" });
    load();
  };

  return (
    <ProtectedAdminRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Button definitions</h1>
              <p className="mt-2 text-muted-foreground">
                Global button definitions used in card, form, and workflow contexts.
              </p>
            </div>
            <Button onClick={openNew}>
              <Plus className="mr-2 h-4 w-4" />
              Add definition
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Definitions</CardTitle>
              <CardDescription>Keys must be unique. Visibility and actions are configured here.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : (
                <div className="space-y-2">
                  {list.map((row) => (
                    <div
                      key={row.id}
                      className="flex items-center justify-between rounded-md border p-3"
                    >
                      <div>
                        <p className="font-medium">{row.label}</p>
                        <p className="text-sm text-muted-foreground">
                          {row.key} · {row.action_type} · {row.context_scope}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => remove(row.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit" : "New"} button definition</DialogTitle>
              <DialogDescription>Key must be unique. Use action_payload for route or modal data.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Key</Label>
                  <Input
                    value={form.key}
                    onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))}
                    placeholder="e.g. assess_primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Label</Label>
                  <Input
                    value={form.label}
                    onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                    placeholder="Assess"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Icon (name)</Label>
                  <Input
                    value={form.icon}
                    onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                    placeholder="ClipboardList"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sort order</Label>
                  <Input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Variant</Label>
                  <Select value={form.variant} onValueChange={(v) => setForm((f) => ({ ...f, variant: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">default</SelectItem>
                      <SelectItem value="outline">outline</SelectItem>
                      <SelectItem value="ghost">ghost</SelectItem>
                      <SelectItem value="secondary">secondary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Action type</Label>
                  <Select value={form.action_type} onValueChange={(v) => setForm((f) => ({ ...f, action_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ACTION_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Context scope</Label>
                <Select value={form.context_scope} onValueChange={(v) => setForm((f) => ({ ...f, context_scope: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONTEXT_SCOPES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Action payload (JSON)</Label>
                <Input
                  value={form.action_payload}
                  onChange={(e) => setForm((f) => ({ ...f, action_payload: e.target.value }))}
                  placeholder='{"route":"/admin/procedure-library/:id/edit"}'
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save} disabled={saving}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </ProtectedAdminRoute>
  );
};

export default ButtonDefinitions;
