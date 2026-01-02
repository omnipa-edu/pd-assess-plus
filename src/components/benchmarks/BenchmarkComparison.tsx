/**
 * Benchmark Comparison Component
 * Displays learner's level compared to benchmark with visual indicators
 */

import { AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { compareToBenchmark, type BenchmarkResult } from '@/lib/benchmarks';
import { cn } from '@/lib/utils';

interface BenchmarkComparisonProps {
  learnerLevel: number;
  benchmark: BenchmarkResult | null;
  isLoading?: boolean;
  epaCode?: string;
  className?: string;
}

export function BenchmarkComparison({
  learnerLevel,
  benchmark,
  isLoading = false,
  epaCode,
  className,
}: BenchmarkComparisonProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground">Loading benchmark...</div>
        </CardContent>
      </Card>
    );
  }

  if (!benchmark || benchmark.expectedLevel === null) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground">
            No benchmark data available for comparison.
          </div>
        </CardContent>
      </Card>
    );
  }

  const status = compareToBenchmark(learnerLevel, benchmark);
  const diff = learnerLevel - benchmark.expectedLevel;

  const statusConfig = {
    ahead: {
      icon: TrendingUp,
      label: 'Ahead',
      color: 'text-success',
      bgColor: 'bg-success/10',
      badgeVariant: 'default' as const,
    },
    on_track: {
      icon: Minus,
      label: 'On Track',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      badgeVariant: 'secondary' as const,
    },
    at_risk: {
      icon: TrendingDown,
      label: 'At Risk',
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      badgeVariant: 'destructive' as const,
    },
    unknown: {
      icon: AlertCircle,
      label: 'Unknown',
      color: 'text-muted-foreground',
      bgColor: 'bg-muted',
      badgeVariant: 'outline' as const,
    },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Benchmark Comparison</CardTitle>
          <Badge variant={config.badgeVariant} className={cn('flex items-center gap-1', config.bgColor)}>
            <StatusIcon className={cn('h-3 w-3', config.color)} />
            {config.label}
          </Badge>
        </div>
        {epaCode && <CardDescription>EPA {epaCode}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Your Level</p>
            <p className="text-2xl font-bold">{learnerLevel.toFixed(1)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Benchmark Median</p>
            <p className="text-2xl font-bold">{benchmark.expectedLevel.toFixed(1)}</p>
          </div>
        </div>

        {diff !== 0 && (
          <div className="rounded-md border p-3">
            <p className="text-sm font-medium">
              {diff > 0 ? '+' : ''}
              {diff.toFixed(1)} points {diff > 0 ? 'above' : 'below'} benchmark
            </p>
          </div>
        )}

        {(benchmark.p25Level !== null || benchmark.p75Level !== null) && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Benchmark Range</p>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">P25:</span>
              <span className="font-medium">
                {benchmark.p25Level !== null ? benchmark.p25Level.toFixed(1) : 'N/A'}
              </span>
              <span className="text-muted-foreground">|</span>
              <span className="text-muted-foreground">P75:</span>
              <span className="font-medium">
                {benchmark.p75Level !== null ? benchmark.p75Level.toFixed(1) : 'N/A'}
              </span>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          Based on {benchmark.nLearners} learners and {benchmark.nAssessments} assessments
        </div>
      </CardContent>
    </Card>
  );
}





