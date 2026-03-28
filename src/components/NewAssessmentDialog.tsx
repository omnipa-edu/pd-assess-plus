import { ClipboardList, Eye, FileText, Users, BookOpen, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";


interface NewAssessmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssessmentSelect: (
    type: 'quick-feedback' | 'epa-observation' | 'direct-observation' | 'narrative' | 'procedure-from-library'
  ) => void;
}

const NewAssessmentDialog = ({ open, onOpenChange, onAssessmentSelect }: NewAssessmentDialogProps) => {
  const assessmentTypes = [
    {
      type: "Quick feedback",
      description: "Learner, O-score, and narrative—optional EPA. Fast path; same EPA assessment record.",
      icon: Zap,
      color: "text-primary",
      bgColor: "bg-primary-light",
      value: "quick-feedback" as const
    },
    {
      type: "Full EPA observation",
      description: "Step-by-step EPA form with full RX-OCR fields",
      icon: ClipboardList,
      color: "text-primary",
      bgColor: "bg-teal-50",
      value: "epa-observation" as const
    },
    {
      type: "Direct observation",
      description: "Procedure-based observation: choose cohort, procedure, and learner from the Procedure Library. Opens Run Assessment; saves to Observations.",
      icon: Eye,
      color: "text-accent",
      bgColor: "bg-accent-light",
      value: "procedure-from-library" as const
    },
    {
      type: "Narrative Assessment",
      description: "Qualitative performance evaluation and coaching",
      icon: FileText,
      color: "text-assessment-good",
      bgColor: "bg-green-50",
      value: "narrative" as const
    },
    {
      type: "Multi-Source Feedback",
      description: "360-degree assessment from multiple evaluators",
      icon: Users,
      color: "text-warning",
      bgColor: "bg-yellow-50",
      value: null
    },
    {
      type: "ITER/ITAR",
      description: "In-training evaluation report for rotation assessment",
      icon: BookOpen,
      color: "text-muted-foreground",
      bgColor: "bg-secondary",
      value: null
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-gradient-card">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">
            New Assessment
          </DialogTitle>
          <DialogDescription>
            Select an assessment type to begin the RX-OCR process
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {assessmentTypes.map((assessment, index) => (
            <Card 
              key={index}
              className="cursor-pointer border-border transition-all duration-300 hover:border-primary/20 hover:shadow-card"
              onClick={() => {
                if (assessment.value !== null && assessment.value !== undefined) {
                  onAssessmentSelect(assessment.value);
                  onOpenChange(false);
                }
              }}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className={`rounded-lg p-2 ${assessment.bgColor}`}>
                    <assessment.icon className={`h-5 w-5 ${assessment.color}`} />
                  </div>
                  <CardTitle className="text-lg">{assessment.type}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  {assessment.description}
                </CardDescription>
                <Button 
                  variant="outline" 
                  className="mt-4 w-full border-border hover:border-primary hover:bg-primary-light"
                >
                  Start Assessment
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 rounded-lg border border-primary/20 bg-gradient-assessment p-4">
          <h4 className="mb-2 font-semibold text-foreground">RX-OCR Process Reminder</h4>
          <div className="grid grid-cols-5 gap-2 text-xs text-muted-foreground">
            <div className="text-center">
              <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary font-bold text-white">R</div>
              <span>Record Setup</span>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-accent font-bold text-white">X</div>
              <span>Experience</span>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-assessment-good font-bold text-white">O</div>
              <span>Observe</span>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-warning font-bold text-white">C</div>
              <span>Coach</span>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary font-bold text-white">R</div>
              <span>Record Results</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewAssessmentDialog;