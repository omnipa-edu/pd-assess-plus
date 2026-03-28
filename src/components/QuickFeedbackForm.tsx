import { useState } from "react";

import { ChevronDown, CheckCircle } from "lucide-react";

import { FeedbackResourceRecommendation } from "@/components/resources/FeedbackResourceRecommendation";
import { SmartFeedbackField } from "@/components/feedback/SmartFeedbackField";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FormFieldError } from "@/components/ui/FormFieldError";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import VoiceRecorder from "@/components/VoiceRecorder";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { EPA_OPTIONS, O_SCORE_OPTIONS } from "@/lib/clinical/epaCatalog";
import { logger } from "@/lib/logger";
import { retry } from "@/lib/retry";

interface PhysicianAssociate {
  id: string;
  name: string;
  program: string;
  year: string;
  supervisor: string;
}

interface QuickFeedbackFormProps {
  associate: PhysicianAssociate;
  /** Larger tap targets and sticky submit when compact layout is on */
  compactLayout?: boolean;
}

export function QuickFeedbackForm({ associate, compactLayout }: QuickFeedbackFormProps) {
  const [narrative, setNarrative] = useState("");
  const [oScore, setOScore] = useState("");
  const [epaNumber, setEpaNumber] = useState<string | "">("");
  const [clinicalSetting, setClinicalSetting] = useState("");
  const [optionalOpen, setOptionalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [recommendationOpenKey, setRecommendationOpenKey] = useState(0);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [aiUsage, setAIUsage] = useState({
    used_smart_feedback: false,
    smart_feedback_applied: false,
  });
  const { toast } = useToast();
  const { user } = useAuth();

  const epaName = epaNumber ? EPA_OPTIONS.find((e) => e.value === epaNumber)?.label : undefined;

  const feedbackContext = {
    role: "supervisor" as const,
    discipline: "PA / MD / NP clinical education",
    epaName,
    encounterType: clinicalSetting || undefined,
    learnerLevel: associate.year,
    learner: {
      level: associate.year,
      role: "student" as const,
      specialty: associate.program,
    },
    context: {
      setting: clinicalSetting || "unspecified",
      case_type: epaNumber || "quick_feedback",
      complexity: "",
      risk_level: "",
    },
    supervisorId: user?.id || "",
    studentId: associate.id,
    assessmentId,
    rawFeedbackRating: oScore ? Number(oScore) : null,
    learnerReflection: null,
    priorGoals: [] as string[],
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!oScore) errors.oScore = "O-SCORE is required";
    if (!narrative.trim()) errors.narrative = "Feedback text is required";
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to submit assessments.",
        variant: "destructive",
      });
      return;
    }
    if (!validate()) {
      toast({
        title: "Validation Error",
        description: "Please complete the required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const feedback = narrative.trim();
      const insertPayload: Record<string, unknown> = {
        student_id: associate.id,
        supervisor_id: user.id,
        epa_number: epaNumber || null,
        clinical_setting: clinicalSetting.trim() || null,
        observations: feedback,
        feedback,
        rating: oScore,
        patient_demographics: null,
        complexity: null,
        used_smart_feedback: aiUsage.used_smart_feedback,
        smart_feedback_applied: aiUsage.smart_feedback_applied,
        smart_feedback_version: aiUsage.used_smart_feedback ? "gpt-4o-mini" : null,
      };

      const result = await retry(
        async () =>
          supabase.from("epa_assessments").insert(insertPayload).select().single(),
        { maxRetries: 2, initialDelay: 1000 }
      );

      if (result.error) throw result.error;

      if (result.data?.id) {
        setAssessmentId(result.data.id);
        setRecommendationOpenKey((k) => k + 1);
      }

      if (feedback && result.data?.id) {
        try {
          const { scoreFeedback, saveFeedbackQualityScore } = await import("@/lib/feedbackScoring");
          const scores = await scoreFeedback({
            feedbackText: feedback,
            assessmentType: "epa",
            context: {
              epaName,
              encounterType: clinicalSetting || undefined,
              learnerLevel: associate.year,
            },
          });
          await saveFeedbackQualityScore(
            result.data.id,
            "epa",
            user.id,
            scores,
            aiUsage.used_smart_feedback
          );
        } catch (err) {
          logger.warn("Feedback quality scoring skipped", err);
        }
      }

      toast({
        title: "Feedback saved",
        description: "Quick feedback was recorded as an EPA observation.",
      });
    } catch (err: unknown) {
      logger.error("Quick feedback submit failed", err);
      toast({
        title: "Submit failed",
        description: err instanceof Error ? err.message : "Could not save feedback.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const padding = compactLayout ? "py-3 px-3 sm:py-6 sm:px-6" : "py-6 px-6";
  const radioItemClass = compactLayout ? "min-h-12 items-center py-2" : "";

  return (
    <SectionErrorBoundary name="QuickFeedbackForm">
      <div className={`mx-auto max-w-3xl space-y-6 ${padding}`}>
        <Card className="border-0 bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="text-foreground">Quick feedback</CardTitle>
            <CardDescription>
              O-score and narrative only. Optional EPA and setting below. Same EPA assessment record as the full form.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-foreground">O-SCORE</Label>
              <RadioGroup value={oScore} onValueChange={setOScore} className="space-y-3">
                {O_SCORE_OPTIONS.map((opt) => (
                  <div
                    key={opt.value}
                    className={`flex items-center space-x-3 rounded-lg border border-border p-3 hover:bg-secondary/50 ${radioItemClass}`}
                  >
                    <RadioGroupItem value={opt.value} id={`quick-o-${opt.value}`} />
                    <Label htmlFor={`quick-o-${opt.value}`} className="flex-1 cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <div className={`h-3 w-3 shrink-0 rounded-full ${opt.color}`} />
                        <span className="text-sm font-medium">{opt.label}</span>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              <FormFieldError error={validationErrors.oScore} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quick-narrative">Feedback (type or dictate)</Label>
              <SmartFeedbackField
                label=""
                value={narrative}
                onChange={setNarrative}
                onAIUsed={() => setAIUsage((u) => ({ ...u, used_smart_feedback: true }))}
                onAIApplied={() => setAIUsage((u) => ({ ...u, smart_feedback_applied: true }))}
                placeholder="What you observed and coaching for the learner…"
                minHeight={compactLayout ? "120px" : "160px"}
                context={feedbackContext}
              />
              <VoiceRecorder onTranscription={(text) => setNarrative((prev) => (prev ? `${prev} ${text}` : text))} />
              <FormFieldError error={validationErrors.narrative} />
            </div>

            <Collapsible open={optionalOpen} onOpenChange={setOptionalOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between" type="button">
                  Optional: EPA &amp; clinical setting
                  <ChevronDown className={`h-4 w-4 transition-transform ${optionalOpen ? "rotate-180" : ""}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label>EPA (optional)</Label>
                  <Select value={epaNumber || "__none__"} onValueChange={(v) => setEpaNumber(v === "__none__" ? "" : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Not specified" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      <SelectItem value="__none__">Not specified</SelectItem>
                      {EPA_OPTIONS.map((e) => (
                        <SelectItem key={e.value} value={e.value}>
                          {e.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quick-setting">Clinical setting (optional)</Label>
                  <Input
                    id="quick-setting"
                    value={clinicalSetting}
                    onChange={(e) => setClinicalSetting(e.target.value)}
                    placeholder="e.g. outpatient clinic, OR, wards"
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            <div
              className={
                compactLayout
                  ? "sticky bottom-0 z-10 -mx-3 border-t border-border bg-card/95 p-3 backdrop-blur sm:-mx-6 sm:px-6"
                  : ""
              }
            >
              <Button
                type="button"
                className="w-full bg-gradient-primary hover:opacity-90"
                size={compactLayout ? "lg" : "default"}
                disabled={submitting}
                onClick={handleSubmit}
              >
                {submitting ? "Saving…" : "Save quick feedback"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {assessmentId && (
          <div className="flex items-start gap-2 rounded-lg border border-assessment-good/30 bg-green-50/50 p-3 dark:bg-green-950/20">
            <CheckCircle className="mt-0.5 h-5 w-5 text-assessment-good" />
            <p className="text-sm text-muted-foreground">
              Assessment saved. You can attach resources for this learner below.
            </p>
          </div>
        )}

        <FeedbackResourceRecommendation
          supervisorId={user?.id || ""}
          associate={{ id: associate.id, name: associate.name }}
          assessmentId={assessmentId}
          autoOpenKey={recommendationOpenKey}
        />
      </div>
    </SectionErrorBoundary>
  );
}

export default QuickFeedbackForm;
