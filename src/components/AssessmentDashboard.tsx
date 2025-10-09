import { useState } from "react";

import { ArrowLeft, User, Calendar, FileText, Star } from "lucide-react";

import DirectObservationForm from "@/components/DirectObservationForm";
import EPAObservationForm from "@/components/EPAObservationForm";
import NarrativeAssessmentForm from "@/components/NarrativeAssessmentForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AssessmentDashboardProps {
  onBack: () => void;
  defaultTab?: 'epa-observation' | 'direct-observation' | 'narrative';
}

const AssessmentDashboard = ({ onBack, defaultTab = 'epa-observation' }: AssessmentDashboardProps) => {
  const [selectedAssociate, setSelectedAssociate] = useState<string | null>(null);

  const associates = [
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

  if (selectedAssociate) {
    const associate = associates.find(r => r.id === selectedAssociate);
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card shadow-card">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => setSelectedAssociate(null)}
                size="sm"
              >
                  Back to Physician Associates
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{associate?.name}</h1>
                  <p className="text-sm text-muted-foreground">
                    {associate?.program} • {associate?.year} • Supervisor: {associate?.supervisor}
                  </p>
                </div>
              </div>
              <Badge className={getStatusColor(associate?.status || "")}>
                {associate?.status}
              </Badge>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-6 py-8">
          <Tabs defaultValue={defaultTab} className="w-full">
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
              <EPAObservationForm associate={associate!} />
            </TabsContent>
            
            <TabsContent value="direct-observation" className="space-y-4">
              <DirectObservationForm associate={associate!} />
            </TabsContent>
            
            <TabsContent value="narrative" className="space-y-4">
              <NarrativeAssessmentForm associate={associate!} />
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
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Assessment Center</h1>
                <p className="text-sm text-muted-foreground">Select a physician associate to begin assessment</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {associates.map((associate) => (
            <Card 
              key={associate.id} 
              className="cursor-pointer border-0 bg-gradient-card shadow-card transition-all duration-300 hover:shadow-elevated"
              onClick={() => setSelectedAssociate(associate.id)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-primary">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{associate.name}</CardTitle>
                      <CardDescription>{associate.program}</CardDescription>
                    </div>
                  </div>
                  <Badge className={getStatusColor(associate.status)}>
                    {associate.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Training Year:</span>
                    <span className="font-semibold text-foreground">{associate.year}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Supervisor:</span>
                    <span className="font-semibold text-foreground">{associate.supervisor}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Recent Avg Score:</span>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 fill-current text-assessment-good" />
                      <span className="font-semibold text-foreground">{associate.recentScore}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Assessments:</span>
                    <span className="font-semibold text-foreground">{associate.assessmentsCount}</span>
                  </div>

                  <Button className="mt-4 w-full bg-gradient-primary hover:opacity-90">
                    <FileText className="mr-2 h-4 w-4" />
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