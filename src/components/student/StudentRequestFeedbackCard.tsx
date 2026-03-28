import { useCallback, useEffect, useState } from "react";

import { Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  createSupervisorFeedbackRequest,
  notifyFeedbackRequestEmail,
} from "@/lib/feedbackRequests";

type SupervisorOption = { id: string; full_name: string | null };

export function StudentRequestFeedbackCard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [supervisors, setSupervisors] = useState<SupervisorOption[]>([]);
  const [supervisorId, setSupervisorId] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadSupervisors = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("supervisor_student_assignments")
        .select(
          `
          supervisor_id,
          supervisor:profiles!supervisor_student_assignments_supervisor_id_fkey(id, full_name)
        `
        )
        .eq("student_id", user.id)
        .eq("is_active", true);

      if (error) throw error;

      const rows = (data || []) as unknown as Array<{
        supervisor_id: string;
        supervisor: { id: string; full_name: string | null } | null;
      }>;

      const opts: SupervisorOption[] = rows
        .map((r) =>
          r.supervisor
            ? { id: r.supervisor.id, full_name: r.supervisor.full_name }
            : { id: r.supervisor_id, full_name: null }
        )
        .filter((o, i, arr) => arr.findIndex((x) => x.id === o.id) === i);

      setSupervisors(opts);
      if (opts.length === 1) setSupervisorId(opts[0].id);
    } catch (e) {
      console.error(e);
      toast({
        title: "Could not load supervisors",
        description: "Try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  useEffect(() => {
    if (open) void loadSupervisors();
  }, [open, loadSupervisors]);

  const handleSubmit = async () => {
    if (!supervisorId) {
      toast({
        title: "Select a supervisor",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      const { id } = await createSupervisorFeedbackRequest(supervisorId, message.trim() || null);
      await notifyFeedbackRequestEmail(id);
      toast({
        title: "Request sent",
        description: "Your supervisor was notified in the app and by email if they have it enabled.",
      });
      setOpen(false);
      setMessage("");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Request failed.";
      toast({
        title: "Could not send request",
        description: msg.includes("no_active") ? "You are not assigned to that supervisor." : msg,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border-0 bg-gradient-card shadow-card">
      <CardHeader>
        <CardTitle className="text-foreground">Request feedback</CardTitle>
        <CardDescription>
          Ask an assigned supervisor for debrief or coaching. They get a dashboard alert and an email.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              <Send className="mr-2 h-4 w-4" />
              Request feedback
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Request feedback</DialogTitle>
              <DialogDescription>Choose a supervisor linked to your account.</DialogDescription>
            </DialogHeader>
            {loading ? (
              <div className="flex items-center gap-2 py-6 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading supervisors…
              </div>
            ) : supervisors.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No active supervisor assignments found. Your program admin can link a supervisor.
              </p>
            ) : (
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Supervisor</Label>
                  <Select value={supervisorId} onValueChange={setSupervisorId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select supervisor" />
                    </SelectTrigger>
                    <SelectContent>
                      {supervisors.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.full_name || s.id.slice(0, 8)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fb-req-msg">Message (optional)</Label>
                  <Textarea
                    id="fb-req-msg"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Topic or timing, e.g. debrief after yesterday's clinic…"
                    rows={3}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} type="button">
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || supervisors.length === 0 || !supervisorId}
                type="button"
              >
                {submitting ? "Sending…" : "Send request"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
