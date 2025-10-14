import { motion } from 'framer-motion';

interface OScoreChartProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const sizes = {
  sm: { container: 60, stroke: 6, text: 'text-lg' },
  md: { container: 80, stroke: 8, text: 'text-2xl' },
  lg: { container: 120, stroke: 10, text: 'text-4xl' },
};

const getScoreColor = (score: number) => {
  if (score >= 4.5) return '#22c55e'; // green-500
  if (score >= 4.0) return '#84cc16'; // lime-500
  if (score >= 3.5) return '#eab308'; // yellow-500
  if (score >= 3.0) return '#f97316'; // orange-500
  return '#ef4444'; // red-500
};

export function OScoreChart({ score, size = 'md', showLabel = true }: OScoreChartProps) {
  const { container, stroke, text } = sizes[size];
  const radius = (container - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const scorePercentage = (score / 5) * 100;
  const strokeDashoffset = circumference - (scorePercentage / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: container, height: container }}>
        {/* Background circle */}
        <svg className="-rotate-90 transform" width={container} height={container}>
          <circle
            cx={container / 2}
            cy={container / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={stroke}
            fill="none"
            className="text-muted/20"
          />
          {/* Animated progress circle */}
          <motion.circle
            cx={container / 2}
            cy={container / 2}
            r={radius}
            stroke={color}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{
              strokeDasharray: circumference,
            }}
          />
        </svg>
        {/* Score number */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-bold ${text}`} style={{ color }}>
            {score.toFixed(1)}
          </span>
        </div>
      </div>
      {showLabel && (
        <div className="text-center">
          <p className="text-xs text-muted-foreground">O-Score</p>
          <p className="text-xs font-medium" style={{ color }}>
            {((scorePercentage / 100) * 5).toFixed(1)} / 5.0
          </p>
        </div>
      )}
    </div>
  );
}

