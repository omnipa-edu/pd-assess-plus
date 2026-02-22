/**
 * Program Assessments – list program cohorts; link to manage procedures per cohort.
 */

import { useEffect, useState } from "react";

import { FileText } from "lucide-react";
import { Link } from "react-router-dom";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { ProtectedAdminRoute } from "@/components/admin/ProtectedAdminRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Cohort {
  id: string;
  name: string;
  specialty_id: string;
  institution_id: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  specialty?: { name: string };
}

const ProgramAssessments = () => {
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    supabase
      .from("program_cohorts")
      .select("id, name, specialty_id, institution_id, start_date, end_date, is_active")
      .order("name")
      .then(({ data, error }) => {
        if (error) {
          toast({ title: "Error", description: error.message, variant: "destructive" });
          return;
        }
        const list = (data || []) as Cohort[];
        if (list.length === 0) {
          setCohorts([]);
          setLoading(false);
          return;
        }
        supabase
          .from("specialties")
          .select("id, name")
          .in("id", list.map((c) => c.specialty_id))
          .then(({ data: specs }) => {
            const byId = new Map((specs || []).map((s: { id: string; name: string }) => [s.id, s]));
            setCohorts(
              list.map((c) => ({
                ...c,
                specialty: byId.get(c.specialty_id)
                  ? { name: (byId.get(c.specialty_id) as { name: string }).name }
                  : undefined,
              }))
            );
          });
      })
      .finally(() => setLoading(false));
  }, [toast]);

  return (
    <ProtectedAdminRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Program Assessments</h1>
            <p className="mt-2 text-muted-foreground">
              Assign procedures from the library to each program cohort. Supervisors use these when running assessments.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : cohorts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No program cohorts found. Create cohorts in your organization setup first.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cohorts.map((c) => (
                <Link key={c.id} to={`/admin/program-assessments/${c.id}`}>
                  <Card className="transition-shadow hover:shadow-md">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <FileText className="h-5 w-5" />
                        {c.name}
                      </CardTitle>
                      <CardDescription>
                        {c.specialty?.name ?? "—"} · {c.is_active ? "Active" : "Inactive"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Manage procedures for this program
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </AdminLayout>
    </ProtectedAdminRoute>
  );
};

export default ProgramAssessments;
