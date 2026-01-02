/**
 * Personalized Learning Plan Card Component
 * Displays recommended learning actions for learners
 */

import { useState } from 'react';

import { Loader2, CheckCircle2, XCircle, PlayCircle, Info } from 'lucide-react';

import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useLearningPlan } from '@/hooks/useLearningPlan';
import type { ScoredAction } from '@/lib/learningPlans/engine';
import { cn } from '@/lib/utils';

const INTENSITY_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Low Effort', color: 'bg-green-100 text-green-800' },
  2: { label: 'Medium Effort', color: 'bg-yellow-100 text-yellow-800' },
  3: { label: 'High Effort', color: 'bg-red-100 text-red-800' },
};

const ACTION_TYPE_LABELS: Record<string, string> = {
  increase_exposure: 'Increase Exposure',
  micro_module: 'Micro Module',
  reflection: 'Reflection',
  feedback_request: 'Request Feedback',
  simulation: 'Simulation',
  peer_learning: 'Peer Learning',
  self_study: 'Self Study',
  supervised_practice: 'Supervised Practice',
};

export function LearningPlanCard({ className }: { className?: string }) {
  const { data: recommendations, isLoading, error, markAccepted, markCompleted, markDismissed } =
    useLearningPlan(3);
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAccept = async (action: ScoredAction) => {
    setProcessingId(action.action.id);
    try {
      await markAccepted.mutateAsync(action.action.id, action.epaId);
      toast({
        title: 'Action started',
        description: 'You\'ve marked this action as in progress.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark action as started.',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleComplete = async (action: ScoredAction) => {
    setProcessingId(action.action.id);
    try {
      await markCompleted.mutateAsync(action.action.id, action.epaId);
      toast({
        title: 'Action completed',
        description: 'Great work! This action has been marked as completed.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark action as completed.',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDismiss = async (action: ScoredAction) => {
    setProcessingId(action.action.id);
    try {
      await markDismissed.mutateAsync(action.action.id, action.epaId);
      toast({
        title: 'Action dismissed',
        description: 'This action has been removed from your plan.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to dismiss action.',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading your personalized learning plan...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !recommendations || recommendations.length === 0) {
    return null; // Don't show if no recommendations
  }

  return (
    <SectionErrorBoundary sectionName="Learning Plan">
      <Card className={className}>
        <CardHeader>
          <CardTitle>Personalized Learning Plan</CardTitle>
          <CardDescription>
            Recommended actions to help you progress in your competencies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {recommendations.map((rec, index) => {
            const isProcessing = processingId === rec.action.id;
            const intensity = INTENSITY_LABELS[rec.action.intensity] || INTENSITY_LABELS[1];
            const actionTypeLabel =
              ACTION_TYPE_LABELS[rec.action.action_type] || rec.action.action_type;

            return (
              <div
                key={`${rec.action.id}-${rec.epaId || 'global'}-${index}`}
                className="space-y-3 rounded-lg border p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-medium">{rec.action.label}</h4>
                      {rec.epaCode && (
                        <Badge variant="outline" className="text-xs">
                          EPA {rec.epaCode}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{rec.action.description}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={cn('text-xs', intensity.color)}>
                    {intensity.label}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {actionTypeLabel}
                  </Badge>
                </div>

                {rec.reason && (
                  <div className="flex items-start gap-2 rounded-md bg-muted p-2 text-xs">
                    <Info className="mt-0.5 h-3 w-3 shrink-0" />
                    <span className="text-muted-foreground">{rec.reason}</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleAccept(rec)}
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    ) : (
                      <PlayCircle className="mr-2 h-3 w-3" />
                    )}
                    Start
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleComplete(rec)}
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-2 h-3 w-3" />
                    )}
                    Complete
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDismiss(rec)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <XCircle className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </SectionErrorBoundary>
  );
}





