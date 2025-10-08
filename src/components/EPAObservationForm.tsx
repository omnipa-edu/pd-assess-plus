import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, MapPin, User, Star, FileText, CheckCircle } from "lucide-react";
import VoiceRecorder from "@/components/VoiceRecorder";

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
    duration: "",
    oScore: "",
    canmedsRoles: [] as string[],
    narrative: "",
    strengths: "",
    areasForImprovement: "",
    actionPlan: ""
  });
  const { toast } = useToast();

  const epas = [
    { value: "1.1", label: "EPA 1.1 - Assess the patient with ENT-HNS complaints" },
    { value: "1.2", label: "EPA 1.2 - Provide initial clinical assessment, investigation and development of a management plan for patients with acute upper airway obstruction" },
    { value: "2.1", label: "EPA 2.1 - Draining a peritonsillar abscess" },
    { value: "2.2", label: "EPA 2.2 - Assess and provide basic management for patients with epistaxis" },
    { value: "2.3", label: "EPA 2.3 - Assess and provide initial management for uncomplicated adult and pediatric patients with adenotonsillar disease" },
    { value: "2.4", label: "EPA 2.4 - Assess and provide initial management for patients with hearing loss" },
    { value: "3.1", label: "EPA 3.1 - Perform primary skin closure to face and neck" },
    { value: "3.2", label: "EPA 3.2 - Assess and participate in the care of patients with maxillofacial trauma" },
    { value: "3.3", label: "EPA 3.3 - Provide basic airway management for patients with normal airway anatomy" },
    { value: "3.4", label: "EPA 3.4 - Identify patients presenting with anticipated difficult airway and prepare for initial management options" },
    { value: "4.1", label: "EPA 4.1 - Provide postoperative management" },
    { value: "4.2", label: "EPA 4.2 - Manage inpatient surgical service" },
    { value: "5.1", label: "EPA 5.1 - Assess and manage patients with non-neoplastic salivary disorders" },
    { value: "5.2", label: "EPA 5.2 - Assess patients with dysphagia" },
    { value: "5.3", label: "EPA 5.3 - Assess and manage patients with sleep disordered breathing" },
    { value: "5.4", label: "EPA 5.4 - Assess patients with facial paralysis, and provide recommendations for non-surgical and surgical treatment options" },
    { value: "6.1", label: "EPA 6.1 - Assess and manage pediatric patients with acute otitis media and otitis media with effusion" },
    { value: "6.2", label: "EPA 6.2 - Assess and manage patients presenting with rhinosinusitis" },
    { value: "6.3", label: "EPA 6.3 - Assess and manage patients presenting with a sinonasal mass" },
    { value: "6.4", label: "EPA 6.4 - Assess and manage patients with nasal obstruction/septal deformity" },
    { value: "6.5", label: "EPA 6.5 - Assess and manage patients with chronic airway obstruction" },
    { value: "7.1", label: "EPA 7.1 - Assess patients with dysphonia" },
    { value: "7.2", label: "EPA 7.2 - Assess and manage patients with mucosal squamous cell carcinoma of the head and neck" },
    { value: "8.1", label: "EPA 8.1 - Assess and manage patients with disorders of the thyroid glands" },
    { value: "8.2", label: "EPA 8.2 - Assess and manage patients with disorders of the parathyroid glands" },
    { value: "8.3", label: "EPA 8.3 - Assess and manage patients with neoplastic disorders of the salivary glands" },
    { value: "9.1", label: "EPA 9.1 - Assess and manage patients with head and neck surgical defects" },
    { value: "9.2", label: "EPA 9.2 - Assess and manage patients with benign or malignant skin lesions of the head and neck" },
    { value: "10.1", label: "EPA 10.1 - Assess patients with tinnitus and providing initial management" },
    { value: "10.2", label: "EPA 10.2 - Assess patients with hearing loss and provide initial management plan" },
    { value: "10.3", label: "EPA 10.3 - Assess patients with vertigo and provide initial management plan" },
    { value: "11.1", label: "EPA 11.1 - Provide after-hours call to ENT-HNS practice" }
  ];

  const oScoreOptions = [
    { value: "1", label: "1 - Required complete guidance: 'I had to do'", color: "bg-assessment-unsatisfactory" },
    { value: "2", label: "2 - Required repeated direction: 'I had to talk them through'", color: "bg-assessment-needs-improvement" },
    { value: "3", label: "3 - Intermittent prompting required: 'I had to direct from time to time'", color: "bg-assessment-satisfactory" },
    { value: "4", label: "4 - Independent, assistance for nuances: 'I had to be just in case'", color: "bg-assessment-good" },
    { value: "5", label: "5 - Complete independence: 'I did not need to be there'", color: "bg-assessment-excellent" }
  ];

  const canmedsRoles = [
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
      title: "Assessment Submitted Successfully",
      description: `EPA observation for ${associate.name} has been recorded.`,
    });
  };

  const renderStep1 = () => (
    <Card className="bg-gradient-card shadow-card border-0">
      <CardHeader>
        <CardTitle className="flex items-center text-foreground">
          <FileText className="w-5 h-5 mr-2 text-primary" />
          Step 1: Record Setup (R)
        </CardTitle>
        <CardDescription>Document the assessment parameters and context</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="epa">EPA Selection</Label>
            <Select value={formData.epaNumber} onValueChange={(value) => setFormData({...formData, epaNumber: value})}>
              <SelectTrigger className="bg-background border-border">
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="setting">Clinical Setting</Label>
            <Select value={formData.setting} onValueChange={(value) => setFormData({...formData, setting: value})}>
              <SelectTrigger className="bg-background border-border">
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
              className="bg-background border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Time</Label>
            <Input 
              id="time"
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({...formData, time: e.target.value})}
              className="bg-background border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input 
              id="duration"
              type="number"
              placeholder="e.g., 30"
              value={formData.duration}
              onChange={(e) => setFormData({...formData, duration: e.target.value})}
              className="bg-background border-border"
            />
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
    <Card className="bg-gradient-card shadow-card border-0">
      <CardHeader>
        <CardTitle className="flex items-center text-foreground">
          <MapPin className="w-5 h-5 mr-2 text-accent" />
          Step 2: Experience (X) & Observe (O)
        </CardTitle>
        <CardDescription>Rate the supervision level and document observation</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Label className="text-base font-semibold">Retrospective Supervision Scale (O Score)</Label>
          <RadioGroup 
            value={formData.oScore} 
            onValueChange={(value) => setFormData({...formData, oScore: value})}
            className="space-y-3"
          >
            {oScoreOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-secondary/50">
                <RadioGroupItem value={option.value} id={option.value} />
                <div className="flex-1">
                  <Label htmlFor={option.value} className="cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${option.color}`}></div>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {canmedsRoles.map((role) => (
              <Badge
                key={role}
                variant={formData.canmedsRoles.includes(role) ? "default" : "outline"}
                className={`cursor-pointer p-2 justify-center ${
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
    <Card className="bg-gradient-card shadow-card border-0">
      <CardHeader>
        <CardTitle className="flex items-center text-foreground">
          <CheckCircle className="w-5 h-5 mr-2 text-success" />
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
            <Textarea
              id="narrative"
              placeholder="Describe specific behaviors observed, context, and performance details..."
              value={formData.narrative}
              onChange={(e) => setFormData({...formData, narrative: e.target.value})}
              className="min-h-[100px] bg-background border-border"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="strengths">Strengths Observed</Label>
              <VoiceRecorder onTranscription={(text) => setFormData({...formData, strengths: text})} />
            </div>
            <Textarea
              id="strengths"
              placeholder="What did the physician associate do well? Specific examples..."
              value={formData.strengths}
              onChange={(e) => setFormData({...formData, strengths: e.target.value})}
              className="min-h-[80px] bg-background border-border"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="improvements">Areas for Improvement</Label>
              <VoiceRecorder onTranscription={(text) => setFormData({...formData, areasForImprovement: text})} />
            </div>
            <Textarea
              id="improvements"
              placeholder="What could be improved? Constructive feedback..."
              value={formData.areasForImprovement}
              onChange={(e) => setFormData({...formData, areasForImprovement: e.target.value})}
              className="min-h-[80px] bg-background border-border"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="actionPlan">Action Plan & Next Steps</Label>
              <VoiceRecorder onTranscription={(text) => setFormData({...formData, actionPlan: text})} />
            </div>
            <Textarea
              id="actionPlan"
              placeholder="Specific recommendations for future learning and development..."
              value={formData.actionPlan}
              onChange={(e) => setFormData({...formData, actionPlan: e.target.value})}
              className="min-h-[80px] bg-background border-border"
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
            disabled={!formData.narrative}
          >
            Submit Assessment
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <Card className="bg-gradient-assessment shadow-card border-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <User className="w-5 h-5 text-primary" />
              <div>
                <h3 className="font-semibold text-foreground">{associate.name}</h3>
                <p className="text-sm text-muted-foreground">{associate.program} • {associate.year}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
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
      {currentStep === 3 && renderStep3()}
    </div>
  );
};

export default EPAObservationForm;