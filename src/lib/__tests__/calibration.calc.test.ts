import { computeCalibration } from '@/lib/calibration/calc';
import { describe, it, expect } from 'vitest';

describe('computeCalibration', () => {
  it('labels more lenient and stricter correctly', () => {
    const rows = computeCalibration([
      { supervisorId: 'A', scores: [5, 5, 4, 5] },
      { supervisorId: 'B', scores: [3, 3, 2, 3] },
      { supervisorId: 'C', scores: [4, 4, 4, 4] },
    ]);
    const map = Object.fromEntries(rows.map((r) => [r.supervisorId, r.category]));
    expect(map['A']).toBe('More lenient');
    expect(map['B']).toBe('Stricter');
    expect(map['C']).toBe('Aligned');
  });
});


