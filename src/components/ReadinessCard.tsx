import { Info } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type Props = {
  title: string;
  readinessPercent: number; // 0..100
  metrics: {
    highScore: { achieved: number; required: number };
    supervisors: { achieved: number; required: number };
    latestScore: number | null;
    latestAt: string | null;
  };
};

export function ReadinessCard({ title, readinessPercent, metrics }: Props) {
  const color =
    readinessPercent >= 80 ? 'bg-emerald-500' : readinessPercent >= 40 ? 'bg-amber-500' : 'bg-muted';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-sm space-y-1">
                <div>
                  WBAs meeting criteria: {metrics.highScore.achieved}/{metrics.highScore.required}
                </div>
                <div>
                  Supervisors: {metrics.supervisors.achieved}/{metrics.supervisors.required}
                </div>
                <div>Most recent O-SCORE: {metrics.latestScore ?? '—'}</div>
                <div>Last observation: {metrics.latestAt ? new Date(metrics.latestAt).toLocaleDateString() : '—'}</div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Toward practice-ready</span>
          <Badge variant="secondary">{Math.round(readinessPercent)}%</Badge>
        </div>
        <Progress value={readinessPercent} className={`h-3 ${color}`} />
      </CardContent>
    </Card>
  );
}

export default ReadinessCard;


