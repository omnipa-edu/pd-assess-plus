import { useState, useMemo } from 'react';

import { Download, FileText, Calendar, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useTeachingStatistics } from '@/hooks/useTeachingStatistics';
import { supabase } from '@/integrations/supabase/client';

export default function CMETeachingReport() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0]
  );

  // Convert string dates to Date objects for the hook
  const startDateObj = useMemo(() => new Date(startDate), [startDate]);
  const endDateObj = useMemo(() => new Date(endDate), [endDate]);

  const { data: stats, isLoading: loading, error } = useTeachingStatistics({
    supervisorId: user?.id || null,
    startDate: startDateObj,
    endDate: endDateObj,
    enabled: !!user,
  });

  // Handle errors
  if (error) {
    const errorMessage = error?.code === 'PGRST116' || error?.message?.includes('404')
      ? 'Some required database tables are missing. Please ensure all migrations have been run.'
      : 'Failed to load report data. Please try again.';
    
    toast({
      title: 'Error',
      description: errorMessage,
      variant: 'destructive',
    });
  }

  const exportCSV = () => {
    if (!stats) return;

    // Get detailed assessment data for CSV
    const generateCSV = async () => {
      try {
        const startDateStr = new Date(startDate).toISOString().split('T')[0];
        const endDateStr = new Date(endDate).toISOString().split('T')[0];

        // Fetch all assessments with their scores (optimized: only select needed columns)
        const [epaAssessments, directAssessments, narrativeAssessments, qualityScoresResult] = await Promise.all([
          supabase
            .from('epa_assessments')
            .select('id, created_at, epa_number, feedback_time_minutes')
            .eq('supervisor_id', user!.id)
            .gte('created_at', startDateStr)
            .lte('created_at', endDateStr),
          supabase
            .from('direct_observation_assessments')
            .select('id, created_at, procedure_type, feedback_time_minutes')
            .eq('supervisor_id', user!.id)
            .gte('created_at', startDateStr)
            .lte('created_at', endDateStr),
          supabase
            .from('narrative_assessments')
            .select('id, created_at, assessment_period, feedback_time_minutes')
            .eq('supervisor_id', user!.id)
            .gte('created_at', startDateStr)
            .lte('created_at', endDateStr),
          supabase
            .from('feedback_quality_scores')
            .select('assessment_id, assessment_type, overall_score, used_ai_assistant')
            .eq('supervisor_id', user!.id)
            .gte('scored_at', startDateStr)
            .lte('scored_at', endDateStr)
            .then(result => {
              // Handle 404 gracefully
              if (result.error && (result.error.code === 'PGRST116' || result.error.message?.includes('404'))) {
                return { data: [], error: null };
              }
              return result;
            }),
        ]);

        const scoresMap = new Map();
        (qualityScoresResult.data || []).forEach(score => {
          scoresMap.set(`${score.assessment_id}_${score.assessment_type}`, score);
        });

        // Build CSV rows
        const rows: string[] = [];
        rows.push('Assessment ID,Date,Type,Details,Time (minutes),Overall Score,AI Used');

        // EPA assessments
        epaAssessments.data?.forEach(assessment => {
          const score = scoresMap.get(`${assessment.id}_epa`);
          rows.push([
            assessment.id,
            new Date(assessment.created_at).toLocaleDateString(),
            'EPA',
            assessment.epa_number || '',
            assessment.feedback_time_minutes || 0,
            score?.overall_score || '',
            score?.used_ai_assistant ? 'Yes' : 'No',
          ].join(','));
        });

        // Direct observation assessments
        directAssessments.data?.forEach(assessment => {
          const score = scoresMap.get(`${assessment.id}_direct_observation`);
          rows.push([
            assessment.id,
            new Date(assessment.created_at).toLocaleDateString(),
            'Direct Observation',
            assessment.procedure_type || '',
            assessment.feedback_time_minutes || 0,
            score?.overall_score || '',
            score?.used_ai_assistant ? 'Yes' : 'No',
          ].join(','));
        });

        // Narrative assessments
        narrativeAssessments.data?.forEach(assessment => {
          const score = scoresMap.get(`${assessment.id}_narrative`);
          rows.push([
            assessment.id,
            new Date(assessment.created_at).toLocaleDateString(),
            'Narrative',
            assessment.assessment_period || '',
            assessment.feedback_time_minutes || 0,
            score?.overall_score || '',
            score?.used_ai_assistant ? 'Yes' : 'No',
          ].join(','));
        });

        const csvContent = rows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cme-teaching-report-${startDate}-${endDate}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        toast({
          title: 'CSV Exported',
          description: 'Your report has been downloaded.',
        });
      } catch (error) {
        console.error('Error exporting CSV:', error);
        toast({
          title: 'Export Failed',
          description: 'Failed to export CSV. Please try again.',
          variant: 'destructive',
        });
      }
    };

    generateCSV();
  };

  const exportPDF = () => {
    // For now, just show a message that PDF export will be implemented
    // In production, you would use a library like jsPDF or react-pdf
    toast({
      title: 'PDF Export',
      description: 'PDF export is coming soon. For now, please use the CSV export.',
    });
  };

  const formatHours = (minutes: number) => {
    return (minutes / 60).toFixed(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Card>
          <CardHeader>
            <CardTitle>CME Teaching & Feedback Report</CardTitle>
            <CardDescription>Loading report data...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/supervisor')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">CME Teaching & Feedback Report</h1>
              <p className="text-muted-foreground">
                {profile?.full_name || 'Supervisor'} • {profile?.institution_id ? 'Institution' : 'No Institution'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={exportPDF}>
              <FileText className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Date Range Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Date Range
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {stats && (
          <>
            {/* Summary Section */}
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
                <CardDescription>
                  {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Students Tracked</p>
                    <p className="text-2xl font-bold">{stats.studentsTracked}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Assessments</p>
                    <p className="text-2xl font-bold">
                      {stats.assessmentCounts.epa +
                        stats.assessmentCounts.direct_observation +
                        stats.assessmentCounts.narrative}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total CME Hours</p>
                    <p className="text-2xl font-bold">
                      {formatHours(
                        stats.cmeTimeByType.direct_observation +
                          stats.cmeTimeByType.narrative_feedback +
                          stats.cmeTimeByType.end_of_rotation +
                          stats.cmeTimeByType.other
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Feedback Quality</p>
                    <p className="text-2xl font-bold">
                      {stats.feedbackQuality.averageOverall > 0
                        ? Math.round(stats.feedbackQuality.averageOverall)
                        : '—'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Time Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Time-Based Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="mb-2 font-semibold">CME Time by Activity Type</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Direct Observation</span>
                      <span className="font-medium">{formatHours(stats.cmeTimeByType.direct_observation)} hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Narrative Feedback</span>
                      <span className="font-medium">{formatHours(stats.cmeTimeByType.narrative_feedback)} hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span>End of Rotation</span>
                      <span className="font-medium">{formatHours(stats.cmeTimeByType.end_of_rotation)} hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Other</span>
                      <span className="font-medium">{formatHours(stats.cmeTimeByType.other)} hours</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="mb-2 font-semibold">Feedback Time by Assessment Type</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>EPA Assessments</span>
                      <span className="font-medium">{formatHours(stats.feedbackTimeByType.epa)} hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Direct Observations</span>
                      <span className="font-medium">{formatHours(stats.feedbackTimeByType.direct_observation)} hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Narrative Assessments</span>
                      <span className="font-medium">{formatHours(stats.feedbackTimeByType.narrative)} hours</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Teaching & Feedback Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Teaching & Feedback Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="mb-2 font-semibold">Assessments by Type</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>EPA Assessments</span>
                      <span className="font-medium">{stats.assessmentCounts.epa}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Direct Observations</span>
                      <span className="font-medium">{stats.assessmentCounts.direct_observation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Narrative Assessments</span>
                      <span className="font-medium">{stats.assessmentCounts.narrative}</span>
                    </div>
                  </div>
                </div>
                {stats.feedbackQuality.averageOverall > 0 && (
                  <div>
                    <h4 className="mb-2 font-semibold">Feedback Quality Scores</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Overall Average</span>
                        <span className="font-medium">{Math.round(stats.feedbackQuality.averageOverall)}/100</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Clarity</span>
                        <span className="font-medium">{stats.feedbackQuality.averageClarity.toFixed(1)}/4</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Specificity</span>
                        <span className="font-medium">{stats.feedbackQuality.averageSpecificity.toFixed(1)}/4</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Actionability</span>
                        <span className="font-medium">{stats.feedbackQuality.averageActionability.toFixed(1)}/4</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Balance</span>
                        <span className="font-medium">{stats.feedbackQuality.averageBalance.toFixed(1)}/4</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Learner Engagement</span>
                        <span className="font-medium">{stats.feedbackQuality.averageEngagement.toFixed(1)}/4</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tone & Professionalism</span>
                        <span className="font-medium">{stats.feedbackQuality.averageTone.toFixed(1)}/4</span>
                      </div>
                      <div className="flex justify-between">
                        <span>High Quality (≥75)</span>
                        <span className="font-medium">{stats.feedbackQuality.highQualityPercentage.toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>AI-Assisted Feedback</span>
                        <span className="font-medium">{stats.feedbackQuality.aiUsagePercentage.toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* CME Disclaimer */}
            <Card>
              <CardHeader>
                <CardTitle>CME Documentation Disclaimer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  This report documents your teaching and feedback activities for the selected period. 
                  The platform tracks activities and quality indicators but does not grant CME credit. 
                  Please consult with your institution or certifying body regarding CME credit eligibility 
                  for Category II activities.
                </p>
                <div className="border-t pt-4">
                  <Label htmlFor="attestation">Attestation</Label>
                  <p className="mt-2 text-sm text-muted-foreground">
                    I attest that the information in this report accurately reflects my teaching and 
                    feedback activities during the specified period.
                  </p>
                  <p className="mt-2 text-sm font-medium">
                    {profile?.full_name || 'Supervisor Name'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date().toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

