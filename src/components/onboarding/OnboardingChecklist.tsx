/**
 * OnboardingChecklist Component
 * Role-aware dismissible checklist for first-time users
 */
import { useState } from 'react';
import { X, CheckCircle2, Circle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useProfileProgress } from '@/hooks/useProfileProgress';
import { content } from '@/content/strings';
import { cn } from '@/lib/utils';

interface OnboardingChecklistProps {
  onTaskClick?: (taskId: string) => void;
  className?: string;
}

export const OnboardingChecklist = ({ onTaskClick, className }: OnboardingChecklistProps) => {
  const { roles } = useAuth();
  const { progress, dismissOnboarding, isTaskCompleted, shouldShowOnboarding } = useProfileProgress();
  const [isExpanded, setIsExpanded] = useState(true);

  // Determine primary role for onboarding content
  const primaryRole = roles.includes('admin') ? 'admin' : roles.includes('supervisor') ? 'supervisor' : 'student';
  const onboardingContent = content.onboarding[primaryRole];
  const tasks = onboardingContent.tasks;

  const completedCount = tasks.filter(task => isTaskCompleted(task.id)).length;
  const progressPercent = (completedCount / tasks.length) * 100;

  if (!shouldShowOnboarding || !progress) {
    return null;
  }

  const handleDismiss = async () => {
    try {
      await dismissOnboarding();
    } catch (error) {
      console.error('Failed to dismiss onboarding:', error);
    }
  };

  const handleTaskClick = async (taskId: string) => {
    // Delegate navigation/action to parent; completion should be triggered
    // by accomplishing the task (parent decides when to call completeTask).
    onTaskClick?.(taskId);
  };

  return (
    <Card 
      className={cn(
        "border-primary/50 bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5",
        className
      )}
      role="region"
      aria-label="Onboarding checklist"
    >
      <CardHeader className="space-y-1 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-1">
            <CardTitle className="text-lg">{onboardingContent.title}</CardTitle>
            <CardDescription>{onboardingContent.subtitle}</CardDescription>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-label={isExpanded ? "Collapse checklist" : "Expand checklist"}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleDismiss}
              aria-label="Dismiss onboarding checklist"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {content.onboarding.common.progressLabel
                .replace('{completed}', completedCount.toString())
                .replace('{total}', tasks.length.toString())}
            </span>
            {completedCount === tasks.length && (
              <Badge variant="default" className="bg-green-600 dark:bg-green-500">
                {content.onboarding.common.completedBadge}
              </Badge>
            )}
          </div>
          <Progress value={progressPercent} className="h-2" aria-label={`${progressPercent}% complete`} />
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-2 pt-0">
          {tasks.map((task) => {
            const isCompleted = isTaskCompleted(task.id);
            return (
              <button
                key={task.id}
                onClick={() => handleTaskClick(task.id)}
                className={cn(
                  "w-full text-left rounded-lg border p-3 transition-all",
                  "hover:border-primary/50 hover:bg-accent/50",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isCompleted && "bg-accent/30 border-green-500/30 dark:border-green-500/50"
                )}
                aria-pressed={isCompleted}
                aria-label={`${task.title}. ${isCompleted ? 'Completed' : 'Not completed'}`}
              >
                <div className="flex items-start gap-3">
                  <div className="pt-0.5">
                    {isCompleted ? (
                      <CheckCircle2 
                        className="h-5 w-5 text-green-600 dark:text-green-400" 
                        aria-hidden="true"
                      />
                    ) : (
                      <Circle 
                        className="h-5 w-5 text-muted-foreground" 
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="font-medium text-sm">{task.title}</div>
                    <div className="text-xs text-muted-foreground">{task.description}</div>
                  </div>
                  {!isCompleted && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-xs h-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTaskClick(task.id);
                      }}
                    >
                      {task.cta}
                    </Button>
                  )}
                </div>
              </button>
            );
          })}
        </CardContent>
      )}
    </Card>
  );
};



