import { Trophy, Star, Award, Medal, Crown } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { UserAchievement } from '@/hooks/useAchievements';

interface AchievementBadgeProps {
  achievement: UserAchievement;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const getRarityIcon = (rarity: UserAchievement['rarity']) => {
  switch (rarity) {
    case 'legendary':
      return Crown;
    case 'epic':
      return Trophy;
    case 'rare':
      return Medal;
    case 'uncommon':
      return Star;
    default:
      return Award;
  }
};

const getRarityColor = (rarity: UserAchievement['rarity']) => {
  switch (rarity) {
    case 'legendary':
      return 'from-yellow-400 to-orange-500';
    case 'epic':
      return 'from-purple-400 to-pink-500';
    case 'rare':
      return 'from-blue-400 to-cyan-500';
    case 'uncommon':
      return 'from-green-400 to-emerald-500';
    default:
      return 'from-gray-400 to-gray-500';
  }
};

const getSizeClasses = (size: 'sm' | 'md' | 'lg') => {
  switch (size) {
    case 'sm':
      return 'h-8 w-8 text-xs';
    case 'lg':
      return 'h-16 w-16 text-2xl';
    default:
      return 'h-12 w-12 text-lg';
  }
};

export function AchievementBadge({ achievement, size = 'md', showLabel = false, className }: AchievementBadgeProps) {
  const Icon = getRarityIcon(achievement.rarity);
  const gradientClass = getRarityColor(achievement.rarity);
  const sizeClass = getSizeClasses(size);
  const isUnlocked = achievement.unlocked_at !== null;

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div
        className={cn(
          "rounded-full flex items-center justify-center border-2 transition-all",
          sizeClass,
          isUnlocked
            ? `bg-gradient-to-br ${gradientClass} border-white shadow-lg`
            : "bg-muted border-muted-foreground/20 opacity-50"
        )}
        title={achievement.name}
      >
        {achievement.icon ? (
          <span className="text-white drop-shadow-md">{achievement.icon}</span>
        ) : (
          <Icon className={cn("text-white", size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-8 w-8' : 'h-6 w-6')} />
        )}
      </div>
      {showLabel && (
        <div className="text-center">
          <p className={cn("text-xs font-medium", isUnlocked ? "text-foreground" : "text-muted-foreground")}>
            {achievement.name}
          </p>
          {!isUnlocked && (
            <p className="text-xs text-muted-foreground">Locked</p>
          )}
        </div>
      )}
    </div>
  );
}

