/**
 * Procedure Library – global list with filters, search, create, import CSV.
 * Procedure cards show quick actions (Assess, Edit, Assign, Preview).
 */

import { useEffect, useState } from "react";

import { Plus, Search, Upload } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { ButtonSetRenderer } from "@/components/buttons/ButtonSetRenderer";
import { useAuth } from "@/hooks/useAuth";
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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export interface ProcedureLibraryItem {
  id: string;
  code: string;
  title: string;
  description: string | null;
  status: "draft" | "active" | "retired";
  specialty_id: string | null;
  indications: unknown;
  contraindications: unknown;
  tags: unknown;
  created_at: string;
  updated_at: string;
  specialty?: { id: string; name: string } | null;
}

const ProcedureLibrary = () => {
  const [procedures, setProcedures] = useState<ProcedureLibraryItem[]>([]);
  const [specialties, setSpecialties] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSpecialtyId, setFilterSpecialtyId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [extendedSchemaAvailable, setExtendedSchemaAvailable] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const role = hasRole("admin") ? "admin" : hasRole("supervisor") ? "supervisor" : "learner";
  const evalContext = { role, screenSize: "desktop" as const, procedureStatus: undefined };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const specRes = await supabase.from("specialties").select("id, name").eq("is_active", true).order("name");
      if (specRes.error) throw specRes.error;
      const specs = (specRes.data || []) as { id: string; name: string }[];
      setSpecialties(specs);

      const extendedColumns = "id, code, title, description, status, specialty_id, indications, contraindications, tags, created_at, updated_at";
      const baseColumns = "id, code, title, description, status, created_at, updated_at";
      let procsRes = await supabase
        .from("procedures")
        .select(extendedColumns)
        .order("title");

      if (procsRes.error) {
        setExtendedSchemaAvailable(false);
        procsRes = await supabase
          .from("procedures")
          .select(baseColumns)
          .order("title");
      } else {
        setExtendedSchemaAvailable(true);
      }
      if (procsRes.error) throw procsRes.error;

      const procs = (procsRes.data || []) as ProcedureLibraryItem[];
      const specialtyIds = new Set(specs.map((s) => s.id));
      const withSpecialty = procs.map((p) => ({
        ...p,
        specialty_id: p.specialty_id ?? null,
        indications: p.indications ?? null,
        contraindications: p.contraindications ?? null,
        tags: p.tags ?? null,
        specialty: p.specialty_id && specialtyIds.has(p.specialty_id)
          ? specs.find((s) => s.id === p.specialty_id) ?? null
          : null,
      }));
      setProcedures(withSpecialty);
    } catch (e) {
      console.error(e);
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to load procedures",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filtered = procedures.filter((p) => {
    if (filterStatus !== "all" && p.status !== filterStatus) return false;
    if (filterSpecialtyId !== "all" && p.specialty_id !== filterSpecialtyId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        p.code.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q) ||
        (Array.isArray(p.tags) && (p.tags as string[]).some((t) => String(t).toLowerCase().includes(q)));
      if (!match) return false;
    }
    return true;
  });

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    retired: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  };

  return (
    <ProtectedAdminRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Procedure Library</h1>
              <p className="mt-2 text-muted-foreground">
                Global procedures for assessments. Create, version, and assign to programs.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild>
                <Link to="/admin/procedure-library/import">
                  <Upload className="mr-2 h-4 w-4" />
                  Import CSV
                </Link>
              </Button>
              <Button asChild>
                <Link to="/admin/procedure-library/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create procedure
                </Link>
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="whitespace-nowrap">Status</Label>
              <Select value={filterStatus || "all"} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {extendedSchemaAvailable && (
              <div className="flex items-center gap-2">
                <Label className="whitespace-nowrap">Specialty</Label>
                <Select value={filterSpecialtyId || "all"} onValueChange={setFilterSpecialtyId}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {specialties
                      .filter((s) => s.id != null && String(s.id).trim() !== "")
                      .map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by code, title, description, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <p className="text-muted-foreground">Loading procedures...</p>
            </div>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">
                  {procedures.length === 0
                    ? "No procedures yet. Create one or import from CSV."
                    : "No procedures match the current filters."}
                </p>
                <Button className="mt-4" asChild>
                  <Link to="/admin/procedure-library/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create procedure
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((proc) => (
                <Card key={proc.id} className="flex flex-col">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="truncate text-lg">{proc.title}</CardTitle>
                        <CardDescription className="mt-1 flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="font-mono text-xs">
                            {proc.code}
                          </Badge>
                          {proc.specialty && (
                            <span className="text-xs">{proc.specialty.name}</span>
                          )}
                        </CardDescription>
                      </div>
                      <Badge className={statusColors[proc.status] ?? ""}>{proc.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-4 pt-0">
                    {proc.description && (
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {proc.description}
                      </p>
                    )}
                    <div className="mt-auto flex flex-wrap gap-2">
                      <ButtonSetRenderer
                        context="card"
                        procedureId={proc.id}
                        evalContext={{ ...evalContext, procedureStatus: proc.status }}
                        navigateBasePath="/admin/procedure-library"
                        onAction={(actionType, payload) => {
                          if (actionType === "OPEN_MODAL") {
                            const modal = payload?.modal as string | undefined;
                            if (modal === "assess") navigate(`/admin/procedure-library/${proc.id}`);
                            else if (modal === "preview") navigate(`/admin/procedure-library/${proc.id}?preview=1`);
                            else if (modal === "assign") navigate(`/admin/procedure-library/${proc.id}?tab=assign`);
                          } else if (actionType === "NAVIGATE" && typeof payload?.route === "string") {
                            navigate((payload.route as string).replace(":id", proc.id));
                          }
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </AdminLayout>
    </ProtectedAdminRoute>
  );
};

export default ProcedureLibrary;
