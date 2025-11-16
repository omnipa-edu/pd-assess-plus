export type SupervisorStats = {
  supervisorId: string;
  supervisorName?: string;
  scores: number[]; // 1..5 values
};

export type CalibrationRow = {
  supervisorId: string;
  supervisorName?: string;
  wbaCount: number;
  mean: number;
  median: number;
  distribution: number[]; // length 5, counts for 1..5
  cohortMedian: number;
  category: 'Aligned' | 'More lenient' | 'Stricter';
  delta: number;
};

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid];
}

function mean(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function distribution(nums: number[]): number[] {
  const counts = [0, 0, 0, 0, 0];
  for (const n of nums) {
    const idx = Math.min(5, Math.max(1, Math.round(n))) - 1;
    counts[idx] += 1;
  }
  return counts;
}

export function computeCalibration(supervisors: SupervisorStats[]): CalibrationRow[] {
  const allScores = supervisors.flatMap((s) => s.scores);
  const cohortMed = median(allScores);
  return supervisors.map((s) => {
    const m = median(s.scores);
    const d = m - cohortMed;
    const category = d <= -0.5 ? 'Stricter' : d >= 0.5 ? 'More lenient' : 'Aligned';
    return {
      supervisorId: s.supervisorId,
      supervisorName: s.supervisorName,
      wbaCount: s.scores.length,
      mean: Number(mean(s.scores).toFixed(2)),
      median: Number(m.toFixed(2)),
      distribution: distribution(s.scores),
      cohortMedian: Number(cohortMed.toFixed(2)),
      category,
      delta: Number(d.toFixed(2)),
    };
  });
}


