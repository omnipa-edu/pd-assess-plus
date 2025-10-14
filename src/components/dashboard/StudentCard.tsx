import { motion } from 'framer-motion';
import { GraduationCap, TrendingUp, Activity, Calendar } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface StudentCardProps {
  name: string;
  email: string;
  program: string;
  yearOfTraining: string;
  averageOScore: number;
  assessmentCount: number;
  lastAssessment: string;
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

const getOScoreRing = (score: number) => {
  if (score >= 4.5) return 'ring-green-500';
  if (score >= 4.0) return 'ring-green-400';
  if (score >= 3.5) return 'ring-yellow-500';
  if (score >= 3.0) return 'ring-orange-500';
  return 'ring-red-500';
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export function StudentCard({
  name,
  email,
  program,
  yearOfTraining,
  averageOScore,
  assessmentCount,
  lastAssessment,
  trend,
  onClick,
}: StudentCardProps) {
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
          <div className="flex items-start gap-3">
            <Avatar className={`h-12 w-12 ring-2 ${getOScoreRing(averageOScore)}`}>
              <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold">{name}</h3>
                  <p className="truncate text-xs text-muted-foreground">{email}</p>
                </div>
                <Badge className={`${getOScoreColor(averageOScore)} shrink-0`}>
                  {averageOScore.toFixed(1)}
                </Badge>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">
                  <GraduationCap className="mr-1 h-3 w-3" />
                  {program}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Year {yearOfTraining}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* O-Score Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">O-Score Progress</span>
              <span className={`font-medium ${trendColor}`}>
                {trendIcon} {((averageOScore / 5) * 100).toFixed(0)}%
              </span>
            </div>
            <Progress value={scorePercentage} className="h-2" />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 border-t pt-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Assessments</p>
                <p className="text-sm font-semibold">{assessmentCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Last</p>
                <p className="text-sm font-semibold">{lastAssessment}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

