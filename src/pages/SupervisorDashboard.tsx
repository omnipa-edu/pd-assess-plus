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
  AlertTriangle,
  UserCircle,
  HelpCircle
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import AssessmentDashboard from "@/components/AssessmentDashboard";
import { AchievementDisplay } from "@/components/achievements/AchievementDisplay";
import { SupervisorBenchmarkView } from "@/components/benchmarks/SupervisorBenchmarkView";
import { CMESummaryCard } from "@/components/cme/CMESummaryCard";
import { CoachingCornerFeed } from "@/components/coaching/CoachingCornerFeed";
import { GoalsDisplay } from "@/components/goals/GoalsDisplay";
import { StreakDisplay } from "@/components/gamification/StreakDisplay";
import NewAssessmentDialog from "@/components/NewAssessmentDialog";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { OnboardingChecklist } from "@/components/onboarding/OnboardingChecklist";
import { FloatingActionButton } from "@/components/quick-actions/FloatingActionButton";
import { SupervisorPersonalizedView } from "@/components/personalization/SupervisorPersonalizedView";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import { TeachingStatisticsCard } from "@/components/teaching/TeachingStatisticsCard";
import { AddWidgetsDrawer } from "@/components/dashboard/AddWidgetsDrawer";
import { DashboardEditControls } from "@/components/dashboard/DashboardEditControls";
import { DashboardGrid } from "@/components/dashboard/DashboardGrid";
import { DashboardCustomizeSidebar } from "@/components/dashboard/DashboardCustomizeSidebar";
import { CustomWidgetRenderer } from "@/components/dashboard/CustomWidgetRenderer";
import { renderWidget } from "@/components/dashboard/widgets/registry";
import { SupervisorRecommendationsCard } from "@/components/resources/SupervisorRecommendationsCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ui/Logo";
import { DashboardGridSkeleton } from "@/components/ui/skeleton-loaders";

import { LogoWordmark } from "@/components/brand/LogoWordmark";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardLayout } from "@/hooks/useDashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import type { WidgetId } from "@/lib/dashboard/types";

const SupervisorDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signOut, hasRole, loading, profile, user } = useAuth();
  const [currentView, setCurrentView] = useState<'dashboard' | 'new-assessment'>('dashboard');
  const [selectedAssessmentType, setSelectedAssessmentType] = useState<'epa-observation' | 'direct-observation' | 'narrative'>('epa-observation');
  const [showNewAssessment, setShowNewAssessment] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: profile?.full_name || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  
  // Dashboard layout customization
  const dashboardLayout = useDashboardLayout({
    dashboardType: 'supervisor',
    userId: user?.id || '',
  });
  
  // Update form when profile changes
  useEffect(() => {
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || '',
      });
    }
  }, [profile]);
  
  const handleSaveProfile = async () => {
    if (!profile) return;
    
    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: profileForm.full_name })
        .eq('id', profile.id);
      
      if (error) throw error;
      
      setShowProfileDialog(false);
      
      // Show success message - profile will be refreshed on next page load or auth state change
      // The useAuth hook will automatically refetch profile data when auth state changes
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  // Handle saving layout
  const handleSaveLayout = async () => {
    try {
      await dashboardLayout.saveLayout();
      toast({
        title: 'Dashboard saved',
        description: 'Your dashboard layout has been saved successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save dashboard layout.',
        variant: 'destructive',
      });
    }
  };

  // Render widget function that handles both registry and custom widgets
  const renderWidgetContent = (widgetId: WidgetId, isCollapsed: boolean) => {
    // Check if it's a custom widget that needs special handling
    if (widgetId === 'statistics_grid') {
      return (
        <CustomWidgetRenderer
          widgetId={widgetId}
          isCollapsed={isCollapsed}
          stats={stats}
        />
      );
    }

    // Special handling for OnboardingChecklist (needs onTaskClick)
    if (widgetId === 'onboarding_checklist') {
      if (isCollapsed) return null;
      return (
        <OnboardingChecklist
          className=""
          onTaskClick={(taskId) => {
            if (taskId === 'create_first_assessment') {
              setShowNewAssessment(true);
            } else if (taskId === 'add_student') {
              navigate('/supervisor/students');
            } else if (taskId === 'complete_profile') {
              setShowProfileDialog(true);
            } else if (taskId === 'explore_analytics') {
              toast({
                title: 'Analytics Dashboard',
                description: 'Analytics dashboard is coming soon. You can view assessment statistics in the Recent Assessments section.',
              });
            }
          }}
        />
      );
    }

    // Use registry for standard widgets
    return renderWidget(widgetId, {
      widgetId,
      isCollapsed,
      onToggleCollapse: () => dashboardLayout.toggleWidgetCollapse(widgetId),
      className: '',
    });
  };

  // Check if user has supervisor role
  if (!loading && !hasRole('supervisor')) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="mx-4 w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-destructive/10 p-4">
                <AlertTriangle className="h-12 w-12 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-2xl">Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access this page. This area is restricted to supervisors only.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <Button onClick={() => navigate('/')} className="w-full">
              Return to Dashboard
            </Button>
            <Button variant="outline" onClick={handleSignOut} className="w-full">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-8">
          <DashboardGridSkeleton cards={4} />
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: "Active Learners",
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
                <p className="text-sm text-muted-foreground">Supervisor Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              {!dashboardLayout.isEditing && <NotificationCenter />}
              <DashboardEditControls
                isEditing={dashboardLayout.isEditing}
                hasUnsavedChanges={dashboardLayout.hasUnsavedChanges}
                isSaving={dashboardLayout.isSaving}
                onStartEditing={dashboardLayout.startEditing}
                onCancel={dashboardLayout.cancelEditing}
                onSave={handleSaveLayout}
                onReset={dashboardLayout.resetToDefault}
              />
              {!dashboardLayout.isEditing && (
                <>
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/supervisor/students')}
                    size="sm"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">My Students</span>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/supervisor/resources">
                      <BookOpen className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">View resources</span>
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/supervisor/help">
                      <HelpCircle className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">Help</span>
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/supervisor/run-assessment">
                      <ClipboardList className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">Run</span> assessment
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/supervisor/observations">
                      <FileText className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">Observations</span>
                    </Link>
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setShowProfileDialog(true)}
                    size="sm"
                  >
                    <UserCircle className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Profile</span>
                  </Button>
                  <Button 
                    onClick={() => setShowNewAssessment(true)}
                    className="bg-gradient-primary shadow-assessment hover:opacity-90"
                    size="sm"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">New</span> Assessment
                  </Button>
                </>
              )}
              <Button variant="outline" onClick={handleSignOut} size="sm">
                <LogOut className="mr-2 h-4 w-4" />
                <span className="hidden md:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Dashboard Customization Sidebar */}
        <DashboardCustomizeSidebar
          open={dashboardLayout.isEditing}
          onOpenChange={(open) => {
            if (!open) {
              dashboardLayout.cancelEditing();
            } else {
              dashboardLayout.startEditing();
            }
          }}
          widgets={dashboardLayout.layout.widgets}
          onReorder={dashboardLayout.moveWidget}
          onRemove={dashboardLayout.toggleWidgetVisibility}
          onToggleVisibility={dashboardLayout.toggleWidgetVisibility}
          onToggleCollapse={dashboardLayout.toggleWidgetCollapse}
          onSetDefaultCollapsed={dashboardLayout.setDefaultCollapsed}
          onSetAutoMode={dashboardLayout.setAutoMode}
          onSetSizePreset={dashboardLayout.setWidgetSizePreset}
          onAddWidget={dashboardLayout.addWidget}
          onSave={handleSaveLayout}
          onCancel={dashboardLayout.cancelEditing}
          onReset={dashboardLayout.resetToDefault}
          hasUnsavedChanges={dashboardLayout.hasUnsavedChanges}
          isSaving={dashboardLayout.isSaving}
          dashboardType="supervisor"
          aiSuggestions={dashboardLayout.aiSuggestions}
          onApplyAISuggestion={dashboardLayout.applyAISuggestion}
          onApplyMobileOptimizedLayout={async (options) => {
            const applied = await dashboardLayout.applyMobileOptimizedLayout(options);
            if (applied) {
              toast({
                title: 'Mobile layout applied',
                description: 'Your dashboard was optimized for mobile and saved.',
              });
            }
            return applied;
          }}
        />

        {/* Dashboard Grid with Customizable Layout */}
        {dashboardLayout.isLoading ? (
          <DashboardGridSkeleton cards={4} />
        ) : (
          <DashboardGrid
            widgets={dashboardLayout.visibleWidgets}
            isEditing={dashboardLayout.isEditing}
            renderWidget={renderWidgetContent}
            onReorder={dashboardLayout.moveWidget}
            onRemove={dashboardLayout.toggleWidgetVisibility}
            onToggleCollapse={dashboardLayout.toggleWidgetCollapse}
            onSetDefaultCollapsed={dashboardLayout.setDefaultCollapsed}
          />
        )}

        <SupervisorRecommendationsCard />

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
      
      {/* Profile Edit Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your profile information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={profileForm.full_name}
                onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                placeholder="Enter your full name"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={profile?.email || ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed. Contact your administrator if you need to update it.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowProfileDialog(false)}
              disabled={savingProfile}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveProfile}
              disabled={savingProfile}
            >
              {savingProfile ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
          </DialogContent>
        </Dialog>

        {/* Floating Action Button */}
        <FloatingActionButton />
    </div>
  );
};

export default SupervisorDashboard;
