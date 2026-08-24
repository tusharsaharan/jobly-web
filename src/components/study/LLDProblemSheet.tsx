import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiCall } from "@/lib/api";
import { 
  Search, 
  Filter, 
  CheckCircle2, 
  Circle, 
  ExternalLink, 
  Code2, 
  Layers, 
  BookOpen, 
  Eye, 
  X,
  Github,
  Sparkles,
  ChevronDown,
  Boxes,
  FileCode
} from "lucide-react";
import { toast } from "sonner";

interface LLDProblem {
  id: string;
  slug: string;
  title: string;
  category: string;
  difficulty: "Easy" | "Medium" | "Hard";
  patterns: string[];
  summary: string;
  requirements: string[];
  githubUrl: string;
  solutionsUrl: string;
  javaUrl: string;
  cppUrl: string;
  pythonUrl: string;
  tsUrl: string;
}

export default function LLDProblemSheet() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedDifficulty, setSelectedDifficulty] = useState("ALL");
  const [selectedPattern, setSelectedPattern] = useState("ALL");
  const [activeModalProblem, setActiveModalProblem] = useState<LLDProblem | null>(null);

  // Local state for completed problems
  const [completedIds, setCompletedIds] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("jobly_lld_completed");
        return saved ? JSON.parse(saved) : {};
      } catch {
        return {};
      }
    }
    return {};
  });

  const { data, isLoading } = useQuery({
    queryKey: ["lld-problems", search, selectedCategory, selectedDifficulty, selectedPattern],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (selectedCategory !== "ALL") params.set("category", selectedCategory);
      if (selectedDifficulty !== "ALL") params.set("difficulty", selectedDifficulty);
      if (selectedPattern !== "ALL") params.set("pattern", selectedPattern);
      return apiCall(`/study/lld-problems?${params.toString()}`);
    }
  });

  const toggleSolved = (id: string) => {
    setCompletedIds(prev => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem("jobly_lld_completed", JSON.stringify(next));
      } catch {}
      return next;
    });
    
    // Save to user study progress endpoint in background
    apiCall("/study/progress", "POST", {
      type: "DSA", // map to progress tracking
      questionId: `lld-${id}`,
      completed: !completedIds[id]
    }).catch(() => {});
  };

  const problems: LLDProblem[] = data?.problems || [];
  const categories: string[] = data?.categories || [];
  const patterns: string[] = data?.patterns || [];
  const stats = data?.stats || { Easy: 0, Medium: 0, Hard: 0, Total: 0 };

  const solvedCount = Object.values(completedIds).filter(Boolean).length;
  const progressPercent = stats.Total > 0 ? Math.min(100, Math.round((solvedCount / stats.Total) * 100)) : 0;

  return (
    <div className="space-y-6">
      {/* Header Banner & Metrics Card */}
      <div className="bg-white rounded-2xl p-6 border border-border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-ink/70 mb-1">
            Source: ashishps1 / awesome-low-level-design
          </div>
          <h2 className="text-2xl font-black text-ink">Awesome Low-Level Design (LLD) Sheet</h2>
          <p className="text-xs text-ink/65 mt-1 max-w-2xl">
            Master 33 classic object-oriented design problems with real code implementations (Java, C++, Python, TypeScript), class diagrams, and design patterns.
          </p>
        </div>

        {/* Progress summary widget */}
        <div className="bg-cream/30 p-4 rounded-xl border border-border shrink-0 min-w-[240px] space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-ink">Progress Tracker</span>
            <span className="font-bold text-ink">{solvedCount} / {stats.Total || 33} Solved</span>
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
              placeholder="Search by problem title, category, pattern (e.g. Parking Lot, State, Strategy)..."
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

            {/* Pattern Filter */}
            <select
              value={selectedPattern}
              onChange={e => setSelectedPattern(e.target.value)}
              aria-label="Filter by design pattern"
              className="bg-cream/20 border border-border rounded-xl px-3 py-2.5 text-xs text-ink focus:border-ink focus:outline-none font-medium cursor-pointer"
            >
              <option value="ALL">All Patterns</option>
              {patterns.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
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
                <th className="py-3.5 px-4">Problem Name & Domain</th>
                <th className="py-3.5 px-4 w-32">Category</th>
                <th className="py-3.5 px-4 w-24">Difficulty</th>
                <th className="py-3.5 px-4">Design Patterns</th>
                <th className="py-3.5 px-4 w-44 text-right">Solutions & Specs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-xs text-ink/50">
                    Loading LLD problems from awesome-low-level-design...
                  </td>
                </tr>
              ) : problems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-xs text-ink/50">
                    No LLD problems match your search filter.
                  </td>
                </tr>
              ) : (
                problems.map((p, idx) => {
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
                          title={isSolved ? "Mark as unsolved" : "Mark as solved"}
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

                      {/* Links */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <a
                            href={p.githubUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cream/30 hover:bg-cream/60 border border-border text-[11px] font-semibold text-ink transition-colors"
                            title="Read requirements on GitHub"
                          >
                            <span>Spec</span>
                            <ExternalLink className="w-2.5 h-2.5 text-ink/60" />
                          </a>

                          <a
                            href={p.solutionsUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-ink text-white hover:bg-ink/90 text-[11px] font-semibold transition-colors"
                            title="View multi-language code solutions (Java, C++, Python, TS)"
                          >
                            <Code2 className="w-3 h-3 text-[#2A9D7B]" />
                            <span>Code</span>
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Problem Quick View Modal */}
      {activeModalProblem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-border shadow-xl max-w-2xl w-full p-6 space-y-5 max-h-[85vh] overflow-y-auto">
            {/* Modal Header */}
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

            {/* Design Patterns Used */}
            <div>
              <div className="text-xs font-bold text-ink mb-1.5">Applicable Design Patterns:</div>
              <div className="flex flex-wrap gap-1.5">
                {activeModalProblem.patterns.map((pat, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 rounded-lg bg-cream/30 border border-border text-xs font-semibold text-ink"
                  >
                    {pat} Pattern
                  </span>
                ))}
              </div>
            </div>

            {/* Core Requirements */}
            <div>
              <div className="text-xs font-bold text-ink mb-2">Core System Requirements:</div>
              <ul className="space-y-2 text-xs text-ink/75 leading-relaxed">
                {activeModalProblem.requirements.map((req, rIdx) => (
                  <li key={rIdx} className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-cream/60 border border-border flex items-center justify-center text-[10px] font-bold text-ink shrink-0 mt-0.5">
                      {rIdx + 1}
                    </span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Code Solution Direct Links */}
            <div className="pt-3 border-t border-border space-y-2">
              <div className="text-xs font-bold text-ink">Explore Source Code Solutions:</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <a
                  href={activeModalProblem.javaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 rounded-xl bg-cream/20 hover:bg-cream/50 border border-border text-center text-xs font-bold text-ink transition-colors"
                >
                  Java Code
                </a>
                <a
                  href={activeModalProblem.cppUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 rounded-xl bg-cream/20 hover:bg-cream/50 border border-border text-center text-xs font-bold text-ink transition-colors"
                >
                  C++ Code
                </a>
                <a
                  href={activeModalProblem.pythonUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 rounded-xl bg-cream/20 hover:bg-cream/50 border border-border text-center text-xs font-bold text-ink transition-colors"
                >
                  Python Code
                </a>
                <a
                  href={activeModalProblem.tsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 rounded-xl bg-cream/20 hover:bg-cream/50 border border-border text-center text-xs font-bold text-ink transition-colors"
                >
                  TypeScript
                </a>
              </div>
            </div>

            {/* Full Spec Button */}
            <div className="pt-2">
              <a
                href={activeModalProblem.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 rounded-xl bg-ink text-white hover:bg-ink/90 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Github className="w-4 h-4" />
                <span>View Complete Markdown & Class Diagram on GitHub</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
