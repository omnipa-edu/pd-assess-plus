import { computeEpaReadiness, EpaObservation } from '@/lib/readiness/calc';
import { DEFAULT_READINESS } from '@/lib/readiness/config';
import { describe, it, expect } from 'vitest';

describe('computeEpaReadiness', () => {
  const now = new Date().toISOString();
  const obs = (score: number, sup: string): EpaObservation => ({
    epaCode: 'EPA-1',
    supervisorId: sup,
    oscore: score,
    createdAt: now,
  });

  it('reaches 100% when thresholds met', () => {
    const observations = [
      obs(4, 's1'),
      obs(4, 's2'),
      obs(4, 's1'),
      obs(4, 's2'),
      obs(4, 's3'),
    ];
    const cfg = { ...DEFAULT_READINESS, minCount: 5, minSupervisors: 2 };
    const [r] = computeEpaReadiness(observations, cfg);
    expect(r.readiness).toBe(1);
  });

  it('shows 0% when no data', () => {
    const r = computeEpaReadiness([], DEFAULT_READINESS);
    expect(r.length).toBe(0);
  });
});


