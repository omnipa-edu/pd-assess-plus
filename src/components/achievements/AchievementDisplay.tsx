import { useState } from 'react';

import { Trophy, Lock } from 'lucide-react';

import { AchievementUnlockModal } from './AchievementUnlockModal';
import { AchievementBadge } from './AchievementBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useAchievements } from '@/hooks/useAchievements';

interface AchievementDisplayProps {
  className?: string;
}

export function AchievementDisplay({ className }: AchievementDisplayProps) {
  const { achievements, unlocked, locked, isLoading } = useAchievements();
  const [selectedAchievement, setSelectedAchievement] = useState<string | null>(null);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showAllDialog, setShowAllDialog] = useState(false);

  const recentlyUnlocked = unlocked
    .sort((a, b) => new Date(b.unlocked_at!).getTime() - new Date(a.unlocked_at!).getTime())
    .slice(0, 3);

  const handleAchievementClick = (code: string) => {
    setSelectedAchievement(code);
    setShowAllDialog(true);
  };

  const selected = achievements.find(a => a.code === selectedAchievement);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={cn(className)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Achievements
              </CardTitle>
              <CardDescription>
                {unlocked.length} of {achievements.length} unlocked
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowAllDialog(true)}>
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentlyUnlocked.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Lock className="h-12 w-12 text-muted-foreground mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">No achievements unlocked yet</p>
              <p className="text-xs text-muted-foreground mt-1">Complete tasks to unlock achievements!</p>
            </div>
          ) : (
            <div className="flex gap-4 justify-center">
              {recentlyUnlocked.map((achievement) => (
                <AchievementBadge
                  key={achievement.code}
                  achievement={achievement}
                  size="md"
                  showLabel
                  className="cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => handleAchievementClick(achievement.code)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAllDialog} onOpenChange={setShowAllDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              All Achievements
            </DialogTitle>
            <DialogDescription>
              {unlocked.length} of {achievements.length} unlocked
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All ({achievements.length})</TabsTrigger>
              <TabsTrigger value="unlocked">Unlocked ({unlocked.length})</TabsTrigger>
              <TabsTrigger value="locked">Locked ({locked.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-4">
              <ScrollArea className="h-[400px]">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.code}
                      className="flex flex-col items-center p-4 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => handleAchievementClick(achievement.code)}
                    >
                      <AchievementBadge achievement={achievement} size="md" />
                      <p className="text-xs font-medium mt-2 text-center">{achievement.name}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="unlocked" className="mt-4">
              <ScrollArea className="h-[400px]">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {unlocked.map((achievement) => (
                    <div
                      key={achievement.code}
                      className="flex flex-col items-center p-4 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => handleAchievementClick(achievement.code)}
                    >
                      <AchievementBadge achievement={achievement} size="md" />
                      <p className="text-xs font-medium mt-2 text-center">{achievement.name}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="locked" className="mt-4">
              <ScrollArea className="h-[400px]">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {locked.map((achievement) => (
                    <div
                      key={achievement.code}
                      className="flex flex-col items-center p-4 rounded-lg border hover:bg-accent cursor-pointer transition-colors opacity-60"
                      onClick={() => handleAchievementClick(achievement.code)}
                    >
                      <AchievementBadge achievement={achievement} size="md" />
                      <p className="text-xs font-medium mt-2 text-center">{achievement.name}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {selected && (
        <AchievementUnlockModal
          achievement={selected.unlocked_at ? selected : null}
          open={showUnlockModal}
          onOpenChange={setShowUnlockModal}
        />
      )}
    </>
  );
}

