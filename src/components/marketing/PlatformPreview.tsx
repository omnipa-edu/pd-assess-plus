import { motion } from 'framer-motion';
import { ClipboardList, TrendingUp, Users, CheckCircle } from 'lucide-react';

/**
 * Mockup preview of the platform interface
 * Shows a simplified version of the dashboard to give users a visual sense of the app
 */
export const PlatformPreview = () => {
  return (
    <div className="relative w-full aspect-video rounded-lg bg-gradient-to-br from-background to-muted/30 dark:from-background dark:to-muted/20 shadow-inner overflow-hidden border border-border">
      {/* Mock browser chrome */}
      <div className="absolute top-0 left-0 right-0 h-8 bg-muted/50 dark:bg-muted/30 border-b border-border flex items-center px-3 gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        <div className="ml-2 flex-1 h-4 bg-background/50 dark:bg-background/30 rounded text-xs flex items-center px-2 text-muted-foreground">
          wbatracker.app
        </div>
      </div>

      {/* Mock dashboard content */}
      <div className="absolute top-8 left-0 right-0 bottom-0 p-4 overflow-hidden">
        {/* Mock header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 dark:bg-primary/30" />
            <div className="space-y-1">
              <div className="w-24 h-3 bg-foreground/10 dark:bg-foreground/20 rounded" />
              <div className="w-32 h-2 bg-foreground/5 dark:bg-foreground/10 rounded" />
            </div>
          </div>
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            className="px-3 py-1.5 bg-primary text-primary-foreground text-xs rounded-md shadow-sm"
          >
            + New Assessment
          </motion.div>
        </div>

        {/* Mock stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-4">
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
              <div className="flex items-center justify-between mb-1">
                <stat.icon className="w-3 h-3 md:w-4 md:h-4 text-foreground/60" />
              </div>
              <div className="text-base md:text-xl font-bold text-foreground">{stat.value}</div>
              <div className="text-[10px] md:text-xs text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Mock activity list */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-20 h-2.5 bg-foreground/10 dark:bg-foreground/20 rounded" />
          </div>
          
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.8 + i * 0.1 }}
              className="flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-card dark:bg-card/50 rounded-lg border border-border shadow-sm"
            >
              <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-primary/20 dark:bg-primary/30" />
              <div className="flex-1 space-y-1">
                <div className="w-20 md:w-32 h-2 md:h-2.5 bg-foreground/10 dark:bg-foreground/20 rounded" />
                <div className="w-16 md:w-24 h-1.5 md:h-2 bg-foreground/5 dark:bg-foreground/10 rounded" />
              </div>
              <div className="px-2 py-1 bg-green-500/10 dark:bg-green-500/20 text-green-700 dark:text-green-400 text-[10px] md:text-xs rounded">
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

