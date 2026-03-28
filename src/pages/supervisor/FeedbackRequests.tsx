import { useCallback, useEffect, useState } from "react";

import { ArrowLeft, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

import { LayoutModeToggle } from "@/components/layout/LayoutModeToggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchSupervisorFeedbackRequests,
  updateSupervisorFeedbackRequestStatus,
  type SupervisorFeedbackRequestWithStudent,
} from "@/lib/feedbackRequests";

export default function FeedbackRequestsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<SupervisorFeedbackRequestWithStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await fetchSupervisorFeedbackRequests(user.id, "all");
      setRows(data);
    } catch (e) {
      console.error(e);
      toast({
        title: "Could not load requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const markFulfilled = async (id: string) => {
    setBusyId(id);
    try {
      await updateSupervisorFeedbackRequestStatus(id, "fulfilled");
      toast({ title: "Marked fulfilled" });
      await load();
    } catch (e) {
      console.error(e);
      toast({ title: "Update failed", variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-card">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-3 px-6 py-4">
          <Button variant="ghost" asChild size="sm">
            <Link to="/supervisor">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <LayoutModeToggle />
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-6 py-8">
        <h1 className="mb-6 text-2xl font-bold text-foreground">Feedback requests</h1>
        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">No requests yet.</CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {rows.map((r) => (
              <Card key={r.id}>
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <CardTitle className="text-lg">
                      {r.student?.full_name || "Learner"}
                    </CardTitle>
                    <Badge variant={r.status === "open" ? "default" : "secondary"}>{r.status}</Badge>
                  </div>
                  <CardDescription>
                    {new Date(r.created_at).toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {r.message && <p className="text-sm text-foreground">{r.message}</p>}
                  {r.status === "open" && (
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" asChild className="bg-gradient-primary">
                        <Link to="/supervisor" state={{ openQuickAssessment: true }}>
                          Start quick feedback
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === r.id}
                        onClick={() => markFulfilled(r.id)}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Mark fulfilled
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
