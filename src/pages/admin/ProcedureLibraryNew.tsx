/**
 * Create new procedure (metadata only); then redirect to Builder.
 */

import { useState } from "react";

import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { ProtectedAdminRoute } from "@/components/admin/ProtectedAdminRoute";
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
import { writeAudit } from "@/lib/admin/audit";

const ProcedureLibraryNew = () => {
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [specialtyId, setSpecialtyId] = useState<string>("");
  const [indications, setIndications] = useState("");
  const [contraindications, setContraindications] = useState("");
  const [tags, setTags] = useState("");
  const [specialties, setSpecialties] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSpecs, setLoadingSpecs] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    supabase
      .from("specialties")
      .select("id, name")
      .eq("is_active", true)
      .order("name")
      .then(({ data }) => {
        setSpecialties((data as { id: string; name: string }[]) || []);
      })
      .finally(() => setLoadingSpecs(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !title.trim()) {
      toast({
        title: "Validation",
        description: "Code and title are required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const indicationsArr = indications
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const contraindicationsArr = contraindications
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const tagsArr = tags
        .split(/[\s,]+/)
        .map((s) => s.trim())
        .filter(Boolean);

      const { data: proc, error: procError } = await supabase
        .from("procedures")
        .insert({
          code: code.trim(),
          title: title.trim(),
          description: description.trim() || null,
          status: "draft",
          specialty_id: specialtyId || null,
          indications: indicationsArr,
          contraindications: contraindicationsArr,
          tags: tagsArr,
          created_by: user?.id ?? null,
        })
        .select()
        .single();

      if (procError) throw procError;

      const { data: ver, error: verError } = await supabase
        .from("procedure_versions")
        .insert({
          procedure_id: proc.id,
          version_number: 1,
          assessment_form: { sections: [] },
          created_by: user?.id ?? null,
        })
        .select()
        .single();

      if (verError) throw verError;

      await supabase
        .from("procedures")
        .update({ latest_version_id: ver.id })
        .eq("id", proc.id);

      await supabase.from("procedure_audit_logs").insert({
        procedure_id: proc.id,
        procedure_version_id: ver.id,
        actor_id: user?.id ?? null,
        action: "created",
        diff: { code: proc.code, title: proc.title },
      });

      await writeAudit({
        action: "create",
        entity: "procedures",
        entityId: proc.id,
        diff: { after: { code: proc.code, title: proc.title } },
      });

      toast({ title: "Created", description: "Procedure created. Opening builder." });
      navigate(`/admin/procedure-library/${proc.id}/edit`);
    } catch (e) {
      console.error(e);
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to create procedure",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedAdminRoute>
      <AdminLayout>
        <div className="space-y-6">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/procedure-library">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Library
            </Link>
          </Button>

          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Create procedure</CardTitle>
              <CardDescription>Add a new procedure to the library. You can build the assessment form next.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="code">Code *</Label>
                    <Input
                      id="code"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="e.g. history-taking"
                      maxLength={64}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. History Taking"
                      maxLength={200}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Specialty</Label>
                  <Select value={specialtyId} onValueChange={setSpecialtyId} disabled={loadingSpecs}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select specialty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {specialties.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="indications">Indications (one per line)</Label>
                  <Textarea
                    id="indications"
                    value={indications}
                    onChange={(e) => setIndications(e.target.value)}
                    placeholder="Indication 1&#10;Indication 2"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contraindications">Contraindications (one per line)</Label>
                  <Textarea
                    id="contraindications"
                    value={contraindications}
                    onChange={(e) => setContraindications(e.target.value)}
                    placeholder="Contraindication 1"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma or space separated)</Label>
                  <Input
                    id="tags"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="e.g. communication, history"
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={loading}>
                    {loading ? "Creating…" : "Create and open Builder"}
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <Link to="/admin/procedure-library">Cancel</Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </ProtectedAdminRoute>
  );
};

export default ProcedureLibraryNew;
