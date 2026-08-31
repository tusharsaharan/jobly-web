import { useEffect, useState, useRef } from "react";
import { Activity, AlertCircle } from "lucide-react";
import { apiCall } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type HealthScoreData = {
  total: number;
  breakdown: {
    completeness: number;
    salary: { score: number; feedback: string[] };
    bias?: { score: number | null; feedback: string[]; isUnavailable?: boolean; isPending?: boolean };
  };
};

type HealthScoreGaugeProps = {
  payload: any;
};

export function HealthScoreGauge({ payload }: HealthScoreGaugeProps) {
  const { token } = useAuth();
  const [data, setData] = useState<HealthScoreData | null>(null);
  const [loading, setLoading] = useState(false);
  const lastSemanticCheck = useRef("");

  // Rule-based checks (debounced on typing)
  useEffect(() => {
    const fetchRuleScore = async () => {
      setLoading(true);
      try {
        const result = await apiCall<HealthScoreData>("/jobs/health-score", "POST", {
          type: "rules",
          payload,
        }, token);
        
        setData(current => {
          if (!current || !current.breakdown.bias || current.breakdown.bias.isPending || current.breakdown.bias.isUnavailable) {
            return result;
          }
          const biasVal = typeof current.breakdown.bias.score === "number" ? current.breakdown.bias.score : null;
          if (biasVal !== null) {
            return {
              ...result,
              total: Math.round((result.breakdown.completeness * 20 + biasVal * 20 + result.breakdown.salary.score * 15) / 55),
              breakdown: {
                ...result.breakdown,
                bias: current.breakdown.bias,
              }
            };
          }
          return result;
        });
      } catch (err) {
        console.error("Failed to fetch rule health score", err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchRuleScore, 500);
    return () => clearTimeout(timer);
  }, [JSON.stringify(payload), token]);

  // Semantic checks (ONLY on blur/significant change of description)
  useEffect(() => {
    const currentDesc = payload.description || "";
    if (currentDesc.length < 50 || currentDesc === lastSemanticCheck.current) return;

    const fetchSemanticScore = async () => {
      try {
        const result = await apiCall<HealthScoreData>("/jobs/health-score", "POST", {
          type: "semantic",
          payload,
        }, token);
        
        lastSemanticCheck.current = currentDesc;
        setData(result);
      } catch (err) {
        console.error("Failed to fetch semantic health score", err);
      }
    };

    // Long debounce to simulate "on stop typing"
    const timer = setTimeout(fetchSemanticScore, 2000);
    return () => clearTimeout(timer);
  }, [payload.description, payload, token]);

  if (!data) return null;

  const score = data.total;
  let color = "text-red-500";
  let bg = "bg-red-500/10 border-red-500/20";
  if (score >= 70) {
    color = "text-green-500";
    bg = "bg-green-500/10 border-green-500/20";
  } else if (score >= 40) {
    color = "text-yellow-500";
    bg = "bg-yellow-500/10 border-yellow-500/20";
  }

  // Calculate SVG dash array for the circular progress (circumference = 2 * pi * r)
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const isBiasUnavailable = Boolean(data.breakdown.bias?.isUnavailable);
  const isBiasPending = Boolean(data.breakdown.bias?.isPending) || (!data.breakdown.bias?.score && !isBiasUnavailable);
  const biasScore = typeof data.breakdown.bias?.score === "number" ? data.breakdown.bias.score : null;

  return (
    <div className={`mt-6 rounded-xl border p-4 transition-colors ${bg}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-ink">
          <Activity className="h-5 w-5" />
          <span className="font-semibold text-sm">Health Score</span>
        </div>
        <div className="flex items-center gap-1.5">
          {loading && <span className="text-xs text-ink/60 animate-pulse">Updating...</span>}
          <span 
            className="rounded bg-ink/5 px-2 py-0.5 text-[10px] font-medium text-ink/60 cursor-help"
            title={isBiasUnavailable 
              ? "Rescaled 2-Factor Calibration: Completeness & Salary. Bias check temporarily unavailable." 
              : "Provisional 3-Factor Calibration: 36.4% Completeness, 36.4% Bias-free, 27.3% Salary. Full 5-factor model recalibrated at N > 100."}
          >
            {isBiasUnavailable ? "2-Factor (Bias Outage)" : "Day 1 (3-factor)"}
          </span>
        </div>
      </div>
      
      <div className="mt-4 flex items-center gap-6">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 50 50">
            <circle
              className="text-ink/10 stroke-current"
              strokeWidth="4"
              fill="transparent"
              r={radius}
              cx="25"
              cy="25"
            />
            <circle
              className={`${color} stroke-current transition-all duration-500 ease-in-out`}
              strokeWidth="4"
              strokeLinecap="round"
              fill="transparent"
              r={radius}
              cx="25"
              cy="25"
              style={{ strokeDasharray: circumference, strokeDashoffset }}
            />
          </svg>
          <span className={`absolute text-lg font-bold ${color}`}>{score}</span>
        </div>
        
        <div className="flex-1 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-ink/70">Completeness ({isBiasUnavailable ? "57.1%" : "36.4%"})</span>
            <span className="font-medium text-ink">{data.breakdown.completeness}/100</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink/70 flex items-center" title={data.breakdown.salary.feedback.join("\n")}>
              Salary Transparency ({isBiasUnavailable ? "42.9%" : "27.3%"}) {data.breakdown.salary.feedback.length > 0 && <AlertCircle className="inline h-3 w-3 text-amber-500 ml-1 shrink-0" />}
            </span>
            <span className="font-medium text-ink">{data.breakdown.salary.score}/100</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-ink/70 flex items-center" title={data.breakdown.bias?.feedback.join("\n")}>
              Bias-free Language ({isBiasUnavailable ? "Excluded" : "36.4%"}) {data.breakdown.bias?.feedback && data.breakdown.bias.feedback.length > 0 && <AlertCircle className="inline h-3 w-3 text-amber-500 ml-1 shrink-0" />}
            </span>
            {isBiasUnavailable ? (
              <span className="text-[10px] font-semibold text-amber-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Unavailable
              </span>
            ) : isBiasPending ? (
              <span className="text-[10px] text-ink/40 italic">Evaluating on blur...</span>
            ) : (
              <span className="font-medium text-ink">{biasScore}/100</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
