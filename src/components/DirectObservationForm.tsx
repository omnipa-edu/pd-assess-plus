import { useState, useEffect } from "react";

import { Eye, Target, MessageSquare } from "lucide-react";

import { SmartFeedbackField } from "@/components/feedback/SmartFeedbackField";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { FormFieldError } from "@/components/ui/FormFieldError";
import { FormSkeleton } from "@/components/ui/FormSkeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import VoiceRecorder from "@/components/VoiceRecorder";
import { FeedbackResourceRecommendation } from "@/components/resources/FeedbackResourceRecommendation";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { retry } from "@/lib/retry";

interface PhysicianAssociate {
  id: string;
  name: string;
  program: string;
  year: string;
  supervisor: string;
}

interface DirectObservationFormProps {
  associate: PhysicianAssociate;
}

const DirectObservationForm = ({ associate }: DirectObservationFormProps) => {
  const [formData, setFormData] = useState({
    activity: "",
    setting: "",
    date: "",
    observationTimeMinutes: "",
    feedbackTimeMinutes: "",
    observationType: "",
    oScore: "",
    competenciesObserved: [] as string[],
    technicalSkills: "",
    communication: "",
    professionalism: "",
    clinicalReasoning: "",
    narrative: "",
    verbalFeedbackGiven: false,
    associateResponse: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [procedures, setProcedures] = useState<Array<{ id: string; code: string; title: string }>>([]);
  const [proceduresLoading, setProceduresLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const load = async () => {
      setProceduresLoading(true);
      try {
        const { data, error } = await supabase
          .from("procedures")
          .select("id, code, title")
          .eq("status", "active")
          .order("title");
        if (error) throw error;
        setProcedures((data || []) as Array<{ id: string; code: string; title: string }>);
      } catch (e) {
        console.error("Failed to load procedures:", e);
        toast({
          title: "Could not load procedures",
          description: "Activity list may be empty. Ask an admin to add procedures.",
          variant: "destructive",
        });
      } finally {
        setProceduresLoading(false);
      }
    };
    load();
  }, [toast]);

  const competencies = [
    "Medical Expert",
    "Communicator",
    "Collaborator", 
    "Leader",
    "Health Advocate",
    "Scholar",
    "Professional"
  ];

  const oScoreOptions = [
    { value: "1", label: "1 - Required complete guidance", color: "bg-assessment-unsatisfactory" },
    { value: "2", label: "2 - Required repeated direction", color: "bg-assessment-needs-improvement" },
    { value: "3", label: "3 - Intermittent prompting required", color: "bg-assessment-satisfactory" },
    { value: "4", label: "4 - Independent, assistance for nuances", color: "bg-assessment-good" },
    { value: "5", label: "5 - Complete independence", color: "bg-assessment-excellent" }
  ];

  const feedbackContext = {
    role: "supervisor",
    discipline: "PA / MD / NP clinical education",
    encounterType: formData.activity,
    learnerLevel: associate.year,
    learner: {
      level: associate.year,
      role: "student",
      specialty: associate.program,
    },
    context: {
      setting: formData.setting || "unspecified",
      case_type: formData.activity || "direct_observation",
      complexity: "",
      risk_level: "",
    },
    supervisorId: user?.id || "",
    studentId: associate.id,
    assessmentId,
    rawFeedbackRating: formData.oScore ? Number(formData.oScore) : null,
    learnerReflection: null,
    priorGoals: [],
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

    // Validate form
    const errors: Record<string, string> = {};
    if (!formData.activity?.trim()) errors.activity = 'Activity is required';
    if (!formData.setting?.trim()) errors.setting = 'Setting is required';
    if (!formData.date?.trim()) errors.date = 'Date is required';
    if (!formData.oScore?.trim()) errors.oScore = 'O-SCORE rating is required';
    if (!formData.narrative?.trim()) errors.narrative = 'Narrative feedback is required';
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form.",
        variant: "destructive",
      });
      return;
    }
    
    setValidationErrors({});

    try {
      setSubmitting(true);
      
      // Combine feedback fields
      const feedback = [
        formData.narrative,
        formData.technicalSkills && `Technical Skills: ${formData.technicalSkills}`,
        formData.communication && `Communication: ${formData.communication}`,
        formData.professionalism && `Professionalism: ${formData.professionalism}`,
        formData.clinicalReasoning && `Clinical Reasoning: ${formData.clinicalReasoning}`,
      ]
        .filter(Boolean)
        .join('\n\n');

      // Save to database
      // Build insert payload - conditionally include time tracking fields
      const insertPayload: any = {
        student_id: associate.id,
        supervisor_id: user.id,
        procedure_type: formData.activity,
        clinical_context: formData.setting,
        performance_rating: formData.oScore,
        technical_skills: formData.technicalSkills || null,
        professionalism: formData.professionalism || null,
        feedback: feedback || null,
        areas_for_improvement: formData.associateResponse || null,
      };

      // Only include time tracking fields if they have values
      if (formData.observationTimeMinutes) {
        const obsMinutes = parseInt(formData.observationTimeMinutes);
        if (!isNaN(obsMinutes) && obsMinutes > 0) {
          insertPayload.observation_time_minutes = obsMinutes;
        }
      }
      if (formData.feedbackTimeMinutes) {
        const feedbackMinutes = parseInt(formData.feedbackTimeMinutes);
        if (!isNaN(feedbackMinutes) && feedbackMinutes > 0) {
          insertPayload.feedback_time_minutes = feedbackMinutes;
        }
      }

      // Use retry logic for critical assessment submission
      let result = await retry(
        async () => {
          return await supabase
            .from('direct_observation_assessments')
            .insert(insertPayload)
            .select()
            .single();
        },
        { maxRetries: 2, initialDelay: 1000 }
      );

      // If error is about unknown columns, try without time tracking fields
      if (result.error && (
          result.error.message?.includes('observation_time_minutes') || 
          result.error.message?.includes('feedback_time_minutes') ||
          result.error.code === '42703' ||
          result.error.message?.includes('column') && result.error.message?.includes('does not exist')
        )) {
        logger.warn('Time tracking columns not found, inserting without them. Please run the migration: 20250115_add_time_tracking_to_assessments.sql');
        result = await retry(
          async () => {
            return await supabase
              .from('direct_observation_assessments')
              .insert({
            student_id: associate.id,
            supervisor_id: user.id,
            procedure_type: formData.activity,
            clinical_context: formData.setting,
            performance_rating: formData.oScore,
            technical_skills: formData.technicalSkills || null,
            professionalism: formData.professionalism || null,
            feedback: feedback || null,
            areas_for_improvement: formData.associateResponse || null,
          })
          .select()
          .single();
          },
          { maxRetries: 2, initialDelay: 1000 }
        );
      }

      if (result.error) throw result.error;
      if (result.data?.id) {
        setAssessmentId(result.data.id);
      }

      // Database trigger will automatically create CME session
      toast({
        title: "Assessment Submitted Successfully",
        description: `Direct observation for ${associate.name} has been recorded. CME time has been automatically logged.`,
      });

      // Reset form
      setFormData({
        activity: "",
        setting: "",
        date: "",
        observationTimeMinutes: "",
        feedbackTimeMinutes: "",
        observationType: "",
        oScore: "",
        competenciesObserved: [],
        technicalSkills: "",
        communication: "",
        professionalism: "",
        clinicalReasoning: "",
        narrative: "",
        verbalFeedbackGiven: false,
        associateResponse: ""
      });
    } catch (error: unknown) {
      logger.error('Error submitting direct observation', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit assessment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitting) {
    return <FormSkeleton fields={8} />;
  }

  return (
    <SectionErrorBoundary sectionName="Direct Observation Form">
      <div className="space-y-6">
      {/* Observation Setup */}
      <Card className="border-0 bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center text-foreground">
            <Eye className="mr-2 h-5 w-5 text-primary" />
            Direct Observation Setup
          </CardTitle>
          <CardDescription>Document the observation context and parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="activity">Activity Observed</Label>
              <Select
                value={formData.activity}
                onValueChange={(value) => {
                  setFormData({ ...formData, activity: value });
                  if (validationErrors.activity) {
                    setValidationErrors((prev) => {
                      const next = { ...prev };
                      delete next.activity;
                      return next;
                    });
                  }
                }}
                disabled={proceduresLoading}
              >
                <SelectTrigger className="border-border bg-background">
                  <SelectValue
                    placeholder={
                      proceduresLoading
                        ? "Loading..."
                        : procedures.length === 0
                          ? "No procedures defined"
                          : "Select activity"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {procedures.map((proc) => (
                    <SelectItem key={proc.id} value={proc.title}>
                      {proc.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!proceduresLoading && procedures.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No procedures available. An admin can add them under Admin → Procedure Library.
                </p>
              )}
              <FormFieldError error={validationErrors.activity} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="setting">Clinical Setting</Label>
              <Select 
                value={formData.setting} 
                onValueChange={(value) => {
                  setFormData({...formData, setting: value});
                  if (validationErrors.setting) {
                    setValidationErrors(prev => {
                      const next = { ...prev };
                      delete next.setting;
                      return next;
                    });
                  }
                }}
              >
                <SelectTrigger className="border-border bg-background">
                  <SelectValue placeholder="Select setting" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ward">Ward</SelectItem>
                  <SelectItem value="emergency">Emergency Department</SelectItem>
                  <SelectItem value="icu">ICU</SelectItem>
                  <SelectItem value="clinic">Outpatient Clinic</SelectItem>
                  <SelectItem value="or">Operating Room</SelectItem>
                </SelectContent>
              </Select>
              <FormFieldError error={validationErrors.setting} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input 
                id="date"
                type="date"
                value={formData.date}
              onChange={(e) => {
                setFormData({...formData, date: e.target.value});
                if (validationErrors.date) {
                  setValidationErrors(prev => {
                    const next = { ...prev };
                    delete next.date;
                    return next;
                  });
                }
              }}
              className="border-border bg-background"
            />
            <FormFieldError error={validationErrors.date} />
          </div>

            <div className="space-y-2">
              <Label htmlFor="observationTimeMinutes">Observation Time (minutes)</Label>
              <Input 
                id="observationTimeMinutes"
                type="number"
                min="0"
                max="1440"
                placeholder="e.g., 30"
                value={formData.observationTimeMinutes}
                onChange={(e) => setFormData({...formData, observationTimeMinutes: e.target.value})}
                className="border-border bg-background"
              />
              <p className="text-xs text-muted-foreground">Time spent directly observing the student</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedbackTimeMinutes">Feedback Time (minutes)</Label>
              <Input 
                id="feedbackTimeMinutes"
                type="number"
                min="0"
                max="1440"
                placeholder="e.g., 15"
                value={formData.feedbackTimeMinutes}
                onChange={(e) => setFormData({...formData, feedbackTimeMinutes: e.target.value})}
                className="border-border bg-background"
              />
              <p className="text-xs text-muted-foreground">Time spent providing feedback and coaching</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Observation Type</Label>
            <RadioGroup 
              value={formData.observationType} 
              onValueChange={(value) => setFormData({...formData, observationType: value})}
              className="flex flex-wrap gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="direct" id="direct" />
                <Label htmlFor="direct">Direct Supervision</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="indirect" id="indirect" />
                <Label htmlFor="indirect">Indirect Supervision</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bedside" id="bedside" />
                <Label htmlFor="bedside">Bedside Teaching</Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* Supervision Assessment */}
      <Card className="border-0 bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center text-foreground">
            <Target className="mr-2 h-5 w-5 text-accent" />
            Performance Assessment
          </CardTitle>
          <CardDescription>Rate the level of supervision required</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Label className="text-base font-semibold">Overall Supervision Level (O Score)</Label>
            <RadioGroup 
              value={formData.oScore} 
              onValueChange={(value) => setFormData({...formData, oScore: value})}
              className="space-y-3"
            >
              {oScoreOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-3 rounded-lg border border-border p-3 hover:bg-secondary/50">
                  <RadioGroupItem value={option.value} id={`score-${option.value}`} />
                  <div className="flex-1">
                    <Label htmlFor={`score-${option.value}`} className="cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <div className={`h-3 w-3 rounded-full ${option.color}`} />
                        <span className="font-medium">{option.label}</span>
                      </div>
                    </Label>
                  </div>
                </div>
              ))}
            </RadioGroup>
            <FormFieldError error={validationErrors.oScore} />
          </div>

          <div className="space-y-4">
            <Label className="text-base font-semibold">Competencies Observed</Label>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {competencies.map((competency) => (
                <div key={competency} className="flex items-center space-x-2">
                  <Checkbox
                    id={competency}
                    checked={formData.competenciesObserved.includes(competency)}
                    onCheckedChange={(checked) => {
                      const newCompetencies = checked
                        ? [...formData.competenciesObserved, competency]
                        : formData.competenciesObserved.filter(c => c !== competency);
                      setFormData({...formData, competenciesObserved: newCompetencies});
                    }}
                  />
                  <Label htmlFor={competency} className="cursor-pointer text-sm">
                    {competency}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Assessment */}
      <Card className="border-0 bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center text-foreground">
            <MessageSquare className="mr-2 h-5 w-5 text-success" />
            Detailed Observation
          </CardTitle>
          <CardDescription>Provide specific feedback in key areas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="technical">Technical Skills</Label>
                <VoiceRecorder onTranscription={(text) => setFormData({...formData, technicalSkills: text})} />
              </div>
              <SmartFeedbackField
                value={formData.technicalSkills}
                onChange={(value) => setFormData({...formData, technicalSkills: value})}
                placeholder="Describe technical competence, procedures, skills demonstrated..."
                minHeight="80px"
                className="border-border bg-background"
                context={feedbackContext}
                textareaProps={{ id: "technical" }}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="communication">Communication</Label>
                <VoiceRecorder onTranscription={(text) => setFormData({...formData, communication: text})} />
              </div>
              <SmartFeedbackField
                value={formData.communication}
                onChange={(value) => setFormData({...formData, communication: value})}
                placeholder="Patient interaction, colleague communication, clarity..."
                minHeight="80px"
                className="border-border bg-background"
                context={feedbackContext}
                textareaProps={{ id: "communication" }}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="professionalism">Professionalism</Label>
                <VoiceRecorder onTranscription={(text) => setFormData({...formData, professionalism: text})} />
              </div>
              <SmartFeedbackField
                value={formData.professionalism}
                onChange={(value) => setFormData({...formData, professionalism: value})}
                placeholder="Professional behavior, ethics, patient respect..."
                minHeight="80px"
                className="border-border bg-background"
                context={feedbackContext}
                textareaProps={{ id: "professionalism" }}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="reasoning">Clinical Reasoning</Label>
                <VoiceRecorder onTranscription={(text) => setFormData({...formData, clinicalReasoning: text})} />
              </div>
              <SmartFeedbackField
                value={formData.clinicalReasoning}
                onChange={(value) => setFormData({...formData, clinicalReasoning: value})}
                placeholder="Decision-making process, diagnostic thinking, problem-solving..."
                minHeight="80px"
                className="border-border bg-background"
                context={feedbackContext}
                textareaProps={{ id: "reasoning" }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="narrative">Overall Narrative</Label>
              <VoiceRecorder onTranscription={(text) => setFormData({...formData, narrative: text})} />
            </div>
            <SmartFeedbackField
              value={formData.narrative}
              onChange={(value) => setFormData({...formData, narrative: value})}
              placeholder="Comprehensive description of performance, context, and specific examples..."
              minHeight="100px"
              className={validationErrors.narrative ? 'border-destructive bg-background' : 'border-border bg-background'}
              context={feedbackContext}
              textareaProps={{ id: "narrative" }}
            />
            {validationErrors.narrative && (
              <p className="text-sm text-destructive">{validationErrors.narrative}</p>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="feedback"
                checked={formData.verbalFeedbackGiven}
                onCheckedChange={(checked) => setFormData({...formData, verbalFeedbackGiven: !!checked})}
              />
              <Label htmlFor="feedback" className="cursor-pointer">
                Verbal feedback was provided to the physician associate
              </Label>
            </div>

            {formData.verbalFeedbackGiven && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="response">Physician Associate Response to Feedback</Label>
                  <VoiceRecorder onTranscription={(text) => setFormData({...formData, associateResponse: text})} />
                </div>
                <SmartFeedbackField
                  value={formData.associateResponse}
                  onChange={(value) => setFormData({...formData, associateResponse: value})}
                  placeholder="How did the physician associate respond to the feedback? Questions asked, understanding demonstrated..."
                  minHeight="60px"
                  className="border-border bg-background"
                  context={feedbackContext}
                  textareaProps={{ id: "response" }}
                />
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-2 pt-4">
            {/* Debug info - show why button is disabled */}
            {process.env.NODE_ENV === 'development' && (
              <div className="text-xs text-muted-foreground">
                Debug: Activity={formData.activity ? '✓' : '✗'}, 
                O-Score={formData.oScore ? '✓' : '✗'}, 
                Narrative={formData.narrative?.trim() ? '✓' : '✗'}
              </div>
            )}
            <Button 
              onClick={handleSubmit}
              className="bg-gradient-primary hover:opacity-90"
              disabled={
                !formData.activity?.trim() || 
                !formData.oScore?.trim() || 
                !formData.narrative?.trim() || 
                submitting
              }
              title={
                !formData.activity?.trim() ? 'Activity is required' :
                !formData.oScore?.trim() ? 'O-SCORE rating is required' :
                !formData.narrative?.trim() ? 'Narrative feedback is required' :
                submitting ? 'Submitting...' :
                'Submit assessment'
              }
            >
              {submitting ? "Submitting..." : "Submit Direct Observation"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <FeedbackResourceRecommendation
        supervisorId={user?.id || ''}
        associate={{ id: associate.id, name: associate.name }}
        assessmentId={assessmentId}
      />
      </div>
    </SectionErrorBoundary>
  );
};

export default DirectObservationForm;