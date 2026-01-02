import { AchievementDisplay } from '@/components/achievements/AchievementDisplay';
import { GoalsDisplay } from '@/components/goals/GoalsDisplay';
import { StreakDisplay } from './StreakDisplay';

export function GamificationDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Your Progress</h2>
        <p className="text-muted-foreground mb-6">
          Track your goals, maintain your streaks, and unlock achievements as you progress.
        </p>
      </div>

      {/* Streak and Achievements Row */}
      <div className="grid gap-6 md:grid-cols-2">
        <StreakDisplay />
        <AchievementDisplay />
      </div>

      {/* Goals */}
      <GoalsDisplay />
    </div>
  );
}

