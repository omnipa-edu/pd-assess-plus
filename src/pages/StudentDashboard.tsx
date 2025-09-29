import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, LogOut } from 'lucide-react';

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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">My Assessments</h1>
            <p className="text-muted-foreground">Welcome back, {profile?.full_name || 'Student'}</p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {profile && (
          <Card>
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

          <TabsContent value="epa" className="space-y-4">
            {epaAssessments.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No EPA assessments yet
                </CardContent>
              </Card>
            ) : (
              epaAssessments.map((assessment) => (
                <Card key={assessment.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
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
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No direct observations yet
                </CardContent>
              </Card>
            ) : (
              directObservations.map((assessment) => (
                <Card key={assessment.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
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
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No narrative assessments yet
                </CardContent>
              </Card>
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
      </div>
    </div>
  );
};

export default StudentDashboard;