import { useState, useEffect } from "react";

import { 
  ClipboardList, 
  Users, 
  BookOpen, 
  TrendingUp, 
  Plus,
  GraduationCap,
  FileText,
  CheckCircle,
  LogOut,
  Loader2
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import AssessmentDashboard from "@/components/AssessmentDashboard";
import NewAssessmentDialog from "@/components/NewAssessmentDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/ui/Logo";
import { useAuth } from "@/hooks/useAuth";

import { LogoWordmark } from "@/components/brand/LogoWordmark";

const Index = () => {
  const navigate = useNavigate();
  const { user, hasRole, signOut, loading, roles } = useAuth();
  const [currentView, setCurrentView] = useState<'dashboard' | 'new-assessment'>('dashboard');
  const [selectedAssessmentType, setSelectedAssessmentType] = useState<'epa-observation' | 'direct-observation' | 'narrative'>('epa-observation');
  const [showNewAssessment, setShowNewAssessment] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    } else if (!loading && user && roles.length > 0) {
      // Only redirect once roles are loaded (roles.length > 0)
      // Check roles in priority order: admin first, then supervisor, then student
      // Admin should have highest priority since they might have multiple roles
      if (hasRole('admin')) {
        navigate('/admin');
      } else if (hasRole('supervisor')) {
        navigate('/supervisor');
      } else if (hasRole('student')) {
        navigate('/student');
      } else {
        // If no recognized role detected, stay on dashboard
        console.warn('User has no recognized role - staying on dashboard');
      }
    }
  }, [user, loading, roles, hasRole, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const stats = [
    {
      title: "Active Physician Associates",
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
      associate: "Dr. Sarah Chen",
      activity: "EPA 1.1 Assessment",
      supervisor: "Dr. Johnson",
      score: "4 - Independent (just in case)",
      time: "2 hours ago",
      status: "completed"
    },
    {
      associate: "Dr. Michael Rodriguez",
      activity: "Direct Observation",
      supervisor: "Dr. Smith",
      score: "3 - Intermittent prompting",
      time: "4 hours ago",
      status: "completed"
    },
    {
      associate: "Dr. Emily Watson",
      activity: "Procedure Assessment",
      supervisor: "Dr. Brown",
      score: "5 - Complete independence",
      time: "6 hours ago",
      status: "completed"
    }
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (currentView === 'new-assessment') {
    return <AssessmentDashboard onBack={() => setCurrentView('dashboard')} defaultTab={selectedAssessmentType} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Logo showText={false} />
              <div>
                <LogoWordmark className="text-2xl" />
                <p className="text-sm text-muted-foreground">Clinical Intelligence Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-primary-light text-primary">
                Royal College CBD
              </Badge>
              <Button 
                onClick={() => setShowNewAssessment(true)}
                className="bg-gradient-primary shadow-assessment hover:opacity-90"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Assessment
              </Button>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Statistics Grid */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index} className="border-0 bg-gradient-card shadow-card transition-all duration-300 hover:shadow-elevated">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="mt-1 text-3xl font-bold text-foreground">{stat.value}</p>
                    <p className="mt-1 text-xs text-success">{stat.change}</p>
                  </div>
                  <div className={`rounded-lg bg-primary-light p-3 ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Quick Actions */}
          <Card className="border-0 bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center text-foreground">
                <GraduationCap className="mr-2 h-5 w-5 text-primary" />
                Quick Actions
              </CardTitle>
              <CardDescription>Common assessment tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="h-12 w-full justify-start border-border hover:bg-primary-light"
                onClick={() => {
                  setSelectedAssessmentType('epa-observation');
                  setCurrentView('new-assessment');
                }}
              >
                <ClipboardList className="mr-3 h-4 w-4 text-primary" />
                EPA Observation
              </Button>
              <Button 
                variant="outline" 
                className="h-12 w-full justify-start border-border hover:bg-accent-light"
                onClick={() => {
                  setSelectedAssessmentType('direct-observation');
                  setCurrentView('new-assessment');
                }}
              >
                <FileText className="mr-3 h-4 w-4 text-accent" />
                Direct Observation
              </Button>
              <Button 
                variant="outline" 
                className="h-12 w-full justify-start border-border hover:bg-secondary"
                onClick={() => {
                  setSelectedAssessmentType('narrative');
                  setCurrentView('new-assessment');
                }}
              >
                <BookOpen className="mr-3 h-4 w-4 text-muted-foreground" />
                Narrative Assessment
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-0 bg-gradient-card shadow-card lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center text-foreground">
                <TrendingUp className="mr-2 h-5 w-5 text-accent" />
                Recent Assessments
              </CardTitle>
              <CardDescription>Latest workplace-based assessment activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center space-x-3">
                        <h4 className="font-semibold text-foreground">{activity.associate}</h4>
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
                        className="mb-1 bg-assessment-good text-white"
                      >
                        {activity.score}
                      </Badge>
                      <p className="text-xs capitalize text-muted-foreground">{activity.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RX-OCR Process Overview */}
        <Card className="mt-8 border-0 bg-gradient-assessment shadow-card">
          <CardHeader>
            <CardTitle className="text-foreground">RX-OCR Assessment Process</CardTitle>
            <CardDescription>Royal College workplace-based assessment workflow</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
              {[
                { step: "R", title: "Record", desc: "Document observation setup", color: "bg-primary" },
                { step: "X", title: "eXperience", desc: "Workplace-based activity", color: "bg-accent" },
                { step: "O", title: "Observe", desc: "Direct supervision & feedback", color: "bg-assessment-good" },
                { step: "C", title: "Coach", desc: "Provide guidance & support", color: "bg-warning" },
                { step: "R", title: "Record", desc: "Document assessment results", color: "bg-primary" }
              ].map((phase, index) => (
                <div key={index} className="text-center">
                  <div className={`h-12 w-12 ${phase.color} mx-auto mb-3 flex items-center justify-center rounded-full text-lg font-bold text-white`}>
                    {phase.step}
                  </div>
                  <h4 className="mb-1 font-semibold text-foreground">{phase.title}</h4>
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
        onAssessmentSelect={(type) => {
          setSelectedAssessmentType(type);
          setCurrentView('new-assessment');
        }}
      />
    </div>
  );
};

export default Index;