interface ProgressRingProps {
  completed: number;
  total: number;
  size?: number;
}

export default function ProgressRing({ completed, total, size = 160 }: ProgressRingProps) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? completed / total : 0;
  const dashOffset = circumference * (1 - progress);
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const allDone = total > 0 && completed === total;

  // Tick mark positions at 25%, 50%, 75%
  const tickPositions = [0.25, 0.5, 0.75];
  const tickLength = 6;
  const outerRadius = radius + strokeWidth / 2;

  // Milestone markers
  const milestones = tickPositions.map((pos) => ({
    pos,
    reached: progress >= pos,
    label: `${pos * 100}%`,
  }));

  return (
    <div
      className={`relative inline-flex items-center justify-center ${allDone ? "animate-ring-glow" : ""}`}
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${completed} of ${total} habits completed, ${percentage}%`}
    >
      <svg width={size + 40} height={size + 40} className="-rotate-90" style={{ margin: -20 }}>
        {/* Subtle gradient background circle for depth */}
        <circle
          cx={(size + 40) / 2}
          cy={(size + 40) / 2}
          r={radius + 20}
          fill="url(#bgGradient)"
        />
        <defs>
          <radialGradient id="bgGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.03" className="text-emerald-500" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" className="text-gray-500" />
          </radialGradient>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="30%" stopColor="#10b981" />
            <stop offset="60%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#6ee7b7" />
          </linearGradient>
          <linearGradient id="progressGradientComplete" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="50%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          {/* Glow filter for completed state */}
          <filter id="glowFilter">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Background circle */}
        <circle
          cx={(size + 40) / 2}
          cy={(size + 40) / 2}
          r={radius}
          fill="none"
          className="stroke-gray-200 dark:stroke-gray-700"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Tick marks at 25%, 50%, 75% with milestone indicators */}
        {milestones.map(({ pos, reached }) => {
          const angle = pos * 2 * Math.PI;
          const innerR = outerRadius - tickLength;
          const outerR = outerRadius + 1;
          const cx = (size + 40) / 2;
          const cy = (size + 40) / 2;
          const x1 = cx + innerR * Math.cos(angle);
          const y1 = cy + innerR * Math.sin(angle);
          const x2 = cx + outerR * Math.cos(angle);
          const y2 = cy + outerR * Math.sin(angle);
          return (
            <line
              key={pos}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={reached ? "#10b981" : "currentColor"}
              className={reached ? "" : "text-gray-300 dark:text-gray-600"}
              strokeWidth={reached ? 2.5 : 2}
              strokeLinecap="round"
            />
          );
        })}
        {/* Progress circle */}
        <circle
          cx={(size + 40) / 2}
          cy={(size + 40) / 2}
          r={radius}
          fill="none"
          stroke={allDone ? "url(#progressGradientComplete)" : "url(#progressGradient)"}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="progress-ring-circle"
          style={{
            "--circumference": circumference,
            "--dash-offset": dashOffset,
          } as React.CSSProperties}
          filter={allDone ? "url(#glowFilter)" : undefined}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-4xl font-extrabold tracking-tight transition-colors ${allDone ? "bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent" : "text-gray-900 dark:text-white"}`}>
          {percentage}%
        </span>
        <span className="text-xs font-medium text-gray-400 dark:text-gray-500 mt-0.5">
          {total === 0 ? "No habits yet" : `${completed} of ${total} done`}
        </span>
        {allDone && (
          <span className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 animate-count-up">All complete!</span>
        )}
      </div>
    </div>
  );
}
