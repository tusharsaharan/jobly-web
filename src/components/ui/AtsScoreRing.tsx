export function AtsScoreRing({ score, size = 64 }: { score: number; size?: number }) {
  const safeScore = Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : 0;
  const radius = (size - 8) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (safeScore / 100) * circumference;

  let color = "text-[#a65b75]";
  if (safeScore >= 40) color = "text-[#b48644]";
  if (safeScore >= 70) color = "text-[#4f8c78]";

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
          className={`${color} transition-all duration-1000 ease-out`}
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <span className="font-mono text-sm font-bold text-ink">{safeScore}</span>
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
  let barColor = "bg-[#c28ea0]";
  if (safeScore >= 40) barColor = "bg-[#d4ae72]";
  if (safeScore >= 70) barColor = "bg-[#7bbda8]";

  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-ink/70">
        <span>{label}</span>
        <span>{safeScore}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden bg-ink/10">
        <div
          className={`h-full ${barColor} transition-all duration-1000 ease-out`}
          style={{ width: `${safeScore}%` }}
        />
      </div>
    </div>
  );
}
