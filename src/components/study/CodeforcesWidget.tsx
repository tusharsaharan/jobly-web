import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiCall } from "@/lib/api";
import { Trophy, Activity, Target, TrendingUp, TrendingDown, BarChart2, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function CodeforcesWidget({ user }: { user: any }) {
  const [handle, setHandle] = useState(user?.codeforcesHandle || "");
  const [isEditing, setIsEditing] = useState(!user?.codeforcesHandle);
  const [activeTab, setActiveTab] = useState<"overview" | "history" | "recommendations">("overview");

  const { data: cfData, isLoading, refetch } = useQuery({
    queryKey: ["codeforces", handle],
    queryFn: () => apiCall(`/study/codeforces/${handle}`),
    enabled: !!handle && !isEditing,
  });

  const { data: ratingHistory } = useQuery({
    queryKey: ["codeforces-rating", handle],
    queryFn: () => apiCall(`/study/codeforces/${handle}/rating-history`),
    enabled: !!handle && !isEditing && activeTab === "history",
  });

  const { data: recommendations } = useQuery({
    queryKey: ["codeforces-recs", handle],
    queryFn: () => apiCall(`/study/codeforces/${handle}/recommendations`),
    enabled: !!handle && !isEditing && activeTab === "recommendations",
  });

  const saveHandle = useMutation({
    mutationFn: (newHandle: string) => apiCall(`/users/profile`, { 
      method: "PATCH", 
      body: { codeforcesHandle: newHandle } 
    }),
    onSuccess: () => {
      toast.success("Codeforces handle linked!");
      setIsEditing(false);
      refetch();
    }
  });

  if (isEditing) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-border shadow-xs">
        <h3 className="text-sm font-bold mb-3 text-ink">
          Link Codeforces
        </h3>
        <input 
          type="text" 
          value={handle} 
          onChange={e => setHandle(e.target.value)}
          placeholder="Codeforces Handle" 
          className="w-full bg-cream/20 border border-border px-3.5 py-2.5 rounded-xl text-xs focus:border-ink focus:outline-none mb-3" 
        />
        <button 
          onClick={() => saveHandle.mutate(handle)} 
          className="w-full bg-ink text-white text-xs font-bold py-2.5 rounded-xl hover:bg-ink/90 cursor-pointer"
        >
          Link Account
        </button>
      </div>
    );
  }

  if (!handle) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-border shadow-xs text-center">
        <Activity className="w-12 h-12 mx-auto text-ink/30 mb-3" />
        <p className="text-sm text-ink/60 mb-4">Link your Codeforces account to track rating and get personalized problem recommendations</p>
        <button onClick={() => setIsEditing(true)} className="text-xs font-semibold text-[#2A9D7B] hover:text-[#183A32] cursor-pointer">
          Connect Codeforces
        </button>
      </div>
    );
  }

  const getRankColor = (rank: string) => {
    const colors: Record<string, string> = {
      "newbie": "text-gray-500",
      "pupil": "text-green-600",
      "specialist": "text-cyan-600",
      "expert": "text-blue-600",
      "candidate master": "text-purple-600",
      "master": "text-yellow-600",
      "international master": "text-orange-600",
      "grandmaster": "text-red-600",
      "international grandmaster": "text-red-700",
      "legendary grandmaster": "text-red-800",
    };
    return colors[rank?.toLowerCase()] || "text-ink";
  };

  const renderOverview = () => {
    if (isLoading) {
      return (
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-3 py-1">
            <div className="h-3.5 bg-border/60 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-3.5 bg-border/60 rounded"></div>
              <div className="h-3.5 bg-border/60 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      );
    }

    if (!cfData?.stats) {
      return <div className="text-destructive text-xs font-medium">Failed to load stats. Check handle.</div>;
    }

    const stats = cfData.stats;
    const ratingChange = stats.rating && stats.maxRating ? stats.maxRating - stats.rating : 0;

    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-3.5">
          <img src={stats.avatar} alt="CF Avatar" className="w-12 h-12 rounded-xl shadow-xs border border-border" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="font-bold text-base text-ink truncate">{stats.handle}</div>
              <span className={`text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${getRankColor(stats.rank)} bg-white/50`}>
                {stats.rank}
              </span>
            </div>
            <div className="text-xs text-ink/50 mt-1">Contribution: {stats.contribution || 0} • Friend of: {stats.friendOfCount || 0}</div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-cream/20 rounded-xl p-3.5 border border-border text-center">
            <div className="text-xl font-black text-ink">{stats.rating || 'N/A'}</div>
            <div className="text-[10px] font-semibold text-ink/50 uppercase tracking-wider mt-0.5">Current Rating</div>
          </div>
          <div className="bg-cream/20 rounded-xl p-3.5 border border-border text-center">
            <div className="text-xl font-black text-ink">{stats.maxRating || 'N/A'}</div>
            <div className="text-[10px] font-semibold text-ink/50 uppercase tracking-wider mt-0.5">Peak Rating</div>
          </div>
        </div>

        {ratingChange !== 0 && (
          <div className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${ratingChange > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {ratingChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {ratingChange > 0 ? "+" : ""}{ratingChange} from peak
          </div>
        )}
      </div>
    );
  };

  const renderHistory = () => {
    if (!ratingHistory?.history || ratingHistory.history.length === 0) {
      return <div className="text-center text-ink/50 py-8">No rating history available</div>;
    }

    const history = ratingHistory.history;
    const maxRating = Math.max(...history.map((h: any) => h.newRating));
    const minRating = Math.min(...history.map((h: any) => h.newRating));
    const range = maxRating - minRating || 1;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-sm text-ink">Rating History</h4>
          <span className="text-xs text-ink/50">{history.length} contests</span>
        </div>
        
        {/* Mini chart */}
        <div className="h-40 relative bg-white/50 rounded-xl p-2">
          <svg width="100%" height="100%" viewBox="0 0 300 150" preserveAspectRatio="none">
            <polyline
              fill="none"
              stroke="#2A9D7B"
              strokeWidth="2"
              points={history.map((h: any, i: number) => 
                `${(i / (history.length - 1 || 1)) * 300},${150 - ((h.newRating - minRating) / range) * 130}`
              ).join(" ")}
            />
            {history.map((h: any, i: number) => (
              <circle
                key={i}
                cx={(i / (history.length - 1 || 1)) * 300}
                cy={150 - ((h.newRating - minRating) / range) * 130}
                r="3"
                fill="#2A9D7B"
              />
            ))}
          </svg>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="bg-cream/20 rounded-lg p-2 text-center border border-border">
            <div className="font-bold text-ink">{history[history.length - 1]?.newRating || 'N/A'}</div>
            <div className="text-ink/50">Current</div>
          </div>
          <div className="bg-cream/20 rounded-lg p-2 text-center border border-border">
            <div className="font-bold text-ink">{maxRating}</div>
            <div className="text-ink/50">Peak</div>
          </div>
          <div className="bg-cream/20 rounded-lg p-2 text-center border border-border">
            <div className="font-bold text-ink">{history.length}</div>
            <div className="text-ink/50">Contests</div>
          </div>
        </div>

        <div className="max-h-40 overflow-y-auto space-y-1">
          {history.slice(-10).reverse().map((h: any, i: number) => (
            <div key={h.contestId} className="flex justify-between items-center text-xs px-2 py-1 bg-white/50 rounded">
              <span className="truncate max-w-[150px]">{h.contestName}</span>
              <span className={`font-mono font-bold ${h.newRating > (h.oldRating || h.newRating) ? "text-mint" : "text-red-400"}`}>
                {h.newRating} ({h.newRating > (h.oldRating || h.newRating) ? "+" : ""}{h.newRating - (h.oldRating || h.newRating)})
              </span>
              <span className="text-ink/40">{h.rank}#{h.rank ? "/" + h.rank : ""}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderRecommendations = () => {
    if (!recommendations?.recommendations) {
      return <div className="text-center text-ink/50 py-8">Loading recommendations...</div>;
    }

    const rec = recommendations.recommendations;
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-sm text-ink">Personalized Recommendations</h4>
          <span className="text-xs text-ink/50">Based on your activity</span>
        </div>

        <div className="bg-cream/20 rounded-xl p-4 border border-border">
          <h5 className="font-bold text-sm text-ink mb-2">Your Profile</h5>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="text-center">
              <div className="font-bold text-ink">{rec.userRating}</div>
              <div className="text-ink/50">Current Rating</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-ink">{rec.solvedCount}</div>
              <div className="text-ink/50">Solved</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-ink">{rec.attemptedCount}</div>
              <div className="text-ink/50">Attempted</div>
            </div>
          </div>
        </div>

        {rec.weakTags.length > 0 && (
          <div className="bg-yellow-50/50 rounded-xl p-4 border border-yellow-200">
            <h5 className="font-bold text-sm text-yellow-800 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Weak Areas
            </h5>
            <div className="flex flex-wrap gap-2">
              {rec.weakTags.map((t: any) => (
                <span key={t.tag} className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                  {t.tag} ({t.attempts})
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-200">
          <h5 className="font-bold text-sm text-blue-800 mb-2 flex items-center gap-2">
            <Target className="w-4 h-4" /> Suggested Rating Range
          </h5>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex-1">
              <div className="text-xs text-blue-600">Min: {rec.recommendedRatingRange.min}</div>
              <div className="h-2 bg-blue-100 rounded overflow-hidden">
                <div 
                  className="bg-blue-500 h-full rounded" 
                  style={{ width: `${(rec.recommendedRatingRange.max - rec.recommendedRatingRange.min) / 2000 * 100}%` }}
                />
              </div>
              <div className="text-xs text-blue-600">Max: {rec.recommendedRatingRange.max}</div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h5 className="font-bold text-sm text-ink">Action Items</h5>
          {rec.suggestions.map((s: string, i: number) => (
            <div key={i} className="flex items-start gap-2 text-sm text-ink/70 bg-white/50 p-3 rounded-lg border border-border">
              <Target className="w-4 h-4 text-mint mt-0.5 flex-shrink-0" />
              <span>{s}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-border shadow-xs">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-bold text-ink">
          Codeforces Telemetry
        </h3>
        <button onClick={() => setIsEditing(true)} className="text-xs font-semibold text-[#2A9D7B] hover:text-[#183A32] cursor-pointer">Edit</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-cream/20 rounded-lg p-1">
        {[
          { id: "overview", label: "Overview", icon: Trophy },
          { id: "history", label: "Rating History", icon: BarChart2 },
          { id: "recommendations", label: "Recommendations", icon: Target },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-md text-xs font-medium transition-all ${
              activeTab === tab.id 
                ? "bg-white text-ink shadow-sm" 
                : "text-ink/60 hover:text-ink"
            }`}
          >
            <tab.icon className="w-3 h-3" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && renderOverview()}
      {activeTab === "history" && renderHistory()}
      {activeTab === "recommendations" && renderRecommendations()}
    </div>
  );
}