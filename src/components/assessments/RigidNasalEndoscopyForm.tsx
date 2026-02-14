import { useState } from "react";

import { SmartFeedbackField } from "@/components/feedback/SmartFeedbackField";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import VoiceRecorder from "@/components/VoiceRecorder";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { retry } from "@/lib/retry";

interface PhysicianAssociate {
  id: string;
  name: string;
  program: string;
  year: string;
  supervisor: string;
}

interface RigidNasalEndoscopyFormProps {
  associate: PhysicianAssociate;
}

const YES_NO_NA = ["yes", "no", "na"] as const;
const ANATOMICAL_ITEMS = [
  { key: "vestibuleSeptum", label: "Vestibule & Septum" },
  { key: "inferiorTurbinateMeatus", label: "Inferior Turbinate & Meatus" },
  { key: "middleTurbinateMeatus", label: "Middle Turbinate & Meatus" },
  { key: "sphenoethmoidalRecess", label: "Sphenoethmoidal Recess" },
  { key: "nasopharynx", label: "Nasopharynx" },
  { key: "overall", label: "Overall" },
] as const;
const ENTRUSTMENT_OPTIONS = [
  { value: "not_ready", label: "Not Ready" },
  { value: "direct_supervision", label: "Direct Supervision Required" },
  { value: "indirect_supervision", label: "Indirect Supervision" },
  { value: "independent", label: "Independent Practice" },
  { value: "able_to_supervise", label: "Able to Supervise Others" },
] as const;

export default function RigidNasalEndoscopyForm({ associate }: RigidNasalEndoscopyFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    setting: "" as "" | "simulation" | "clinical",
    difficulty: "" as "" | "normal" | "difficult",
    // Section I
    indicationsStated: "" as "" | "yes" | "no" | "na",
    indicationsJustified: "" as "" | "yes" | "no" | "na",
    // Section II
    contraindicationsAbsolute: "" as "" | "yes" | "no" | "na",
    contraindicationsRelative: "" as "" | "yes" | "no" | "na",
    // Section III (0–2 each)
    vestibuleSeptum: null as number | null,
    inferiorTurbinateMeatus: null as number | null,
    middleTurbinateMeatus: null as number | null,
    sphenoethmoidalRecess: null as number | null,
    nasopharynx: null as number | null,
    overall: null as number | null,
    // Section IV – Global Performance Rating
    anatomyRating: "" as string,
    anatomyComment: "",
    handlingRating: "" as string,
    handlingComment: "",
    safetyRating: "" as string,
    safetyComment: "",
    infectionRating: "" as string,
    infectionComment: "",
    // Section V – Entrustment
    entrustmentLevel: "" as string,
  });

  const feedbackContext = {
    role: "supervisor",
    discipline: "PA / MD / NP clinical education",
    encounterType: "rigid_nasal_endoscopy",
    learnerLevel: associate.year,
    learner: { level: associate.year, role: "student", specialty: associate.program },
    context: { setting: formData.setting || "unspecified", case_type: "rigid_nasal_endoscopy", complexity: formData.difficulty || "", risk_level: "" },
    supervisorId: user?.id || "",
    studentId: associate.id,
    assessmentId: null,
    rawFeedbackRating: null,
    learnerReflection: null,
    priorGoals: [],
  };

  const anatomicalTotal =
    [formData.vestibuleSeptum, formData.inferiorTurbinateMeatus, formData.middleTurbinateMeatus, formData.sphenoethmoidalRecess, formData.nasopharynx, formData.overall]
      .filter((v): v is number => v != null && !Number.isNaN(v))
      .reduce((a, b) => a + b, 0);
  const anatomicalMax = 12;
  const anatomicalPercent = anatomicalMax > 0 ? Math.round((anatomicalTotal / anatomicalMax) * 100) : 0;

  const buildEvaluationData = () => ({
    header: {
      practitionerName: associate.name,
      evaluatorId: user?.id ?? null,
      date: formData.date,
      setting: formData.setting || null,
      difficulty: formData.difficulty || null,
    },
    sectionI: {
      indicationsStated: formData.indicationsStated || null,
      indicationsJustified: formData.indicationsJustified || null,
    },
    sectionII: {
      contraindicationsAbsolute: formData.contraindicationsAbsolute || null,
      contraindicationsRelative: formData.contraindicationsRelative || null,
    },
    sectionIII: {
      vestibuleSeptum: formData.vestibuleSeptum,
      inferiorTurbinateMeatus: formData.inferiorTurbinateMeatus,
      middleTurbinateMeatus: formData.middleTurbinateMeatus,
      sphenoethmoidalRecess: formData.sphenoethmoidalRecess,
      nasopharynx: formData.nasopharynx,
      overall: formData.overall,
      total: anatomicalTotal,
      percentage: anatomicalPercent,
    },
    sectionIV: {
      anatomyKnowledge: { rating: formData.anatomyRating ? Number(formData.anatomyRating) : null, comments: formData.anatomyComment || null },
      scopeHandling: { rating: formData.handlingRating ? Number(formData.handlingRating) : null, comments: formData.handlingComment || null },
      patientSafety: { rating: formData.safetyRating ? Number(formData.safetyRating) : null, comments: formData.safetyComment || null },
      infectionControl: { rating: formData.infectionRating ? Number(formData.infectionRating) : null, comments: formData.infectionComment || null },
    },
    sectionV: {
      entrustmentLevel: formData.entrustmentLevel || null,
    },
  });

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.entrustmentLevel) errors.entrustmentLevel = "Entrustment level is required.";
    if (!formData.anatomyRating) errors.anatomyRating = "Anatomy Knowledge rating is required.";
    if (!formData.handlingRating) errors.handlingRating = "Scope Handling rating is required.";
    if (!formData.safetyRating) errors.safetyRating = "Patient Safety rating is required.";
    if (!formData.infectionRating) errors.infectionRating = "Infection Control rating is required.";
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to submit.", variant: "destructive" });
      return;
    }
    if (!validate()) {
      toast({ title: "Validation Error", description: "Please complete all required fields.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const evaluationData = buildEvaluationData();
      const { error } = await retry(
        async () =>
          supabase
            .from("procedure_competency_evaluations")
            .insert({
              student_id: associate.id,
              supervisor_id: user.id,
              procedure_code: "rigid_nasal_endoscopy",
              evaluation_data: evaluationData,
            })
            .select()
            .single(),
        { maxRetries: 2, initialDelay: 1000 }
      );
      if (error) throw error;
      toast({ title: "Evaluation submitted", description: "Rigid Nasal Endoscopy competency evaluation has been saved." });
    } catch (e) {
      console.error(e);
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to submit evaluation.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const update = <K extends keyof typeof formData>(key: K, value: (typeof formData)[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Rigid Nasal Endoscopy</CardTitle>
          <CardDescription>Competency Evaluation Form</CardDescription>
          <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
            <p><span className="font-medium text-foreground">Practitioner:</span> {associate.name}</p>
            <p><span className="font-medium text-foreground">Evaluator:</span> {user?.user_metadata?.full_name ?? "Current user"}</p>
            <div>
              <Label className="text-muted-foreground">Date</Label>
              <input
                type="date"
                className="ml-2 rounded border bg-background px-2 py-1"
                value={formData.date}
                onChange={(e) => update("date", e.target.value)}
              />
            </div>
            <div>
              <Label className="text-muted-foreground">Setting</Label>
              <Select value={formData.setting} onValueChange={(v) => update("setting", v as typeof formData.setting)}>
                <SelectTrigger className="ml-2 w-[180px]"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="simulation">Simulation</SelectItem>
                  <SelectItem value="clinical">Clinical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-muted-foreground">Difficulty</Label>
              <Select value={formData.difficulty} onValueChange={(v) => update("difficulty", v as typeof formData.difficulty)}>
                <SelectTrigger className="ml-2 w-[180px]"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="difficult">Difficult</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Section I – Clinical Indications</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>States indications for rigid nasal endoscopy</Label>
            <RadioGroup value={formData.indicationsStated} onValueChange={(v) => update("indicationsStated", v as typeof formData.indicationsStated)} className="flex flex-wrap gap-2">
              {YES_NO_NA.map((opt) => (
                <Label
                  key={opt}
                  htmlFor={`indications-stated-${opt}`}
                  className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-border px-4 py-3 hover:bg-secondary/50 active:bg-secondary/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:ring-2 has-[[data-state=checked]]:ring-ring"
                >
                  <RadioGroupItem value={opt} id={`indications-stated-${opt}`} />
                  <span className="capitalize">{opt}</span>
                </Label>
              ))}
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label>Justifies need for procedure in this patient</Label>
            <RadioGroup value={formData.indicationsJustified} onValueChange={(v) => update("indicationsJustified", v as typeof formData.indicationsJustified)} className="flex flex-wrap gap-2">
              {YES_NO_NA.map((opt) => (
                <Label
                  key={opt}
                  htmlFor={`indications-justified-${opt}`}
                  className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-border px-4 py-3 hover:bg-secondary/50 active:bg-secondary/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:ring-2 has-[[data-state=checked]]:ring-ring"
                >
                  <RadioGroupItem value={opt} id={`indications-justified-${opt}`} />
                  <span className="capitalize">{opt}</span>
                </Label>
              ))}
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Section II – Contraindications</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Identifies absolute contraindications</Label>
            <RadioGroup value={formData.contraindicationsAbsolute} onValueChange={(v) => update("contraindicationsAbsolute", v as typeof formData.contraindicationsAbsolute)} className="flex flex-wrap gap-2">
              {YES_NO_NA.map((opt) => (
                <Label
                  key={opt}
                  htmlFor={`contra-abs-${opt}`}
                  className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-border px-4 py-3 hover:bg-secondary/50 active:bg-secondary/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:ring-2 has-[[data-state=checked]]:ring-ring"
                >
                  <RadioGroupItem value={opt} id={`contra-abs-${opt}`} />
                  <span className="capitalize">{opt}</span>
                </Label>
              ))}
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label>Identifies relative contraindications</Label>
            <RadioGroup value={formData.contraindicationsRelative} onValueChange={(v) => update("contraindicationsRelative", v as typeof formData.contraindicationsRelative)} className="flex flex-wrap gap-2">
              {YES_NO_NA.map((opt) => (
                <Label
                  key={opt}
                  htmlFor={`contra-rel-${opt}`}
                  className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-border px-4 py-3 hover:bg-secondary/50 active:bg-secondary/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:ring-2 has-[[data-state=checked]]:ring-ring"
                >
                  <RadioGroupItem value={opt} id={`contra-rel-${opt}`} />
                  <span className="capitalize">{opt}</span>
                </Label>
              ))}
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Section III – Anatomical Checklist</CardTitle>
          <CardDescription>Score each 0–2. Total: {anatomicalTotal} / {anatomicalMax} ({anatomicalPercent}%)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border border-blue-800 bg-blue-50 px-4 py-3 text-blue-900">
            <span className="font-bold">Scoring</span>: 0 = Not Seen | 1 = Partial View | 2 = Clearly Visualized
          </div>
          {ANATOMICAL_ITEMS.map(({ key, label }) => (
            <div key={key} className="flex flex-col gap-2">
              <Label className="shrink-0">{label}</Label>
              <RadioGroup
                value={formData[key]?.toString() ?? ""}
                onValueChange={(v) => update(key, v === "" ? null : Number(v))}
                className="flex flex-wrap gap-2"
              >
                {[0, 1, 2].map((n) => (
                  <Label
                    key={n}
                    htmlFor={`${key}-${n}`}
                    className="flex min-h-12 min-w-[3rem] cursor-pointer items-center justify-center gap-2 rounded-lg border border-border px-4 py-3 hover:bg-secondary/50 active:bg-secondary/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:ring-2 has-[[data-state=checked]]:ring-ring"
                  >
                    <RadioGroupItem value={String(n)} id={`${key}-${n}`} />
                    <span>{n}</span>
                  </Label>
                ))}
              </RadioGroup>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Section IV – Global Performance Rating</CardTitle>
          <CardDescription>Rate each category from 1 (Poor) to 5 (Excellent)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {[
            { ratingKey: "anatomyRating" as const, commentKey: "anatomyComment" as const, label: "Anatomy Knowledge & Visualization", placeholder: "Optional comments..." },
            { ratingKey: "handlingRating" as const, commentKey: "handlingComment" as const, label: "Scope Handling & Technique", placeholder: "Optional comments..." },
            { ratingKey: "safetyRating" as const, commentKey: "safetyComment" as const, label: "Patient Safety & Comfort", placeholder: "Optional comments..." },
            { ratingKey: "infectionRating" as const, commentKey: "infectionComment" as const, label: "Infection Control & Scope Care", placeholder: "Optional comments..." },
          ].map(({ ratingKey, commentKey, label, placeholder }) => (
            <div key={ratingKey} className="space-y-2">
              <Label>{label}</Label>
              <RadioGroup value={formData[ratingKey]} onValueChange={(v) => update(ratingKey, v)} className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Label
                    key={n}
                    htmlFor={`${ratingKey}-${n}`}
                    className="flex min-h-12 min-w-[3rem] cursor-pointer items-center justify-center gap-2 rounded-lg border border-border px-4 py-3 hover:bg-secondary/50 active:bg-secondary/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:ring-2 has-[[data-state=checked]]:ring-ring"
                  >
                    <RadioGroupItem value={String(n)} id={`${ratingKey}-${n}`} />
                    <span>{n}</span>
                  </Label>
                ))}
              </RadioGroup>
              {validationErrors[ratingKey] && (
                <p className="text-sm text-destructive">{validationErrors[ratingKey]}</p>
              )}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`comment-${commentKey}`}>Comments (optional)</Label>
                  <VoiceRecorder onTranscription={(text) => setFormData((prev) => ({ ...prev, [commentKey]: text }))} />
                </div>
                <SmartFeedbackField
                  value={formData[commentKey]}
                  onChange={(value) => setFormData((prev) => ({ ...prev, [commentKey]: value }))}
                  placeholder={placeholder}
                  minHeight="80px"
                  className="border-border bg-background"
                  context={feedbackContext}
                  textareaProps={{ id: `comment-${commentKey}` } as React.TextareaHTMLAttributes<HTMLTextAreaElement>}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Section V – Entrustment Level</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <RadioGroup value={formData.entrustmentLevel} onValueChange={(v) => update("entrustmentLevel", v)} className="space-y-2">
            {ENTRUSTMENT_OPTIONS.map(({ value, label }) => (
              <Label
                key={value}
                htmlFor={`entrust-${value}`}
                className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-border px-4 py-3 hover:bg-secondary/50 active:bg-secondary/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:ring-2 has-[[data-state=checked]]:ring-ring"
              >
                <RadioGroupItem value={value} id={`entrust-${value}`} />
                <span>{label}</span>
              </Label>
            ))}
          </RadioGroup>
          {validationErrors.entrustmentLevel && (
            <p className="text-sm text-destructive">{validationErrors.entrustmentLevel}</p>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" disabled={submitting}>Save draft</Button>
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Submitting…" : "Submit evaluation"}
        </Button>
      </div>
    </div>
  );
}
