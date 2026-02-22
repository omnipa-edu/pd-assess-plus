/**
 * Import procedures from CSV (name/code, specialty, description, indications, contraindications, tags).
 * Creates procedure + initial procedure_version with empty assessment_form.
 */

import { useCallback, useState } from "react";

import Papa from "papaparse";
import { ArrowLeft, Upload } from "lucide-react";
import { Link } from "react-router-dom";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { ProtectedAdminRoute } from "@/components/admin/ProtectedAdminRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { writeAudit } from "@/lib/admin/audit";
import { supabase } from "@/integrations/supabase/client";

const EXPECTED_HEADERS = ["name", "title", "code", "specialty", "description", "indications", "contraindications", "tags"];
const NORMALIZE: Record<string, string> = {
  "procedure name": "name",
  "procedure title": "title",
  "procedure code": "code",
  "specialty code": "specialty",
  "specialty name": "specialty",
};

function normalizeHeader(h: string): string {
  const lower = h.trim().toLowerCase().replace(/\s+/g, " ");
  return NORMALIZE[lower] ?? lower;
}

function parseArray(val: unknown): string[] {
  if (Array.isArray(val)) return val.map(String).filter(Boolean);
  if (typeof val === "string") {
    return val.split(/[\n,;]/).map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

const ProcedureLibraryImport = () => {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{ created: number; skipped: number; errors: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const runImport = useCallback(async () => {
    if (!file) {
      toast({ title: "No file", description: "Choose a CSV file.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setResult(null);
    const errors: string[] = [];
    let created = 0;
    let skipped = 0;

    return new Promise<void>((resolve) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (parsed) => {
          const rows = parsed.data as Record<string, string>[];
          if (!rows.length) {
            setResult({ created: 0, skipped: 0, errors: ["No rows in CSV"] });
            setLoading(false);
            resolve();
            return;
          }
          const rawHeaders = Object.keys(rows[0]);
          const headerMap: Record<string, string> = {};
          rawHeaders.forEach((h) => {
            const key = normalizeHeader(h);
            if (EXPECTED_HEADERS.includes(key) || key === "name" || key === "title" || key === "code") {
              headerMap[h] = key;
            }
          });
          const get = (row: Record<string, string>, key: string) => {
            const col = Object.keys(headerMap).find((c) => headerMap[c] === key);
            return (col && row[col]?.trim()) ?? "";
          };

          const { data: specialties } = await supabase
            .from("specialties")
            .select("id, name, code")
            .eq("is_active", true);
          const byCode = new Map((specialties || []).map((s: { code?: string; id: string }) => [String((s as { code?: string }).code ?? "").toLowerCase(), s]));
          const byName = new Map((specialties || []).map((s: { name: string; id: string }) => [String((s as { name: string }).name).toLowerCase(), s]));

          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const title = get(row, "title") || get(row, "name");
            const code = get(row, "code");
            if (!code.trim() || !title.trim()) {
              errors.push(`Row ${i + 2}: code and title/name required`);
              skipped++;
              continue;
            }
            const specVal = get(row, "specialty");
            let specialtyId: string | null = null;
            if (specVal) {
              const sByCode = byCode.get(specVal.toLowerCase());
              const sByName = byName.get(specVal.toLowerCase());
              specialtyId = (sByCode ?? sByName)?.id ?? null;
              if (!specialtyId) errors.push(`Row ${i + 2}: specialty "${specVal}" not found`);
            }
            const description = get(row, "description") || null;
            const indications = parseArray(get(row, "indications"));
            const contraindications = parseArray(get(row, "contraindications"));
            const tags = parseArray(get(row, "tags"));

            const { data: existing } = await supabase
              .from("procedures")
              .select("id")
              .eq("code", code.trim())
              .maybeSingle();
            if (existing) {
              skipped++;
              errors.push(`Row ${i + 2}: code "${code.trim()}" already exists`);
              continue;
            }

            try {
              const { data: proc, error: procError } = await supabase
                .from("procedures")
                .insert({
                  code: code.trim(),
                  title: title.trim(),
                  description: description || null,
                  status: "draft",
                  specialty_id: specialtyId,
                  indications,
                  contraindications,
                  tags,
                  created_by: user?.id ?? null,
                })
                .select("id")
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
                .select("id")
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
              });
              await writeAudit({
                action: "create",
                entity: "procedure",
                entityId: proc.id,
                metadata: { source: "csv_import", code: code.trim(), title: title.trim() },
              });
              created++;
            } catch (e) {
              errors.push(`Row ${i + 2}: ${e instanceof Error ? e.message : "Failed"}`);
              skipped++;
            }
          }
          setResult({ created, skipped, errors });
          if (created > 0) toast({ title: "Import complete", description: `${created} procedure(s) created.` });
          setLoading(false);
          resolve();
        },
        error: (err) => {
          setResult({ created: 0, skipped: 0, errors: [err.message ?? "Parse error"] });
          setLoading(false);
          resolve();
        },
      });
    });
  }, [file, user?.id, toast]);

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

          <Card>
            <CardHeader>
              <CardTitle>Import procedures from CSV</CardTitle>
              <CardDescription>
                CSV must have headers: <code>code</code>, <code>name</code> or <code>title</code>, optional{' '}
                <code>specialty</code> (code or name), <code>description</code>, <code>indications</code>,{' '}
                <code>contraindications</code>, <code>tags</code> (comma/newline separated).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="text-sm"
                />
                <Button onClick={runImport} disabled={!file || loading}>
                  <Upload className="mr-2 h-4 w-4" />
                  {loading ? "Importing…" : "Import"}
                </Button>
              </div>
              {result && (
                <div className="rounded-md border p-4 space-y-2">
                  <p className="font-medium">
                    Created: {result.created} · Skipped: {result.skipped}
                  </p>
                  {result.errors.length > 0 && (
                    <ul className="text-sm text-muted-foreground list-disc pl-4">
                      {result.errors.slice(0, 20).map((msg, i) => (
                        <li key={i}>{msg}</li>
                      ))}
                      {result.errors.length > 20 && (
                        <li>… and {result.errors.length - 20} more</li>
                      )}
                    </ul>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </ProtectedAdminRoute>
  );
};

export default ProcedureLibraryImport;
