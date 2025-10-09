import { useState } from "react";

import { Eye, Clock, Target, MessageSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import VoiceRecorder from "@/components/VoiceRecorder";
import { useToast } from "@/hooks/use-toast";

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
    duration: "",
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
  const { toast } = useToast();

  const activities = [
    "Patient History Taking",
    "Physical Examination", 
    "Procedure Performance",
    "Patient Counseling",
    "Interdisciplinary Rounds",
    "Emergency Response",
    "Diagnostic Interpretation",
    "Treatment Planning",
    "Family Conference",
    "Handover Communication"
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

  const oScoreOptions = [
    { value: "1", label: "1 - Required complete guidance", color: "bg-assessment-unsatisfactory" },
    { value: "2", label: "2 - Required repeated direction", color: "bg-assessment-needs-improvement" },
    { value: "3", label: "3 - Intermittent prompting required", color: "bg-assessment-satisfactory" },
    { value: "4", label: "4 - Independent, assistance for nuances", color: "bg-assessment-good" },
    { value: "5", label: "5 - Complete independence", color: "bg-assessment-excellent" }
  ];

  const handleSubmit = () => {
    toast({
      title: "Direct Observation Submitted",
      description: `Assessment for ${associate.name} has been recorded successfully.`,
    });
  };

  return (
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
              <Select value={formData.activity} onValueChange={(value) => setFormData({...formData, activity: value})}>
                <SelectTrigger className="border-border bg-background">
                  <SelectValue placeholder="Select activity" />
                </SelectTrigger>
                <SelectContent>
                  {activities.map((activity) => (
                    <SelectItem key={activity} value={activity}>
                      {activity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="setting">Clinical Setting</Label>
              <Select value={formData.setting} onValueChange={(value) => setFormData({...formData, setting: value})}>
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
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input 
                id="duration"
                type="number"
                placeholder="e.g., 45"
                value={formData.duration}
                onChange={(e) => setFormData({...formData, duration: e.target.value})}
                className="border-border bg-background"
              />
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
              <Textarea
                id="technical" 
                placeholder="Describe technical competence, procedures, skills demonstrated..."
                value={formData.technicalSkills}
                onChange={(e) => setFormData({...formData, technicalSkills: e.target.value})}
                className="min-h-[80px] border-border bg-background"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="communication">Communication</Label>
                <VoiceRecorder onTranscription={(text) => setFormData({...formData, communication: text})} />
              </div>
              <Textarea
                id="communication"
                placeholder="Patient interaction, colleague communication, clarity..."
                value={formData.communication}
                onChange={(e) => setFormData({...formData, communication: e.target.value})}
                className="min-h-[80px] border-border bg-background"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="professionalism">Professionalism</Label>
                <VoiceRecorder onTranscription={(text) => setFormData({...formData, professionalism: text})} />
              </div>
              <Textarea
                id="professionalism"
                placeholder="Professional behavior, ethics, patient respect..."
                value={formData.professionalism}
                onChange={(e) => setFormData({...formData, professionalism: e.target.value})}
                className="min-h-[80px] border-border bg-background"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="reasoning">Clinical Reasoning</Label>
                <VoiceRecorder onTranscription={(text) => setFormData({...formData, clinicalReasoning: text})} />
              </div>
              <Textarea
                id="reasoning"
                placeholder="Decision-making process, diagnostic thinking, problem-solving..."
                value={formData.clinicalReasoning}
                onChange={(e) => setFormData({...formData, clinicalReasoning: e.target.value})}
                className="min-h-[80px] border-border bg-background"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="narrative">Overall Narrative</Label>
              <VoiceRecorder onTranscription={(text) => setFormData({...formData, narrative: text})} />
            </div>
            <Textarea
              id="narrative"
              placeholder="Comprehensive description of performance, context, and specific examples..."
              value={formData.narrative}
              onChange={(e) => setFormData({...formData, narrative: e.target.value})}
              className="min-h-[100px] border-border bg-background"
            />
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
                <Textarea
                  id="response"
                  placeholder="How did the physician associate respond to the feedback? Questions asked, understanding demonstrated..."
                  value={formData.associateResponse}
                  onChange={(e) => setFormData({...formData, associateResponse: e.target.value})}
                  className="min-h-[60px] border-border bg-background"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4">
            <Button 
              onClick={handleSubmit}
              className="bg-gradient-primary hover:opacity-90"
              disabled={!formData.activity || !formData.oScore || !formData.narrative}
            >
              Submit Direct Observation
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DirectObservationForm;