import { useEffect, useState } from "react";
import { Clock, TrendingUp, TrendingDown, Info, AlertTriangle } from "lucide-react";
import { apiCall } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type Factor = {
  text: string;
  impact: "increase" | "decrease" | "neutral";
};

type PredictionData = {
  predictedDays: number;
  confidence: "high" | "medium" | "low";
  sampleSize: number;
  unfilledRate: number;
  factors: Factor[];
};

type PredictiveInsightsPanelProps = {
  payload: any;
};

export function PredictiveInsightsPanel({ payload }: PredictiveInsightsPanelProps) {
  const { token } = useAuth();
  const [data, setData] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPrediction = async () => {
      setLoading(true);
      try {
        const result = await apiCall<PredictionData>("/jobs/predict-fill", "POST", payload, token);
        setData(result);
      } catch (err) {
        console.error("Failed to predict time to fill", err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchPrediction, 600);
    return () => clearTimeout(timer);
  }, [
    payload.title,
    JSON.stringify(payload.skills),
    payload.atsRequirements?.minExperienceYears,
    payload.atsRequirements?.minCgpa,
    payload.atsRequirements?.targetCollegeTier,
    payload.salaryRange?.visible,
    payload.salaryRange?.min,
    payload.salaryRange?.max,
    payload.location,
    token
  ]);

  if (!data) return null;

  const confidenceBadgeColor = {
    high: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    medium: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    low: "bg-amber-500/10 text-amber-600 border-amber-500/20"
  }[data.confidence];

  return (
    <div className="rounded-xl border border-border/80 bg-panel/70 p-5 shadow-xs transition-all backdrop-blur-xs">
      <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-3">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-ink" />
          <span className="font-semibold text-ink text-sm">Predictive Time-to-Fill</span>
        </div>
        <div className="flex items-center gap-2">
          {loading && <span className="text-xs text-ink/50 animate-pulse">Calculating...</span>}
          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${confidenceBadgeColor}`}>
            {data.confidence} confidence
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-display font-bold text-ink">~{data.predictedDays}</span>
        <span className="text-sm font-medium text-ink/70">days to first shortlist</span>
      </div>

      {data.unfilledRate > 20 && (
        <div className="mt-2.5 flex items-center gap-1.5 rounded-md bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>{data.unfilledRate}% of similar postings with high requirements take &gt;60 days to fill.</span>
        </div>
      )}

      {data.factors && data.factors.length > 0 && (
        <div className="mt-4 space-y-1.5 border-t border-border/40 pt-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink/50">Impacting Factors</p>
          <ul className="space-y-1 text-xs">
            {data.factors.map((factor, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                {factor.impact === "decrease" && (
                  <TrendingDown className="h-3.5 w-3.5 shrink-0 text-emerald-500 mt-0.5" />
                )}
                {factor.impact === "increase" && (
                  <TrendingUp className="h-3.5 w-3.5 shrink-0 text-amber-500 mt-0.5" />
                )}
                {factor.impact === "neutral" && (
                  <Info className="h-3.5 w-3.5 shrink-0 text-ink/40 mt-0.5" />
                )}
                <span className={
                  factor.impact === "decrease"
                    ? "text-emerald-700 dark:text-emerald-300"
                    : factor.impact === "increase"
                    ? "text-amber-800 dark:text-amber-300"
                    : "text-ink/70"
                }>
                  {factor.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
