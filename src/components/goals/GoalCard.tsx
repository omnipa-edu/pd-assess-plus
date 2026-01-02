import { useState } from 'react';

import { CheckCircle2, Target, Calendar, TrendingUp, MoreVertical, Edit, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { Goal } from '@/hooks/useGoals';

interface GoalCardProps {
  goal: Goal;
  onEdit?: (goal: Goal) => void;
  onDelete?: (goalId: string) => void;
  className?: string;
}

const getGoalTypeLabel = (type: Goal['type']) => {
  switch (type) {
    case 'assessment_count':
      return 'Assessments';
    case 'oscore_target':
      return 'O-Score';
    case 'streak_days':
      return 'Streak';
    case 'epa_readiness':
      return 'EPA Readiness';
    case 'feedback_quality':
      return 'Feedback Quality';
    case 'weekly_active':
      return 'Weekly Activity';
    default:
      return 'Custom';
  }
};

const getStatusColor = (status: Goal['status']) => {
  switch (status) {
    case 'completed':
      return 'bg-green-500';
    case 'active':
      return 'bg-blue-500';
    case 'paused':
      return 'bg-yellow-500';
    case 'cancelled':
      return 'bg-gray-500';
    default:
      return 'bg-gray-500';
  }
};

export function GoalCard({ goal, onEdit, onDelete, className }: GoalCardProps) {
  const progress = goal.target_value > 0 
    ? Math.min((goal.current_value / goal.target_value) * 100, 100)
    : 0;
  const isCompleted = goal.status === 'completed';
  const daysRemaining = goal.end_date 
    ? Math.max(0, Math.ceil((new Date(goal.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <Card className={cn("relative overflow-hidden", className, isCompleted && "opacity-75")}>
      {isCompleted && (
        <div className="absolute top-2 right-2">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        </div>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              {goal.title}
            </CardTitle>
            {goal.description && (
              <CardDescription className="mt-1">{goal.description}</CardDescription>
            )}
          </div>
          {(onEdit || onDelete) && goal.status === 'active' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(goal)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(goal.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold">
              {goal.current_value.toFixed(0)} / {goal.target_value.toFixed(0)} {goal.unit || ''}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{progress.toFixed(0)}% complete</span>
            {daysRemaining !== null && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {daysRemaining} days left
              </span>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs">
            {getGoalTypeLabel(goal.type)}
          </Badge>
          {goal.period && (
            <Badge variant="outline" className="text-xs">
              {goal.period}
            </Badge>
          )}
          <Badge 
            variant="secondary" 
            className={cn("text-xs", getStatusColor(goal.status))}
          >
            {goal.status}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

