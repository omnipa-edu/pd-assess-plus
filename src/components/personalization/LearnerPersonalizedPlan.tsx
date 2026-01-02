/**
 * Learner Personalized Plan Component
 * Displays personalized focus areas and priority actions for learners
 */

import { AlertTriangle, TrendingUp, Minus, Target } from 'lucide-react';

import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLearnerPersonalization } from '@/hooks/useLearnerPersonalization';
import { cn } from '@/lib/utils';

export function LearnerPersonalizedPlan({ className }: { className?: string }) {
  const { data: summary, isLoading, error } = useLearnerPersonalization();

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-sm text-muted-foreground">Loading personalized plan...</div>
        </CardContent>
      </Card>
    );
  }

  if (error || !summary) {
    return null; // Don't show if no summary available
  }

  if (summary.key_epas.length === 0 && summary.priority_actions.length === 0) {
    return null; // Don't show empty plan
  }

  return (
    <SectionErrorBoundary sectionName="Learner Personalized Plan">
      <Card className={className}>
        <CardHeader>
          <CardTitle>My Focus Areas</CardTitle>
          <CardDescription>
            Based on your recent assessments, here are your current focus areas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Key EPAs */}
          {summary.key_epas.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Key EPAs</h3>
              <div className="space-y-3">
                {summary.key_epas.map((epa) => (
                  <div
                    key={epa.epa_code}
                    className="space-y-2 rounded-lg border p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{epa.epa_title}</h4>
                        <p className="text-sm text-muted-foreground">EPA {epa.epa_code}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {epa.risk_flag && (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            At Risk
                          </Badge>
                        )}
                        {epa.plateau_flag && !epa.risk_flag && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Minus className="h-3 w-3" />
                            Plateaued
                          </Badge>
                        )}
                        {!epa.risk_flag && !epa.plateau_flag && (
                          <Badge variant="default" className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            On Track
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Current Level</p>
                        <p className="font-medium">
                          {epa.current_level !== null ? epa.current_level.toFixed(1) : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Target Level</p>
                        <p className="font-medium">
                          {epa.target_level !== null ? epa.target_level.toFixed(1) : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {epa.benchmark_delta !== null && (
                      <div className="rounded-md bg-muted p-2 text-sm">
                        <p>
                          {epa.benchmark_delta > 0 ? '+' : ''}
                          {epa.benchmark_delta.toFixed(1)} points{' '}
                          {epa.benchmark_delta > 0 ? 'above' : 'below'} {epa.benchmark_scope} benchmark
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Priority Actions */}
          {summary.priority_actions.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Priority Actions</h3>
              <ul className="space-y-2">
                {summary.priority_actions.map((action, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {summary.suggested_focus_window_weeks > 0 && (
            <div className="text-xs text-muted-foreground">
              Suggested focus window: {summary.suggested_focus_window_weeks} weeks
            </div>
          )}
        </CardContent>
      </Card>
    </SectionErrorBoundary>
  );
}





