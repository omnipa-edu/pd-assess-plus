import { useMemo } from 'react';

import { Users, FileText, Clock, TrendingUp, Sparkles, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useTeachingStatistics } from '@/hooks/useTeachingStatistics';

interface TeachingStatisticsCardProps {
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export function TeachingStatisticsCard({ dateRange }: TeachingStatisticsCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Default to current calendar year
  const startDate = useMemo(
    () => dateRange?.start || new Date(new Date().getFullYear(), 0, 1),
    [dateRange?.start]
  );
  const endDate = useMemo(
    () => dateRange?.end || new Date(new Date().getFullYear(), 11, 31),
    [dateRange?.end]
  );

  const { data: stats, isLoading: loading, error } = useTeachingStatistics({
    supervisorId: user?.id || null,
    startDate,
    endDate,
    enabled: !!user,
  });

  // Handle errors
  if (error) {
    const errorMessage = error?.code === 'PGRST116' || error?.message?.includes('404')
      ? 'Some required database tables are missing. Please ensure all migrations have been run.'
      : 'Failed to load teaching statistics. Please try again.';
    
    toast({
      title: 'Error',
      description: errorMessage,
      variant: 'destructive',
    });
  }

  const formatHours = (minutes: number) => {
    return (minutes / 60).toFixed(1);
  };

  if (loading) {
    return (
      <Card className="border-0 bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle>Teaching & Feedback Summary</CardTitle>
          <CardDescription>Loading statistics...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <Card className="border-0 bg-gradient-card shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Teaching & Feedback Summary
            </CardTitle>
            <CardDescription>
              {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/supervisor/cme-teaching-report')}
          >
            View Full Report
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Top-level summary */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Students</span>
            </div>
            <p className="text-2xl font-bold">{stats.studentsTracked}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>Assessments</span>
            </div>
            <p className="text-2xl font-bold">
              {stats.assessmentCounts.epa + stats.assessmentCounts.direct_observation + stats.assessmentCounts.narrative}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>CME Hours</span>
            </div>
            <p className="text-2xl font-bold">
              {formatHours(
                stats.cmeTimeByType.direct_observation +
                stats.cmeTimeByType.narrative_feedback +
                stats.cmeTimeByType.end_of_rotation +
                stats.cmeTimeByType.other
              )}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>Avg Quality</span>
            </div>
            <p className="text-2xl font-bold">
              {stats.feedbackQuality.averageOverall > 0
                ? Math.round(stats.feedbackQuality.averageOverall)
                : '—'}
            </p>
          </div>
        </div>

        {/* Assessment breakdown */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Assessments by Type</h4>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border p-2 text-center">
              <p className="text-xs text-muted-foreground">EPA</p>
              <p className="text-lg font-bold">{stats.assessmentCounts.epa}</p>
            </div>
            <div className="rounded-lg border p-2 text-center">
              <p className="text-xs text-muted-foreground">Direct Obs.</p>
              <p className="text-lg font-bold">{stats.assessmentCounts.direct_observation}</p>
            </div>
            <div className="rounded-lg border p-2 text-center">
              <p className="text-xs text-muted-foreground">Narrative</p>
              <p className="text-lg font-bold">{stats.assessmentCounts.narrative}</p>
            </div>
          </div>
        </div>

        {/* Feedback quality metrics */}
        {stats.feedbackQuality.averageOverall > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Feedback Quality</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">High Quality (≥75)</span>
                <Badge variant="secondary">
                  {stats.feedbackQuality.highQualityPercentage.toFixed(0)}%
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">AI-Assisted</span>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  {stats.feedbackQuality.aiUsagePercentage.toFixed(0)}%
                </Badge>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

