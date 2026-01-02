import { useEffect, useRef, useState, useMemo } from 'react';

import { Loader2, LogOut, ClipboardList, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { AchievementDisplay } from '@/components/achievements/AchievementDisplay';
import { EpaTrajectoryView } from '@/components/benchmarks/EpaTrajectoryView';
import { CoachingCornerFeed } from '@/components/coaching/CoachingCornerFeed';
import { GoalsDisplay } from '@/components/goals/GoalsDisplay';
import { StreakDisplay } from '@/components/gamification/StreakDisplay';
import { LearningPlanCard } from '@/components/learningPlans/LearningPlanCard';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist';
import { LearnerPersonalizedPlan } from '@/components/personalization/LearnerPersonalizedPlan';
import ReadinessCard from '@/components/ReadinessCard';
import { AddWidgetsDrawer } from '@/components/dashboard/AddWidgetsDrawer';
import { DashboardEditControls } from '@/components/dashboard/DashboardEditControls';
import { DashboardGrid } from '@/components/dashboard/DashboardGrid';
import { DashboardCustomizeSidebar } from '@/components/dashboard/DashboardCustomizeSidebar';
import { CustomWidgetRenderer } from '@/components/dashboard/CustomWidgetRenderer';
import { renderWidget } from '@/components/dashboard/widgets/registry';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { DashboardGridSkeleton } from '@/components/ui/skeleton-loaders';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { content } from '@/content/strings';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardLayout } from '@/hooks/useDashboardLayout';
import { useProfileProgress } from '@/hooks/useProfileProgress';
import { useStudentAssessments } from '@/hooks/useStudentAssessments';
import { supabase } from '@/integrations/supabase/client';
import { computeEpaReadiness, type EpaObservation } from '@/lib/readiness/calc';
import { DEFAULT_READINESS } from '@/lib/readiness/config';
import type { WidgetId } from '@/lib/dashboard/types';

interface Assessment {
  id: string;
  created_at: string;
  supervisor_id: string;
}

interface EPAAssessment extends Assessment {
  epa_number: string;
  feedback: string;
  rating: string;
}

interface DirectObservationAssessment extends Assessment {
  procedure_type: string;
  feedback: string;
  performance_rating: string;
}

interface NarrativeAssessment extends Assessment {
  assessment_period: string;
  strengths: string;
  areas_for_growth: string;
}

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  const { completeTask, isTaskCompleted } = useProfileProgress();
  const [showOScoreDialog, setShowOScoreDialog] = useState(false);
  const [selectedEpaForBenchmark, setSelectedEpaForBenchmark] = useState<string | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const epaSectionRef = useRef<HTMLDivElement | null>(null);
  
  // Dashboard layout customization
  const dashboardLayout = useDashboardLayout({
    dashboardType: 'learner',
    userId: user?.id || '',
  });

  // Use React Query for assessments (cached and optimized)
  const { data: assessmentsData, isLoading: loading } = useStudentAssessments();
  const epaAssessments = assessmentsData?.epa || [];
  const directObservations = assessmentsData?.direct || [];
  const narratives = assessmentsData?.narrative || [];

  // Memoize readiness calculation to avoid recomputation on every render
  const readinessData = useMemo(() => {
    if (epaAssessments.length === 0) return [];
    
    const observations: EpaObservation[] = epaAssessments.map((a: EPAAssessment) => ({
      epaCode: a.epa_number,
      supervisorId: a.supervisor_id,
      oscore: Number(a.rating) || null,
      createdAt: a.created_at,
    }));
    
    const breakdowns = computeEpaReadiness(observations, DEFAULT_READINESS);
    return breakdowns.map((b) => ({
      epaCode: b.epaCode,
      percent: Math.round(b.readiness * 100),
      high: b.highScoreCount,
      supCount: b.distinctSupervisors,
      latestScore: b.latestScore,
      latestAt: b.latestAt,
    }));
  }, [epaAssessments]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const handleOnboarding = async () => {
      try {
        // Auto-complete onboarding items based on data conditions
        // 1) View first assessment: any EPA assessment present
        if (epaAssessments.length > 0 && !isTaskCompleted('view_first_assessment')) {
          await completeTask('view_first_assessment');
        }

        // 2) Complete profile: program and year set
        // profile is available from useAuth()
        if (profile && (profile.program?.length || 0) > 0 && (profile.year_of_training?.length || 0) > 0) {
          if (!isTaskCompleted('complete_profile')) {
            await completeTask('complete_profile');
          }
        }
      } catch (error) {
        console.error('Error handling onboarding:', error);
      }
    };

    handleOnboarding();
  }, [user, epaAssessments, profile, completeTask, isTaskCompleted, navigate]);

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
    if (widgetId === 'readiness_cards' || widgetId === 'recent_assessments') {
      return (
        <CustomWidgetRenderer
          widgetId={widgetId}
          isCollapsed={isCollapsed}
          readinessData={readinessData}
          assessmentsData={assessmentsData}
          onEpaClick={setSelectedEpaForBenchmark}
          selectedEpa={selectedEpaForBenchmark}
          profile={profile}
          profileRef={profileRef}
          epaSectionRef={epaSectionRef}
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
            if (taskId === 'complete_profile') {
              profileRef.current?.scrollIntoView({ behavior: 'smooth' });
            } else if (taskId === 'view_first_assessment') {
              epaSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
            } else if (taskId === 'understand_oscore') {
              setShowOScoreDialog(true);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <DashboardGridSkeleton cards={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Assessments</h1>
            <p className="text-muted-foreground">Welcome back, {profile?.full_name || 'Student'}</p>
          </div>
          <div className="flex items-center gap-2">
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
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>

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
          onSetSizePreset={dashboardLayout.setWidgetSizePreset}
          onAddWidget={dashboardLayout.addWidget}
          onSave={handleSaveLayout}
          onCancel={dashboardLayout.cancelEditing}
          onReset={dashboardLayout.resetToDefault}
          hasUnsavedChanges={dashboardLayout.hasUnsavedChanges}
          isSaving={dashboardLayout.isSaving}
          dashboardType="learner"
          aiSuggestions={dashboardLayout.aiSuggestions}
          onApplyAISuggestion={dashboardLayout.applyAISuggestion}
        />

        {/* Dashboard Grid with Customizable Layout */}
        {dashboardLayout.isLoading ? (
          <DashboardGridSkeleton cards={3} />
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

        {/* Profile Card (always visible, not in widget system) */}
        {profile && (
          <Card ref={profileRef}>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Student ID</p>
                <p className="font-medium">{profile.student_id || 'Not set'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Program</p>
                <p className="font-medium">{profile.program || 'Not set'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Year of Training</p>
                <p className="font-medium">{profile.year_of_training || 'Not set'}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* O-SCORE Info Dialog */}
        <Dialog open={showOScoreDialog} onOpenChange={(open) => {
          setShowOScoreDialog(open);
          if (!open && !isTaskCompleted('understand_oscore')) {
            completeTask('understand_oscore');
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Understanding O-SCORE</DialogTitle>
              <DialogDescription>
                O-SCOREs indicate observed readiness on a 1–5 scale. A score of 4+ typically
                signals near-independent performance with minimal supervision required.
                Your readiness combines score thresholds, supervisor mix, and recent activity.
              </DialogDescription>
            </DialogHeader>
            <div className="text-sm text-muted-foreground">
              You can improve readiness by adding recent observations, achieving higher O-SCOREs,
              and having feedback from multiple supervisors.
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default StudentDashboard;