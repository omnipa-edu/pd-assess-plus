import { Flame, TrendingUp } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useStreaks } from '@/hooks/useStreaks';

export function StreakDisplay() {
  const { assessmentStreak, isLoading } = useStreaks();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Streak</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  const currentStreak = assessmentStreak.current_streak || 0;
  const longestStreak = assessmentStreak.longest_streak || 0;

  return (
    <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          Assessment Streak
        </CardTitle>
        <CardDescription>Keep your momentum going!</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Current Streak */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Flame className="h-8 w-8 text-orange-500" />
              <span className="text-4xl font-bold text-orange-600 dark:text-orange-400">
                {currentStreak}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {currentStreak === 0 
                ? 'Start your streak today!'
                : currentStreak === 1
                ? 'Day in a row'
                : 'Days in a row'}
            </p>
          </div>

          {/* Longest Streak */}
          {longestStreak > 0 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Longest Streak</span>
              </div>
              <Badge variant="secondary" className="text-sm font-semibold">
                {longestStreak} days
              </Badge>
            </div>
          )}

          {/* Motivation Message */}
          {currentStreak > 0 && (
            <div className="pt-2">
              <p className="text-xs text-center text-muted-foreground">
                {currentStreak < 3 
                  ? 'Keep it up! You\'re building momentum.'
                  : currentStreak < 7
                  ? 'Great job! You\'re on a roll!'
                  : currentStreak < 30
                  ? 'Amazing! You\'re maintaining excellent consistency!'
                  : 'Incredible! You\'re a consistency champion! 🔥'}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

