import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FileText, Target, TrendingUp, MessageCircle, Lightbulb } from "lucide-react";
import VoiceRecorder from "@/components/VoiceRecorder";

interface Resident {
  id: string;
  name: string;
  program: string;
  year: string;
  supervisor: string;
}

interface NarrativeAssessmentFormProps {
  resident: Resident;
}

const NarrativeAssessmentForm = ({ resident }: NarrativeAssessmentFormProps) => {
  const [formData, setFormData] = useState({
    assessmentType: "",
    date: "",
    duration: "",
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
  const { toast } = useToast();

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

  const handleSubmit = () => {
    toast({
      title: "Narrative Assessment Submitted",
      description: `Comprehensive assessment for ${resident.name} has been documented.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Assessment Context */}
      <Card className="bg-gradient-card shadow-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center text-foreground">
            <FileText className="w-5 h-5 mr-2 text-primary" />
            Assessment Context
          </CardTitle>
          <CardDescription>Define the scope and context of this narrative assessment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Assessment Type</Label>
              <Select value={formData.assessmentType} onValueChange={(value) => setFormData({...formData, assessmentType: value})}>
                <SelectTrigger className="bg-background border-border">
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Assessment Date</Label>
              <Input 
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Assessment Period</Label>
              <Input 
                id="duration"
                placeholder="e.g., 4 weeks, 1 rotation, 6 months"
                value={formData.duration}
                onChange={(e) => setFormData({...formData, duration: e.target.value})}
                className="bg-background border-border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="context">Clinical Context</Label>
            <Textarea
              id="context"
              placeholder="Describe the clinical settings, patient types, complexity of cases, learning opportunities..."
              value={formData.context}
              onChange={(e) => setFormData({...formData, context: e.target.value})}
              className="min-h-[80px] bg-background border-border"
            />
          </div>

          <div className="space-y-4">
            <Label className="text-base font-semibold">Competencies Addressed</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {competencies.map((competency) => (
                <Badge
                  key={competency}
                  variant={formData.competenciesAddressed.includes(competency) ? "default" : "outline"}
                  className={`cursor-pointer p-2 justify-center ${
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
      <Card className="bg-gradient-card shadow-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center text-foreground">
            <Target className="w-5 h-5 mr-2 text-accent" />
            Performance Description
          </CardTitle>
          <CardDescription>Comprehensive narrative of observed performance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="performance">Overall Performance Summary</Label>
            <Textarea
              id="performance"
              placeholder="Provide a comprehensive overview of the resident's performance during this period. Include specific examples, patterns observed, and contextual factors..."
              value={formData.performanceDescription}
              onChange={(e) => setFormData({...formData, performanceDescription: e.target.value})}
              className="min-h-[120px] bg-background border-border"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="strengths">Key Strengths</Label>
                <VoiceRecorder 
                  onTranscription={(text) => 
                    setFormData({...formData, strengths: formData.strengths + (formData.strengths ? ' ' : '') + text})
                  }
                />
              </div>
              <Textarea
                id="strengths"
                placeholder="What does the resident do exceptionally well? Provide specific examples and evidence..."
                value={formData.strengths}
                onChange={(e) => setFormData({...formData, strengths: e.target.value})}
                className="min-h-[100px] bg-background border-border"
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
              <Textarea
                id="growth"
                placeholder="What areas need development? Be specific and constructive..."
                value={formData.areasForGrowth}
                onChange={(e) => setFormData({...formData, areasForGrowth: e.target.value})}
                className="min-h-[100px] bg-background border-border"
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
            <Textarea
              id="examples"
              placeholder="Provide concrete examples of performance, critical incidents, or memorable interactions that illustrate your assessment..."
              value={formData.specificExamples}
              onChange={(e) => setFormData({...formData, specificExamples: e.target.value})}
              className="min-h-[100px] bg-background border-border"
            />
          </div>
        </CardContent>
      </Card>

      {/* Competency-Specific Comments */}
      <Card className="bg-gradient-card shadow-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center text-foreground">
            <MessageCircle className="w-5 h-5 mr-2 text-success" />
            Competency-Specific Observations
          </CardTitle>
          <CardDescription>Detailed comments on key competency areas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="behavioral">Behavioral Observations</Label>
              <Textarea
                id="behavioral"
                placeholder="Describe specific behaviors, attitudes, and professional conduct observed..."
                value={formData.behavioralObservations}
                onChange={(e) => setFormData({...formData, behavioralObservations: e.target.value})}
                className="min-h-[80px] bg-background border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reasoning">Clinical Reasoning</Label>
              <Textarea
                id="reasoning" 
                placeholder="Comment on diagnostic thinking, problem-solving approach, decision-making process..."
                value={formData.clinicalReasoningComments}
                onChange={(e) => setFormData({...formData, clinicalReasoningComments: e.target.value})}
                className="min-h-[80px] bg-background border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="communication">Communication Skills</Label>
              <Textarea
                id="communication"
                placeholder="Patient communication, colleague interaction, documentation quality..."
                value={formData.communicationComments}
                onChange={(e) => setFormData({...formData, communicationComments: e.target.value})}
                className="min-h-[80px] bg-background border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="professionalism">Professionalism</Label>
              <Textarea
                id="professionalism"
                placeholder="Professional behavior, ethics, reliability, teamwork..."
                value={formData.professionalismComments}
                onChange={(e) => setFormData({...formData, professionalismComments: e.target.value})}
                className="min-h-[80px] bg-background border-border"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Development Plan */}
      <Card className="bg-gradient-card shadow-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center text-foreground">
            <TrendingUp className="w-5 h-5 mr-2 text-warning" />
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
            <Textarea
              id="recommendations"
              placeholder="Specific, actionable recommendations for addressing areas of growth..."
              value={formData.recommendationsForImprovement}
              onChange={(e) => setFormData({...formData, recommendationsForImprovement: e.target.value})}
              className="min-h-[100px] bg-background border-border"
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
            <Textarea
              id="plan"
              placeholder="Outline specific learning objectives, activities, resources, and timelines for development..."
              value={formData.developmentPlan}
              onChange={(e) => setFormData({...formData, developmentPlan: e.target.value})}
              className="min-h-[100px] bg-background border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="followup">Follow-up Requirements</Label>
            <Textarea
              id="followup"
              placeholder="What follow-up assessments, meetings, or check-ins are recommended?"
              value={formData.followUpRequired}
              onChange={(e) => setFormData({...formData, followUpRequired: e.target.value})}
              className="min-h-[80px] bg-background border-border"
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button 
              onClick={handleSubmit}
              className="bg-gradient-primary hover:opacity-90"
              disabled={!formData.assessmentType || !formData.performanceDescription}
            >
              <Lightbulb className="w-4 h-4 mr-2" />
              Submit Narrative Assessment
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NarrativeAssessmentForm;