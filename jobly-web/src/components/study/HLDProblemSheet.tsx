import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiCall } from "@/lib/api";
import { 
  Search, 
  CheckCircle2, 
  Circle, 
  ExternalLink, 
  Layers, 
  BookOpen, 
  Eye, 
  X,
  Github,
  Scroll,
  Newspaper,
  Compass
} from "lucide-react";

interface HLDProblem {
  id: string;
  slug: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  category: string;
  patterns: string[];
  referenceUrl: string;
  githubUrl: string;
  summary: string;
}

interface PaperOrArticle {
  title: string;
  url: string;
}

export default function HLDProblemSheet() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedDifficulty, setSelectedDifficulty] = useState("ALL");
  const [activeModalProblem, setActiveModalProblem] = useState<HLDProblem | null>(null);
  const [activeTab, setActiveTab] = useState<"PROBLEMS" | "PAPERS" | "ARTICLES">("PROBLEMS");

  // Local state for completed problems
  const [completedIds, setCompletedIds] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("jobly_hld_completed");
        return saved ? JSON.parse(saved) : {};
      } catch {
        return {};
      }
    }
    return {};
  });

  const { data, isLoading } = useQuery({
    queryKey: ["hld-problems", search, selectedCategory, selectedDifficulty],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (selectedCategory !== "ALL") params.set("category", selectedCategory);
      if (selectedDifficulty !== "ALL") params.set("difficulty", selectedDifficulty);
      return apiCall(`/study/hld-problems?${params.toString()}`);
    }
  });

  const toggleSolved = (id: string) => {
    setCompletedIds(prev => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem("jobly_hld_completed", JSON.stringify(next));
      } catch {}
      return next;
    });

    apiCall("/study/progress", "POST", {
      type: "DSA",
      questionId: `hld-${id}`,
      completed: !completedIds[id]
    }).catch(() => {});
  };

  const problems: HLDProblem[] = data?.problems || [];
  const categories: string[] = data?.categories || [];
  const stats = data?.stats || { Easy: 0, Medium: 0, Hard: 0, Total: 0 };
  const papers: PaperOrArticle[] = data?.papers || [];
  const articles: PaperOrArticle[] = data?.articles || [];

  const solvedCount = Object.values(completedIds).filter(Boolean).length;
  const progressPercent = stats.Total > 0 ? Math.min(100, Math.round((solvedCount / stats.Total) * 100)) : 0;

  return (
    <div className="space-y-6">
      {/* Header Banner & Metrics Card */}
      <div className="bg-white rounded-2xl p-6 border border-border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-ink/70 mb-1">
            Source: ashishps1 / awesome-system-design-resources
          </div>
          <h2 className="text-2xl font-black text-ink">Awesome High-Level Design (HLD) Sheet</h2>
          <p className="text-xs text-ink/65 mt-1 max-w-2xl">
            Master 45+ real-world large-scale system design interview problems, landmark distributed systems papers, and production engineering deep dives.
          </p>
        </div>

        {/* Progress summary widget */}
        <div className="bg-cream/30 p-4 rounded-xl border border-border shrink-0 min-w-[240px] space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-ink">HLD Tracker</span>
            <span className="font-bold text-ink">{solvedCount} / {stats.Total || 45} Mastered</span>
          </div>
          <div className="w-full bg-cream/60 rounded-full h-2 overflow-hidden border border-border">
            <div 
              className="bg-[#2A9D7B] h-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-ink/50 font-medium">
            <span>{stats.Easy} Easy</span>
            <span>{stats.Medium} Medium</span>
            <span>{stats.Hard} Hard</span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex bg-cream/40 p-1.5 rounded-2xl border border-border gap-1 w-fit">
        <button
          onClick={() => setActiveTab("PROBLEMS")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "PROBLEMS" ? "bg-white text-ink shadow-xs border border-border/80" : "text-ink/60 hover:text-ink"
          }`}
        >
          <span>System Design Problems ({problems.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("PAPERS")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "PAPERS" ? "bg-white text-ink shadow-xs border border-border/80" : "text-ink/60 hover:text-ink"
          }`}
        >
          <span>Landmark Papers ({papers.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("ARTICLES")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "ARTICLES" ? "bg-white text-ink shadow-xs border border-border/80" : "text-ink/60 hover:text-ink"
          }`}
        >
          <span>Engineering Blogs ({articles.length})</span>
        </button>
      </div>

      {activeTab === "PROBLEMS" && (
        <>
          {/* Filter Toolbar */}
          <div className="bg-white rounded-2xl p-4 border border-border shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row items-center gap-3">
              {/* Search Box */}
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by system name, category, pattern (e.g. Twitter, Uber, WebSockets, Kafka)..."
                  className="w-full pl-9 pr-4 py-2.5 bg-cream/20 border border-border rounded-xl text-xs focus:border-ink focus:outline-none"
                />
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  aria-label="Filter by category"
                  className="bg-cream/20 border border-border rounded-xl px-3 py-2.5 text-xs text-ink focus:border-ink focus:outline-none font-medium cursor-pointer w-full md:w-auto"
                >
                  <option value="ALL">All Categories ({categories.length})</option>
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                {/* Difficulty Filter */}
                <select
                  value={selectedDifficulty}
                  onChange={e => setSelectedDifficulty(e.target.value)}
                  aria-label="Filter by difficulty"
                  className="bg-cream/20 border border-border rounded-xl px-3 py-2.5 text-xs text-ink focus:border-ink focus:outline-none font-medium cursor-pointer"
                >
                  <option value="ALL">All Difficulties</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>
          </div>

          {/* Problems Sheet / Table */}
          <div className="bg-white rounded-2xl border border-border shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-cream/40 border-b border-border text-[11px] font-bold text-ink/60 uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-12 text-center">Status</th>
                    <th className="py-3.5 px-4">System Design Problem</th>
                    <th className="py-3.5 px-4 w-36">Category</th>
                    <th className="py-3.5 px-4 w-24">Difficulty</th>
                    <th className="py-3.5 px-4">Key Architectural Patterns</th>
                    <th className="py-3.5 px-4 w-36 text-right">Deep Dive Guide</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-xs text-ink/50">
                        Loading HLD problems from awesome-system-design-resources...
                      </td>
                    </tr>
                  ) : problems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-xs text-ink/50">
                        No HLD problems match your filter.
                      </td>
                    </tr>
                  ) : (
                    problems.map(p => {
                      const isSolved = Boolean(completedIds[p.id]);
                      return (
                        <tr 
                          key={p.id} 
                          className={`hover:bg-cream/20 transition-colors ${
                            isSolved ? "bg-[#2A9D7B]/5" : ""
                          }`}
                        >
                          {/* Checkbox Status */}
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => toggleSolved(p.id)}
                              className="hover:scale-110 transition-transform cursor-pointer"
                              title={isSolved ? "Mark as unsolved" : "Mark as mastered"}
                            >
                              {isSolved ? (
                                <CheckCircle2 className="w-4 h-4 text-[#2A9D7B]" />
                              ) : (
                                <Circle className="w-4 h-4 text-ink/30 hover:text-ink/60" />
                              )}
                            </button>
                          </td>

                          {/* Title & Preview */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setActiveModalProblem(p)}
                                className="font-bold text-ink hover:text-[#2A9D7B] hover:underline text-left cursor-pointer transition-colors"
                              >
                                {p.title}
                              </button>
                              <button
                                onClick={() => setActiveModalProblem(p)}
                                className="text-ink/40 hover:text-ink cursor-pointer p-0.5"
                                title="Quick Preview"
                              >
                                <Eye className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="text-[11px] text-ink/50 truncate max-w-md mt-0.5">
                              {p.summary}
                            </div>
                          </td>

                          {/* Category */}
                          <td className="py-3.5 px-4 text-ink/70 font-medium whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-md bg-cream/40 border border-border text-[10px]">
                              {p.category}
                            </span>
                          </td>

                          {/* Difficulty */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              p.difficulty === "Easy"
                                ? "bg-[#2A9D7B]/10 text-[#2A9D7B]"
                                : p.difficulty === "Medium"
                                ? "bg-amber-500/10 text-amber-600"
                                : "bg-red-500/10 text-red-600"
                            }`}>
                              {p.difficulty}
                            </span>
                          </td>

                          {/* Patterns */}
                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap gap-1">
                              {p.patterns.map((pat, patIdx) => (
                                <span
                                  key={patIdx}
                                  className="px-1.5 py-0.5 rounded-md bg-white border border-border/80 text-[10px] font-semibold text-ink/70"
                                >
                                  {pat}
                                </span>
                              ))}
                            </div>
                          </td>

                          {/* Link */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <a
                              href={p.referenceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-ink text-white hover:bg-ink/90 text-[11px] font-semibold transition-colors"
                            >
                              <span>Study Blueprint</span>
                              <ExternalLink className="w-2.5 h-2.5 text-[#2A9D7B]" />
                            </a>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Landmark Papers Tab */}
      {activeTab === "PAPERS" && (
        <div className="bg-white rounded-2xl p-6 border border-border shadow-xs space-y-4">
          <div>
            <h3 className="text-lg font-bold text-ink">Must-Read Landmark Distributed Systems Papers</h3>
            <p className="text-xs text-ink/60 mt-0.5">Foundational research papers that shaped modern cloud infrastructure and distributed consensus.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {papers.map((p, idx) => (
              <a
                key={idx}
                href={p.url}
                target="_blank"
                rel="noreferrer"
                className="p-4 rounded-xl bg-cream/20 hover:bg-cream/50 border border-border flex items-center justify-between gap-3 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-border flex items-center justify-center text-ink/70 shrink-0">
                    <Scroll className="w-4 h-4 text-[#2A9D7B]" strokeWidth={2} />
                  </div>
                  <span className="text-xs font-bold text-ink group-hover:text-[#2A9D7B] transition-colors">{p.title}</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-ink/40 group-hover:text-ink shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Engineering Articles Tab */}
      {activeTab === "ARTICLES" && (
        <div className="bg-white rounded-2xl p-6 border border-border shadow-xs space-y-4">
          <div>
            <h3 className="text-lg font-bold text-ink">Production Engineering Deep Dives</h3>
            <p className="text-xs text-ink/60 mt-0.5">Real-world production post-mortems and architecture breakdowns from Discord, Netflix, Canva, Airbnb, Stripe, and Slack.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {articles.map((a, idx) => (
              <a
                key={idx}
                href={a.url}
                target="_blank"
                rel="noreferrer"
                className="p-4 rounded-xl bg-cream/20 hover:bg-cream/50 border border-border flex items-center justify-between gap-3 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-border flex items-center justify-center text-ink/70 shrink-0">
                    <Newspaper className="w-4 h-4 text-amber-600" strokeWidth={2} />
                  </div>
                  <span className="text-xs font-bold text-ink group-hover:text-amber-600 transition-colors">{a.title}</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-ink/40 group-hover:text-ink shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Modal Quick View */}
      {activeModalProblem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-border shadow-xl max-w-xl w-full p-6 space-y-5">
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-border">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    activeModalProblem.difficulty === "Easy"
                      ? "bg-[#2A9D7B]/10 text-[#2A9D7B]"
                      : activeModalProblem.difficulty === "Medium"
                      ? "bg-amber-500/10 text-amber-600"
                      : "bg-red-500/10 text-red-600"
                  }`}>
                    {activeModalProblem.difficulty}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-cream/40 border border-border text-[10px] text-ink/70 font-semibold">
                    {activeModalProblem.category}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-ink">{activeModalProblem.title}</h3>
              </div>

              <button
                onClick={() => setActiveModalProblem(null)}
                className="p-1.5 rounded-xl hover:bg-cream/40 text-ink/60 hover:text-ink transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <div className="text-xs font-bold text-ink mb-1.5">Core Architectural Patterns:</div>
              <div className="flex flex-wrap gap-1.5">
                {activeModalProblem.patterns.map((pat, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 rounded-lg bg-cream/30 border border-border text-xs font-semibold text-ink"
                  >
                    {pat}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-bold text-ink mb-1">Architecture Overview:</div>
              <p className="text-xs text-ink/70 leading-relaxed">{activeModalProblem.summary}</p>
            </div>

            <div className="pt-2">
              <a
                href={activeModalProblem.referenceUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 rounded-xl bg-ink text-white hover:bg-ink/90 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <span>Read Full System Design Guide & Video</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
