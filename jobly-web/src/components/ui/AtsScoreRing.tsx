/**
 * Calculates a unique shade of green for any given ATS / fit percentage (0 - 100).
 * Lower scores -> lighter mint / sage greens.
 * Higher scores -> darker, richer deep forest greens.
 */
export function getScoreGreenShade(score: number): string {
  const safeScore = Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : 0;
  // lightness: 76% at score 0 down to 18% at score 100 (smooth continuous interpolation)
  const lightness = 76 - (safeScore / 100) * 58;
  // saturation: 26% at score 0 up to 64% at score 100
  const saturation = 26 + (safeScore / 100) * 38;
  return `hsl(164, ${Math.round(saturation)}%, ${Math.round(lightness)}%)`;
}

export function AtsScoreRing({ score, size = 64 }: { score: number; size?: number }) {
  const safeScore = Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : 0;
  const radius = (size - 8) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (safeScore / 100) * circumference;
  const strokeColor = getScoreGreenShade(safeScore);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="absolute inset-0 -rotate-90 transform" width={size} height={size}>
        <circle
          className="text-ink/10"
          strokeWidth="4"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          style={{ stroke: strokeColor }}
          className="transition-all duration-1000 ease-out"
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <span className="font-mono text-sm font-bold" style={{ color: strokeColor }}>
        {safeScore}
      </span>
    </div>
  );
}

const BREAKDOWN_LABELS: Record<string, string> = {
  skillMatch: "Skill Match",
  experienceRelevance: "Experience",
  educationFit: "Education",
  projectsAndAchievements: "Projects & Awards",
  keywordOptimization: "Keywords",
  overallPresentation: "Presentation",
};

export function AtsBreakdown({ breakdown, tips }: { breakdown?: any; tips?: string[] }) {
  if (!breakdown) return null;

  return (
    <div className="mt-4 space-y-3 border-t border-border pt-4 text-sm">
      <div className="space-y-2">
        {Object.entries(BREAKDOWN_LABELS).map(([key, label]) => {
          const val = breakdown[key];
          if (val === undefined || val === null) return null;
          return <BreakdownBar key={key} label={label} score={val} />;
        })}
      </div>
      
      {tips && tips.length > 0 && (
        <div className="mt-4 border-t border-border pt-3">
          <p className="font-semibold text-ink">Improvement tips:</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-ink/70">
            {tips.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function BreakdownBar({ label, score }: { label: string; score: number }) {
  const safeScore = Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : 0;
  const barColor = getScoreGreenShade(safeScore);

  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-ink/70">
        <span>{label}</span>
        <span className="font-semibold" style={{ color: barColor }}>{safeScore}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden bg-ink/10 rounded-full">
        <div
          className="h-full transition-all duration-1000 ease-out rounded-full"
          style={{ width: `${safeScore}%`, backgroundColor: barColor }}
        />
      </div>
    </div>
  );
}
