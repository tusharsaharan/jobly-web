import { useState, useEffect } from "react";
import { Award, Zap, Target, Clock, TrendingUp, ShieldCheck, UserCheck } from "lucide-react";
import { apiCall } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type LeaderboardEntry = {
  id: string;
  name: string;
  totalPostings: number;
  activePostings: number;
  completedHires: number;
  totalApplicants: number;
  shortlistedCount: number;
  avgTimeToFillDays: number;
  avgCandidateAts: number;
  badges: { name: string; description: string }[];
  score: number;
};

type LeaderboardData = {
  leaderboard: LeaderboardEntry[];
  currentRecruiterRank: number;
};

export function RecruiterLeaderboard() {
  const { user, token } = useAuth();
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const res = await apiCall<LeaderboardData>("/dashboard/leaderboard", "GET", undefined, token);
        if (res?.leaderboard) {
          setData(res);
        }
      } catch (err) {
        console.error("Failed to load recruiter leaderboard", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [token]);

  if (loading) {
    return (
      <div className="surface p-6 rounded-2xl border border-border space-y-4 animate-pulse">
        <div className="h-6 w-48 bg-panel rounded" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-panel/50 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.leaderboard.length === 0) return null;

  return (
    <div className="surface rounded-2xl border border-border p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint text-ink">
            <Award className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-semibold text-ink text-base">Hiring Velocity &amp; Quality Benchmarks</h2>
            <p className="text-xs text-ink/60">Organization leaderboard ranked by time-to-fill speed and candidate match quality</p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-border/80 bg-panel/50 px-3.5 py-1.5 text-xs">
          <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-ink/70 font-medium">Your Rank:</span>
          <span className="font-bold text-ink">#{data.currentRecruiterRank}</span>
        </div>
      </div>

      <div className="space-y-3">
        {data.leaderboard.map((entry, idx) => {
          const isCurrentUser = entry.id.toString() === user?._id?.toString();
          return (
            <div
              key={entry.id}
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border p-4 transition-all ${
                isCurrentUser
                  ? "border-emerald-500/40 bg-emerald-500/5 shadow-xs"
                  : "border-border/80 bg-panel/30 hover:border-border"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                  idx === 0
                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30"
                    : idx === 1
                    ? "bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-500/30"
                    : idx === 2
                    ? "bg-amber-700/15 text-amber-900 dark:text-amber-600 border border-amber-700/30"
                    : "bg-panel text-ink/60"
                }`}>
                  {idx + 1}
                </span>

                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-ink text-sm">
                      {entry.name} {isCurrentUser && <span className="text-xs text-emerald-600 font-medium">(You)</span>}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {entry.badges.map((badge, bIdx) => (
                      <span
                        key={bIdx}
                        title={badge.description}
                        className="inline-flex items-center gap-1 rounded bg-ink/5 px-2 py-0.5 text-[10px] font-medium text-ink/70"
                      >
                        {badge.name.includes("Velocity") && <Zap className="h-2.5 w-2.5 text-amber-500" />}
                        {badge.name.includes("Quality") && <Target className="h-2.5 w-2.5 text-emerald-500" />}
                        {badge.name.includes("Active") && <TrendingUp className="h-2.5 w-2.5 text-blue-500" />}
                        {badge.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 border-t sm:border-t-0 sm:border-l border-border/60 pt-3 sm:pt-0 sm:pl-4 text-xs text-ink/70">
                <div>
                  <p className="text-[10px] text-ink/50 uppercase font-semibold">Hires Completed</p>
                  <p className="font-display font-bold text-ink text-sm mt-0.5">{entry.completedHires}</p>
                </div>
                <div>
                  <p className="text-[10px] text-ink/50 uppercase font-semibold">Avg Time-to-Fill</p>
                  <p className="font-display font-bold text-ink text-sm mt-0.5">{entry.avgTimeToFillDays}d</p>
                </div>
                <div>
                  <p className="text-[10px] text-ink/50 uppercase font-semibold">Candidate Match</p>
                  <p className="font-display font-bold text-ink text-sm mt-0.5">{entry.avgCandidateAts}%</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
