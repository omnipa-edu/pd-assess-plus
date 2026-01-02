/**
 * EPA Trajectory View Component
 * Displays learner's EPA trajectory with benchmark comparison
 */

import { useState } from 'react';

import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useEpaBenchmark } from '@/hooks/useEpaBenchmark';
import { type BenchmarkScope } from '@/lib/benchmarks';

import { BenchmarkComparison } from './BenchmarkComparison';
import { BenchmarkScopeSelector } from './BenchmarkScopeSelector';

interface EpaTrajectoryViewProps {
  epaCode: string;
  learnerId?: string | null; // If not provided, uses current user
  currentLevel?: number; // Current learner level (if available)
  className?: string;
}

/**
 * Calculate current level from assessments
 * This is a simple implementation - you may want to use your existing trajectory calculation
 */
function calculateCurrentLevel(assessments: Array<{ rating: string; created_at: string }>): number {
  if (assessments.length === 0) return 0;

  // Get most recent assessment
  const sorted = [...assessments].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const latest = sorted[0];
  return Number(latest.rating) || 0;
}

export function EpaTrajectoryView({
  epaCode,
  learnerId,
  currentLevel,
  className,
}: EpaTrajectoryViewProps) {
  const { user } = useAuth();
  const effectiveLearnerId = learnerId || user?.id || null;
  const [selectedScope, setSelectedScope] = useState<BenchmarkScope>('current_cohort');

  const { data: benchmark, isLoading } = useEpaBenchmark({
    scope: selectedScope,
    learnerId: effectiveLearnerId,
    epaCode,
  });

  // If currentLevel not provided, we'd need to fetch it from assessments
  // For now, we'll use the provided value or show a placeholder
  const learnerLevel = currentLevel ?? 0;

  return (
    <SectionErrorBoundary sectionName="EPA Trajectory View">
      <Card className={className}>
        <CardHeader>
          <CardTitle>EPA {epaCode} Trajectory</CardTitle>
          <CardDescription>Compare your progress against benchmarks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <BenchmarkScopeSelector
            value={selectedScope}
            onValueChange={setSelectedScope}
            className="w-full"
          />

          <BenchmarkComparison
            learnerLevel={learnerLevel}
            benchmark={benchmark}
            isLoading={isLoading}
            epaCode={epaCode}
          />

          {/* Future: Add chart visualization here */}
          {/* <EpaTrajectoryChart learnerLevel={learnerLevel} benchmark={benchmark} /> */}
        </CardContent>
      </Card>
    </SectionErrorBoundary>
  );
}





