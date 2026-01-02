/**
 * Benchmark Scope Selector Component
 * Allows users to select which benchmark scope to compare against
 */

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getBenchmarkScopeLabel, type BenchmarkScope } from '@/lib/benchmarks';

interface BenchmarkScopeSelectorProps {
  value: BenchmarkScope;
  onValueChange: (scope: BenchmarkScope) => void;
  availableScopes?: BenchmarkScope[]; // If provided, only show these scopes
  label?: string;
  className?: string;
}

const ALL_SCOPES: BenchmarkScope[] = [
  'current_cohort',
  'previous_cohorts_program',
  'all_cohorts_program',
  'all_cohorts_department',
  'all_cohorts_institution',
  'all_cohorts_discipline',
];

export function BenchmarkScopeSelector({
  value,
  onValueChange,
  availableScopes,
  label = 'Compare against:',
  className,
}: BenchmarkScopeSelectorProps) {
  const scopes = availableScopes || ALL_SCOPES;

  return (
    <div className={className}>
      <Label htmlFor="benchmark-scope" className="text-sm font-medium">
        {label}
      </Label>
      <Select value={value} onValueChange={(val) => onValueChange(val as BenchmarkScope)}>
        <SelectTrigger id="benchmark-scope" className="w-full">
          <SelectValue placeholder="Select benchmark scope" />
        </SelectTrigger>
        <SelectContent>
          {scopes.map((scope) => (
            <SelectItem key={scope} value={scope}>
              {getBenchmarkScopeLabel(scope)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}





