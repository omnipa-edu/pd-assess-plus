import { motion } from 'framer-motion';
import { Building2, TrendingUp, Users, Activity } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface DepartmentCardProps {
  name: string;
  studentCount: number;
  averageOScore: number;
  assessmentCount: number;
  trend: 'up' | 'down' | 'stable';
  onClick?: () => void;
}

const getOScoreColor = (score: number) => {
  if (score >= 4.5) return 'bg-green-500 text-white';
  if (score >= 4.0) return 'bg-green-400 text-white';
  if (score >= 3.5) return 'bg-yellow-500 text-white';
  if (score >= 3.0) return 'bg-orange-500 text-white';
  return 'bg-red-500 text-white';
};

const getOScoreLabel = (score: number) => {
  if (score >= 4.5) return 'Excellent';
  if (score >= 4.0) return 'Very Good';
  if (score >= 3.5) return 'Good';
  if (score >= 3.0) return 'Satisfactory';
  return 'Needs Improvement';
};

export function DepartmentCard({
  name,
  studentCount,
  averageOScore,
  assessmentCount,
  trend,
  onClick,
}: DepartmentCardProps) {
  const scorePercentage = (averageOScore / 5) * 100;
  const trendIcon = trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→';
  const trendColor = trend === 'up' ? 'text-green-600 dark:text-green-400' : trend === 'down' ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className="cursor-pointer border-2 transition-all duration-200 hover:border-primary/50 hover:shadow-lg dark:hover:shadow-primary/10"
        onClick={onClick}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">{name}</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  {studentCount} {studentCount === 1 ? 'Student' : 'Students'}
                </p>
              </div>
            </div>
            <Badge className={getOScoreColor(averageOScore)}>
              {averageOScore.toFixed(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* O-Score Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Average O-Score</span>
              <span className={`font-medium ${trendColor}`}>
                {trendIcon} {getOScoreLabel(averageOScore)}
              </span>
            </div>
            <Progress value={scorePercentage} className="h-2" />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 border-t pt-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Students</p>
                <p className="text-sm font-semibold">{studentCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Assessments</p>
                <p className="text-sm font-semibold">{assessmentCount}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

