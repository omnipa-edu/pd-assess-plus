import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, User, Calendar, FileText, Star } from "lucide-react";
import EPAObservationForm from "@/components/EPAObservationForm";
import DirectObservationForm from "@/components/DirectObservationForm";
import NarrativeAssessmentForm from "@/components/NarrativeAssessmentForm";

interface AssessmentDashboardProps {
  onBack: () => void;
}

const AssessmentDashboard = ({ onBack }: AssessmentDashboardProps) => {
  const [selectedResident, setSelectedResident] = useState<string | null>(null);

  const residents = [
    {
      id: "1",
      name: "Dr. Sarah Chen",
      program: "Internal Medicine",
      year: "PGY-3",
      supervisor: "Dr. Johnson",
      recentScore: 4.2,
      assessmentsCount: 23,
      status: "On Track"
    },
    {
      id: "2", 
      name: "Dr. Michael Rodriguez",
      program: "Surgery",
      year: "PGY-2",
      supervisor: "Dr. Smith",
      recentScore: 3.8,
      assessmentsCount: 18,
      status: "Needs Attention"
    },
    {
      id: "3",
      name: "Dr. Emily Watson", 
      program: "Emergency Medicine",
      year: "PGY-4",
      supervisor: "Dr. Brown",
      recentScore: 4.5,
      assessmentsCount: 31,
      status: "Excellent"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Excellent": return "bg-assessment-excellent text-white";
      case "On Track": return "bg-assessment-good text-white";
      case "Needs Attention": return "bg-assessment-needs-improvement text-white";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  if (selectedResident) {
    const resident = residents.find(r => r.id === selectedResident);
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card shadow-card">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  onClick={() => setSelectedResident(null)}
                  className="hover:bg-primary-light"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Residents
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{resident?.name}</h1>
                  <p className="text-sm text-muted-foreground">
                    {resident?.program} • {resident?.year} • Supervisor: {resident?.supervisor}
                  </p>
                </div>
              </div>
              <Badge className={getStatusColor(resident?.status || "")}>
                {resident?.status}
              </Badge>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-6 py-8">
          <Tabs defaultValue="epa-observation" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-secondary">
              <TabsTrigger value="epa-observation" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                EPA Observation
              </TabsTrigger>
              <TabsTrigger value="direct-observation" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Direct Observation
              </TabsTrigger>
              <TabsTrigger value="narrative" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Narrative Assessment
              </TabsTrigger>
            </TabsList>

            <TabsContent value="epa-observation" className="mt-6">
              <EPAObservationForm resident={resident!} />
            </TabsContent>

            <TabsContent value="direct-observation" className="mt-6">
              <DirectObservationForm resident={resident!} />
            </TabsContent>

            <TabsContent value="narrative" className="mt-6">
              <NarrativeAssessmentForm resident={resident!} />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={onBack}
                className="hover:bg-primary-light"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Assessment Center</h1>
                <p className="text-sm text-muted-foreground">Select a resident to begin assessment</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {residents.map((resident) => (
            <Card 
              key={resident.id} 
              className="bg-gradient-card shadow-card border-0 hover:shadow-elevated transition-all duration-300 cursor-pointer"
              onClick={() => setSelectedResident(resident.id)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{resident.name}</CardTitle>
                      <CardDescription>{resident.program}</CardDescription>
                    </div>
                  </div>
                  <Badge className={getStatusColor(resident.status)}>
                    {resident.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Training Year:</span>
                    <span className="font-semibold text-foreground">{resident.year}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Supervisor:</span>
                    <span className="font-semibold text-foreground">{resident.supervisor}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Recent Avg Score:</span>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-assessment-good fill-current" />
                      <span className="font-semibold text-foreground">{resident.recentScore}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Assessments:</span>
                    <span className="font-semibold text-foreground">{resident.assessmentsCount}</span>
                  </div>

                  <Button className="w-full mt-4 bg-gradient-primary hover:opacity-90">
                    <FileText className="w-4 h-4 mr-2" />
                    Start Assessment
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default AssessmentDashboard;