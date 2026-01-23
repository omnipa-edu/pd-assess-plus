import { useEffect, useState } from "react";

import { CalendarDays, Loader2, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type DigestRecord = {
  id: string;
  assessment_id: string | null;
  created_at: string;
  learner_digest: {
    strengths: string[];
    priority_growth: string[];
    next_case_plan: { action: string; success_observed_as: string }[];
    reflection_prompt: string;
    follow_up: string;
  };
};

export function StudentFeedbackDigests() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [digests, setDigests] = useState<DigestRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadDigests = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("student_feedback_digests")
          .select("id, assessment_id, created_at, learner_digest")
          .eq("student_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10);

        if (error) throw error;
        setDigests((data || []) as DigestRecord[]);
      } catch (error: any) {
        console.error("Error loading feedback digests", error);
        toast({
          title: "Unable to load feedback digests",
          description: error.message || "Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadDigests();
  }, [user?.id, toast]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Feedback Digests
        </CardTitle>
        <CardDescription>
          AI-generated summaries of recent feedback with next steps and reflection prompts.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading feedback digests...
          </div>
        )}
        {!loading && digests.length === 0 && (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            No feedback digests yet.
          </div>
        )}
        {!loading &&
          digests.map((digest) => (
            <div key={digest.id} className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-3 w-3" />
                  {new Date(digest.created_at).toLocaleDateString()}
                </div>
                {digest.assessment_id && (
                  <Badge variant="secondary" className="text-xs">
                    Linked to assessment
                  </Badge>
                )}
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Strengths</h4>
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {digest.learner_digest?.strengths?.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Priority Growth</h4>
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {digest.learner_digest?.priority_growth?.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Next Case Plan</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {digest.learner_digest?.next_case_plan?.map((plan, index) => (
                    <li key={`${digest.id}-plan-${index}`}>
                      <span className="font-medium text-foreground">{plan.action}</span>
                      <div className="text-xs text-muted-foreground">
                        Success looks like: {plan.success_observed_as}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Reflection Prompt</h4>
                <p className="text-sm text-muted-foreground">{digest.learner_digest?.reflection_prompt}</p>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Follow-up</h4>
                <p className="text-sm text-muted-foreground">{digest.learner_digest?.follow_up}</p>
              </div>
            </div>
          ))}
      </CardContent>
    </Card>
  );
}
