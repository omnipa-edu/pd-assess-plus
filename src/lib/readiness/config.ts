export type ReadinessConfig = {
  minOsScore: number;
  minCount: number;
  minSupervisors: number;
  recencyMonths: number;
};

export const DEFAULT_READINESS: ReadinessConfig = {
  minOsScore: 4,
  minCount: 5,
  minSupervisors: 2,
  recencyMonths: 6,
};

export function monthsToMs(months: number): number {
  const daysApprox = months * 30;
  return daysApprox * 24 * 60 * 60 * 1000;
}

export function isRecent(dateIso: string, recencyMonths: number): boolean {
  const cutoff = Date.now() - monthsToMs(recencyMonths);
  return new Date(dateIso).getTime() >= cutoff;
}


