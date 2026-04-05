interface GaugeProps { label: string; score: number; color?: string; size?: number; }

function getColor(score: number) {
  if (score >= 75) return '#10b981'; // emerald
  if (score >= 50) return '#f59e0b'; // amber
  return '#ef4444'; // red
}

export function HealthGauge({ label, score, size = 100 }: GaugeProps) {
  const r = 40;
  const circumference = 2 * Math.PI * r;
  const dashoffset = circumference - (score / 100) * circumference;
  const color = getColor(score);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 100 100" className="-rotate-90">
          {/* Track */}
          <circle cx="50" cy="50" r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
          {/* Fill */}
          <circle
            cx="50" cy="50" r={r}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashoffset}
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-gray-900" style={{ color }}>{score}</span>
          <span className="text-[10px] text-gray-400 leading-tight">/ 100</span>
        </div>
      </div>
      <span className="text-xs font-medium text-gray-600 text-center leading-tight">{label}</span>
    </div>
  );
}

export function OverallGauge({ score, grade }: { score: number; grade: string }) {
  const r = 52;
  const circumference = 2 * Math.PI * r;
  const dashoffset = circumference - (score / 100) * circumference;
  const color = getColor(score);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: 140, height: 140 }}>
        <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
          <circle cx="70" cy="70" r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
          <circle
            cx="70" cy="70" r={r}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashoffset}
            style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)', filter: `drop-shadow(0 0 8px ${color}66)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold" style={{ color }}>{score}</span>
          <span className="text-xs text-gray-400">/ 100</span>
          <span className="text-lg font-bold mt-0.5" style={{ color }}>{grade}</span>
        </div>
      </div>
      <div className="text-center">
        <p className="font-semibold text-gray-900">Portfolio Health</p>
        <p className="text-sm text-gray-500">
          {score >= 75 ? 'Excellent' : score >= 60 ? 'Good' : score >= 45 ? 'Fair' : 'Needs Attention'}
        </p>
      </div>
    </div>
  );
}
