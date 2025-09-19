import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ClipboardList, 
  Users, 
  BookOpen, 
  TrendingUp, 
  Plus,
  Stethoscope,
  GraduationCap,
  FileText,
  CheckCircle
} from "lucide-react";
import AssessmentDashboard from "@/components/AssessmentDashboard";
import NewAssessmentDialog from "@/components/NewAssessmentDialog";

const Index = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'new-assessment'>('dashboard');
  const [showNewAssessment, setShowNewAssessment] = useState(false);

  const stats = [
    {
      title: "Active Residents",
      value: "24",
      change: "+2 this month",
      icon: Users,
      color: "text-primary"
    },
    {
      title: "Assessments This Week",
      value: "87",
      change: "+15 from last week",
      icon: ClipboardList,
      color: "text-accent"
    },
    {
      title: "EPAs Completed",
      value: "156",
      change: "+23 this month",
      icon: CheckCircle,
      color: "text-success"
    },
    {
      title: "Avg O Score",
      value: "3.8",
      change: "+0.3 improvement",
      icon: TrendingUp,
      color: "text-assessment-good"
    }
  ];

  const recentActivity = [
    {
      resident: "Dr. Sarah Chen",
      activity: "EPA 1.1 Assessment",
      supervisor: "Dr. Johnson",
      score: "4 - Independent (just in case)",
      time: "2 hours ago",
      status: "completed"
    },
    {
      resident: "Dr. Michael Rodriguez",
      activity: "Direct Observation",
      supervisor: "Dr. Smith",
      score: "3 - Intermittent prompting",
      time: "4 hours ago",
      status: "completed"
    },
    {
      resident: "Dr. Emily Watson",
      activity: "Procedure Assessment",
      supervisor: "Dr. Brown",
      score: "5 - Complete independence",
      time: "6 hours ago",
      status: "completed"
    }
  ];

  if (currentView === 'new-assessment') {
    return <AssessmentDashboard onBack={() => setCurrentView('dashboard')} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-primary rounded-lg">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">WBA Tracker</h1>
                <p className="text-sm text-muted-foreground">Workplace-Based Assessment Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-primary-light text-primary">
                Royal College CBD
              </Badge>
              <Button 
                onClick={() => setShowNewAssessment(true)}
                className="bg-gradient-primary hover:opacity-90 shadow-assessment"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Assessment
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="bg-gradient-card shadow-card border-0 hover:shadow-elevated transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{stat.value}</p>
                    <p className="text-xs text-success mt-1">{stat.change}</p>
                  </div>
                  <div className={`p-3 rounded-lg bg-primary-light ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <Card className="bg-gradient-card shadow-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center text-foreground">
                <GraduationCap className="w-5 h-5 mr-2 text-primary" />
                Quick Actions
              </CardTitle>
              <CardDescription>Common assessment tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start h-12 border-border hover:bg-primary-light"
                onClick={() => setCurrentView('new-assessment')}
              >
                <ClipboardList className="w-4 h-4 mr-3 text-primary" />
                EPA Observation
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start h-12 border-border hover:bg-accent-light"
              >
                <FileText className="w-4 h-4 mr-3 text-accent" />
                Direct Observation
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start h-12 border-border hover:bg-secondary"
              >
                <BookOpen className="w-4 h-4 mr-3 text-muted-foreground" />
                Narrative Assessment
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="lg:col-span-2 bg-gradient-card shadow-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center text-foreground">
                <TrendingUp className="w-5 h-5 mr-2 text-accent" />
                Recent Assessments
              </CardTitle>
              <CardDescription>Latest workplace-based assessment activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-background rounded-lg border border-border">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold text-foreground">{activity.resident}</h4>
                        <Badge variant="outline" className="text-xs">
                          {activity.activity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Supervisor: {activity.supervisor} • {activity.time}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant="secondary" 
                        className="bg-assessment-good text-white mb-1"
                      >
                        {activity.score}
                      </Badge>
                      <p className="text-xs text-muted-foreground capitalize">{activity.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RX-OCR Process Overview */}
        <Card className="mt-8 bg-gradient-assessment shadow-card border-0">
          <CardHeader>
            <CardTitle className="text-foreground">RX-OCR Assessment Process</CardTitle>
            <CardDescription>Royal College workplace-based assessment workflow</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[
                { step: "R", title: "Record", desc: "Document observation setup", color: "bg-primary" },
                { step: "X", title: "eXperience", desc: "Workplace-based activity", color: "bg-accent" },
                { step: "O", title: "Observe", desc: "Direct supervision & feedback", color: "bg-assessment-good" },
                { step: "C", title: "Coach", desc: "Provide guidance & support", color: "bg-warning" },
                { step: "R", title: "Record", desc: "Document assessment results", color: "bg-primary" }
              ].map((phase, index) => (
                <div key={index} className="text-center">
                  <div className={`w-12 h-12 ${phase.color} text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-3`}>
                    {phase.step}
                  </div>
                  <h4 className="font-semibold text-foreground mb-1">{phase.title}</h4>
                  <p className="text-xs text-muted-foreground">{phase.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      <NewAssessmentDialog 
        open={showNewAssessment} 
        onOpenChange={setShowNewAssessment}
      />
    </div>
  );
};

export default Index;