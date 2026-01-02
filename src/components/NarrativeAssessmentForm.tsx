import { useState } from "react";

import { FileText, Target, TrendingUp, MessageCircle, Lightbulb } from "lucide-react";

import { SmartFeedbackField } from "@/components/feedback/SmartFeedbackField";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormFieldError } from "@/components/ui/FormFieldError";
import { FormSkeleton } from "@/components/ui/FormSkeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import VoiceRecorder from "@/components/VoiceRecorder";
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

interface NarrativeAssessmentFormProps {
  associate: PhysicianAssociate;
}

const NarrativeAssessmentForm = ({ associate }: NarrativeAssessmentFormProps) => {
  const [formData, setFormData] = useState({
    assessmentType: "",
    date: "",
    observationTimeMinutes: "",
    feedbackTimeMinutes: "",
    context: "",
    performanceDescription: "",
    strengths: "",
    areasForGrowth: "",
    specificExamples: "",
    behavioralObservations: "",
    clinicalReasoningComments: "",
    communicationComments: "",
    professionalismComments: "",
    recommendationsForImprovement: "",
    developmentPlan: "",
    followUpRequired: "",
    competenciesAddressed: [] as string[]
  });
  const [submitting, setSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const { user } = useAuth();

  const assessmentTypes = [
    "Longitudinal Assessment",
    "Rotation Summary",
    "Critical Incident Analysis",
    "Milestone Review",
    "Professional Development Discussion",
    "Performance Improvement Plan",
    "Competency Committee Review"
  ];

  const competencies = [
    "Medical Expert",
    "Communicator",
    "Collaborator",
    "Leader", 
    "Health Advocate",
    "Scholar",
    "Professional"
  ];

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
    if (!formData.assessmentType) errors.assessmentType = 'Assessment type is required';
    if (!formData.performanceDescription || formData.performanceDescription.trim().length === 0) {
      errors.performanceDescription = 'Performance description is required';
    }
    
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
      
      // Combine all narrative fields
      const overallProgression = [
        formData.performanceDescription,
        formData.strengths && `Strengths: ${formData.strengths}`,
        formData.areasForGrowth && `Areas for Growth: ${formData.areasForGrowth}`,
        formData.specificExamples && `Specific Examples: ${formData.specificExamples}`,
      ]
        .filter(Boolean)
        .join('\n\n');

      const recommendations = [
        formData.recommendationsForImprovement,
        formData.developmentPlan,
        formData.followUpRequired,
      ]
        .filter(Boolean)
        .join('\n\n');

      // Save to database
      // Build insert payload - conditionally include time tracking fields
      // (they may not exist if migration hasn't been run yet)
      const insertPayload: any = {
        student_id: associate.id,
        supervisor_id: user.id,
        assessment_period: formData.assessmentType,
        clinical_context: formData.context || null,
        strengths: formData.strengths || null,
        areas_for_growth: formData.areasForGrowth || null,
        overall_progression: overallProgression || null,
        recommendations: recommendations || null,
      };

      // Only include time tracking fields if they have values
      // This allows the code to work before the migration is run
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
            .from('narrative_assessments')
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
        // Retry without time tracking fields
        result = await retry(
          async () => {
            return await supabase
              .from('narrative_assessments')
              .insert({
                student_id: associate.id,
                supervisor_id: user.id,
                assessment_period: formData.assessmentType,
                clinical_context: formData.context || null,
                strengths: formData.strengths || null,
                areas_for_growth: formData.areasForGrowth || null,
                overall_progression: overallProgression || null,
                recommendations: recommendations || null,
              })
              .select()
              .single();
          },
          { maxRetries: 2, initialDelay: 1000 }
        );
      }

      if (result.error) throw result.error;
      if (!result.data) throw new Error('Failed to create assessment');

      // Database trigger will automatically create CME session
      toast({
        title: "Assessment Submitted Successfully",
        description: `Narrative assessment for ${associate.name} has been recorded. CME time has been automatically logged.`,
      });

      // Reset form
      setFormData({
        assessmentType: "",
        date: "",
        observationTimeMinutes: "",
        feedbackTimeMinutes: "",
        context: "",
        performanceDescription: "",
        strengths: "",
        areasForGrowth: "",
        specificExamples: "",
        behavioralObservations: "",
        clinicalReasoningComments: "",
        communicationComments: "",
        professionalismComments: "",
        recommendationsForImprovement: "",
        developmentPlan: "",
        followUpRequired: "",
        competenciesAddressed: []
      });
    } catch (error: unknown) {
      logger.error('Error submitting narrative assessment', error);
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
    return <FormSkeleton fields={10} />;
  }

  return (
    <SectionErrorBoundary sectionName="Narrative Assessment Form">
      <div className="space-y-6">
      {/* Assessment Context */}
      <Card className="border-0 bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center text-foreground">
            <FileText className="mr-2 h-5 w-5 text-primary" />
            Assessment Context
          </CardTitle>
          <CardDescription>Define the scope and context of this narrative assessment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="type">Assessment Type</Label>
              <Select value={formData.assessmentType} onValueChange={(value) => setFormData({...formData, assessmentType: value})}>
                <SelectTrigger className="border-border bg-background">
                  <SelectValue placeholder="Select assessment type" />
                </SelectTrigger>
                <SelectContent>
                  {assessmentTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormFieldError error={validationErrors.assessmentType} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Assessment Date</Label>
              <Input 
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="border-border bg-background"
              />
            </div>

          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="observationTimeMinutes">Observation Time (minutes)</Label>
              <Input 
                id="observationTimeMinutes"
                type="number"
                min="0"
                max="1440"
                placeholder="e.g., 60"
                value={formData.observationTimeMinutes}
                onChange={(e) => setFormData({...formData, observationTimeMinutes: e.target.value})}
                className="border-border bg-background"
              />
              <p className="text-xs text-muted-foreground">Time spent observing the student during this period</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedbackTimeMinutes">Feedback Time (minutes)</Label>
              <Input 
                id="feedbackTimeMinutes"
                type="number"
                min="0"
                max="1440"
                placeholder="e.g., 30"
                value={formData.feedbackTimeMinutes}
                onChange={(e) => setFormData({...formData, feedbackTimeMinutes: e.target.value})}
                className="border-border bg-background"
              />
              <p className="text-xs text-muted-foreground">Time spent providing feedback and coaching</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="context">Clinical Context</Label>
            <Textarea
              id="context"
              placeholder="Describe the clinical settings, patient types, complexity of cases, learning opportunities..."
              value={formData.context}
              onChange={(e) => setFormData({...formData, context: e.target.value})}
              className="min-h-[80px] border-border bg-background"
            />
          </div>

          <div className="space-y-4">
            <Label className="text-base font-semibold">Competencies Addressed</Label>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {competencies.map((competency) => (
                <Badge
                  key={competency}
                  variant={formData.competenciesAddressed.includes(competency) ? "default" : "outline"}
                  className={`cursor-pointer justify-center p-2 ${
                    formData.competenciesAddressed.includes(competency) 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-primary-light"
                  }`}
                  onClick={() => {
                    const newCompetencies = formData.competenciesAddressed.includes(competency)
                      ? formData.competenciesAddressed.filter(c => c !== competency)
                      : [...formData.competenciesAddressed, competency];
                    setFormData({...formData, competenciesAddressed: newCompetencies});
                  }}
                >
                  {competency}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Description */}
      <Card className="border-0 bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center text-foreground">
            <Target className="mr-2 h-5 w-5 text-accent" />
            Performance Description
          </CardTitle>
          <CardDescription>Comprehensive narrative of observed performance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="performance">Overall Performance Summary</Label>
            <SmartFeedbackField
              value={formData.performanceDescription}
              onChange={(value) => {
                setFormData({...formData, performanceDescription: value});
                if (validationErrors.performanceDescription) {
                  setValidationErrors(prev => {
                    const next = { ...prev };
                    delete next.performanceDescription;
                    return next;
                  });
                }
              }}
              placeholder="Provide a comprehensive overview of the physician associate's performance during this period. Include specific examples, patterns observed, and contextual factors..."
              minHeight="120px"
              className="border-border bg-background"
              context={{
                encounterType: formData.assessmentType,
              }}
              textareaProps={{ id: "performance" }}
            />
            <FormFieldError error={validationErrors.performanceDescription} />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="strengths">Key Strengths</Label>
                <VoiceRecorder 
                  onTranscription={(text) => 
                    setFormData({...formData, strengths: formData.strengths + (formData.strengths ? ' ' : '') + text})
                  }
                />
              </div>
              <SmartFeedbackField
                value={formData.strengths}
                onChange={(value) => setFormData({...formData, strengths: value})}
                placeholder="What does the physician associate do exceptionally well? Provide specific examples and evidence..."
                minHeight="100px"
                className="border-border bg-background"
                context={{
                  encounterType: formData.assessmentType,
                }}
                textareaProps={{ id: "strengths" }}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="growth">Areas for Growth</Label>
                <VoiceRecorder 
                  onTranscription={(text) => 
                    setFormData({...formData, areasForGrowth: formData.areasForGrowth + (formData.areasForGrowth ? ' ' : '') + text})
                  }
                />
              </div>
              <SmartFeedbackField
                value={formData.areasForGrowth}
                onChange={(value) => setFormData({...formData, areasForGrowth: value})}
                placeholder="What areas need development? Be specific and constructive..."
                minHeight="100px"
                className="border-border bg-background"
                context={{
                  encounterType: formData.assessmentType,
                }}
                textareaProps={{ id: "growth" }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="examples">Specific Examples</Label>
              <VoiceRecorder 
                onTranscription={(text) => 
                  setFormData({...formData, specificExamples: formData.specificExamples + (formData.specificExamples ? ' ' : '') + text})
                }
              />
            </div>
            <SmartFeedbackField
              value={formData.specificExamples}
              onChange={(value) => setFormData({...formData, specificExamples: value})}
              placeholder="Provide concrete examples of performance, critical incidents, or memorable interactions that illustrate your assessment..."
              minHeight="100px"
              className="border-border bg-background"
              context={{
                encounterType: formData.assessmentType,
              }}
              textareaProps={{ id: "examples" }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Competency-Specific Comments */}
      <Card className="border-0 bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center text-foreground">
            <MessageCircle className="mr-2 h-5 w-5 text-success" />
            Competency-Specific Observations
          </CardTitle>
          <CardDescription>Detailed comments on key competency areas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="behavioral">Behavioral Observations</Label>
              <Textarea
                id="behavioral"
                placeholder="Describe specific behaviors, attitudes, and professional conduct observed..."
                value={formData.behavioralObservations}
                onChange={(e) => setFormData({...formData, behavioralObservations: e.target.value})}
                className="min-h-[80px] border-border bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reasoning">Clinical Reasoning</Label>
              <Textarea
                id="reasoning" 
                placeholder="Comment on diagnostic thinking, problem-solving approach, decision-making process..."
                value={formData.clinicalReasoningComments}
                onChange={(e) => setFormData({...formData, clinicalReasoningComments: e.target.value})}
                className="min-h-[80px] border-border bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="communication">Communication Skills</Label>
              <Textarea
                id="communication"
                placeholder="Patient communication, colleague interaction, documentation quality..."
                value={formData.communicationComments}
                onChange={(e) => setFormData({...formData, communicationComments: e.target.value})}
                className="min-h-[80px] border-border bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="professionalism">Professionalism</Label>
              <Textarea
                id="professionalism"
                placeholder="Professional behavior, ethics, reliability, teamwork..."
                value={formData.professionalismComments}
                onChange={(e) => setFormData({...formData, professionalismComments: e.target.value})}
                className="min-h-[80px] border-border bg-background"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Development Plan */}
      <Card className="border-0 bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center text-foreground">
            <TrendingUp className="mr-2 h-5 w-5 text-warning" />
            Development Plan
          </CardTitle>
          <CardDescription>Forward-looking recommendations and action items</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="recommendations">Recommendations for Improvement</Label>
              <VoiceRecorder 
                onTranscription={(text) => 
                  setFormData({...formData, recommendationsForImprovement: formData.recommendationsForImprovement + (formData.recommendationsForImprovement ? ' ' : '') + text})
                }
              />
            </div>
            <SmartFeedbackField
              value={formData.recommendationsForImprovement}
              onChange={(value) => setFormData({...formData, recommendationsForImprovement: value})}
              placeholder="Specific, actionable recommendations for addressing areas of growth..."
              minHeight="100px"
              className="border-border bg-background"
              context={{
                encounterType: formData.assessmentType,
              }}
              textareaProps={{ id: "recommendations" }}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="plan">Learning and Development Plan</Label>
              <VoiceRecorder 
                onTranscription={(text) => 
                  setFormData({...formData, developmentPlan: formData.developmentPlan + (formData.developmentPlan ? ' ' : '') + text})
                }
              />
            </div>
            <SmartFeedbackField
              value={formData.developmentPlan}
              onChange={(value) => setFormData({...formData, developmentPlan: value})}
              placeholder="Outline specific learning objectives, activities, resources, and timelines for development..."
              minHeight="100px"
              className="border-border bg-background"
              context={{
                encounterType: formData.assessmentType,
              }}
              textareaProps={{ id: "plan" }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="followup">Follow-up Requirements</Label>
            <Textarea
              id="followup"
              placeholder="What follow-up assessments, meetings, or check-ins are recommended?"
              value={formData.followUpRequired}
              onChange={(e) => setFormData({...formData, followUpRequired: e.target.value})}
              className="min-h-[80px] border-border bg-background"
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button 
              onClick={handleSubmit}
              className="bg-gradient-primary hover:opacity-90"
              disabled={!formData.assessmentType?.trim() || !formData.performanceDescription?.trim() || submitting}
            >
              <Lightbulb className="mr-2 h-4 w-4" />
              {submitting ? "Submitting..." : "Submit Narrative Assessment"}
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>
    </SectionErrorBoundary>
  );
};

export default NarrativeAssessmentForm;