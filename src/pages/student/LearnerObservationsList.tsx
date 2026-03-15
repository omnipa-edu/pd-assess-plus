/**
 * Learner observations list: view your own procedure observations with filters.
 */

import { useEffect, useState } from "react";

import { format } from "date-fns";
import { ArrowLeft, Eye } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLearnerObservations } from "@/hooks/useLearnerObservations";
import { supabase } from "@/integrations/supabase/client";

const LearnerObservationsList = () => {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterProcedureId, setFilterProcedureId] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [procedures, setProcedures] = useState<{ id: string; title: string; code: string }[]>([]);

  const { data: observations = [], isLoading } = useLearnerObservations({
    status: filterStatus,
    procedureId: filterProcedureId,
    dateFrom,
    dateTo,
  });

  useEffect(() => {
    supabase
      .from("procedures")
      .select("id, code, title")
      .eq("status", "active")
      .order("title")
      .then(({ data }) => {
        setProcedures((data as { id: string; title: string; code: string }[]) || []);
      });
  }, []);

  return (
    <div className="container max-w-4xl space-y-6 py-8">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/student">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to dashboard
        </Link>
      </Button>

      <div>
        <h1 className="text-3xl font-bold">My observations</h1>
        <p className="mt-2 text-muted-foreground">View your procedure-based assessments and feedback.</p>
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
                {procedures.map((procedure) => (
                  <SelectItem key={procedure.id} value={procedure.id}>
                    {procedure.title}
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
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : observations.length === 0 ? (
            <p className="text-muted-foreground">No observations match your filters.</p>
          ) : (
            <ul className="space-y-2">
              {observations.map((observation) => (
                <li key={observation.id} className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="font-medium">{observation.procedure?.title ?? observation.procedure_id}</p>
                    <p className="text-sm text-muted-foreground">
                      {observation.procedure?.code ?? ""} · {observation.status} · Observed by {observation.observer?.full_name ?? observation.observer_id} · {" "}
                      {format(new Date(observation.created_at), "PPp")}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/student/observations/${observation.id}`}>
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

export default LearnerObservationsList;
