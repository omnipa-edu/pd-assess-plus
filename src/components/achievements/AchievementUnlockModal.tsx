import { useEffect, useState } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

import { AchievementBadge } from './AchievementBadge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import type { UserAchievement } from '@/hooks/useAchievements';

interface AchievementUnlockModalProps {
  achievement: UserAchievement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AchievementUnlockModal({ achievement, open, onOpenChange }: AchievementUnlockModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (open && achievement) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [open, achievement]);

  if (!achievement) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <div className="relative bg-gradient-to-br from-primary/10 to-primary/5 p-8">
          {/* Confetti effect */}
          <AnimatePresence>
            {showConfetti && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                    initial={{
                      x: '50%',
                      y: '50%',
                      opacity: 1,
                      scale: 1,
                    }}
                    animate={{
                      x: `${50 + (Math.random() - 0.5) * 100}%`,
                      y: `${50 + (Math.random() - 0.5) * 100}%`,
                      opacity: 0,
                      scale: 0,
                    }}
                    transition={{
                      duration: 2,
                      delay: Math.random() * 0.5,
                    }}
                  />
                ))}
              </div>
            )}
          </AnimatePresence>

          <div className="flex flex-col items-center text-center space-y-4 relative z-10">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: 'spring',
                stiffness: 200,
                damping: 15,
              }}
            >
              <AchievementBadge achievement={achievement} size="lg" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-2"
            >
              <h3 className="text-2xl font-bold">Achievement Unlocked!</h3>
              <p className="text-lg font-semibold text-primary">{achievement.name}</p>
              <p className="text-sm text-muted-foreground">{achievement.description}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Button onClick={() => onOpenChange(false)}>
                Awesome!
              </Button>
            </motion.div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

