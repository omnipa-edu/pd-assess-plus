import { describe, it, expect } from 'vitest';

function narrativeCoverage(countWithNarrative: number, total: number): number {
  if (total === 0) return 0;
  return countWithNarrative / total;
}

function showsImprovement(scores: number[]): boolean {
  if (scores.length < 2) return false;
  return scores[scores.length - 1] > scores[0];
}

describe('accreditation metrics helpers', () => {
  it('computes narrative coverage fraction', () => {
    expect(narrativeCoverage(7, 10)).toBeCloseTo(0.7);
  });

  it('detects improvement across repeated WBAs', () => {
    expect(showsImprovement([3, 3, 4])).toBe(true);
    expect(showsImprovement([4, 3, 3])).toBe(false);
  });
});


