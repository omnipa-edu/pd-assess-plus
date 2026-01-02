/**
 * Supervisor Benchmark View Component
 * Shows benchmark scope selector and summary for supervisor dashboard
 */

import { useState } from 'react';

import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { type BenchmarkScope } from '@/lib/benchmarks';

import { BenchmarkScopeSelector } from './BenchmarkScopeSelector';

interface SupervisorBenchmarkViewProps {
  className?: string;
}

export function SupervisorBenchmarkView({ className }: SupervisorBenchmarkViewProps) {
  const [selectedScope, setSelectedScope] = useState<BenchmarkScope>('current_cohort');

  return (
    <SectionErrorBoundary sectionName="Supervisor Benchmark View">
      <Card className={className}>
        <CardHeader>
          <CardTitle>Benchmark Comparison</CardTitle>
          <CardDescription>
            Select a benchmark scope to compare learner performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BenchmarkScopeSelector
            value={selectedScope}
            onValueChange={setSelectedScope}
            className="w-full"
          />
          <p className="mt-4 text-sm text-muted-foreground">
            Benchmark status indicators will be shown for each learner based on the selected scope.
            Use this to identify learners who are ahead, on track, or at risk relative to their peers.
          </p>
        </CardContent>
      </Card>
    </SectionErrorBoundary>
  );
}





