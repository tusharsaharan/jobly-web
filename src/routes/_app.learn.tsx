import { createFileRoute, useNavigate } from "@tanstack/react-router";
import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiCall } from "@/lib/api";
import { 
  BrainCircuit, 
  BookOpen, 
  Gamepad2, 
  Code2, 
  Database, 
  Target, 
  CheckCircle2, 
  Circle, 
  Search, 
  ExternalLink, 
  Loader2, 
  KeyRound, 
  Users, 
  Layers, 
  Sparkles, 
  Check, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  Play
} from "lucide-react";
import CodeforcesWidget from "@/components/study/CodeforcesWidget";
import RAGChatbot from "@/components/study/RAGChatbot";
import AIStudyTutor from "@/components/study/AIStudyTutor";
import LLDProblemSheet from "@/components/study/LLDProblemSheet";
import HLDProblemSheet from "@/components/study/HLDProblemSheet";
import { toast } from "sonner";
import { useFocusMode } from "@/contexts/FocusModeContext";

export const Route = createFileRoute("/_app/learn")({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: (search.tab as string) || "RECOMMENDED",
  }),
  component: StudyDashboard,
});

function StudyDashboard() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [activeTab, setActiveTab] = useState<"RECOMMENDED" | "CODING" | "SYSTEM_DESIGN" | "ARENA" | "TUTOR">(
    (search.tab as any) || "RECOMMENDED"
  );

  useEffect(() => {
    if (search.tab && ["RECOMMENDED", "CODING", "SYSTEM_DESIGN", "ARENA", "TUTOR"].includes(search.tab as string)) {
      setActiveTab(search.tab as any);
    }
  }, [search.tab]);

  const { data: user } = useQuery({ queryKey: ["user-me"], queryFn: () => apiCall("/users/me") });

  const handleTabChange = (tab: "RECOMMENDED" | "CODING" | "SYSTEM_DESIGN" | "ARENA" | "TUTOR") => {
    setActiveTab(tab);
    navigate({ search: { tab } });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-28 sm:px-6 sm:pt-32">
      <header className="mb-10 text-center">
        <h1 className="font-display text-4xl sm:text-5xl font-black tracking-tight text-ink">
          Learn & Practice Hub
        </h1>
        <p className="mt-3 text-base sm:text-lg text-ink/70 max-w-2xl mx-auto font-medium">
          Remediate interview weaknesses, practice company-wise LeetCode & OA trackers, explore System Design blueprints, battle peers in live arenas, or ask the AI Study Tutor any technical question.
        </p>
      </header>

      {/* 5 Unified Pillars Tabs */}
      <div className="flex justify-center mb-10">
        <div className="inline-flex flex-wrap justify-center bg-cream/50 p-1.5 rounded-2xl border border-border gap-1">
          <TabButton 
            active={activeTab === "RECOMMENDED"} 
            onClick={() => handleTabChange("RECOMMENDED")} 
            label="Personalized Recommendations" 
          />
          <TabButton 
            active={activeTab === "CODING"} 
            onClick={() => handleTabChange("CODING")} 
            label="Coding Practice" 
          />
          <TabButton 
            active={activeTab === "SYSTEM_DESIGN"} 
            onClick={() => handleTabChange("SYSTEM_DESIGN")} 
            label="System Design (HLD / LLD)" 
          />
          <TabButton 
            active={activeTab === "ARENA"} 
            onClick={() => handleTabChange("ARENA")} 
            label="Quiz Battles & Arena" 
          />
          <TabButton 
            active={activeTab === "TUTOR"} 
            onClick={() => handleTabChange("TUTOR")} 
            label="AI Study Tutor (Universal)" 
          />
        </div>
      </div>

      <div className="min-h-[500px]">
        {activeTab === "RECOMMENDED" && <PillarRecommendations onSwitchTab={handleTabChange} />}
        {activeTab === "CODING" && <PillarCodingPractice user={user} onSwitchTab={handleTabChange} />}
        {activeTab === "SYSTEM_DESIGN" && <PillarSystemDesign />}
        {activeTab === "ARENA" && <PillarQuizArena />}
        {activeTab === "TUTOR" && <AIStudyTutor />}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
        active ? "bg-white shadow-xs text-ink border border-border/80" : "text-ink/65 hover:text-ink"
      }`}
    >
      <span>{label}</span>
    </button>
  );
}

// =========================================================================
// PILLAR 1: Personalized Study Recommendations & General Search
// =========================================================================
function PillarRecommendations({ onSwitchTab }: { onSwitchTab?: (tab: any) => void }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  const { data: weaknessData, isLoading: loadingWeaknesses, refetch: refetchWeaknesses } = useQuery({
    queryKey: ["candidate-weaknesses"],
    queryFn: () => apiCall("/study/weaknesses")
  });

  const { data: searchResults, isFetching: searching } = useQuery({
    queryKey: ["study-search", activeSearch],
    queryFn: () => apiCall(`/study/search?q=${encodeURIComponent(activeSearch)}`),
    enabled: activeSearch.length >= 2
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => apiCall(`/study/weaknesses/${id}/resolve`, { method: "POST" }),
    onSuccess: () => {
      toast.success("Marked as studied!");
      refetchWeaknesses();
    },
    onError: () => toast.error("Failed to update status")
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) {
      setActiveSearch(searchQuery.trim());
    }
  };

  const weaknesses = weaknessData?.weaknesses || [];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Search Header */}
      <div className="bg-white rounded-2xl p-7 border border-border shadow-xs space-y-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-ink/70">
          Universal Knowledge Retrieval
        </div>
        <h2 className="text-xl font-bold text-ink">Search Any CS or System Design Topic</h2>
        <p className="text-xs text-ink/65 max-w-xl">
          Instantly query our verified study catalog for curated documentation, LeetCode patterns, and technical blueprints.
        </p>

        <form onSubmit={handleSearch} className="flex gap-2 pt-1">
          <div className="relative flex-1">
            <input 
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="e.g. Dynamic Programming, Operating Systems, Caching, CAP Theorem..."
              className="w-full bg-cream/20 border border-border px-4 py-2.5 rounded-xl text-xs focus:border-ink focus:outline-none"
            />
          </div>
          <button 
            type="submit" 
            className="bg-ink text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-ink/90 inline-flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            {searching ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <Search className="w-4 h-4 shrink-0" strokeWidth={2} />}
            <span>Search</span>
          </button>
        </form>

        {/* Search Results Display */}
        {activeSearch && (
          <div className="mt-4 pt-4 border-t border-border/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink">
                Results for &ldquo;{activeSearch}&rdquo; ({searchResults?.results?.length || 0})
              </span>
              <button 
                onClick={() => { setActiveSearch(""); setSearchQuery(""); }} 
                className="text-[11px] font-semibold text-ink/50 hover:text-ink cursor-pointer"
              >
                Clear Search
              </button>
            </div>

            {searching ? (
              <div className="py-6 text-center text-xs text-ink/50 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-ink/40" />
                <span>Searching technical knowledge base...</span>
              </div>
            ) : searchResults?.results?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {searchResults.results.map((res: any, rIdx: number) => (
                  <a
                    key={rIdx}
                    href={res.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3.5 bg-cream/20 border border-border rounded-xl hover:border-ink/30 transition-colors flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs text-ink group-hover:text-[#2A9D7B] flex items-center gap-1">
                          <span>{res.title}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" strokeWidth={2} />
                        </span>
                        {res.topic && (
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-cream/50 text-ink/70">
                            {res.topic}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-ink/65 line-clamp-2 leading-relaxed">{res.description}</p>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-cream/30 rounded-xl text-xs text-ink/65 text-center">
                No direct match found.{" "}
                {searchResults?.fallbackUrl && (
                  <a href={searchResults.fallbackUrl} target="_blank" rel="noreferrer" className="text-[#2A9D7B] underline font-semibold">
                    Search on GeeksForGeeks directly &rarr;
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recommended Weakness Cards */}
      <div className="bg-white rounded-2xl p-7 border border-border shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-ink/70 mb-1">
              AI Diagnostic Engine
            </div>
            <h2 className="text-xl font-bold text-ink">Remediation Topics Flagged in Interviews</h2>
          </div>
          <span className="text-xs font-semibold text-ink/50">
            {weaknesses.length} topic{weaknesses.length === 1 ? "" : "s"} to remediate
          </span>
        </div>

        {loadingWeaknesses ? (
          <div className="text-center py-12">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-ink/40" />
          </div>
        ) : weaknesses.length === 0 ? (
          <div className="text-center py-12 bg-cream/20 rounded-xl border border-dashed border-border space-y-3">
            <div className="w-10 h-10 rounded-full bg-cream/50 flex items-center justify-center mx-auto text-ink/50">
              <Check className="w-5 h-5 text-[#2A9D7B]" strokeWidth={2} />
            </div>
            <h3 className="text-sm font-bold text-ink">All Clear &mdash; No Unresolved Weaknesses!</h3>
            <p className="text-xs text-ink/60 max-w-md mx-auto">
              Complete mock interview sessions with recruiters or peers. Any areas flagged for improvement will automatically surface here with attached study resources.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {weaknesses.map((w: any) => (
              <div key={w._id} className="p-5 bg-cream/15 rounded-2xl border border-border flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-ink">{w.topic}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cream/60 border border-border/80 text-ink/70">
                      {w.category || "CS"}
                    </span>
                  </div>

                  {w.sourceSession && (
                    <div className="text-[11px] text-ink/55 mb-3 flex items-center gap-1">
                      <span>Flagged from:</span>
                      <span className="font-semibold text-ink/75">{w.sourceSession.title}</span>
                    </div>
                  )}

                  {/* Attached Resources */}
                  <div className="space-y-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-ink/45">Recommended Resources:</div>
                    {w.cachedResources && w.cachedResources.length > 0 ? (
                      w.cachedResources.slice(0, 3).map((res: any, idx: number) => (
                        <a
                          key={idx}
                          href={res.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between p-2 rounded-lg bg-white border border-border/80 hover:border-ink/30 text-xs transition-colors"
                        >
                          <span className="font-medium text-[11px] text-ink truncate pr-2">{res.title}</span>
                          <ExternalLink className="w-3 h-3 text-[#2A9D7B] shrink-0" strokeWidth={2} />
                        </a>
                      ))
                    ) : (
                      <div className="text-[11px] text-ink/50 italic">No resources attached yet.</div>
                    )}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-border/60">
                  <button
                    onClick={() => resolveMutation.mutate(w._id)}
                    disabled={resolveMutation.isPending}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#2A9D7B] hover:text-[#183A32] cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2} />
                    <span>Mark as Studied</span>
                  </button>
                  <button
                    onClick={() => onSwitchTab?.("CODING")}
                    className="text-xs font-semibold text-ink/65 hover:text-ink cursor-pointer"
                  >
                    Practice Problems &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// =========================================================================
// PILLAR 2: Coding Practice (Company-wise DSA & OA Trackers)
// =========================================================================
function PillarCodingPractice({ user, onSwitchTab }: { user: any; onSwitchTab?: (tab: any) => void }) {
  const [source, setSource] = useState<"dsa" | "oa">("dsa");
  const [selectedCompany, setSelectedCompany] = useState("ALL");
  const [selectedTimeWindow, setSelectedTimeWindow] = useState("ALL");
  const [selectedDifficulty, setSelectedDifficulty] = useState("ALL");
  const [selectedTopic, setSelectedTopic] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  // Fetch Problem Stats
  const { data: statsData } = useQuery({
    queryKey: ["problem-stats", source],
    queryFn: () => apiCall(`/study/problems/stats?source=${source}`)
  });

  // Fetch Problems
  const { data: problemsData, isLoading, refetch } = useQuery({
    queryKey: ["problems", source, selectedCompany, selectedTimeWindow, selectedDifficulty, selectedTopic, searchQuery, page],
    queryFn: () => {
      const params = new URLSearchParams({
        source,
        page: String(page),
        limit: "25",
        company: selectedCompany,
        timeWindow: selectedTimeWindow,
        difficulty: selectedDifficulty,
        topic: selectedTopic,
        search: searchQuery
      });
      return apiCall(`/study/problems?${params.toString()}`);
    }
  });

  // Toggle completion
  const toggleMutation = useMutation({
    mutationFn: ({ questionId, completed }: { questionId: string; completed: boolean }) => 
      apiCall("/study/progress", {
        method: "POST",
        body: { type: source === "oa" ? "OA" : "DSA", questionId, completed }
      }),
    onSuccess: () => refetch()
  });

  const problems = problemsData?.problems || [];
  const total = problemsData?.total || 0;
  const totalPages = problemsData?.totalPages || 1;
  const companies = statsData?.companies || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Left Column: Stats & Codeforces Widget */}
      <div className="space-y-6">
        <CodeforcesWidget user={user} />

        {/* Progress Summary Card */}
        <div className="bg-white rounded-2xl p-6 border border-border shadow-xs space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-ink/70">
            Tracker Metrics
          </div>
          <div>
            <div className="text-2xl font-black text-ink">
              {statsData?.completed || 0} <span className="text-sm font-normal text-ink/50">/ {statsData?.total || 0}</span>
            </div>
            <div className="text-xs text-ink/65 mt-0.5">Problems Completed</div>
          </div>

          <div className="w-full bg-cream/40 rounded-full h-2 overflow-hidden border border-border">
            <div 
              className="bg-[#2A9D7B] h-full transition-all" 
              style={{ width: `${statsData?.total ? Math.min(100, Math.round((statsData.completed / statsData.total) * 100)) : 0}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 text-center text-[11px]">
            <div className="p-2 rounded-lg bg-cream/20 border border-border/80">
              <div className="font-bold text-[#2A9D7B]">{statsData?.breakdown?.easy || 0}</div>
              <div className="text-[10px] text-ink/50 uppercase">Easy</div>
            </div>
            <div className="p-2 rounded-lg bg-cream/20 border border-border/80">
              <div className="font-bold text-amber-600">{statsData?.breakdown?.medium || 0}</div>
              <div className="text-[10px] text-ink/50 uppercase">Med</div>
            </div>
            <div className="p-2 rounded-lg bg-cream/20 border border-border/80">
              <div className="font-bold text-red-600">{statsData?.breakdown?.hard || 0}</div>
              <div className="text-[10px] text-ink/50 uppercase">Hard</div>
            </div>
          </div>
        </div>

        {/* Live Arena Prompt */}
        <div className="bg-white rounded-2xl p-6 border border-border shadow-xs space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-ink/70">
            Multiplayer
          </div>
          <h3 className="font-display text-base font-bold text-ink">CP Duels Arena</h3>
          <p className="text-ink/65 text-xs">Battle peers in live coding matches with automated testcase judging.</p>
          <button
            type="button"
            onClick={() => onSwitchTab?.("ARENA")}
            className="w-full text-center bg-ink text-white text-xs font-bold py-2.5 rounded-xl hover:bg-ink/90 transition-all cursor-pointer"
          >
            Enter Arena
          </button>
        </div>
      </div>

      {/* Right Column: Problem Table & Filters */}
      <div className="lg:col-span-3 space-y-6">
        <div className="bg-white rounded-2xl p-6 border border-border shadow-xs space-y-5">
          {/* Top Row: Source Switcher & Search */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex bg-cream/40 p-1 rounded-xl border border-border gap-1">
              <button
                onClick={() => { setSource("dsa"); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  source === "dsa" ? "bg-white text-ink shadow-xs border border-border/80" : "text-ink/60 hover:text-ink"
                }`}
              >
                Company-Wise DSA Tracker
              </button>
              <button
                onClick={() => { setSource("oa"); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  source === "oa" ? "bg-white text-ink shadow-xs border border-border/80" : "text-ink/60 hover:text-ink"
                }`}
              >
                Online Assessment (OA) Tracker
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
                placeholder="Search problem title..."
                className="w-full bg-cream/20 border border-border px-3 py-2 rounded-xl text-xs focus:border-ink focus:outline-none"
              />
            </div>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {/* Company Dropdown */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-ink/50 mb-1">Company</label>
              <select
                value={selectedCompany}
                onChange={e => { setSelectedCompany(e.target.value); setPage(1); }}
                className="w-full bg-cream/20 border border-border px-2.5 py-1.5 rounded-xl text-xs focus:border-ink focus:outline-none"
              >
                <option value="ALL">All Companies</option>
                {companies.map((c: string) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Time Window (DSA only) */}
            {source === "dsa" ? (
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-ink/50 mb-1">Time Window</label>
                <select
                  value={selectedTimeWindow}
                  onChange={e => { setSelectedTimeWindow(e.target.value); setPage(1); }}
                  className="w-full bg-cream/20 border border-border px-2.5 py-1.5 rounded-xl text-xs focus:border-ink focus:outline-none"
                >
                  <option value="ALL">All Windows</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 3 Months</option>
                  <option value="180d">Last 6 Months</option>
                  <option value="180d+">More Than 6 Months</option>
                  <option value="all">All-Time</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-ink/50 mb-1">Category</label>
                <div className="text-xs text-ink/60 py-1.5 px-2.5 bg-cream/10 rounded-xl border border-border/50">Online Assessments</div>
              </div>
            )}

            {/* Difficulty */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-ink/50 mb-1">Difficulty</label>
              <select
                value={selectedDifficulty}
                onChange={e => { setSelectedDifficulty(e.target.value); setPage(1); }}
                className="w-full bg-cream/20 border border-border px-2.5 py-1.5 rounded-xl text-xs focus:border-ink focus:outline-none"
              >
                <option value="ALL">All Difficulties</option>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>

            {/* Total Results Summary */}
            <div className="flex flex-col justify-end">
              <div className="text-xs font-semibold text-ink/60 pb-1.5">
                Showing <span className="font-bold text-ink">{problems.length}</span> of {total}
              </div>
            </div>
          </div>

          {/* Problems Table */}
          <div className="border border-border rounded-xl overflow-hidden">
            {isLoading ? (
              <div className="py-16 text-center text-xs text-ink/50 flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-ink/40" />
                <span>Loading problems...</span>
              </div>
            ) : problems.length === 0 ? (
              <div className="py-16 text-center text-xs text-ink/50">
                No problems found matching your filters.
              </div>
            ) : (
              <div className="divide-y divide-border/80">
                {problems.map((p: any) => (
                  <div 
                    key={p._id} 
                    className="p-3.5 flex items-center justify-between hover:bg-cream/15 transition-colors gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleMutation.mutate({ questionId: p.link, completed: !p.completed })}
                        className="p-1 hover:scale-105 transition-transform cursor-pointer shrink-0"
                      >
                        {p.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-[#2A9D7B]" strokeWidth={2} />
                        ) : (
                          <Circle className="w-4 h-4 text-border hover:text-ink/60" strokeWidth={1.5} />
                        )}
                      </button>

                      {/* Title + Link */}
                      <div className="min-w-0 flex-1">
                        <a
                          href={p.link}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-xs text-ink hover:text-[#2A9D7B] hover:underline flex items-center gap-1.5 truncate"
                        >
                          <span className="truncate">{p.title}</span>
                          <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-50" strokeWidth={2} />
                        </a>

                        {/* Topics */}
                        {p.topics && p.topics.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {p.topics.slice(0, 3).map((t: string, tIdx: number) => (
                              <span key={tIdx} className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-cream/40 text-ink/60">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Difficulty Badge */}
                    <div className="shrink-0 flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        p.difficulty === "EASY" 
                          ? "bg-[#2A9D7B]/10 text-[#2A9D7B]" 
                          : p.difficulty === "HARD" 
                          ? "bg-red-500/10 text-red-600" 
                          : "bg-amber-500/10 text-amber-600"
                      }`}>
                        {p.difficulty}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page <= 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-ink disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                <span>Previous</span>
              </button>

              <span className="text-xs font-medium text-ink/60">
                Page {page} of {totalPages}
              </span>

              <button
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                disabled={page >= totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-ink disabled:opacity-40 cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// PILLAR 3: System Design (HLD vs LLD Tracks & Oracle)
// =========================================================================
function PillarSystemDesign() {
  const [track, setTrack] = useState<"HLD" | "LLD">("HLD");

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Track Switcher Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-border shadow-xs">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-ink/70 mb-0.5">
            {track === "HLD" ? "High-Level Architecture (ashishps1 / awesome-system-design-resources)" : "Object-Oriented Design (ashishps1 / awesome-low-level-design)"}
          </div>
          <h2 className="text-lg font-bold text-ink">
            {track === "HLD" ? "High-Level System Design (HLD) Sheet" : "Low-Level Design (LLD) Problem Sheet"}
          </h2>
        </div>

        <div className="flex bg-cream/40 p-1 rounded-xl border border-border gap-1 shrink-0">
          <button
            onClick={() => setTrack("HLD")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              track === "HLD" ? "bg-white text-ink shadow-xs border border-border/80" : "text-ink/60 hover:text-ink"
            }`}
          >
            High-Level Design (HLD Sheet)
          </button>
          <button
            onClick={() => setTrack("LLD")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              track === "LLD" ? "bg-white text-ink shadow-xs border border-border/80" : "text-ink/60 hover:text-ink"
            }`}
          >
            Low-Level Design (LLD Sheet)
          </button>
        </div>
      </div>

      {track === "LLD" ? (
        <LLDProblemSheet />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2">
            <HLDProblemSheet />
          </div>
          <div className="sticky top-28">
            <RAGChatbot />
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// PILLAR 4: Quiz Battles & Arena Configuration
// =========================================================================
function PillarQuizArena() {
  const navigate = useNavigate();
  const { startFocusMode } = useFocusMode();

  const [pin, setPin] = useState("");
  const [topic, setTopic] = useState("Operating Systems");
  const [mode, setMode] = useState<"QUIZ" | "CP">("QUIZ");
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard" | "Mixed">("Medium");
  const [questionCount, setQuestionCount] = useState(5);
  const [isSoloFocus, setIsSoloFocus] = useState(false);

  const joinMutation = useMutation({
    mutationFn: async () => {
      if (!pin) throw new Error("PIN is required");
      const { lobby } = await apiCall("/compete/join", {
        method: "POST",
        body: { pin },
      });
      return lobby;
    },
    onSuccess: (lobby) => {
      navigate({ to: "/compete/$lobbyId", params: { lobbyId: lobby._id } });
    },
    onError: (err: any) => toast.error(err.message || "Failed to join match lobby"),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!topic) throw new Error("Topic is required");

      if (isSoloFocus && mode === "QUIZ") {
        // Launch Solo Focus Mode Quiz
        toast.info(`Generating solo focus quiz for ${topic}...`);
        const { quiz } = await apiCall("/learn/generate-quiz", {
          method: "POST",
          body: { topic, difficulty, count: questionCount }
        });

        const session = await apiCall("/learn/session", {
          method: "POST",
          body: {
            type: "QUIZ",
            topic,
            durationMinutes: questionCount * 2,
            quizData: quiz
          }
        });

        await startFocusMode(session);
        navigate({ to: "/focus/$sessionId", params: { sessionId: session._id } });
        return;
      }

      // Launch Multiplayer Match Lobby
      toast.info(`Creating ${mode === "QUIZ" ? "Live Quiz Battle" : "CP Duel Match"}...`);
      const { lobby } = await apiCall("/compete/create", {
        method: "POST",
        body: {
          topic,
          mode,
          difficulty,
          questionCount
        },
      });
      return lobby;
    },
    onSuccess: (lobby) => {
      if (lobby?._id) {
        navigate({ to: "/compete/$lobbyId", params: { lobbyId: lobby._id } });
      }
    },
    onError: (err: any) => toast.error(err.message || "Failed to create match"),
  });

  const POPULAR_TOPICS = [
    "Arrays & Two Pointers", "Dynamic Programming", "Trees & Graphs", 
    "Operating Systems", "DBMS & SQL", "Computer Networks", "OOPs & SOLID",
    "Load Balancing", "Caching & Redis", "System Design Case Studies"
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Join Panel */}
        <div className="rounded-2xl border border-border bg-white p-7 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink mb-1">Join Live Match</h2>
            <p className="text-xs text-ink/65 mb-6">Enter the 6-digit Game PIN provided by your host.</p>
            
            <div className="space-y-4">
              <input 
                type="text" 
                maxLength={6}
                className="w-full text-center text-2xl font-bold tracking-widest rounded-xl border border-border px-4 py-3 bg-cream/20 focus:border-ink focus:outline-none placeholder:text-border"
                placeholder="000000"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && joinMutation.mutate()}
              />
            </div>
          </div>

          <button
            onClick={() => joinMutation.mutate()}
            disabled={joinMutation.isPending || pin.length < 6}
            className="w-full rounded-xl bg-ink py-3 text-xs font-bold text-white tracking-wide hover:bg-ink/90 transition-all disabled:opacity-50 cursor-pointer mt-6"
          >
            {joinMutation.isPending ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "ENTER ARENA"}
          </button>
        </div>

        {/* Configure & Host Panel */}
        <div className="rounded-2xl border border-border bg-white p-7 shadow-xs space-y-4">
          <div>
            <h2 className="text-lg font-bold text-ink mb-1">Configure Match / Quiz</h2>
            <p className="text-xs text-ink/65">Customize topics, difficulty, and format for live battles or solo practice.</p>
          </div>

          <div className="space-y-3.5">
            {/* Topic Input + Quick Picks */}
            <div>
              <label className="block text-[11px] font-semibold text-ink/70 mb-1">Topic</label>
              <input 
                type="text" 
                className="w-full rounded-xl border border-border px-3 py-2 bg-cream/20 text-xs focus:border-ink focus:outline-none placeholder:text-ink/40 mb-1.5"
                placeholder="e.g. Operating Systems, Dynamic Programming..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
              <div className="flex flex-wrap gap-1">
                {POPULAR_TOPICS.slice(0, 4).map((t, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setTopic(t)}
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                      topic === t ? "bg-ink text-white border-ink" : "bg-cream/40 border-border/80 text-ink/60 hover:text-ink"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-ink/70 mb-1">Arena Mode</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode("QUIZ")}
                  className={`flex-1 rounded-xl py-2 text-xs font-semibold border transition-all text-center cursor-pointer ${
                    mode === "QUIZ" 
                      ? "border-ink bg-ink text-white" 
                      : "border-border bg-transparent text-ink/70 hover:border-ink/30"
                  }`}
                >
                  Live Quiz Battle
                </button>
                <button
                  type="button"
                  onClick={() => setMode("CP")}
                  className={`flex-1 rounded-xl py-2 text-xs font-semibold border transition-all text-center cursor-pointer ${
                    mode === "CP" 
                      ? "border-ink bg-ink text-white" 
                      : "border-border bg-transparent text-ink/70 hover:border-ink/30"
                  }`}
                >
                  CP Duel Battle
                </button>
              </div>
            </div>

            {/* Difficulty & Question Count */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-ink/70 mb-1">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e: any) => setDifficulty(e.target.value)}
                  className="w-full rounded-xl border border-border px-2.5 py-1.5 bg-cream/20 text-xs focus:border-ink focus:outline-none"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                  <option value="Mixed">Mixed</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-ink/70 mb-1">Questions</label>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full rounded-xl border border-border px-2.5 py-1.5 bg-cream/20 text-xs focus:border-ink focus:outline-none"
                >
                  <option value={5}>5 Questions</option>
                  <option value={10}>10 Questions</option>
                  <option value={15}>15 Questions</option>
                </select>
              </div>
            </div>

            {/* Format Toggle (Solo Focus vs Multiplayer Lobby) */}
            {mode === "QUIZ" && (
              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSoloFocus}
                    onChange={(e) => setIsSoloFocus(e.target.checked)}
                    className="rounded border-border text-ink focus:ring-0"
                  />
                  <span className="text-xs text-ink/80 font-medium">Launch in Solo Focus Environment (self-paced)</span>
                </label>
              </div>
            )}

            <button
              type="button"
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !topic.trim()}
              className="w-full rounded-xl bg-ink py-3 text-xs font-bold text-white tracking-wide hover:bg-ink/90 transition-all disabled:opacity-50 mt-2 flex items-center justify-center cursor-pointer"
            >
              {createMutation.isPending ? (
                <Loader2 className="mx-auto h-4 w-4 animate-spin" />
              ) : isSoloFocus ? (
                "START SOLO SESSION"
              ) : (
                "CREATE MATCH ROOM"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
