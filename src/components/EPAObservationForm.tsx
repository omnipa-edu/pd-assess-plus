import { useState } from "react";

import { MapPin, User, FileText, CheckCircle } from "lucide-react";

import { SmartFeedbackField } from "@/components/feedback/SmartFeedbackField";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormFieldError } from "@/components/ui/FormFieldError";
import { FormSkeleton } from "@/components/ui/FormSkeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import VoiceRecorder from "@/components/VoiceRecorder";
import { FeedbackResourceRecommendation } from "@/components/resources/FeedbackResourceRecommendation";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { EPA_OPTIONS as epas, O_SCORE_OPTIONS } from "@/lib/clinical/epaCatalog";
import { retry } from "@/lib/retry";


interface PhysicianAssociate {
  id: string;
  name: string;
  program: string;
  year: string;
  supervisor: string;
}

interface EPAObservationFormProps {
  associate: PhysicianAssociate;
}

const EPAObservationForm = ({ associate }: EPAObservationFormProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    epaNumber: "",
    setting: "",
    date: "",
    time: "",
    observationTimeMinutes: "",
    feedbackTimeMinutes: "",
    oScore: "",
    canmedsRoles: [] as string[],
    narrative: "",
    strengths: "",
    areasForImprovement: "",
    actionPlan: ""
  });
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

  const oScoreOptions = [...O_SCORE_OPTIONS];

  const canmedsRoles = [
    "Medical Expert",
    "Communicator", 
    "Collaborator",
    "Leader",
    "Health Advocate",
    "Scholar",
    "Professional"
  ];

  const feedbackContext = {
    role: "supervisor",
    discipline: "PA / MD / NP clinical education",
    epaName: formData.epaNumber ? epas.find(e => e.value === formData.epaNumber)?.label : undefined,
    encounterType: formData.setting,
    learnerLevel: associate.year,
    learner: {
      level: associate.year,
      role: "student",
      specialty: associate.program,
    },
    context: {
      setting: formData.setting || "unspecified",
      case_type: formData.epaNumber || "unknown",
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

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.epaNumber) {
      errors.epaNumber = 'EPA selection is required';
    }
    if (!formData.setting) {
      errors.setting = 'Clinical setting is required';
    }
    if (!formData.date) {
      errors.date = 'Date is required';
    }
    if (!formData.oScore) {
      errors.oScore = 'O-SCORE rating is required';
    }
    if (!formData.narrative || formData.narrative.trim().length === 0) {
      errors.narrative = 'Narrative observation is required';
    }
    
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

    // Validate form
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      
      // Combine narrative fields into feedback
      const feedback = [
        formData.narrative,
        formData.strengths && `Strengths: ${formData.strengths}`,
        formData.areasForImprovement && `Areas for Improvement: ${formData.areasForImprovement}`,
        formData.actionPlan && `Action Plan: ${formData.actionPlan}`,
      ]
        .filter(Boolean)
        .join('\n\n');

      // Save to database
      // Build insert payload - conditionally include time tracking fields
      const insertPayload: any = {
        student_id: associate.id, // Using associate.id as student_id
        supervisor_id: user.id,
        epa_number: formData.epaNumber,
        clinical_setting: formData.setting,
        observations: formData.narrative,
        feedback: feedback,
        rating: formData.oScore,
        patient_demographics: null,
        complexity: null,
        used_smart_feedback: aiUsage.used_smart_feedback,
        smart_feedback_applied: aiUsage.smart_feedback_applied,
        smart_feedback_version: aiUsage.used_smart_feedback ? 'gpt-4o-mini' : null,
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
            .from('epa_assessments')
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
              .from('epa_assessments')
              .insert({
                student_id: associate.id,
                supervisor_id: user.id,
                epa_number: formData.epaNumber,
                clinical_setting: formData.setting,
                observations: formData.narrative,
                feedback: feedback,
                rating: formData.oScore,
                patient_demographics: null,
                complexity: null,
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
        setRecommendationOpenKey((prev) => prev + 1);
      }
      
      // Database trigger will automatically create CME session
      
      // Score feedback quality if feedback exists
      if (feedback && feedback.trim().length > 0 && result.data?.id) {
        try {
          const { scoreFeedback, saveFeedbackQualityScore } = await import('@/lib/feedbackScoring');
          const scores = await scoreFeedback({
            feedbackText: feedback,
            assessmentType: 'epa',
            context: {
              epaName: formData.epaNumber ? epas.find(e => e.value === formData.epaNumber)?.label : undefined,
            },
          });
          
          await saveFeedbackQualityScore(
            result.data.id,
            'epa',
            user.id,
            scores,
            aiUsage.used_smart_feedback
          );
        } catch (scoringError) {
          // Don't fail the submission if scoring fails - just log it
          logger.warn('Failed to score feedback quality', { error: scoringError });
        }
      }
      toast({
        title: "Assessment Submitted Successfully",
        description: `EPA observation for ${associate.name} has been recorded. CME time has been automatically logged.`,
      });

      // Reset form
      setFormData({
        epaNumber: "",
        setting: "",
        date: "",
        time: "",
        observationTimeMinutes: "",
        feedbackTimeMinutes: "",
        oScore: "",
        canmedsRoles: [],
        narrative: "",
        strengths: "",
        areasForImprovement: "",
        actionPlan: ""
      });
      setAIUsage({
        used_smart_feedback: false,
        smart_feedback_applied: false,
      });
      setCurrentStep(1);
    } catch (error: unknown) {
      logger.error('Error submitting EPA assessment', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit assessment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <Card className="border-0 bg-gradient-card shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center text-foreground">
          <FileText className="mr-2 h-5 w-5 text-primary" />
          Step 1: Record Setup (R)
        </CardTitle>
        <CardDescription>Document the assessment parameters and context</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="epa">EPA Selection</Label>
            <Select 
              value={formData.epaNumber} 
              onValueChange={(value) => {
                setFormData({...formData, epaNumber: value});
                if (validationErrors.epaNumber) {
                  setValidationErrors(prev => {
                    const next = { ...prev };
                    delete next.epaNumber;
                    return next;
                  });
                }
              }}
            >
              <SelectTrigger className="border-border bg-background">
                <SelectValue placeholder="Select EPA to assess" />
              </SelectTrigger>
              <SelectContent>
                {epas.map((epa) => (
                  <SelectItem key={epa.value} value={epa.value}>
                    {epa.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormFieldError error={validationErrors.epaNumber} />
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
                <SelectItem value="simulation">Simulation Lab</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input 
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              className="border-border bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Time</Label>
            <Input 
              id="time"
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({...formData, time: e.target.value})}
              className="border-border bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observationTimeMinutes">Observation Time (minutes)</Label>
            <Input 
              id="observationTimeMinutes"
              type="number"
              min="0"
              max="1440"
              placeholder="e.g., 20"
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
              placeholder="e.g., 10"
              value={formData.feedbackTimeMinutes}
              onChange={(e) => setFormData({...formData, feedbackTimeMinutes: e.target.value})}
              className="border-border bg-background"
            />
            <p className="text-xs text-muted-foreground">Time spent providing feedback and coaching</p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={() => setCurrentStep(2)}
            className="bg-gradient-primary hover:opacity-90"
            disabled={!formData.epaNumber || !formData.setting || !formData.date}
          >
            Next: Experience
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card className="border-0 bg-gradient-card shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center text-foreground">
          <MapPin className="mr-2 h-5 w-5 text-accent" />
          Step 2: Experience (X) & Observe (O)
        </CardTitle>
        <CardDescription>Rate the supervision level and document observation</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Label className="text-base font-semibold">Retrospective Supervision Scale (O Score)</Label>
          <RadioGroup 
            value={formData.oScore} 
            onValueChange={(value) => {
              setFormData({...formData, oScore: value});
              if (validationErrors.oScore) {
                setValidationErrors(prev => {
                  const next = { ...prev };
                  delete next.oScore;
                  return next;
                });
              }
            }}
            className="space-y-3"
          >
            {oScoreOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-3 rounded-lg border border-border p-3 hover:bg-secondary/50">
                <RadioGroupItem value={option.value} id={option.value} />
                <div className="flex-1">
                  <Label htmlFor={option.value} className="cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <div className={`h-3 w-3 rounded-full ${option.color}`} />
                      <span className="font-medium">{option.label}</span>
                    </div>
                  </Label>
                </div>
              </div>
            ))}
          </RadioGroup>
        </div>

        <Separator />

        <div className="space-y-4">
          <Label className="text-base font-semibold">CanMEDS Roles Observed</Label>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {canmedsRoles.map((role) => (
              <Badge
                key={role}
                variant={formData.canmedsRoles.includes(role) ? "default" : "outline"}
                className={`cursor-pointer justify-center p-2 ${
                  formData.canmedsRoles.includes(role) 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-primary-light"
                }`}
                onClick={() => {
                  const newRoles = formData.canmedsRoles.includes(role)
                    ? formData.canmedsRoles.filter(r => r !== role)
                    : [...formData.canmedsRoles, role];
                  setFormData({...formData, canmedsRoles: newRoles});
                }}
              >
                {role}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => setCurrentStep(1)}
            className="border-border hover:bg-secondary"
          >
            Previous
          </Button>
          <Button 
            onClick={() => setCurrentStep(3)}
            className="bg-gradient-primary hover:opacity-90"
            disabled={!formData.oScore}
          >
            Next: Coach & Record
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep3 = () => (
    <Card className="border-0 bg-gradient-card shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center text-foreground">
          <CheckCircle className="mr-2 h-5 w-5 text-success" />
          Step 3: Coach (C) & Record (R)
        </CardTitle>
        <CardDescription>Provide feedback and document the assessment</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="narrative">Narrative Observation</Label>
              <VoiceRecorder onTranscription={(text) => setFormData({...formData, narrative: text})} />
            </div>
            <SmartFeedbackField
              value={formData.narrative}
              onChange={(value) => setFormData({...formData, narrative: value})}
              onAIUsed={() => setAIUsage(prev => ({ ...prev, used_smart_feedback: true }))}
              onAIApplied={() => setAIUsage(prev => ({ ...prev, smart_feedback_applied: true }))}
              placeholder="Describe specific behaviors observed, context, and performance details..."
              minHeight="100px"
              className="border-border bg-background"
            context={feedbackContext}
              textareaProps={{ id: "narrative" }}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="strengths">Strengths Observed</Label>
              <VoiceRecorder onTranscription={(text) => setFormData({...formData, strengths: text})} />
            </div>
            <SmartFeedbackField
              value={formData.strengths}
              onChange={(value) => setFormData({...formData, strengths: value})}
              onAIUsed={() => setAIUsage(prev => ({ ...prev, used_smart_feedback: true }))}
              onAIApplied={() => setAIUsage(prev => ({ ...prev, smart_feedback_applied: true }))}
              placeholder="What did the physician associate do well? Specific examples..."
              minHeight="80px"
              className="border-border bg-background"
            context={feedbackContext}
              textareaProps={{ id: "strengths" }}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="improvements">Areas for Improvement</Label>
              <VoiceRecorder onTranscription={(text) => setFormData({...formData, areasForImprovement: text})} />
            </div>
            <SmartFeedbackField
              value={formData.areasForImprovement}
              onChange={(value) => setFormData({...formData, areasForImprovement: value})}
              onAIUsed={() => setAIUsage(prev => ({ ...prev, used_smart_feedback: true }))}
              onAIApplied={() => setAIUsage(prev => ({ ...prev, smart_feedback_applied: true }))}
              placeholder="What could be improved? Constructive feedback..."
              minHeight="80px"
              className="border-border bg-background"
            context={feedbackContext}
              textareaProps={{ id: "improvements" }}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="actionPlan">Action Plan & Next Steps</Label>
              <VoiceRecorder onTranscription={(text) => setFormData({...formData, actionPlan: text})} />
            </div>
            <SmartFeedbackField
              value={formData.actionPlan}
              onChange={(value) => setFormData({...formData, actionPlan: value})}
              onAIUsed={() => setAIUsage(prev => ({ ...prev, used_smart_feedback: true }))}
              onAIApplied={() => setAIUsage(prev => ({ ...prev, smart_feedback_applied: true }))}
              placeholder="Specific recommendations for future learning and development..."
              minHeight="80px"
              className="border-border bg-background"
            context={feedbackContext}
              textareaProps={{ id: "actionPlan" }}
            />
          </div>
        </div>

        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => setCurrentStep(2)}
            className="border-border hover:bg-secondary"
          >
            Previous
          </Button>
          <Button 
            onClick={handleSubmit}
            className="bg-gradient-primary hover:opacity-90"
            disabled={!formData.narrative?.trim() || submitting}
          >
            {submitting ? "Submitting..." : "Submit Assessment"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Early return for loading state
  if (submitting) {
    return (
      <SectionErrorBoundary sectionName="EPA Observation Form">
        <FormSkeleton fields={6} />
      </SectionErrorBoundary>
    );
  }

  return (
    <SectionErrorBoundary sectionName="EPA Observation Form">
      <div className="space-y-6">
        {/* Progress Indicator */}
        <Card className="border-0 bg-gradient-assessment shadow-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <User className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-semibold text-foreground">{associate.name}</h3>
                <p className="text-sm text-muted-foreground">{associate.program} • {associate.year}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                    currentStep >= step
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {step}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Steps */}
      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      {currentStep === 3 && (
        <div className="space-y-6">
          {renderStep3()}
          <FeedbackResourceRecommendation
            supervisorId={user?.id || ''}
            associate={{ id: associate.id, name: associate.name }}
            assessmentId={assessmentId}
            autoOpenKey={recommendationOpenKey}
          />
        </div>
      )}
      </div>
    </SectionErrorBoundary>
  );
};

export default EPAObservationForm;