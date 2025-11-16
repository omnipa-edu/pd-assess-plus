import { useEffect, useRef, useState } from 'react';

import { Loader2, LogOut, ClipboardList, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist';
import { CoachingCornerCard } from '@/components/coaching/CoachingCornerCard';
import { DashboardGridSkeleton } from '@/components/ui/skeleton-loaders';
import { useAuth } from '@/hooks/useAuth';
import { useProfileProgress } from '@/hooks/useProfileProgress';
import { usePrimaryCoachingItem, useDismissCoaching } from '@/hooks/useCoachingCorner';
import { supabase } from '@/integrations/supabase/client';
import { content } from '@/content/strings';
import ReadinessCard from '@/components/ReadinessCard';
import { DEFAULT_READINESS } from '@/lib/readiness/config';
import { computeEpaReadiness, EpaObservation } from '@/lib/readiness/calc';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
  const [loading, setLoading] = useState(true);
  const [epaAssessments, setEpaAssessments] = useState<EPAAssessment[]>([]);
  const [directObservations, setDirectObservations] = useState<DirectObservationAssessment[]>([]);
  const [narratives, setNarratives] = useState<NarrativeAssessment[]>([]);
  const { completeTask, isTaskCompleted } = useProfileProgress();
  const [showOScoreDialog, setShowOScoreDialog] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const epaSectionRef = useRef<HTMLDivElement | null>(null);
  const [readinessData, setReadinessData] = useState<
    { epaCode: string; percent: number; high: number; supCount: number; latestScore: number | null; latestAt: string | null }[]
  >([]);
  
  // Coaching corner
  const { item: coachingItem } = usePrimaryCoachingItem();
  const dismissCoaching = useDismissCoaching();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchAssessments();
  }, [user, navigate]);

  const fetchAssessments = async () => {
    if (!user) return;

    try {
      const [epaData, directData, narrativeData] = await Promise.all([
        supabase.from('epa_assessments').select('*').eq('student_id', user.id).order('created_at', { ascending: false }),
        supabase.from('direct_observation_assessments').select('*').eq('student_id', user.id).order('created_at', { ascending: false }),
        supabase.from('narrative_assessments').select('*').eq('student_id', user.id).order('created_at', { ascending: false })
      ]);

      if (epaData.data) setEpaAssessments(epaData.data);
      if (directData.data) setDirectObservations(directData.data);
      if (narrativeData.data) setNarratives(narrativeData.data);

      // Auto-complete onboarding items based on data conditions
      // 1) View first assessment: any EPA assessment present
      if ((epaData.data?.length || 0) > 0 && !isTaskCompleted('view_first_assessment')) {
        await completeTask('view_first_assessment');
      }

      // 2) Complete profile: program and year set
      // profile is available from useAuth()
      if (profile && (profile.program?.length || 0) > 0 && (profile.year_of_training?.length || 0) > 0) {
        if (!isTaskCompleted('complete_profile')) {
          await completeTask('complete_profile');
        }
      }

      // compute readiness from EPA data
      const observations: EpaObservation[] =
        (epaData.data || []).map((a: EPAAssessment) => ({
          epaCode: a.epa_number,
          supervisorId: a.supervisor_id,
          oscore: Number(a.rating) || null,
          createdAt: a.created_at,
        }));
      const breakdowns = computeEpaReadiness(observations, DEFAULT_READINESS);
      const mapped = breakdowns.map((b) => ({
        epaCode: b.epaCode,
        percent: Math.round(b.readiness * 100),
        high: b.highScoreCount,
        supCount: b.distinctSupervisors,
        latestScore: b.latestScore,
        latestAt: b.latestAt,
      }));
      setReadinessData(mapped);
    } catch (error) {
      console.error('Error fetching assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
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
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>

        {/* Onboarding Checklist */}
        <OnboardingChecklist 
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

        {/* Coaching Corner */}
        <CoachingCornerCard 
          item={coachingItem}
          onDismiss={(id) => dismissCoaching.mutate(id)}
        />

        {/* Readiness Section */}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Readiness</h2>
          {readinessData.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No data yet"
              description="Complete EPA assessments to see your readiness toward practice."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {readinessData.map((r) => (
                <ReadinessCard
                  key={r.epaCode}
                  title={`EPA ${r.epaCode}`}
                  readinessPercent={r.percent}
                  metrics={{
                    highScore: { achieved: r.high, required: DEFAULT_READINESS.minCount },
                    supervisors: { achieved: r.supCount, required: DEFAULT_READINESS.minSupervisors },
                    latestScore: r.latestScore,
                    latestAt: r.latestAt,
                  }}
                />
              ))}
            </div>
          )}
        </div>

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

        <Tabs defaultValue="epa" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="epa">EPA Assessments</TabsTrigger>
            <TabsTrigger value="direct">Direct Observations</TabsTrigger>
            <TabsTrigger value="narrative">Narrative Assessments</TabsTrigger>
          </TabsList>

          <TabsContent value="epa" className="space-y-4" ref={epaSectionRef}>
            {epaAssessments.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title={content.emptyStates.assessments.student.title}
                description={content.emptyStates.assessments.student.description}
                primaryAction={{
                  label: content.emptyStates.assessments.student.primaryCta,
                  onClick: () => {
                    // Navigate to help or documentation
                  }
                }}
                secondaryAction={content.emptyStates.assessments.student.secondaryCta ? {
                  label: content.emptyStates.assessments.student.secondaryCta,
                  onClick: () => {
                    // Show demo
                  }
                } : undefined}
              />
            ) : (
              epaAssessments.map((assessment) => (
                <Card key={assessment.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle>EPA {assessment.epa_number}</CardTitle>
                      <Badge>{assessment.rating}</Badge>
                    </div>
                    <CardDescription>
                      {new Date(assessment.created_at).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium">Feedback</p>
                        <p className="text-sm text-muted-foreground">{assessment.feedback}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="direct" className="space-y-4">
            {directObservations.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title={content.emptyStates.assessments.student.title}
                description={content.emptyStates.assessments.student.description}
                primaryAction={{
                  label: content.emptyStates.assessments.student.primaryCta,
                  onClick: () => {
                    // Navigate to help
                  }
                }}
              />
            ) : (
              directObservations.map((assessment) => (
                <Card key={assessment.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle>{assessment.procedure_type}</CardTitle>
                      <Badge>{assessment.performance_rating}</Badge>
                    </div>
                    <CardDescription>
                      {new Date(assessment.created_at).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium">Feedback</p>
                        <p className="text-sm text-muted-foreground">{assessment.feedback}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="narrative" className="space-y-4">
            {narratives.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title={content.emptyStates.assessments.student.title}
                description={content.emptyStates.assessments.student.description}
                primaryAction={{
                  label: content.emptyStates.assessments.student.primaryCta,
                  onClick: () => {
                    // Navigate to help
                  }
                }}
              />
            ) : (
              narratives.map((assessment) => (
                <Card key={assessment.id}>
                  <CardHeader>
                    <CardTitle>Assessment Period: {assessment.assessment_period}</CardTitle>
                    <CardDescription>
                      {new Date(assessment.created_at).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium">Strengths</p>
                        <p className="text-sm text-muted-foreground">{assessment.strengths}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Areas for Growth</p>
                        <p className="text-sm text-muted-foreground">{assessment.areas_for_growth}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

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