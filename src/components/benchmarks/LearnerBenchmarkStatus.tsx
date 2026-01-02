/**
 * Learner Benchmark Status Component
 * Shows "On track / Ahead / At risk" indicator for supervisors
 */

import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { useEpaBenchmark } from '@/hooks/useEpaBenchmark';
import { compareToBenchmark, type BenchmarkScope } from '@/lib/benchmarks';
import { cn } from '@/lib/utils';

interface LearnerBenchmarkStatusProps {
  learnerId: string;
  epaCode: string;
  learnerLevel: number;
  scope: BenchmarkScope;
  className?: string;
  showLabel?: boolean;
}

export function LearnerBenchmarkStatus({
  learnerId,
  epaCode,
  learnerLevel,
  scope,
  className,
  showLabel = true,
}: LearnerBenchmarkStatusProps) {
  const { data: benchmark, isLoading } = useEpaBenchmark({
    scope,
    learnerId,
    epaCode,
  });

  if (isLoading) {
    return (
      <Badge variant="outline" className={cn('animate-pulse', className)}>
        Loading...
      </Badge>
    );
  }

  const status = compareToBenchmark(learnerLevel, benchmark);

  const statusConfig = {
    ahead: {
      icon: TrendingUp,
      label: 'Ahead',
      variant: 'default' as const,
      className: 'bg-success text-success-foreground',
    },
    on_track: {
      icon: Minus,
      label: 'On Track',
      variant: 'secondary' as const,
      className: 'bg-primary/10 text-primary',
    },
    at_risk: {
      icon: TrendingDown,
      label: 'At Risk',
      variant: 'destructive' as const,
      className: 'bg-destructive text-destructive-foreground',
    },
    unknown: {
      icon: AlertCircle,
      label: 'Unknown',
      variant: 'outline' as const,
      className: 'bg-muted text-muted-foreground',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={cn('flex items-center gap-1', config.className, className)}>
      <Icon className="h-3 w-3" />
      {showLabel && config.label}
    </Badge>
  );
}





