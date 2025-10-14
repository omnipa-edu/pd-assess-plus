import { motion } from 'framer-motion';
import { ClipboardList, TrendingUp, Users, CheckCircle } from 'lucide-react';

/**
 * Mockup preview of the platform interface
 * Shows a simplified version of the dashboard to give users a visual sense of the app
 */
export const PlatformPreview = () => {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-gradient-to-br from-background to-muted/30 shadow-inner dark:from-background dark:to-muted/20">
      {/* Mock browser chrome */}
      <div className="absolute left-0 right-0 top-0 flex h-8 items-center gap-1.5 border-b border-border bg-muted/50 px-3 dark:bg-muted/30">
        <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
        <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
        <div className="ml-2 flex h-4 flex-1 items-center rounded bg-background/50 px-2 text-xs text-muted-foreground dark:bg-background/30">
          wbatracker.app
        </div>
      </div>

      {/* Mock dashboard content */}
      <div className="absolute bottom-0 left-0 right-0 top-8 overflow-hidden p-4">
        {/* Mock header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/20 dark:bg-primary/30" />
            <div className="space-y-1">
              <div className="h-3 w-24 rounded bg-foreground/10 dark:bg-foreground/20" />
              <div className="h-2 w-32 rounded bg-foreground/5 dark:bg-foreground/10" />
            </div>
          </div>
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            className="rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground shadow-sm"
          >
            + New Assessment
          </motion.div>
        </div>

        {/* Mock stats grid */}
        <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
          {[
            { icon: Users, value: '24', label: 'Students', color: 'bg-blue-500/10 dark:bg-blue-500/20' },
            { icon: ClipboardList, value: '87', label: 'Assessments', color: 'bg-purple-500/10 dark:bg-purple-500/20' },
            { icon: CheckCircle, value: '156', label: 'Completed', color: 'bg-green-500/10 dark:bg-green-500/20' },
            { icon: TrendingUp, value: '3.8', label: 'Avg Score', color: 'bg-orange-500/10 dark:bg-orange-500/20' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 + i * 0.1 }}
              className={`${stat.color} rounded-lg p-2 md:p-3`}
            >
              <div className="mb-1 flex items-center justify-between">
                <stat.icon className="h-3 w-3 text-foreground/60 md:h-4 md:w-4" />
              </div>
              <div className="text-base font-bold text-foreground md:text-xl">{stat.value}</div>
              <div className="text-[10px] text-muted-foreground md:text-xs">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Mock activity list */}
        <div className="space-y-2">
          <div className="mb-2 flex items-center gap-2">
            <div className="h-2.5 w-20 rounded bg-foreground/10 dark:bg-foreground/20" />
          </div>
          
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.8 + i * 0.1 }}
              className="flex items-center gap-2 rounded-lg border border-border bg-card p-2 shadow-sm dark:bg-card/50 md:gap-3 md:p-3"
            >
              <div className="h-6 w-6 rounded-full bg-primary/20 dark:bg-primary/30 md:h-8 md:w-8" />
              <div className="flex-1 space-y-1">
                <div className="h-2 w-20 rounded bg-foreground/10 dark:bg-foreground/20 md:h-2.5 md:w-32" />
                <div className="h-1.5 w-16 rounded bg-foreground/5 dark:bg-foreground/10 md:h-2 md:w-24" />
              </div>
              <div className="rounded bg-green-500/10 px-2 py-1 text-[10px] text-green-700 dark:bg-green-500/20 dark:text-green-400 md:text-xs">
                ✓
              </div>
            </motion.div>
          ))}
        </div>

        {/* Subtle animation overlay */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </div>
    </div>
  );
};

