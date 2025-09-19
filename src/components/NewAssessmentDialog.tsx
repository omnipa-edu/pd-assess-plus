import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, Eye, FileText, Users, BookOpen, Stethoscope } from "lucide-react";

interface NewAssessmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NewAssessmentDialog = ({ open, onOpenChange }: NewAssessmentDialogProps) => {
  const assessmentTypes = [
    {
      type: "EPA Observation",
      description: "Entrustable Professional Activity assessment with O score",
      icon: ClipboardList,
      color: "text-primary",
      bgColor: "bg-primary-light"
    },
    {
      type: "Direct Observation", 
      description: "Real-time supervision and feedback documentation",
      icon: Eye,
      color: "text-accent",
      bgColor: "bg-accent-light"
    },
    {
      type: "Narrative Assessment",
      description: "Qualitative performance evaluation and coaching",
      icon: FileText,
      color: "text-assessment-good",
      bgColor: "bg-green-50"
    },
    {
      type: "Multi-Source Feedback",
      description: "360-degree assessment from multiple evaluators",
      icon: Users,
      color: "text-warning",
      bgColor: "bg-yellow-50"
    },
    {
      type: "Procedure Assessment",
      description: "Technical skill evaluation with competency markers",
      icon: Stethoscope,
      color: "text-destructive",
      bgColor: "bg-red-50"
    },
    {
      type: "ITER/ITAR",
      description: "In-training evaluation report for rotation assessment",
      icon: BookOpen,
      color: "text-muted-foreground",
      bgColor: "bg-secondary"
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {assessmentTypes.map((assessment, index) => (
            <Card 
              key={index}
              className="hover:shadow-card transition-all duration-300 cursor-pointer border-border hover:border-primary/20"
              onClick={() => {
                // Handle assessment type selection
                onOpenChange(false);
              }}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${assessment.bgColor}`}>
                    <assessment.icon className={`w-5 h-5 ${assessment.color}`} />
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
                  className="w-full mt-4 border-border hover:bg-primary-light hover:border-primary"
                >
                  Start Assessment
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 p-4 bg-gradient-assessment rounded-lg border border-primary/20">
          <h4 className="font-semibold text-foreground mb-2">RX-OCR Process Reminder</h4>
          <div className="grid grid-cols-5 gap-2 text-xs text-muted-foreground">
            <div className="text-center">
              <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold mx-auto mb-1">R</div>
              <span>Record Setup</span>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-accent text-white rounded-full flex items-center justify-center font-bold mx-auto mb-1">X</div>
              <span>Experience</span>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-assessment-good text-white rounded-full flex items-center justify-center font-bold mx-auto mb-1">O</div>
              <span>Observe</span>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-warning text-white rounded-full flex items-center justify-center font-bold mx-auto mb-1">C</div>
              <span>Coach</span>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold mx-auto mb-1">R</div>
              <span>Record Results</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewAssessmentDialog;