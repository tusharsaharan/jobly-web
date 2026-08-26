import { useState, useEffect } from "react";
import { HelpCircle, Sparkles } from "lucide-react";
import { apiCall } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type CoachingData = {
  [key: string]: {
    stat: string;
    detail: string;
  };
};

let cachedStats: CoachingData | null = null;

type FieldCoachingTooltipProps = {
  fieldKey: "title" | "salary" | "location" | "skills" | "cgpa";
  fallbackStat?: string;
  fallbackDetail?: string;
};

export function FieldCoachingTooltip({ fieldKey, fallbackStat, fallbackDetail }: FieldCoachingTooltipProps) {
  const { token } = useAuth();
  const [stats, setStats] = useState<CoachingData | null>(cachedStats);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (cachedStats) {
      setStats(cachedStats);
      return;
    }

    const fetchStats = async () => {
      try {
        const res = await apiCall<{ stats: CoachingData }>("/jobs/coaching-stats", "GET", undefined, token);
        if (res?.stats) {
          cachedStats = res.stats;
          setStats(res.stats);
        }
      } catch (err) {
        // Silently fall back to default props
      }
    };

    fetchStats();
  }, [token]);

  const current = stats?.[fieldKey] || {
    stat: fallbackStat || "Hiring Insight",
    detail: fallbackDetail || "Platform data suggests optimizing this field improves candidate application rates."
  };

  return (
    <span className="relative inline-flex items-center ml-1.5 align-middle">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          setIsOpen(!isOpen);
        }}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="rounded-full p-0.5 text-ink/40 hover:text-ink hover:bg-panel transition-colors focus:outline-none"
        aria-label="Why this field matters"
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>

      {isOpen && (
        <div 
          className="absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-xl border border-border/80 bg-background/95 p-3 text-xs shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
          <div className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{current.stat}</span>
          </div>
          <p className="text-ink/80 leading-relaxed text-[11px]">{current.detail}</p>
          <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-border/80 bg-background/95" />
        </div>
      )}
    </span>
  );
}
