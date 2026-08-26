import { useEffect, useState } from "react";
import { Users, AlertTriangle } from "lucide-react";
import { apiCall } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type CandidatePoolMeterProps = {
  skills: string[];
  minCgpa?: number;
  targetCollegeTier: string;
};

export function CandidatePoolMeter({ skills, minCgpa = 0, targetCollegeTier }: CandidatePoolMeterProps) {
  const { token } = useAuth();
  const [matchingCandidates, setMatchingCandidates] = useState<number | null>(null);
  const [breakdown, setBreakdown] = useState<{ withSkillMatch: number; filteredByCgpa: number; filteredByTier?: number } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPool = async () => {
      setLoading(true);
      try {
        const result = await apiCall<{
          matchingCandidates: number;
          breakdown: { withSkillMatch: number; filteredByCgpa: number; filteredByTier?: number };
        }>("/jobs/candidate-pool-preview", "POST", {
          skills,
          minCgpa,
          targetCollegeTier,
        }, token);
        
        setMatchingCandidates(result.matchingCandidates);
        setBreakdown(result.breakdown);
      } catch (err) {
        console.error("Failed to fetch candidate pool", err);
      } finally {
        setLoading(false);
      }
    };

    // Debounce the API call
    const timer = setTimeout(fetchPool, 500);
    return () => clearTimeout(timer);
  }, [skills.join(","), minCgpa, targetCollegeTier, token]);

  if (matchingCandidates === null) return null;

  const getColorClass = () => {
    if (matchingCandidates >= 100) return "text-green-500 bg-green-500/10 border-green-500/20";
    if (matchingCandidates >= 10) return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
    return "text-red-500 bg-red-500/10 border-red-500/20";
  };

  return (
    <div className={`mt-6 flex flex-col gap-2 rounded-xl border p-4 transition-colors ${getColorClass()}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <span className="font-semibold">Candidate Pool Preview</span>
        </div>
        {loading && <span className="text-xs opacity-60 animate-pulse">Updating...</span>}
      </div>
      
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-display">{matchingCandidates}</span>
        <span className="text-sm opacity-80">matching candidates</span>
      </div>

      <div className="mt-2 space-y-1 text-xs opacity-75">
        {breakdown && breakdown.filteredByCgpa > 0 && (
          <p>• {breakdown.filteredByCgpa} candidates filtered out by CGPA ≥ {minCgpa}</p>
        )}
        {breakdown && breakdown.filteredByTier && breakdown.filteredByTier > 0 && (
          <p>• {breakdown.filteredByTier} candidates filtered out by College Tier ({targetCollegeTier})</p>
        )}
      </div>

      {matchingCandidates < 10 && (
        <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>Limited candidate pool. Consider adjusting requirement thresholds.</span>
        </div>
      )}
    </div>
  );
}
