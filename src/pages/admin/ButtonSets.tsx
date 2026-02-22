/**
 * Admin: List button sets, edit set items (add/remove/reorder), attach to procedure.
 */

import { useCallback, useEffect, useState } from "react";

import { ChevronDown, ChevronUp, GripVertical, Pencil, Plus } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ButtonSetRow {
  id: string;
  name: string;
  description: string | null;
  context: string;
}

interface SetItemWithDef {
  button_definition_id: string;
  sort_order: number;
  definition?: { id: string; key: string; label: string };
}

const ButtonSets = () => {
  const [sets, setSets] = useState<ButtonSetRow[]>([]);
  const [definitions, setDefinitions] = useState<{ id: string; key: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [editSetId, setEditSetId] = useState<string | null>(null);
  const [setItems, setSetItems] = useState<SetItemWithDef[]>([]);
  const [addDefId, setAddDefId] = useState<string>("");
  const [procedureId, setProcedureId] = useState<string>("");
  const [procedureContext, setProcedureContext] = useState<string>("card");
  const [attachOpen, setAttachOpen] = useState(false);
  const [procedures, setProcedures] = useState<{ id: string; title: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const loadSets = useCallback(async () => {
    const { data } = await supabase.from("button_sets").select("*").order("name");
    setSets((data as ButtonSetRow[]) || []);
  }, []);

  useEffect(() => {
    const load = async () => {
      const [setsRes, defsRes] = await Promise.all([
        supabase.from("button_sets").select("*").order("name"),
        supabase.from("button_definitions").select("id, key, label").order("sort_order"),
      ]);
      setSets((setsRes.data as ButtonSetRow[]) || []);
      setDefinitions((defsRes.data as { id: string; key: string; label: string }[]) || []);
      const { data: procs } = await supabase.from("procedures").select("id, title").order("title");
      setProcedures((procs as { id: string; title: string }[]) || []);
    };
    load().finally(() => setLoading(false));
  }, []);

  const loadSetItems = useCallback(async (setId: string) => {
    const { data: items } = await supabase
      .from("button_set_items")
      .select("button_definition_id, sort_order")
      .eq("button_set_id", setId)
      .order("sort_order");
    const list = (items || []) as SetItemWithDef[];
    if (list.length > 0) {
      const { data: defs } = await supabase
        .from("button_definitions")
        .select("id, key, label")
        .in("id", list.map((i) => i.button_definition_id));
      const byId = new Map((defs || []).map((d: { id: string; key: string; label: string }) => [d.id, d]));
      setSetItems(list.map((i) => ({ ...i, definition: byId.get(i.button_definition_id) })));
    } else {
      setSetItems([]);
    }
  }, []);

  useEffect(() => {
    if (editSetId) loadSetItems(editSetId);
  }, [editSetId, loadSetItems]);

  const openEdit = (setId: string) => {
    setEditSetId(setId);
  };

  const addToSet = async () => {
    if (!editSetId || !addDefId) return;
    setSaving(true);
    const nextOrder = setItems.length > 0 ? Math.max(...setItems.map((i) => i.sort_order)) + 1 : 0;
    const { error } = await supabase.from("button_set_items").insert({
      button_set_id: editSetId,
      button_definition_id: addDefId,
      sort_order: nextOrder,
    });
    if (error) {
      if (error.code === "23505") toast({ title: "Already in set", variant: "destructive" });
      else toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      loadSetItems(editSetId);
      setAddDefId("");
    }
    setSaving(false);
  };

  const removeFromSet = async (defId: string) => {
    if (!editSetId) return;
    await supabase
      .from("button_set_items")
      .delete()
      .eq("button_set_id", editSetId)
      .eq("button_definition_id", defId);
    loadSetItems(editSetId);
  };

  const moveItem = async (index: number, dir: "up" | "down") => {
    if (!editSetId || setItems.length === 0) return;
    const next = [...setItems];
    const swap = dir === "up" ? index - 1 : index + 1;
    if (swap < 0 || swap >= next.length) return;
    [next[index], next[swap]] = [next[swap], next[index]];
    next.forEach((item, i) => (item.sort_order = i));
    setSetItems(next);
    setSaving(true);
    for (const item of next) {
      await supabase
        .from("button_set_items")
        .update({ sort_order: item.sort_order })
        .eq("button_set_id", editSetId)
        .eq("button_definition_id", item.button_definition_id);
    }
    setSaving(false);
  };

  const attachToProcedure = async () => {
    if (!procedureId || !editSetId) return;
    setSaving(true);
    const { error } = await supabase.from("procedure_button_set").upsert({
      procedure_id: procedureId,
      context: procedureContext as "card" | "form" | "workflow",
      button_set_id: editSetId,
    }, { onConflict: "procedure_id,context" });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Attached", description: "Button set attached to procedure." });
      setAttachOpen(false);
    }
    setSaving(false);
  };

  const currentSet = sets.find((s) => s.id === editSetId);
  const availableDefs = definitions.filter((d) => !setItems.some((i) => i.button_definition_id === d.id));

  return (
    <ProtectedAdminRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Button sets</h1>
            <p className="mt-2 text-muted-foreground">
              Group button definitions for card, form, or workflow. Assign sets to procedures.
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Sets</CardTitle>
              <CardDescription>Click Edit to add/remove/reorder buttons. Use Assign to attach a set to a procedure.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : (
                <div className="space-y-2">
                  {sets.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between rounded-md border p-3"
                    >
                      <div>
                        <p className="font-medium">{s.name}</p>
                        <p className="text-sm text-muted-foreground">{s.description ?? s.context}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => openEdit(s.id)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {editSetId && currentSet && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Edit: {currentSet.name}</CardTitle>
                    <CardDescription>Add or remove buttons and reorder.</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setAttachOpen(true)}>
                      Assign to procedure
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditSetId(null)}>
                      Close
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Select value={addDefId} onValueChange={setAddDefId}>
                    <SelectTrigger className="w-56">
                      <SelectValue placeholder="Add button..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDefs.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.label} ({d.key})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={addToSet} disabled={!addDefId || saving}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add
                  </Button>
                </div>
                <ul className="space-y-2">
                  {setItems.map((item, index) => (
                    <li
                      key={item.button_definition_id}
                      className="flex items-center gap-2 rounded-md border p-2"
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 font-medium">
                        {item.definition?.label ?? item.button_definition_id}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => moveItem(index, "up")}
                        disabled={index === 0 || saving}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => moveItem(index, "down")}
                        disabled={index === setItems.length - 1 || saving}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromSet(item.button_definition_id)}
                      >
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        <Dialog open={attachOpen} onOpenChange={setAttachOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign set to procedure</DialogTitle>
              <DialogDescription>
                This procedure will use the selected button set for the chosen context (e.g. card).
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Procedure</label>
                <Select value={procedureId} onValueChange={setProcedureId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select procedure..." />
                  </SelectTrigger>
                  <SelectContent>
                    {procedures.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Context</label>
                <Select value={procedureContext} onValueChange={setProcedureContext}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="card">card</SelectItem>
                    <SelectItem value="form">form</SelectItem>
                    <SelectItem value="workflow">workflow</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAttachOpen(false)}>Cancel</Button>
              <Button onClick={attachToProcedure} disabled={!procedureId || saving}>Assign</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </ProtectedAdminRoute>
  );
};

export default ButtonSets;
