import { useEffect, useState } from "react";

import { Inbox, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import {
  FeedbackRequestsSchemaUnavailableError,
  fetchSupervisorFeedbackRequests,
} from "@/lib/feedbackRequests";

export function SupervisorFeedbackRequestsCard() {
  const { user } = useAuth();
  const [openCount, setOpenCount] = useState<number | null>(null);
  const [schemaUnavailable, setSchemaUnavailable] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const rows = await fetchSupervisorFeedbackRequests(user.id, "open");
        if (!cancelled) {
          setOpenCount(rows.length);
          setSchemaUnavailable(false);
        }
      } catch (e) {
        if (!cancelled) {
          if (e instanceof FeedbackRequestsSchemaUnavailableError) {
            setSchemaUnavailable(true);
          }
          setOpenCount(0);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return (
    <Card className="border-0 bg-gradient-card shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Inbox className="h-5 w-5 text-primary" />
          Feedback requests
        </CardTitle>
        <CardDescription>
          {schemaUnavailable
            ? "This feature needs the latest database migration on your Supabase project."
            : "Learners linked to you can request debriefs. Open requests also appear in notifications."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {schemaUnavailable
            ? "Run migration 202603271000_quick_feedback_and_requests.sql (see repo supabase/migrations)."
            : openCount === null
              ? "Loading…"
              : openCount === 0
                ? "No open requests."
                : `${openCount} open request${openCount === 1 ? "" : "s"}.`}
        </p>
        {!schemaUnavailable && (
          <Button variant="outline" size="sm" asChild>
            <Link to="/supervisor/feedback-requests">
              View all
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
