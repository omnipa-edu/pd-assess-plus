import { DEFAULT_READINESS, type ReadinessConfig, isRecent } from './config';

export type EpaObservation = {
  epaCode: string;
  supervisorId: string | null;
  oscore: number | null;
  createdAt: string; // ISO
};

export type EpaReadinessBreakdown = {
  epaCode: string;
  totalInWindow: number;
  highScoreCount: number;
  distinctSupervisors: number;
  hasRecentHighScore: boolean;
  latestScore: number | null;
  latestAt: string | null;
  readiness: number; // 0..1
};

export function computeEpaReadiness(
  observations: EpaObservation[],
  config: ReadinessConfig = DEFAULT_READINESS
): EpaReadinessBreakdown[] {
  const byEpa = new Map<string, EpaObservation[]>();
  for (const obs of observations) {
    if (!byEpa.has(obs.epaCode)) byEpa.set(obs.epaCode, []);
    byEpa.get(obs.epaCode)!.push(obs);
  }

  const results: EpaReadinessBreakdown[] = [];
  for (const [epaCode, list] of byEpa.entries()) {
    // only include in-window items
    const inWindow = list.filter((o) => isRecent(o.createdAt, config.recencyMonths));
    const totalInWindow = inWindow.length;
    const high = inWindow.filter((o) => (o.oscore ?? 0) >= config.minOsScore);
    const highScoreCount = high.length;
    const supervisors = new Set<string>();
    for (const o of inWindow) {
      if (o.supervisorId) supervisors.add(o.supervisorId);
    }
    const distinctSupervisors = supervisors.size;
    const latest = [...inWindow].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
    const latestScore = latest?.oscore ?? null;
    const latestAt = latest?.createdAt ?? null;
    const hasRecentHighScore = high.length > 0;

    const fractionCount = config.minCount > 0 ? highScoreCount / config.minCount : 0;
    const fractionSup = config.minSupervisors > 0 ? distinctSupervisors / config.minSupervisors : 0;
    const fractionRecent = hasRecentHighScore ? 1 : 0;
    const readiness = Math.max(
      0,
      Math.min(1, Math.min(fractionCount, Math.min(fractionSup, fractionRecent)))
    );

    results.push({
      epaCode,
      totalInWindow,
      highScoreCount,
      distinctSupervisors,
      hasRecentHighScore,
      latestScore,
      latestAt,
      readiness,
    });
  }
  return results;
}


