/**
 * Supervisor Personalized View Component
 * Displays learners needing attention and feedback quality snapshot
 */

import { AlertTriangle, TrendingDown, Minus, Info } from 'lucide-react';

import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSupervisorPersonalization } from '@/hooks/useSupervisorPersonalization';
import { cn } from '@/lib/utils';

export function SupervisorPersonalizedView({ className }: { className?: string }) {
  const { data: summary, isLoading, error } = useSupervisorPersonalization();

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-sm text-muted-foreground">Loading personalized insights...</div>
        </CardContent>
      </Card>
    );
  }

  if (error || !summary) {
    return null; // Don't show if no summary available
  }

  const hasLearnersOfInterest = summary.learners_of_interest.length > 0;
  const hasFeedbackQuality = summary.feedback_quality.avg_overall_score !== null;

  if (!hasLearnersOfInterest && !hasFeedbackQuality) {
    return null; // Don't show empty view
  }

  return (
    <SectionErrorBoundary sectionName="Supervisor Personalized View">
      <div className={cn('space-y-6', className)}>
        {/* Learners Needing Attention */}
        {hasLearnersOfInterest && (
          <Card>
            <CardHeader>
              <CardTitle>Learners Needing Attention</CardTitle>
              <CardDescription>
                Learners with EPAs flagged for risk or plateau
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {summary.learners_of_interest.map((learner) => (
                  <div
                    key={learner.learner_id}
                    className="space-y-3 rounded-lg border p-4"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">
                        {learner.learner_name || 'Unknown Learner'}
                      </h4>
                      <Badge variant="outline">{learner.key_epas.length} EPAs flagged</Badge>
                    </div>

                    <div className="space-y-2">
                      {learner.key_epas.map((epa) => (
                        <div
                          key={epa.epa_code}
                          className="flex items-start justify-between rounded-md bg-muted/50 p-2"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium">{epa.epa_title}</p>
                            <p className="text-xs text-muted-foreground">EPA {epa.epa_code}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {epa.risk_flag && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertTriangle className="mr-1 h-3 w-3" />
                                Risk
                              </Badge>
                            )}
                            {epa.plateau_flag && !epa.risk_flag && (
                              <Badge variant="secondary" className="text-xs">
                                <Minus className="mr-1 h-3 w-3" />
                                Plateau
                              </Badge>
                            )}
                            {epa.benchmark_delta !== null && (
                              <span className="text-xs text-muted-foreground">
                                {epa.benchmark_delta > 0 ? '+' : ''}
                                {epa.benchmark_delta.toFixed(1)} vs benchmark
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Feedback Quality & Teaching Snapshot */}
        {hasFeedbackQuality && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Feedback & Teaching Snapshot</CardTitle>
                  <CardDescription>
                    Your feedback quality and CME teaching activity
                  </CardDescription>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">
                        These are developmental analytics to help you improve your teaching and feedback. 
                        They are not used for evaluation or promotion decisions.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Average Feedback Quality */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium">Average Feedback Quality</p>
                  <Badge
                    variant={
                      (summary.feedback_quality.avg_overall_score || 0) >= 75
                        ? 'default'
                        : (summary.feedback_quality.avg_overall_score || 0) >= 60
                        ? 'secondary'
                        : 'destructive'
                    }
                  >
                    {summary.feedback_quality.avg_overall_score !== null
                      ? Math.round(summary.feedback_quality.avg_overall_score)
                      : 'N/A'}
                    /100
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {summary.feedback_quality.avg_overall_score !== null
                    ? summary.feedback_quality.avg_overall_score >= 75
                      ? 'Strong'
                      : summary.feedback_quality.avg_overall_score >= 60
                      ? 'Developing'
                      : 'Needs Improvement'
                    : 'No data available'}
                </p>
              </div>

              {/* Strengths */}
              {summary.feedback_quality.strengths.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium">Strengths</p>
                  <ul className="space-y-1">
                    {summary.feedback_quality.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
                        <span className="capitalize">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Improvement Areas */}
              {summary.feedback_quality.improvement_areas.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium">Areas for Improvement</p>
                  <ul className="space-y-1">
                    {summary.feedback_quality.improvement_areas.map((area, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                        <span className="capitalize">{area}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* AI Usage Rate */}
              {summary.feedback_quality.ai_usage_rate !== null && (
                <div>
                  <p className="mb-1 text-sm font-medium">Smart Feedback Assistant Usage</p>
                  <p className="text-sm text-muted-foreground">
                    {Math.round(summary.feedback_quality.ai_usage_rate * 100)}% of your feedback 
                    entries used the AI assistant
                  </p>
                </div>
              )}

              {/* CME Teaching Snapshot */}
              <div className="border-t pt-4">
                <p className="mb-2 text-sm font-medium">CME Teaching Activity (Year to Date)</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Hours</p>
                    <p className="text-lg font-semibold">
                      {summary.cme_teaching_snapshot.total_cme_hours_year_to_date.toFixed(1)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Sessions</p>
                    <p className="text-lg font-semibold">
                      {summary.cme_teaching_snapshot.sessions_count_year_to_date}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </SectionErrorBoundary>
  );
}





