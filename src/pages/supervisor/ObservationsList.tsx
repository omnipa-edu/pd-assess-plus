/**
 * List observations with filters (learner, procedure, date range, status).
 */

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { ArrowLeft, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface ObservationRow {
  id: string;
  procedure_id: string;
  learner_id: string;
  status: string;
  created_at: string;
  submitted_at: string | null;
  procedure?: { code: string; title: string };
  learner?: { full_name: string | null };
}

const ObservationsList = () => {
  const { user, hasRole } = useAuth();
  const [observations, setObservations] = useState<ObservationRow[]>([]);
  const [procedures, setProcedures] = useState<{ id: string; title: string; code: string }[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterProcedureId, setFilterProcedureId] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    const isAdmin = hasRole("admin");
    let query = supabase
      .from("observations")
      .select("id, procedure_id, learner_id, status, created_at, submitted_at")
      .order("created_at", { ascending: false });
    if (!isAdmin) query = query.eq("observer_id", user.id);
    if (filterStatus !== "all") query = query.eq("status", filterStatus);
    if (filterProcedureId !== "all") query = query.eq("procedure_id", filterProcedureId);
    if (dateFrom) query = query.gte("created_at", `${dateFrom}T00:00:00`);
    if (dateTo) query = query.lte("created_at", `${dateTo}T23:59:59`);
    const { data, error } = await query;
    if (error) {
      setObservations([]);
      setLoading(false);
      return;
    }
    const list = (data || []) as ObservationRow[];
    if (list.length === 0) {
      setObservations([]);
      setLoading(false);
      return;
    }
    const procIds = [...new Set(list.map((o) => o.procedure_id))];
    const learnerIds = [...new Set(list.map((o) => o.learner_id))];
    const [{ data: procs }, { data: learners }] = await Promise.all([
      supabase.from("procedures").select("id, code, title").in("id", procIds),
      supabase.from("profiles").select("id, full_name").in("id", learnerIds),
    ]);
    const procMap = new Map((procs || []).map((p: { id: string; code: string; title: string }) => [p.id, p]));
    const learnerMap = new Map((learners || []).map((l: { id: string; full_name: string | null }) => [l.id, l]));
    setObservations(
      list.map((o) => ({
        ...o,
        procedure: procMap.get(o.procedure_id),
        learner: learnerMap.get(o.learner_id),
      }))
    );
    setLoading(false);
  }, [user, hasRole, filterStatus, filterProcedureId, dateFrom, dateTo]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    supabase
      .from("procedures")
      .select("id, code, title")
      .eq("status", "active")
      .order("title")
      .then(({ data }) => setProcedures((data as { id: string; title: string; code: string }[]) || []));
  }, []);

  return (
    <div className="container max-w-4xl space-y-6 py-8">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/supervisor">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to dashboard
        </Link>
      </Button>
      <div>
        <h1 className="text-3xl font-bold">Observations</h1>
        <p className="mt-2 text-muted-foreground">
          Procedure-based observations created via Run Assessment. For Quick observations (O-Score + narrative), see the learner's assessment history in My Students.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Narrow by status, procedure, and date range</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Procedure</Label>
            <Select value={filterProcedureId} onValueChange={setFilterProcedureId}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="All procedures" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {procedures.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>From date</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
          </div>
          <div className="space-y-2">
            <Label>To date</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
          <CardDescription>{observations.length} observation(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : observations.length === 0 ? (
            <p className="text-muted-foreground">No observations match your filters.</p>
          ) : (
            <ul className="space-y-2">
              {observations.map((o) => (
                <li key={o.id} className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="font-medium">{o.procedure?.title ?? o.procedure_id}</p>
                    <p className="text-sm text-muted-foreground">
                      {o.learner?.full_name ?? o.learner_id} · {o.procedure?.code ?? ""} · {o.status} ·{" "}
                      {format(new Date(o.created_at), "PPp")}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/supervisor/observations/${o.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ObservationsList;
