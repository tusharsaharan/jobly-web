import React, { useState, useEffect, useCallback } from "react";
import { getInterviewSocket as getSocket } from "@/lib/socket";
import { Editor } from "@monaco-editor/react";
import {
  Play,
  Trophy,
  Code2,
  ChevronDown,
  Plus,
  Trash2,
  Copy,
  Wand2,
  CheckCircle2,
  XCircle,
  FlaskConical,
  Terminal,
  Maximize2,
  Minimize2,
  Beaker,
  Search,
  ListChecks,
  ChevronUp,
  AlertCircle,
  Clock,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

const LANGUAGES = [
  { id: "javascript", label: "JavaScript", extension: "js" },
  { id: "python", label: "Python", extension: "py" },
  { id: "typescript", label: "TypeScript", extension: "ts" },
  { id: "cpp", label: "C++", extension: "cpp" },
  { id: "java", label: "Java", extension: "java" },
  { id: "go", label: "Go", extension: "go" },
  { id: "rust", label: "Rust", extension: "rs" },
];

const INITIAL_CODE_TEMPLATES: Record<string, string> = {
  javascript: `function solve(input) {
  // Your solution here
  return result;
}`,
  python: `def solve(input):
    # Your solution here
    return result`,
  typescript: `function solve(input: any): any {
  // Your solution here
  return result;
}`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    // Read input from stdin, write output to stdout
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    return 0;
}`,
  java: `import java.util.*;

public class Solution {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        // Your solution here
    }
}`,
  go: `package main

import (
    "fmt"
)

func main() {
    // Your solution here
}`,
  rust: `use std::io::{self, Read};

fn main() {
    let mut input = String::new();
    io::stdin().read_to_string(&mut input).unwrap();
    // Your solution here
}`,
};

interface LocalTestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
  label?: string;
}

function genId() {
  return Math.random().toString(36).slice(2, 9);
}

function generateBulkCases(count: number, language: string): LocalTestCase[] {
  const cases: LocalTestCase[] = [];
  if (count >= 1) cases.push({ id: genId(), input: "", expectedOutput: "", label: "Empty input" });
  if (count >= 2) cases.push({ id: genId(), input: "1\n0", expectedOutput: "0", label: "Single zero" });
  if (count >= 3) cases.push({ id: genId(), input: "1\n-1", expectedOutput: "-1", label: "Negative" });
  if (count >= 4) cases.push({ id: genId(), input: "3\n5 5 5", expectedOutput: "", label: "All equal" });
  if (count >= 5) {
    const big = Array.from({ length: 20 }, (_, i) => i + 1).join(" ");
    cases.push({ id: genId(), input: `20\n${big}`, expectedOutput: "", label: "Large sequential (n=20)" });
  }
  // Fill remaining with random-ish patterns
  const patterns = [
    () => ({ input: `2\n${Math.floor(Math.random() * 100)} ${Math.floor(Math.random() * 100)}`, expectedOutput: "" }),
    () => {
      const n = 5 + Math.floor(Math.random() * 5);
      const arr = Array.from({ length: n }, () => Math.floor(Math.random() * 1000) - 500).join(" ");
      return { input: `${n}\n${arr}`, expectedOutput: "" };
    },
    () => {
      const n = 3;
      const arr = Array.from({ length: n }, () => Math.floor(Math.random() * 10000)).join(" ");
      return { input: `${n}\n${arr}`, expectedOutput: "" };
    },
    () => ({ input: `1\n${Math.floor(Math.random() * 1e9)}`, expectedOutput: "" }),
  ];
  while (cases.length < count) {
    const fn = patterns[cases.length % patterns.length];
    const { input, expectedOutput } = fn();
    cases.push({ id: genId(), input, expectedOutput, label: `Stress #${cases.length + 1}` });
  }
  return cases.slice(0, count);
}

export default function CPArena({ lobbyState, user, setLobbyState }: any) {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [bottomTab, setBottomTab] = useState<"TESTS" | "OUTPUT" | "CONSOLE">("TESTS");
  const [testCases, setTestCases] = useState<LocalTestCase[]>([]);
  const [expandedCases, setExpandedCases] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<"all" | "passed" | "failed">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showGenMenu, setShowGenMenu] = useState(false);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);

  const problem = lobbyState.cpData;

  // Initialize test cases from problem + allow lot of custom cases
  useEffect(() => {
    if (problem?.testCases?.length) {
      const initial: LocalTestCase[] = problem.testCases.map((tc: any, idx: number) => ({
        id: genId(),
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        isHidden: idx >= 2, // first 2 visible like before, rest hidden preview
        label: tc.isHidden ? `Hidden #${idx + 1}` : `Sample #${idx + 1}`,
      }));
      setTestCases(initial);
      // auto expand first 2 for visibility like VS Code problems preview
      setExpandedCases(new Set(initial.slice(0, 2).map((c) => c.id)));
    } else if (testCases.length === 0) {
      const fallback: LocalTestCase[] = [
        { id: genId(), input: "5\n1 2 3 4 5", expectedOutput: "15", label: "Sample #1" },
        { id: genId(), input: "3\n10 20 30", expectedOutput: "60", label: "Sample #2" },
      ];
      setTestCases(fallback);
      setExpandedCases(new Set(fallback.map((c) => c.id)));
    }
  }, [problem]);

  // Initialize code when problem loads or language changes
  useEffect(() => {
    if (problem?.initialCode) {
      if (typeof problem.initialCode === "object") {
        setCode(problem.initialCode[language] || INITIAL_CODE_TEMPLATES[language] || "");
      } else {
        setCode(problem.initialCode);
      }
    } else {
      setCode(INITIAL_CODE_TEMPLATES[language] || "");
    }
  }, [problem, language]);

  useEffect(() => {
    const socket = getSocket();

    socket.on("cp_score_update", (data: any) => {
      setLobbyState((prev: any) => {
        const newPlayers = prev.players.map((p: any) => {
          if (p.userId === data.userId) {
            return {
              ...p,
              testCasesPassed: data.testCasesPassed,
              score: (p.score || 0) + (data.scoreDelta || 0),
            };
          }
          return p;
        });

        newPlayers.sort((a: any, b: any) => (b.score || 0) - (a.score || 0));

        return { ...prev, players: newPlayers };
      });

      if (data.userId === user._id) {
        setLastResult(data);
        setBottomTab("OUTPUT");
        toast.success(`Passed ${data.testCasesPassed}/${data.totalTestCases} test cases!`);
        if (data.allPassed) {
          toast.success("🎉 All test cases passed!");
        }
      }
      setIsEvaluating(false);
    });

    socket.on("cp_complete", (data: any) => {
      setLobbyState((prev: any) => ({
        ...prev,
        status: "LEADERBOARD",
        players: data.finalScores,
      }));
      if (data.winner) {
        toast.success(`${data.winner} solved the problem first!`);
      }
    });

    return () => {
      socket.off("cp_score_update");
      socket.off("cp_complete");
    };
  }, [user._id, setLobbyState]);

  const handleRunCode = async () => {
    if (!code.trim()) {
      toast.error("Please write some code first");
      return;
    }

    setIsEvaluating(true);
    setLastResult(null);
    setBottomTab("OUTPUT");

    try {
      getSocket().emit("submit_cp_solution", {
        pin: lobbyState.pin,
        code,
        language,
      });
      // fallback timeout if server doesn't respond quickly
      setTimeout(() => setIsEvaluating((v) => (v ? false : v)), 15000);
    } catch (err: any) {
      toast.error(`Submission failed: ${err.message}`);
      setIsEvaluating(false);
    }
  };

  const handleAddCase = () => {
    if (testCases.length >= 100) return toast.error("Max 100 test cases (VS Code limit)");
    const newCase: LocalTestCase = { id: genId(), input: "", expectedOutput: "", label: `Custom #${testCases.length + 1}` };
    setTestCases((prev) => [...prev, newCase]);
    setExpandedCases((prev) => new Set([...prev, newCase.id]));
  };

  const handleGenerateBulk = (count: number) => {
    if (testCases.length + count > 100) return toast.error("Max 100 test cases");
    const bulk = generateBulkCases(count, language);
    setTestCases((prev) => [...prev, ...bulk]);
    setExpandedCases((prev) => {
      const next = new Set(prev);
      bulk.slice(0, 3).forEach((c) => next.add(c.id));
      return next;
    });
    toast.success(`Generated ${count} test cases`);
    setShowGenMenu(false);
  };

  const handleDuplicate = (id: string) => {
    const c = testCases.find((x) => x.id === id);
    if (!c) return;
    if (testCases.length >= 100) return toast.error("Max 100");
    setTestCases((prev) => [...prev, { ...c, id: genId(), label: (c.label || "Copy") + " copy" }]);
  };

  const handleDelete = (id: string) => {
    if (testCases.length <= 1) return toast.error("Keep at least one test case");
    setTestCases((prev) => prev.filter((c) => c.id !== id));
  };

  const handleUpdate = (id: string, patch: Partial<LocalTestCase>) => {
    setTestCases((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const toggleExpand = (id: string) => {
    setExpandedCases((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpandedCases(new Set(testCases.map((c) => c.id)));
  const collapseAll = () => setExpandedCases(new Set());

  const currentLang = LANGUAGES.find((l) => l.id === language) || LANGUAGES[0];

  // Filtered view for search + filter (VS Code style filter bar)
  const filteredCases = testCases.filter((tc, idx) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!tc.input.toLowerCase().includes(q) && !tc.expectedOutput.toLowerCase().includes(q) && !(tc.label || "").toLowerCase().includes(q)) return false;
    }
    if (filter !== "all" && lastResult?.testResults) {
      const res = lastResult.testResults[idx];
      if (!res) return filter === "all";
      if (filter === "passed" && !res.passed) return false;
      if (filter === "failed" && res.passed) return false;
    }
    return true;
  });

  if (lobbyState.status === "LEADERBOARD") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-white relative bg-[#1e1e1e]">
        <Trophy className="w-24 h-24 text-[#2A9D7B] mb-8" />
        <h1 className="text-5xl font-black mb-12 text-[#7EE0C5] tracking-tight">Match Concluded</h1>
        <div className="w-full max-w-lg bg-[#252526] rounded-xl p-6 border border-[#333] shadow-2xl">
          {lobbyState.players.map((p: any, idx: number) => (
            <div key={p.userId} className="flex items-center justify-between py-3 border-b border-white/10 last:border-0">
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono text-white/40 w-6">{idx + 1}.</span>
                <span className="text-[13px] font-semibold text-white">{p.name}</span>
                {p.userId === lobbyState.hostId && <span className="text-[10px] bg-yellow-500/20 text-yellow-300 px-1.5 py-0.5 rounded font-mono">HOST</span>}
              </div>
              <div className="text-[#7EE0C5] font-mono text-xs font-bold">
                {p.score} pts • {p.testCasesPassed || 0} / {problem?.testCases?.length || testCases.length} Passed
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!problem) return <div className="flex-1 flex items-center justify-center bg-[#1e1e1e] text-white font-mono text-sm p-8">No problem generated. Waiting for host...</div>;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#1e1e1e] text-white min-h-0">
      {/* VS Code Top Bar - File tab + language + actions */}
      <div className="h-9 flex items-center justify-between px-2 bg-[#181818] border-b border-[#2d2d2d] flex-shrink-0 select-none">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1e1e1e] border-t-2 border-[#2A9D7B] text-xs font-mono text-white rounded-t-sm">
            <Code2 className="w-3.5 h-3.5 text-[#7EE0C5]" />
            <span className="font-medium">solution.{currentLang.extension}</span>
            <span className="ml-1 h-1.5 w-1.5 rounded-full bg-[#2A9D7B] animate-pulse" title="Synced" />
          </div>
          <div className="hidden sm:flex items-center gap-1.5 ml-2 text-[11px] font-mono text-[#858585]">
            <span className="flex items-center gap-1">
              <Beaker className="w-3 h-3" /> {testCases.length} Cases
            </span>
            <span className="text-[#3c3c3c]">|</span>
            <span>{currentLang.label}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Switcher like VS Code status */}
          <div className="relative">
            <button
              onClick={() => setShowLanguageSelector(!showLanguageSelector)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#252526] hover:bg-[#2a2d2e] text-xs font-mono text-[#cccccc] border border-[#3c3c3c] transition"
            >
              <Settings className="w-3 h-3 text-[#858585]" />
              <span>{currentLang.label}</span>
              <ChevronDown className={`w-3 h-3 transition ${showLanguageSelector ? "rotate-180" : ""}`} />
            </button>
            {showLanguageSelector && (
              <div className="absolute right-0 top-full mt-1 bg-[#252526] border border-[#3c3c3c] rounded-md py-1 min-w-[160px] z-50 shadow-2xl max-h-[300px] overflow-y-auto">
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#858585] border-b border-[#3c3c3c] mb-1">Select Language</div>
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => {
                      setLanguage(lang.id);
                      setShowLanguageSelector(false);
                    }}
                    className={`w-full px-3 py-1.5 text-left text-xs font-mono hover:bg-[#2a2d2e] flex items-center justify-between ${language === lang.id ? "bg-[#37373d] text-[#7EE0C5]" : "text-[#cccccc]"}`}
                  >
                    <span>{lang.label}</span>
                    <span className="text-[10px] text-[#858585]">.{lang.extension}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleRunCode}
            disabled={isEvaluating}
            className="flex items-center gap-1.5 px-3.5 py-1 bg-[#0e639c] hover:bg-[#1177bb] text-white font-semibold text-xs rounded-sm transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            title="Run all tests (Ctrl+Enter)"
          >
            {isEvaluating ? (
              <>
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Running…</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Tests</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Workspace: Resizable Horizontal - VS Code layout */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* Left Panel: Problem Statement + Leaderboard - scrollable */}
          {!isLeftCollapsed && (
            <>
              <ResizablePanel defaultSize={32} minSize={22} maxSize={45} className="bg-[#181818]">
                <div className="h-full flex flex-col border-r border-[#2d2d2d] bg-[#181818] overflow-hidden">
                  {/* Explorer Header like VS Code */}
                  <div className="h-8 flex items-center justify-between px-3 bg-[#181818] border-b border-[#2d2d2d] flex-shrink-0">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#bbbbbb] flex items-center gap-1.5">
                      <ListChecks className="w-3.5 h-3.5 text-[#7EE0C5]" /> Explorer
                    </span>
                    <button onClick={() => setIsLeftCollapsed(true)} className="p-1 hover:bg-[#2a2d2e] rounded text-[#858585] hover:text-white" title="Hide Explorer">
                      <Minimize2 className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Live Leaderboard - sticky top, compact VS Code tree style */}
                  <div className="px-3 py-2.5 border-b border-[#2d2d2d] bg-[#1f1f1f] flex-shrink-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#7EE0C5] flex items-center gap-1.5">
                        <Trophy className="w-3.5 h-3.5" /> Live Leaderboard
                      </h3>
                      <span className="text-[10px] font-mono bg-[#252526] px-1.5 py-0.5 rounded text-[#cccccc]">{lobbyState.players.length} players</span>
                    </div>
                    <div className="space-y-1 max-h-[140px] overflow-y-auto pr-1 scrollbar-thin">
                      {lobbyState.players.map((p: any, idx: number) => (
                        <div
                          key={p.userId}
                          className={`flex items-center justify-between px-2 py-1.5 rounded text-xs ${p.userId === user._id ? "bg-[#37373d] border border-[#3c3c3c]" : "bg-[#252526] border border-transparent"}`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-mono text-[11px] text-[#858585] w-4 text-center">{idx + 1}</span>
                            <span className={`truncate text-[12px] ${p.userId === user._id ? "font-bold text-white" : "text-[#cccccc]"}`}>{p.name}</span>
                            {p.userId === user._id && <span className="text-[9px] bg-[#0e639c] text-white px-1 rounded font-bold">YOU</span>}
                          </div>
                          <div className="flex gap-1 ml-2">
                            {Array.from({ length: Math.min(problem.testCases.length, 8) }).map((_, i) => (
                              <div key={i} className={`w-2 h-2 rounded-full flex-shrink-0 ${i < (p.testCasesPassed || 0) ? "bg-[#89d185]" : "bg-[#3c3c3c]"}`} />
                            ))}
                            {problem.testCases.length > 8 && <span className="text-[9px] text-[#858585] ml-0.5">+{problem.testCases.length - 8}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Problem Statement - scrollable VS Code markdown style */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-[#424242] scrollbar-track-transparent">
                    <div>
                      <h2 className="text-[13px] font-bold text-white leading-tight">{lobbyState.topic}</h2>
                      <p className="text-[11px] font-mono text-[#858585] mt-1">PROBLEM • {problem.testCases.length} test cases • {language.toUpperCase()}</p>
                    </div>

                    <div className="prose prose-invert max-w-none">
                      <pre className="whitespace-pre-wrap font-sans text-[12.5px] leading-relaxed text-[#cccccc] bg-[#1e1e1e] border border-[#2d2d2d] rounded p-3 overflow-x-auto">
                        {problem.problemStatement}
                      </pre>
                    </div>

                    {/* Quick stats */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-[#252526] border border-[#2d2d2d] rounded p-2">
                        <div className="text-[11px] font-bold text-[#7EE0C5]">{testCases.length}</div>
                        <div className="text-[9px] uppercase tracking-wider text-[#858585]">Cases</div>
                      </div>
                      <div className="bg-[#252526] border border-[#2d2d2d] rounded p-2">
                        <div className="text-[11px] font-bold text-[#cccccc]">{lastResult ? `${lastResult.testCasesPassed}/${lastResult.totalTestCases}` : "—"}</div>
                        <div className="text-[9px] uppercase tracking-wider text-[#858585]">Passed</div>
                      </div>
                      <div className="bg-[#252526] border border-[#2d2d2d] rounded p-2">
                        <div className="text-[11px] font-bold text-[#cccccc]">{lastResult?.durationMs ? `${lastResult.durationMs}ms` : "—"}</div>
                        <div className="text-[9px] uppercase tracking-wider text-[#858585]">Last Run</div>
                      </div>
                    </div>
                  </div>
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle className="bg-[#2d2d2d] hover:bg-[#007acc] transition-colors w-px" />
            </>
          )}

          {/* Right Panel: Editor + Bottom Panel Vertical Split - VS Code style */}
          <ResizablePanel defaultSize={isLeftCollapsed ? 100 : 68} className="bg-[#1e1e1e]">
            {isLeftCollapsed && (
              <button
                onClick={() => setIsLeftCollapsed(false)}
                className="absolute left-2 top-10 z-10 p-1.5 bg-[#252526] border border-[#3c3c3c] rounded text-[#cccccc] hover:text-white hover:bg-[#2a2d2e] shadow"
                title="Show Explorer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            )}
            <ResizablePanelGroup direction="vertical" className="h-full">
              {/* Editor */}
              <ResizablePanel defaultSize={62} minSize={30} className="bg-[#1e1e1e]">
                <div className="h-full flex flex-col overflow-hidden">
                  {/* Breadcrumbs like VS Code Online */}
                  <div className="h-6 flex items-center px-3 bg-[#252526] border-b border-[#2d2d2d] text-[11px] font-mono text-[#858585] flex-shrink-0 gap-1">
                    <span className="text-[#cccccc]">src</span>
                    <ChevronDown className="w-3 h-3 rotate-[-90deg] opacity-50" />
                    <span className="text-[#cccccc]">solution.{currentLang.extension}</span>
                    <span className="ml-auto flex items-center gap-2">
                      <span className="hidden sm:inline">Ln 1, Col 1</span>
                      <span className="w-2 h-2 rounded-full bg-[#89d185] animate-pulse" title="Editor ready" />
                    </span>
                  </div>
                  <div className="flex-1 min-h-0 relative">
                    <Editor
                      height="100%"
                      language={language}
                      theme="vs-dark"
                      value={code}
                      onChange={(val) => setCode(val || "")}
                      options={{
                        minimap: { enabled: true, scale: 0.8, showSlider: "mouseover" },
                        fontSize: 13,
                        fontFamily: "Cascadia Code, JetBrains Mono, Fira Code, Menlo, monospace",
                        lineHeight: 18,
                        padding: { top: 12, bottom: 12 },
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 2,
                        cursorBlinking: "smooth",
                        smoothScrolling: true,
                        wordWrap: "on",
                        bracketPairColorization: { enabled: true },
                        guides: { bracketPairs: true, indentation: true },
                        suggest: { showKeywords: true, showSnippets: true },
                        quickSuggestions: { other: true, comments: false, strings: false },
                        folding: true,
                        renderLineHighlight: "all",
                        stickyScroll: { enabled: true },
                        rulers: [80, 100],
                      }}
                    />
                  </div>
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle className="bg-[#2d2d2d] hover:bg-[#007acc] h-px transition-colors" />

              {/* Bottom Panel: Test Cases + Console - VS Code Panel style, SCROLLABLE */}
              <ResizablePanel defaultSize={38} minSize={22} maxSize={72} className="bg-[#181818]">
                <div className="h-full flex flex-col overflow-hidden bg-[#181818] border-t border-[#2d2d2d]">
                  {/* Panel Tabs - VS Code style (Problems, Output, Debug Console, Terminal) */}
                  <div className="h-9 flex items-center justify-between px-2 bg-[#181818] border-b border-[#2d2d2d] flex-shrink-0 select-none">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setBottomTab("TESTS")}
                        className={`flex items-center gap-1.5 px-3 py-1 text-[11px] font-medium uppercase tracking-wide border-b-2 transition ${bottomTab === "TESTS" ? "border-[#007acc] text-white bg-[#1f1f1f]" : "border-transparent text-[#858585] hover:text-[#cccccc]"}`}
                      >
                        <Beaker className="w-3.5 h-3.5" />
                        <span>Test Cases</span>
                        <span className="ml-1 bg-[#252526] text-[#cccccc] px-1.5 py-0 rounded text-[10px] font-mono">{testCases.length}</span>
                      </button>
                      <button
                        onClick={() => setBottomTab("OUTPUT")}
                        className={`flex items-center gap-1.5 px-3 py-1 text-[11px] font-medium uppercase tracking-wide border-b-2 transition ${bottomTab === "OUTPUT" ? "border-[#007acc] text-white bg-[#1f1f1f]" : "border-transparent text-[#858585] hover:text-[#cccccc]"}`}
                      >
                        <Terminal className="w-3.5 h-3.5" />
                        <span>Output</span>
                        {lastResult && <span className={`w-2 h-2 rounded-full ${lastResult.allPassed ? "bg-[#89d185]" : "bg-[#f85149]"}`} />}
                      </button>
                      <button
                        onClick={() => setBottomTab("CONSOLE")}
                        className={`hidden sm:flex items-center gap-1.5 px-3 py-1 text-[11px] font-medium uppercase tracking-wide border-b-2 transition ${bottomTab === "CONSOLE" ? "border-[#007acc] text-white bg-[#1f1f1f]" : "border-transparent text-[#858585] hover:text-[#cccccc]"}`}
                      >
                        <ListChecks className="w-3.5 h-3.5" />
                        <span>Problems</span>
                        {lastResult && !lastResult.allPassed && <span className="bg-[#f85149] text-white px-1 rounded text-[10px]">{(lastResult.totalTestCases || 0) - (lastResult.testCasesPassed || 0)}</span>}
                      </button>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="hidden md:flex items-center gap-1 text-[10px] font-mono text-[#858585] mr-2">
                        <Clock className="w-3 h-3" />
                        {lastResult ? `${lastResult.durationMs ?? 0}ms` : "no run yet"}
                      </span>
                      <button
                        onClick={handleRunCode}
                        disabled={isEvaluating}
                        className="flex items-center gap-1 px-2.5 py-1 bg-[#0e639c] hover:bg-[#1177bb] text-white text-[11px] font-semibold rounded-sm disabled:opacity-50"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        Run
                      </button>
                    </div>
                  </div>

                  {/* Panel Content - SCROLLABLE, like VS Code Panel */}
                  <div className="flex-1 min-h-0 overflow-hidden flex flex-col bg-[#1e1e1e]">
                    {bottomTab === "TESTS" ? (
                      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                        {/* Toolbar - VS Code filter bar */}
                        <div className="flex items-center gap-1.5 px-2 py-1.5 bg-[#252526] border-b border-[#2d2d2d] flex-shrink-0 flex-wrap">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={handleAddCase}
                              className="flex items-center gap-1 px-2 py-1 bg-[#0e639c] hover:bg-[#1177bb] text-white text-[11px] font-medium rounded-sm transition"
                              title="Add new test case"
                            >
                              <Plus className="w-3 h-3" /> Add
                            </button>
                            <div className="relative">
                              <button
                                onClick={() => setShowGenMenu(!showGenMenu)}
                                className="flex items-center gap-1 px-2 py-1 bg-[#323233] hover:bg-[#3c3c3c] text-[#cccccc] text-[11px] rounded-sm border border-[#3c3c3c]"
                              >
                                <Wand2 className="w-3 h-3 text-[#7EE0C5]" /> Generate <ChevronDown className="w-3 h-3" />
                              </button>
                              {showGenMenu && (
                                <div className="absolute left-0 top-full mt-1 bg-[#252526] border border-[#3c3c3c] rounded-md shadow-2xl py-1 min-w-[180px] z-50">
                                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#858585]">Bulk Generate Cases</div>
                                  {[5, 10, 25, 50].map((n) => (
                                    <button
                                      key={n}
                                      onClick={() => handleGenerateBulk(n)}
                                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-[#2a2d2e] text-[#cccccc] flex items-center justify-between"
                                    >
                                      <span>Generate {n} edge cases</span>
                                      <span className="text-[10px] text-[#858585]">+{n}</span>
                                    </button>
                                  ))}
                                  <div className="border-t border-[#3c3c3c] mt-1 pt-1 px-2">
                                    <button
                                      onClick={() => {
                                        if (testCases.length >= 100) return toast.error("Max 100");
                                        const remain = Math.min(15, 100 - testCases.length);
                                        const bulk = generateBulkCases(remain, language).map((c) => ({ ...c, label: `Random #${genId().slice(0, 3)}` }));
                                        setTestCases((p) => [...p, ...bulk]);
                                        toast.success(`Generated ${remain} random cases`);
                                        setShowGenMenu(false);
                                      }}
                                      className="w-full px-2 py-1 text-xs bg-[#0e639c] text-white rounded text-center"
                                    >
                                      + 15 Random Stress
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                            <button onClick={expandAll} className="p-1 hover:bg-[#2a2d2e] rounded text-[#858585] hover:text-white" title="Expand All">
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={collapseAll} className="p-1 hover:bg-[#2a2d2e] rounded text-[#858585] hover:text-white" title="Collapse All">
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="h-4 w-px bg-[#3c3c3c] mx-1 hidden sm:block" />

                          <div className="flex items-center gap-1 ml-auto">
                            <div className="relative hidden sm:flex items-center">
                              <Search className="w-3 h-3 absolute left-2 text-[#858585]" />
                              <input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Filter cases..."
                                className="pl-7 pr-2 py-1 bg-[#3c3c3c] border border-[#3c3c3c] rounded-sm text-[11px] text-white placeholder:text-[#858585] focus:border-[#007acc] focus:outline-none w-[140px]"
                              />
                            </div>
                            <select
                              value={filter}
                              onChange={(e) => setFilter(e.target.value as any)}
                              className="bg-[#3c3c3c] border border-[#3c3c3c] text-[#cccccc] text-[11px] rounded-sm px-1.5 py-1 focus:border-[#007acc] focus:outline-none"
                            >
                              <option value="all">All Cases</option>
                              <option value="passed">Passed Only</option>
                              <option value="failed">Failed Only</option>
                            </select>
                          </div>
                        </div>

                        {/* Scrollable Test Cases List - THIS IS THE KEY VS CODE SCROLLABLE AREA */}
                        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-2 space-y-1.5 bg-[#1e1e1e] scrollbar-thin scrollbar-thumb-[#424242] scrollbar-track-transparent">
                          {filteredCases.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                              <Beaker className="w-8 h-8 text-[#424242] mb-2" />
                              <p className="text-xs text-[#858585]">No test cases match filter</p>
                              <p className="text-[11px] text-[#5a5a5a] mt-1">{searchQuery ? `Search: "${searchQuery}"` : "Try changing filter or generate cases"}</p>
                            </div>
                          ) : (
                            filteredCases.map((tc, idx) => {
                              const originalIdx = testCases.findIndex((c) => c.id === tc.id);
                              const res = lastResult?.testResults?.[originalIdx];
                              const status: "idle" | "pass" | "fail" = !lastResult ? "idle" : res?.passed ? "pass" : res ? "fail" : "idle";
                              const isExpanded = expandedCases.has(tc.id);
                              return (
                                <div
                                  key={tc.id}
                                  className={`rounded border overflow-hidden transition ${status === "pass" ? "border-[#89d185]/30 bg-[#89d185]/[0.06]" : status === "fail" ? "border-[#f85149]/30 bg-[#f85149]/[0.06]" : "border-[#2d2d2d] bg-[#252526]"}`}
                                >
                                  {/* Card Header - VS Code tree row */}
                                  <div
                                    className="flex items-center justify-between px-2.5 py-1.5 bg-[#252526]/80 hover:bg-[#2a2d2e] cursor-pointer select-none"
                                    onClick={() => toggleExpand(tc.id)}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span
                                        className={`flex h-5 w-5 items-center justify-center rounded-sm text-[10px] font-bold font-mono flex-shrink-0 ${status === "pass" ? "bg-[#89d185] text-black" : status === "fail" ? "bg-[#f85149] text-white" : "bg-[#3c3c3c] text-[#cccccc]"}`}
                                      >
                                        {originalIdx + 1}
                                      </span>
                                      <span className="text-[12px] font-medium text-[#cccccc] truncate">{tc.label || `Case ${originalIdx + 1}`}</span>
                                      {tc.isHidden && <span className="text-[9px] bg-[#37373d] text-[#858585] px-1 py-0.5 rounded font-mono">HIDDEN</span>}
                                      {status !== "idle" && (
                                        <span className={`hidden sm:flex items-center gap-1 text-[11px] font-medium ${status === "pass" ? "text-[#89d185]" : "text-[#f85149]"}`}>
                                          {status === "pass" ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}{" "}
                                          {status === "pass" ? "Passed" : "Failed"}
                                          {res?.durationMs != null && <span className="font-mono font-normal text-[#858585]">· {res.durationMs}ms</span>}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-0.5 flex-shrink-0">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDuplicate(tc.id);
                                        }}
                                        title="Duplicate"
                                        className="p-1 rounded hover:bg-[#37373d] text-[#858585] hover:text-white"
                                      >
                                        <Copy className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDelete(tc.id);
                                        }}
                                        title="Delete"
                                        className="p-1 rounded hover:bg-[#5a1d1d] text-[#858585] hover:text-[#f85149]"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                      <span className="p-1 text-[#858585]">{isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}</span>
                                    </div>
                                  </div>

                                  {/* Collapsed preview - one line */}
                                  {!isExpanded && (
                                    <div className="px-3 pb-1.5 flex items-center gap-2 text-[11px] font-mono text-[#858585] truncate">
                                      <span className="truncate">
                                        in: <span className="text-[#cccccc]">{tc.input.slice(0, 32) || "∅"}{tc.input.length > 32 ? "…" : ""}</span>
                                      </span>
                                      <span className="text-[#424242]">→</span>
                                      <span className="truncate">
                                        out: <span className="text-[#cccccc]">{tc.expectedOutput.slice(0, 16) || "∅"}</span>
                                      </span>
                                    </div>
                                  )}

                                  {/* Expanded editors */}
                                  {isExpanded && (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 p-2.5 bg-[#1e1e1e] border-t border-[#2d2d2d]">
                                      <div className="flex flex-col gap-1 min-w-0">
                                        <label className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#858585]">
                                          <span>Input (stdin)</span>
                                          <span className="font-mono font-normal text-[#5a5a5a]">{tc.input.length} chars</span>
                                        </label>
                                        <textarea
                                          value={tc.input}
                                          onChange={(e) => handleUpdate(tc.id, { input: e.target.value })}
                                          placeholder={"e.g.\n5\n1 2 3 4 5"}
                                          className="min-h-[68px] w-full resize-y rounded-sm border border-[#3c3c3c] bg-[#252526] p-2 text-[12px] leading-relaxed font-mono text-[#cccccc] placeholder:text-[#5a5a5a] outline-none focus:border-[#007acc]"
                                          spellCheck={false}
                                          rows={3}
                                        />
                                      </div>
                                      <div className="flex flex-col gap-1 min-w-0">
                                        <label className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#858585]">
                                          <span>Expected Output</span>
                                          <span className="font-mono font-normal text-[#5a5a5a]">{tc.expectedOutput.length} chars</span>
                                        </label>
                                        <textarea
                                          value={tc.expectedOutput}
                                          onChange={(e) => handleUpdate(tc.id, { expectedOutput: e.target.value })}
                                          placeholder={"e.g.\n15"}
                                          className="min-h-[68px] w-full resize-y rounded-sm border border-[#3c3c3c] bg-[#252526] p-2 text-[12px] leading-relaxed font-mono text-[#cccccc] placeholder:text-[#5a5a5a] outline-none focus:border-[#007acc]"
                                          spellCheck={false}
                                          rows={3}
                                        />
                                      </div>
                                      {res && !res.passed && (
                                        <div className="lg:col-span-2 rounded border border-[#f85149]/30 bg-[#f85149]/10 p-2 space-y-1">
                                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#f85149]">
                                            <AlertCircle className="w-3 h-3" /> Mismatch at Case {originalIdx + 1}
                                          </div>
                                          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                                            <div>
                                              <div className="text-[10px] uppercase tracking-wider text-[#858585]">Expected</div>
                                              <pre className="mt-1 whitespace-pre-wrap break-all rounded bg-[#252526] p-2 text-[#7EE0C5] border border-[#3c3c3c] max-h-24 overflow-auto scrollbar-thin">{res.expectedOutput || "(empty)"}</pre>
                                            </div>
                                            <div>
                                              <div className="text-[10px] uppercase tracking-wider text-[#858585]">Actual</div>
                                              <pre className="mt-1 whitespace-pre-wrap break-all rounded bg-[#252526] p-2 text-[#f85149] border border-[#3c3c3c] max-h-24 overflow-auto scrollbar-thin">
                                                {res.actualOutput || "(empty)"} {res.error && `\n[stderr] ${String(res.error).slice(0, 300)}`}
                                              </pre>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                      {res && res.passed && (
                                        <div className="lg:col-span-2 flex items-center gap-1.5 rounded bg-[#89d185]/10 border border-[#89d185]/20 px-2 py-1.5 text-[11px] text-[#89d185]">
                                          <CheckCircle2 className="w-3 h-3" /> Output matched expected
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Footer summary - sticky like VS Code status */}
                        <div className="flex-shrink-0 border-t border-[#2d2d2d] bg-[#252526] px-3 py-2 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 text-[#858585] font-mono text-[11px]">
                            <span>
                              {filteredCases.length}/{testCases.length} cases {searchQuery && `(filtered)`}
                            </span>
                            {lastResult && (
                              <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${lastResult.allPassed ? "bg-[#89d185]/20 text-[#89d185]" : "bg-[#f85149]/20 text-[#f85149]"}`}>
                                {lastResult.testCasesPassed}/{lastResult.totalTestCases} passed on server
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={handleAddCase} className="hidden sm:flex items-center gap-1 px-2 py-1 bg-[#37373d] hover:bg-[#3c3c3c] text-[#cccccc] text-[11px] rounded-sm">
                              <Plus className="w-3 h-3" /> New Case
                            </button>
                            <span className="text-[10px] text-[#5a5a5a] font-mono">Scroll ↕ • Lot ready</span>
                          </div>
                        </div>
                      </div>
                    ) : bottomTab === "OUTPUT" ? (
                      <div className="flex-1 flex flex-col min-h-0 p-3 overflow-y-auto scrollbar-thin bg-[#1e1e1e]">
                        {!lastResult ? (
                          <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                            <div className="w-12 h-12 rounded-full bg-[#252526] flex items-center justify-center mb-3 border border-[#2d2d2d]">
                              <Terminal className="w-6 h-6 text-[#858585]" />
                            </div>
                            <p className="text-sm font-medium text-[#cccccc]">No execution output yet</p>
                            <p className="text-xs text-[#858585] mt-1 max-w-[320px]">Click “Run Tests” to compile and run your solution against all {testCases.length} test cases in the isolated sandbox.</p>
                            <button
                              onClick={handleRunCode}
                              disabled={isEvaluating}
                              className="mt-4 px-4 py-1.5 bg-[#0e639c] hover:bg-[#1177bb] text-white text-xs font-semibold rounded-sm flex items-center gap-1.5 disabled:opacity-50"
                            >
                              <Play className="w-3 h-3 fill-current" /> Run {testCases.length} Tests
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className={`rounded border p-3 flex items-center gap-2 ${lastResult.allPassed ? "bg-[#89d185]/10 border-[#89d185]/30 text-[#89d185]" : "bg-[#f85149]/10 border-[#f85149]/30 text-[#f85149]"}`}>
                              {lastResult.allPassed ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                              <div>
                                <div className="text-sm font-bold">{lastResult.allPassed ? "All tests passed!" : `${lastResult.testCasesPassed}/${lastResult.totalTestCases} tests passed`}</div>
                                <div className="text-xs opacity-80 font-mono">Score: +{lastResult.scoreDelta ?? 0} • {lastResult.durationMs ? `${lastResult.durationMs}ms` : ""}</div>
                              </div>
                              <div className="ml-auto text-xs font-mono bg-black/20 px-2 py-1 rounded">{lastResult.allPassed ? "✓ SUCCESS" : "✗ FAILED"}</div>
                            </div>

                            {lastResult.testResults && (
                              <div className="rounded border border-[#2d2d2d] bg-[#252526] overflow-hidden">
                                <div className="px-3 py-1.5 bg-[#2d2d2d] text-[11px] font-bold uppercase tracking-wider text-[#cccccc] flex items-center justify-between">
                                  <span>Per-Case Breakdown</span>
                                  <span className="font-mono text-[11px] font-normal normal-case text-[#858585]">{lastResult.testResults.length} cases</span>
                                </div>
                                <div className="max-h-[240px] overflow-y-auto divide-y divide-[#2d2d2d] scrollbar-thin">
                                  {lastResult.testResults.map((r: any, i: number) => (
                                    <div key={i} className={`flex items-center justify-between px-3 py-1.5 text-xs font-mono ${r.passed ? "text-[#89d185] bg-[#89d185]/5" : "text-[#f85149] bg-[#f85149]/5"}`}>
                                      <span className="flex items-center gap-2">
                                        <span className={`w-5 h-5 rounded-sm flex items-center justify-center text-[10px] font-bold ${r.passed ? "bg-[#89d185] text-black" : "bg-[#f85149] text-white"}`}>{r.testCaseIndex ?? i + 1}</span>
                                        Case {r.testCaseIndex ?? i + 1}
                                      </span>
                                      <span className="flex items-center gap-2">
                                        {r.durationMs != null && <span className="text-[#858585]">{r.durationMs}ms</span>}
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${r.passed ? "bg-[#89d185] text-black" : "bg-[#f85149] text-white"}`}>{r.passed ? "PASS" : "FAIL"}</span>
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {lastResult.compilerOutput && (
                              <pre className="whitespace-pre-wrap break-all bg-[#252526] border border-[#2d2d2d] rounded p-3 text-xs font-mono text-[#f85149] max-h-[160px] overflow-auto scrollbar-thin">
                                {lastResult.compilerOutput}
                              </pre>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex-1 p-3 overflow-y-auto scrollbar-thin bg-[#1e1e1e] space-y-2">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-[#858585]">Problems ({lastResult && !lastResult.allPassed ? (lastResult.totalTestCases - lastResult.testCasesPassed) : 0})</div>
                        {!lastResult || lastResult.allPassed ? (
                          <div className="flex items-center gap-2 text-xs text-[#89d185] bg-[#89d185]/10 border border-[#89d185]/20 rounded p-3">
                            <CheckCircle2 className="w-4 h-4" /> No problems detected. All cases passed!
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {lastResult.testResults
                              ?.filter((r: any) => !r.passed)
                              .map((r: any, i: number) => (
                                <div key={i} className="flex items-start gap-2 p-2 bg-[#252526] border border-[#2d2d2d] rounded hover:bg-[#2a2d2e]">
                                  <XCircle className="w-3.5 h-3.5 text-[#f85149] mt-0.5 flex-shrink-0" />
                                  <div className="min-w-0">
                                    <div className="text-xs font-medium text-[#f85149]">Test Case {r.testCaseIndex ?? i + 1} failed</div>
                                    <div className="text-[11px] font-mono text-[#858585] truncate">Expected: {(r.expectedOutput || "").slice(0, 60) || "∅"} → Got: {(r.actualOutput || "").slice(0, 60) || "∅"}</div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Status Bar - VS Code style */}
      <div className="h-5 flex items-center justify-between px-2 bg-[#007acc] text-white text-[11px] font-mono flex-shrink-0 select-none">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> Live • CP Battle
          </span>
          <span className="hidden sm:inline opacity-80">{language.toUpperCase()} • {testCases.length} cases</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline opacity-90">Spaces: 2 • UTF-8 • LF</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> {isEvaluating ? "Evaluating…" : "Ready"}
          </span>
        </div>
      </div>
    </div>
  );
}
